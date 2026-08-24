import React, { useContext, useEffect, useRef, useState } from "react";
import SEO from "./seo.jsx";
import { useNavigate, useParams } from "react-router-dom";

import BankMap from "./BankMap";
import { resolveGooglePlace } from "./BankGetApi.jsx";
import { BankContext } from "../contexts/BankContext";

const BranchDetails = () => {
  const navigate = useNavigate();
  const { bankCode, branchCode } = useParams();
  const resultRef = useRef(null);

  const {
    selectedBank,
    setSelectedBank,
    selectedBranch,
    setSelectedBranch,
    setBankSearchTerm,
    setBranchSearchTerm,
    setBranchData,
    setFilteredBranches,
    setActiveDropdown,
    setSelectedIndex,
    setMouseHoveredIndex,

    // 附近分行相關狀態
    userLocation,
    nearbyBranches,
    isNearbySearch,
    resetNearbyState,
  } = useContext(BankContext);

  // 記錄目前已複製的項目
  const [copiedItem, setCopiedItem] = useState("");

  // 記錄 Google 地圖是不是正在準備
  const [isOpeningGoogleMaps, setIsOpeningGoogleMaps] = useState(false);

  // 選擇分行後自動捲動到結果區
  useEffect(() => {
    if (selectedBank && selectedBranch && resultRef.current) {
      const timer = window.setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);

      return () => {
        window.clearTimeout(timer);
      };
    }

    return undefined;
  }, [selectedBank, selectedBranch]);

  // 複製成功提示兩秒後自動消失
  useEffect(() => {
    if (!copiedItem) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCopiedItem("");
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedItem]);

  // 複製文字
  const copyText = async (text, itemName) => {
    if (!text) {
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 非安全連線時使用備用複製方式
        const textArea = document.createElement("textarea");

        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand("copy");

        document.body.removeChild(textArea);
      }

      setCopiedItem(itemName);
    } catch (error) {
      console.error("複製失敗", error);
    }
  };

  // 複製目前分行查詢網址
  const handleCopyUrl = () => {
    copyText(window.location.href, "url");
  };

  // 清除目前查詢結果
  const handleReset = () => {
    setSelectedBank(null);
    setSelectedBranch(null);

    setBankSearchTerm("");
    setBranchSearchTerm("");

    setBranchData([]);
    setFilteredBranches([]);

    setActiveDropdown(null);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);

    // 清除附近分行與定位資料
    resetNearbyState();

    navigate("/");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 格式化分行與使用者之間的距離
  const formatDistance = (distanceMeters) => {
    const distance = Number(distanceMeters);

    if (!Number.isFinite(distance)) {
      return null;
    }

    if (distance < 1000) {
      return `距離你約 ${Math.round(distance)} 公尺`;
    }

    const distanceKilometers = distance / 1000;

    return `距離你約 ${distanceKilometers.toFixed(distanceKilometers >= 10 ? 0 : 1)} 公里`;
  };

  // 已選擇銀行但尚未選擇分行
  if (selectedBank && !selectedBranch) {
    return (
      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-5xl px-6 py-10 mx-auto text-center border border-blue-200 shadow-sm rounded-2xl bg-blue-50">
          <span className="flex items-center justify-center mx-auto text-blue-700 bg-blue-100 h-14 w-14 rounded-2xl">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
          </span>

          <h2 className="mt-4 text-xl font-bold text-slate-900">請選擇分行</h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">銀行已選擇完成 請在上方分行欄位選擇要查詢的分行</p>
        </div>
      </section>
    );
  }

  // 使用者直接開啟分行網址時等待資料載入
  if (!selectedBank || !selectedBranch) {
    return (
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center max-w-5xl px-6 py-12 mx-auto bg-white border shadow-sm rounded-2xl border-slate-200">
          <div className="text-center">
            <span className="block w-8 h-8 mx-auto border-4 border-blue-100 rounded-full animate-spin border-t-blue-700" />

            <p className="mt-4 text-sm text-slate-500">正在載入分行資料…</p>
          </div>
        </div>
      </section>
    );
  }

  const selectedBankCode = selectedBank.split(" ")[0] || bankCode || "";

  const selectedBankName = selectedBank.split(" ").slice(1).join(" ") || "銀行";

  const selectedBranchCode = selectedBranch.code || branchCode || "";

  const selectedBranchName = selectedBranch.name || "分行";

  const branchAddress = selectedBranch.address || "目前沒有地址資料";

  const branchPhone = selectedBranch.tel || selectedBranch.phone || selectedBranch.telephone || "目前沒有電話資料";

  const distanceText = isNearbySearch ? formatDistance(selectedBranch.distance_meters) : null;

  // 組合目前分行名稱
  // 有可信 Place ID 時用來協助 Google 顯示正確的分行名稱
  const branchDisplayName = [selectedBranch.bank_name || selectedBankName, selectedBranchName].filter(Boolean).join(" ");

  // 沒有可信 Place ID 時直接使用官方原始地址
  // 前端不再自己重新整理地址格式
  const fallbackNavigationAddress = selectedBranch.address || "";

  const hasBranchCode = Boolean(selectedBranchCode);

  // 有分行代碼跟沒有分行代碼使用不同 SEO 文案
  const seoTitle = hasBranchCode
    ? `${selectedBankName}${selectedBranchName}｜銀行代碼、地址與電話查詢`
    : `${selectedBankName}${selectedBranchName}｜地址與電話查詢`;

  const seoDescription = hasBranchCode
    ? `查詢${selectedBankName}${selectedBranchName}分行資訊，包含銀行代碼、分行代碼、地址、電話與 Google 地圖位置。`
    : `查詢${selectedBankName}${selectedBranchName}資訊，包含銀行代碼、地址、電話與 Google 地圖位置。`;

  const seoUrl = window.location.href;

  // 組出最後要開啟的 Google Maps 網址
  // 有可信 Place ID 就直接指定正式 Google Place
  // 沒有 Place ID 才回到官方原始地址
  const createGoogleMapsUrl = (placeResult = null) => {
    const placeId = String(selectedBranch.place_id || placeResult?.place_id || "").trim();

    const googleName = String(placeResult?.google_name || branchDisplayName || "").trim();

    // 附近分行模式會直接從使用者目前位置開始導航
    if (isNearbySearch && userLocation) {
      const originLatitude = Number(userLocation.lat);

      const originLongitude = Number(userLocation.lng);

      if (Number.isFinite(originLatitude) && Number.isFinite(originLongitude)) {
        const originValue = `${originLatitude},${originLongitude}`;

        // 有 Place ID 就讓 Google Maps 直接辨識正式分行
        // Google Maps 會自行呈現 Place 名稱與地址
        if (placeId) {
          const destinationName = googleName || branchDisplayName || fallbackNavigationAddress;

          if (!destinationName) {
            return null;
          }

          return (
            "https://www.google.com/maps/dir/" +
            "?api=1" +
            `&origin=${encodeURIComponent(originValue)}` +
            `&destination=${encodeURIComponent(destinationName)}` +
            `&destination_place_id=${encodeURIComponent(placeId)}` +
            "&travelmode=driving"
          );
        }

        // 沒有可信 Place ID 時以官方原始地址為主
        if (fallbackNavigationAddress) {
          return (
            "https://www.google.com/maps/dir/" +
            "?api=1" +
            `&origin=${encodeURIComponent(originValue)}` +
            `&destination=${encodeURIComponent(fallbackNavigationAddress)}` +
            "&travelmode=driving"
          );
        }

        return null;
      }
    }

    // 一般查詢有 Place ID 就直接開正式 Google Place
    if (placeId) {
      const placeQuery = googleName || branchDisplayName || fallbackNavigationAddress;

      if (!placeQuery) {
        return null;
      }

      return (
        "https://www.google.com/maps/search/" +
        "?api=1" +
        `&query=${encodeURIComponent(placeQuery)}` +
        `&query_place_id=${encodeURIComponent(placeId)}`
      );
    }

    // 沒有可信 Place ID 時直接使用官方原始地址
    if (fallbackNavigationAddress) {
      return "https://www.google.com/maps/search/" + "?api=1" + `&query=${encodeURIComponent(fallbackNavigationAddress)}`;
    }

    return null;
  };

  // 左側按鈕也使用 Google Place 優先的邏輯
  // 已經有 Place ID 時就不再重打 API
  const handleOpenGoogleMaps = async () => {
    if (isOpeningGoogleMaps) {
      return;
    }

    setIsOpeningGoogleMaps(true);

    // 先開空白分頁避免等待 API 時被瀏覽器擋掉
    const mapWindow = window.open("about:blank", "_blank");

    if (mapWindow) {
      mapWindow.opener = null;
    }

    try {
      let placeResult = null;

      // bank_data.json 還沒有 Place ID 的舊資料
      // 才暫時透過目前 resolver 查 Google Place
      if (!selectedBranch.place_id) {
        placeResult = await resolveGooglePlace(selectedBankCode, selectedBranchCode, selectedBranchName);
      }

      const googleMapsUrl = createGoogleMapsUrl(placeResult);

      if (!googleMapsUrl) {
        if (mapWindow && !mapWindow.closed) {
          mapWindow.close();
        }

        return;
      }

      if (mapWindow && !mapWindow.closed) {
        mapWindow.location.href = googleMapsUrl;

        return;
      }

      // 新分頁被瀏覽器擋掉時就在目前頁面開啟
      window.location.href = googleMapsUrl;
    } catch (error) {
      console.error("開啟 Google 地圖失敗", error);

      // Place 查詢失敗時就回到官方原始地址
      const fallbackGoogleMapsUrl = createGoogleMapsUrl();

      if (!fallbackGoogleMapsUrl) {
        if (mapWindow && !mapWindow.closed) {
          mapWindow.close();
        }

        return;
      }

      if (mapWindow && !mapWindow.closed) {
        mapWindow.location.href = fallbackGoogleMapsUrl;

        return;
      }

      window.location.href = fallbackGoogleMapsUrl;
    } finally {
      setIsOpeningGoogleMaps(false);
    }
  };

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} url={seoUrl} />

      <section ref={resultRef} className="px-4 py-10 scroll-mt-24 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold text-blue-700">查詢結果</p>

              {isNearbySearch && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3" />
                    <path d="M12 19v3" />
                    <path d="M2 12h3" />
                    <path d="M19 12h3" />
                  </svg>
                  附近分行
                </span>
              )}
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">分行詳細資訊</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">查看分行代碼 地址 電話與 Google 地圖位置</p>
          </div>

          <div className="overflow-hidden bg-white border shadow-xl rounded-3xl border-slate-200 shadow-slate-900/5">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              {/* 左側分行資料 */}
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="flex items-start gap-4">
                  <span className="flex items-center justify-center text-white bg-blue-700 shadow-sm h-14 w-14 shrink-0 rounded-2xl">
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <path d="M3 9h18" />
                      <path d="M5 9v8" />
                      <path d="M9 9v8" />
                      <path d="M15 9v8" />
                      <path d="M19 9v8" />
                      <path d="M3 17h18" />
                      <path d="M2 21h20" />
                      <path d="M12 3 3 7h18L12 3Z" />
                    </svg>
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-700">{selectedBankCode}</p>

                    <h3 className="mt-1 text-xl font-bold break-words text-slate-900 sm:text-2xl">{selectedBankName}</h3>

                    <p className="mt-1 text-base font-semibold break-words text-slate-600">{selectedBranchName}</p>

                    {distanceText && (
                      <div className="mt-3 min-w-0">
                        <p className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-full bg-emerald-50 text-emerald-700">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                            <circle cx="12" cy="10" r="2" />
                          </svg>

                          {distanceText}
                        </p>

                        <p className="mt-1.5 max-w-[260px] text-xs leading-5 break-words text-slate-400">此為直線距離，實際距離依地圖顯示為主</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {/* 分行代碼 */}
                  <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-10 h-10 text-blue-700 bg-white shadow-sm shrink-0 rounded-xl">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M4 7h16" />
                          <path d="M4 12h16" />
                          <path d="M4 17h16" />
                        </svg>
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-500">分行代碼</p>

                        <p className="mt-1 font-bold break-all text-slate-900">{selectedBranchCode || "無分行代碼"}</p>
                      </div>

                      {selectedBranchCode && (
                        <button
                          type="button"
                          onClick={() => copyText(selectedBranchCode, "branchCode")}
                          className="inline-flex items-center justify-center px-3 py-2 text-sm font-bold text-blue-700 transition bg-white border border-blue-200 rounded-lg shrink-0 hover:border-blue-300 hover:bg-blue-50"
                        >
                          {copiedItem === "branchCode" ? "已複製" : "複製"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 分行地址 */}
                  <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-10 h-10 text-blue-700 bg-white shadow-sm shrink-0 rounded-xl">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                          <circle cx="12" cy="10" r="2" />
                        </svg>
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-500">分行地址</p>

                        <p className="mt-1 font-semibold leading-7 break-words text-slate-900">{branchAddress}</p>
                      </div>

                      {selectedBranch.address && (
                        <button
                          type="button"
                          onClick={() => copyText(selectedBranch.address, "address")}
                          className="inline-flex items-center justify-center px-3 py-2 text-sm font-bold text-blue-700 transition bg-white border border-blue-200 rounded-lg shrink-0 hover:border-blue-300 hover:bg-blue-50"
                        >
                          {copiedItem === "address" ? "已複製" : "複製"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 聯絡電話 */}
                  <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-10 h-10 text-blue-700 bg-white shadow-sm shrink-0 rounded-xl">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M7 3h3l2 5-2 2a15 15 0 0 0 4 4l2-2 5 2v3a4 4 0 0 1-4 4A14 14 0 0 1 3 7a4 4 0 0 1 4-4Z" />
                        </svg>
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-500">聯絡電話</p>

                        {branchPhone !== "目前沒有電話資料" ? (
                          <a href={`tel:${branchPhone}`} className="block mt-1 font-bold break-all transition text-slate-900 hover:text-blue-700">
                            {branchPhone}
                          </a>
                        ) : (
                          <p className="mt-1 font-semibold text-slate-900">{branchPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="grid grid-cols-1 gap-3 mt-7 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    disabled={isOpeningGoogleMaps}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white transition bg-blue-700 min-h-12 rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:bg-blue-600"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m4 4 16 7-7 3-3 6-6-16Z" />
                    </svg>

                    {isOpeningGoogleMaps ? "正在開啟 Google 地圖" : "開啟 Google 地圖"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition bg-white border min-h-12 rounded-xl border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" />

                      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
                    </svg>

                    {copiedItem === "url" ? "網址已複製" : "複製查詢網址"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 mt-3 text-sm font-bold transition bg-white border min-h-12 rounded-xl border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 12a8 8 0 1 0 3-6" />
                    <path d="M4 4v6h6" />
                  </svg>
                  重新查詢
                </button>

                <p className="mt-6 text-xs leading-5 text-slate-400">資料僅供查詢參考 實際資訊請以各銀行官方公告為準</p>
              </div>

              {/* 右側 Google 地圖 */}
              <div className="min-h-[320px] border-t border-slate-200 bg-slate-100 lg:min-h-full lg:border-l lg:border-t-0">
                <BankMap
                  address={selectedBranch.address}
                  latitude={selectedBranch.latitude}
                  longitude={selectedBranch.longitude}
                  bankCode={selectedBankCode}
                  bankName={selectedBankName}
                  selectedBranch={selectedBranch}
                  userLocation={userLocation}
                  nearbyBranches={nearbyBranches}
                  isNearbySearch={isNearbySearch}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BranchDetails;
