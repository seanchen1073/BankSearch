import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BankMap from "./BankMap";
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
  } = useContext(BankContext);

  const [copiedItem, setCopiedItem] = useState("");

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

  const copyText = async (text, itemName) => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
    } catch (error) {
      console.error("複製失敗：", error);
    }
  };

  const handleCopyUrl = () => {
    copyText(window.location.href, "url");
  };

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

    navigate("/");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 已選擇銀行，但尚未選擇分行
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

          <p className="mt-2 text-sm leading-6 text-slate-600">銀行已選擇完成，請在上方分行欄位選擇要查詢的分行。</p>
        </div>
      </section>
    );
  }

  // 使用者直接開啟分行網址時，等待銀行與分行資料載入
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

  const googleMapsUrl =
    branchAddress !== "目前沒有地址資料" ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branchAddress)}` : null;

  return (
    <section ref={resultRef} className="px-4 py-10 scroll-mt-24 sm:px-6 sm:py-12 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-700">查詢結果</p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">分行詳細資訊</h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">查看分行代碼、地址、電話與 Google 地圖位置。</p>
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

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-500">分行代碼</p>

                      <p className="mt-1 font-bold break-all text-slate-900">{selectedBranchCode}</p>
                    </div>
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
                        className="px-2 py-1 text-sm font-semibold text-blue-700 transition rounded-lg shrink-0 hover:bg-blue-100"
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
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white transition bg-blue-700 min-h-12 rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m4 4 16 7-7 3-3 6-6-16Z" />
                    </svg>
                    開啟 Google 地圖
                  </a>
                )}

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

              <p className="mt-6 text-xs leading-5 text-slate-400">資料僅供查詢參考，實際資訊請以各銀行官方公告為準。</p>
            </div>

            {/* 右側 Google 地圖 */}
            <div className="min-h-[320px] border-t border-slate-200 bg-slate-100 lg:min-h-full lg:border-l lg:border-t-0">
              <BankMap address={selectedBranch.address} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BranchDetails;
