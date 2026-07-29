import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#071f3f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-4 mx-auto text-center max-w-7xl sm:flex-row sm:text-left">
        <div>
          <p className="text-lg font-bold">BankSearch</p>

          <p className="mt-1 text-sm text-blue-200">台灣銀行與分行資訊查詢系統</p>
        </div>

        <div className="text-sm text-blue-200 sm:text-right">
          <p>Designed &amp; Developed by Sean</p>

          <p className="mt-1">© {currentYear} BankSearch</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
