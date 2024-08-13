import React, { useState } from "react";

function App() {
  const [selectedBank, setSelectedBank] = useState("");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-1 text-xs text-white bg-gray-700">powered by Sean</div>
      <h1 className="p-4 text-4xl font-bold text-center text-white bg-black">台灣銀行代碼查詢</h1>
      <div className="container flex mx-auto mt-8">
        <div className="w-1/2 pr-4">
          <h2 className="mb-2 text-xl font-semibold">銀行名稱</h2>
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pr-10 border rounded-md"
              placeholder="請輸入關鍵字或銀行代碼"
              onChange={(e) => setSelectedBank(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <div className="w-px h-4 mr-2 bg-gray-300"></div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          <div>可使用下拉選單或直接輸入關鍵字查詢</div>
        </div>
        <div className="w-1/2 pl-4">
          <h2 className="mb-2 text-xl font-semibold">分行名稱</h2>
          <div className="relative">
            <input
              type="text"
              className={`w-full p-2 border rounded-md pr-10 ${!selectedBank ? "bg-gray-200" : ""}`}
              placeholder="請選擇銀行後輸入分行名稱"
              disabled={!selectedBank}
            />
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <div className="w-px h-4 mr-2 bg-gray-300"></div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
