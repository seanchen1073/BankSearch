import React, { useContext, useEffect } from "react";

import { BankContext } from "../contexts/BankContext";
import { fetchNearbyBranches } from "./BankGetApi.jsx";

const NearbyBranchModal = () => {
  // 使用銀行查詢共用狀態
  const {
    isNearbyModalOpen,
    setIsNearbyModalOpen,
    setUserLocation,
    setNearbyBranches,
    isLocating,
    setIsLocating,
    locationError,
    setLocationError,
    setIsNearbySearch,
    setSelectedBank,
    setSelectedBranch,
    setBankSearchTerm,
    setBranchSearchTerm,
    setActiveDropdown,
    setSelectedIndex,
    setMouseHoveredIndex,
  } = useContext(BankContext);

  // 每次開啟視窗時清除上一次錯誤
  useEffect(() => {
    if (isNearbyModalOpen) {
      setLocationError("");
    }
  }, [isNearbyModalOpen, setLocationError]);

  // Modal 開啟時鎖住背景捲動
  // 按下 Escape 時關閉視窗
  useEffect(() => {
    if (!isNearbyModalOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLocating) {
        setLocationError("");
        setIsNearbyModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNearbyModalOpen, isLocating, setIsNearbyModalOpen, setLocationError]);

  // 關閉定位說明視窗
  const handleCloseModal = () => {
    // 定位進行中不允許關閉視窗
    if (isLocating) {
      return;
    }

    setLocationError("");
    setIsNearbyModalOpen(false);
  };

  // 點擊背景遮罩時關閉視窗
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCloseModal();
    }
  };

  // 根據瀏覽器回傳代碼顯示錯誤訊息
  const getLocationErrorMessage = (error) => {
    switch (error.code) {
      case 1:
        return "你拒絕了定位權限 請允許網站取得位置後再試一次";

      case 2:
        return "目前無法取得你的位置 請確認裝置定位功能已開啟";

      case 3:
        return "取得位置逾時 請確認網路連線後再試一次";

      default:
        return "取得位置失敗 請稍後再試一次";
    }
  };

  // 取得目前位置並查詢附近分行
  const handleUseCurrentLocation = () => {
    setLocationError("");

    // 瀏覽器不支援定位時顯示錯誤
    if (!navigator.geolocation) {
      setLocationError("目前的瀏覽器不支援定位功能");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // 先儲存使用者位置
        const currentLocation = {
          lat: latitude,
          lng: longitude,
        };

        setUserLocation(currentLocation);

        try {
          // 呼叫後端附近分行 API
          const branches = await fetchNearbyBranches(latitude, longitude, 10);

          if (!branches) {
            setLocationError("附近分行資料載入失敗 請確認後端服務後再試一次");
            return;
          }

          if (branches.length === 0) {
            setLocationError("目前找不到具有位置資料的附近分行");
            return;
          }

          // 儲存最近十間分行
          setNearbyBranches(branches);

          // 自動選取距離最近的第一間分行
          const nearestBranch = branches[0];

          // 沿用原本搜尋欄的資料格式
          const bankValue = `${nearestBranch.bank_code} ${nearestBranch.bank_name}`;

          const branchValue = `${nearestBranch.code} ${nearestBranch.name}`;

          setSelectedBank(bankValue);
          setSelectedBranch(nearestBranch);
          setBankSearchTerm(bankValue);
          setBranchSearchTerm(branchValue);

          // 關閉所有搜尋下拉選單
          setActiveDropdown(null);
          setSelectedIndex(-1);
          setMouseHoveredIndex(-1);

          // 開啟附近分行模式
          setIsNearbySearch(true);

          // 關閉定位說明視窗
          setIsNearbyModalOpen(false);

          // 捲動到搜尋區與結果區
          window.setTimeout(() => {
            const searchSection = document.getElementById("search");

            searchSection?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 150);
        } catch (error) {
          console.error("附近分行查詢失敗", error);

          setLocationError("附近分行查詢失敗 請稍後再試一次");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setLocationError(getLocationErrorMessage(error));

        setIsLocating(false);
      },
      {
        // 一般附近搜尋不需要最高精度
        enableHighAccuracy: false,

        // 最多等待十秒
        timeout: 10000,

        // 五分鐘內的位置可以重複使用
        maximumAge: 300000,
      }
    );
  };

  // 視窗關閉時不渲染任何內容
  if (!isNearbyModalOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="relative w-full max-w-lg overflow-hidden bg-white border shadow-2xl rounded-3xl border-slate-200 shadow-slate-950/25"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-branch-title"
        aria-describedby="nearby-branch-description"
      >
        <div className="p-6 sm:p-8">
          <button
            type="button"
            className="absolute inline-flex items-center justify-center w-10 h-10 transition rounded-full right-4 top-4 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleCloseModal}
            disabled={isLocating}
            aria-label="關閉定位視窗"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6 18 18" />
              <path d="M18 6 6 18" />
            </svg>
          </button>

          <div className="flex items-center justify-center text-blue-700 bg-blue-100 h-14 w-14 rounded-2xl">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
              <circle cx="12" cy="10" r="2.2" />
            </svg>
          </div>

          <h2 id="nearby-branch-title" className="pr-10 mt-5 text-2xl font-bold tracking-tight text-slate-900">
            尋找附近分行
          </h2>

          <p id="nearby-branch-description" className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            允許網站取得你目前的位置後 系統會自動找出距離最近的銀行分行
          </p>

          <div className="p-4 mt-6 space-y-3 rounded-2xl bg-slate-50">
            <div className="flex items-start gap-3">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>

              <p className="text-sm leading-6 text-slate-600">只會取得本次查詢所需的位置</p>
            </div>

            <div className="flex items-start gap-3">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>

              <p className="text-sm leading-6 text-slate-600">系統只會載入距離最近的十間分行</p>
            </div>

            <div className="flex items-start gap-3">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>

              <p className="text-sm leading-6 text-slate-600">查詢完成後會自動選取最近的分行</p>
            </div>
          </div>

          {locationError && (
            <div
              className="flex items-start gap-3 px-4 py-3 mt-5 text-sm leading-6 text-red-700 border border-red-200 rounded-2xl bg-red-50"
              role="alert"
            >
              <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6" />
                <path d="M12 17h.01" />
              </svg>

              <p>{locationError}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 mt-7 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center h-12 px-5 text-sm font-semibold transition border rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleCloseModal}
              disabled={isLocating}
            >
              取消
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center h-12 gap-2 px-5 text-sm font-semibold text-white transition bg-blue-700 shadow-sm rounded-xl hover:bg-blue-800 disabled:cursor-wait disabled:bg-blue-400"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <>
                  <span className="w-5 h-5 border-2 rounded-full animate-spin border-white/40 border-t-white" aria-hidden="true" />
                  正在取得位置
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3" />
                    <path d="M12 19v3" />
                    <path d="M2 12h3" />
                    <path d="M19 12h3" />
                  </svg>
                  使用目前位置
                </>
              )}
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-center text-slate-400">瀏覽器會在下一步顯示定位權限視窗</p>
        </div>
      </section>
    </div>
  );
};

export default NearbyBranchModal;
