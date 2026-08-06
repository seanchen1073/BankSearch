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

        // 儲存使用者目前位置
        const currentLocation = {
          lat: latitude,
          lng: longitude,
        };

        setUserLocation(currentLocation);

        try {
          // 查詢十公里內最多十間最近分行
          const branches = await fetchNearbyBranches(latitude, longitude, 10, 10);

          if (!branches) {
            setLocationError("附近分行資料載入失敗 請確認後端服務後再試一次");

            return;
          }

          if (branches.length === 0) {
            setNearbyBranches([]);

            setLocationError("目前位置十公里內找不到可用的分行資料");

            return;
          }

          // 儲存十公里內最多十間最近分行
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
        className="relative w-full max-w-md overflow-hidden bg-white border shadow-2xl rounded-3xl border-slate-200 shadow-slate-950/25"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-branch-title"
        aria-describedby="nearby-branch-description"
      >
        <div className="p-6 sm:p-7">
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
            快速尋找附近分行
          </h2>

          <p id="nearby-branch-description" className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            允許取得您目前的位置後，幫您快速找到 10 公里內最近的銀行分行。
          </p>

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

          {/* 定位權限提醒 */}
          <div className="flex items-start gap-3 px-4 py-3.5 mt-5 border border-amber-200 rounded-2xl bg-amber-50">
            <span className="flex items-center justify-center shrink-0 w-8 h-8 text-amber-700 bg-amber-100 rounded-full">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
              </svg>
            </span>

            <div>
              <p className="text-sm font-bold text-amber-900">請允許定位權限</p>

              <p className="mt-1 text-sm font-medium leading-6 text-amber-800">下一步請在瀏覽器的定位權限視窗點選「允許」</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 mt-6 sm:flex-row sm:justify-center">
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
        </div>
      </section>
    </div>
  );
};

export default NearbyBranchModal;
