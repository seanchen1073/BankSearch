import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white border shadow-xl rounded-3xl border-slate-200 shadow-slate-900/5">
        <div className="relative px-6 py-12 overflow-hidden text-center sm:px-10 sm:py-16">
          {/* 背景裝飾 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-56 h-56 bg-blue-100 rounded-full -left-20 -top-20 blur-3xl" />

            <div className="absolute w-64 h-64 bg-indigo-100 rounded-full -bottom-24 -right-16 blur-3xl" />
          </div>

          <div className="relative">
            {/* 圖示 */}
            <span className="flex items-center justify-center w-20 h-20 mx-auto text-blue-700 bg-blue-100 rounded-3xl sm:h-24 sm:w-24">
              <svg viewBox="0 0 24 24" className="w-10 h-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />

                <path d="m20 20-4-4" />

                <path d="M8.5 8.5h5" />

                <path d="M8.5 11.5h3" />
              </svg>
            </span>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-blue-700">404 Not Found</p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">找不到這個銀行或分行頁面</h1>

            <p className="max-w-xl mx-auto mt-5 text-base leading-7 text-slate-600">
              此網址可能已失效、資料不存在，或銀行與分行代碼輸入錯誤。 請返回首頁重新選擇銀行與分行。
            </p>

            <div className="flex flex-col justify-center gap-3 mt-8 sm:flex-row">
              <Link
                to="/"
                onClick={handleBackToTop}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition bg-blue-700 min-h-12 rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 12a8 8 0 1 0 3-6" />

                  <path d="M4 4v6h6" />
                </svg>
                返回首頁重新查詢
              </Link>

              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition bg-white border min-h-12 rounded-xl border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                了解 BankSearch
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
