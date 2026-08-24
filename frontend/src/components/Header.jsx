import React, { useContext, useState } from "react";

import { BankContext } from "../contexts/BankContext";

const navItems = [
  {
    label: "銀行查詢",
    href: "#search",
  },
  {
    label: "附近分行",
    action: "nearby",
  },
  {
    label: "關於本站",
    href: "#about",
  },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 取得附近分行定位視窗的控制狀態
  const { setIsNearbyModalOpen, setLocationError } = useContext(BankContext);

  // 處理導覽選單點擊
  const handleNavClick = (item) => {
    // 手機版點擊選單後自動關閉
    setIsMenuOpen(false);

    // 點擊附近分行時開啟定位說明視窗
    if (item.action === "nearby") {
      setLocationError("");
      setIsNearbyModalOpen(true);
    }
  };

  // 渲染桌機版導覽項目
  const renderDesktopNavItem = (item) => {
    if (item.action === "nearby") {
      return (
        <button
          key={item.label}
          type="button"
          onClick={() => handleNavClick(item)}
          className="text-sm font-semibold transition-colors text-slate-600 hover:text-blue-700"
        >
          {item.label}
        </button>
      );
    }

    return (
      <a
        key={item.label}
        href={item.href}
        onClick={() => handleNavClick(item)}
        className="text-sm font-semibold transition-colors text-slate-600 hover:text-blue-700"
      >
        {item.label}
      </a>
    );
  };

  // 渲染手機版導覽項目
  const renderMobileNavItem = (item) => {
    const className = "w-full px-3 py-3 text-sm font-semibold text-left transition rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700";

    if (item.action === "nearby") {
      return (
        <button key={item.label} type="button" onClick={() => handleNavClick(item)} className={className}>
          {item.label}
        </button>
      );
    }

    return (
      <a key={item.label} href={item.href} onClick={() => handleNavClick(item)} className={className}>
        {item.label}
      </a>
    );
  };

  return (
    <header className="pt-16">
      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b shadow-sm border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3" aria-label="回到 BankSearch 首頁">
            <span className="flex items-center justify-center w-10 h-10 text-white bg-blue-700 shadow-sm rounded-xl">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
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

            <span className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">BankSearch</span>
          </a>

          {/* 桌機與平板選單 */}
          <div className="items-center hidden gap-6 md:flex lg:gap-8">{navItems.map(renderDesktopNavItem)}</div>

          {/* 手機版選單按鈕 */}
          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 transition border rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={isMenuOpen ? "關閉導覽選單" : "開啟導覽選單"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6 18 18" />
                <path d="M18 6 6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {/* 手機版下拉選單 */}
        {isMenuOpen && (
          <div className="px-4 py-3 bg-white border-t border-slate-200 md:hidden">
            <div className="flex flex-col mx-auto max-w-7xl">{navItems.map(renderMobileNavItem)}</div>
          </div>
        )}
      </nav>

      {/* 首頁標題區 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2f63] via-[#0a3d7c] to-[#082956]">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-56 h-56 rounded-full -left-24 top-10 bg-blue-400/20 blur-3xl" />
          <div className="absolute bottom-0 w-64 h-64 rounded-full -right-24 bg-cyan-300/20 blur-3xl" />
        </div>

        <div className="relative px-4 pt-8 pb-20 mx-auto text-center max-w-7xl sm:px-6 sm:pb-24 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-12">
          <p className="inline-flex px-4 py-2 mx-auto text-sm font-semibold text-blue-100 border rounded-full border-blue-300/30 bg-white/10">
            本站目前僅提供銀行分行資料，暫不包含郵局及農漁會
          </p>

          <h1 className="max-w-4xl mx-auto mt-5 text-[26px] font-bold tracking-tight text-white min-[360px]:text-3xl sm:text-4xl lg:text-5xl">
            全台銀行與分行查詢系統
          </h1>

          <p className="max-w-3xl mx-auto mt-5 text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">
            快速查詢全台銀行與分行、找到最近的服務據點、一鍵開啟 Google 地圖導航
          </p>
        </div>
      </section>
    </header>
  );
};

export default Header;
