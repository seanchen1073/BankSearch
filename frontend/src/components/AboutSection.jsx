import React, { useContext } from "react";

import { BankContext } from "../contexts/BankContext";

const features = [
  {
    title: "快速查詢",
    description: "支援銀行名稱、常用簡稱與三碼銀行代碼查詢。",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    ),
  },
  {
    title: "查看分行位置",
    description: "顯示分行地址、聯絡電話與 Google 地圖位置。",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    ),
  },
  {
    title: "一鍵導航",
    description: "選定分行後，可直接開啟 Google 地圖導航前往。",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m4 4 16 7-7 3-3 6-6-16Z" />
      </svg>
    ),
  },
];

const AboutSection = () => {
  const { selectedBank, selectedBranch } = useContext(BankContext);

  // 只有選好銀行但還沒選分行時縮短與提示區的距離
  const isWaitingForBranch = selectedBank && !selectedBranch;

  return (
    <section id="about" className={isWaitingForBranch ? "px-4 pt-6 pb-16 sm:px-6 sm:pt-6 sm:pb-20 lg:px-8" : "px-4 py-16 sm:px-6 sm:py-20 lg:px-8"}>
      <div className="max-w-6xl mx-auto overflow-hidden bg-white border shadow-lg rounded-3xl border-slate-200 shadow-slate-900/5">
        <div className="grid items-center lg:grid-cols-[0.9fr_1.1fr]">
          {/* 左側示意圖 */}
          <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 p-8 sm:min-h-[360px] sm:p-10">
            <div className="absolute rounded-full -left-16 -top-16 h-52 w-52 bg-blue-300/30 blur-3xl" />
            <div className="absolute rounded-full -bottom-20 -right-14 h-60 w-60 bg-indigo-300/30 blur-3xl" />

            <div className="relative flex h-full min-h-[250px] items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* 手機地圖 */}
                <div className="absolute left-2 top-2 h-52 w-36 -rotate-6 rounded-[28px] border-[7px] border-slate-800 bg-white shadow-2xl sm:left-8 sm:h-60 sm:w-40">
                  <div className="h-2 mx-auto mt-3 rounded-full w-14 bg-slate-300" />

                  <div className="p-3 mx-4 mt-5 rounded-xl bg-blue-50">
                    <div className="h-20 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" aria-hidden="true">
                        <path d="M10 62 35 35l20 12 22-25 33 22" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="77" cy="22" r="8" fill="#dc2626" />
                      </svg>
                    </div>

                    <div className="w-20 h-2 mt-3 rounded bg-slate-200" />
                    <div className="w-16 h-2 mt-2 rounded bg-slate-200" />
                  </div>
                </div>

                {/* 銀行資料卡 */}
                <div className="ml-auto mt-12 w-[72%] rounded-3xl border border-white/80 bg-white/90 p-6 shadow-2xl backdrop-blur sm:mt-16">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto text-white bg-blue-700 rounded-2xl">
                    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <path d="M3 9h18" />
                      <path d="M5 9v8" />
                      <path d="M9 9v8" />
                      <path d="M15 9v8" />
                      <path d="M19 9v8" />
                      <path d="M3 17h18" />
                      <path d="M2 21h20" />
                      <path d="M12 3 3 7h18L12 3Z" />
                    </svg>
                  </div>

                  <div className="h-3 mt-5 rounded-full bg-slate-200" />
                  <div className="w-4/5 h-3 mt-3 rounded-full bg-slate-200" />

                  <div className="flex gap-2 mt-5">
                    <span className="flex-1 h-8 bg-blue-100 rounded-lg" />
                    <span className="flex-1 h-8 rounded-lg bg-emerald-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右側介紹內容 */}
          <div className="p-6 sm:p-10 lg:p-12">
            <p className="text-sm font-bold text-blue-700">關於 BankSearch</p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">查銀行、找分行、直接導航</h2>

            <p className="mt-5 leading-7 text-slate-600">
              BankSearch 整合全台銀行與分行資訊，讓你快速確認銀行代碼、 分行地址與所在位置，並直接開啟 Google 地圖導航。
            </p>

            <div className="mt-8 space-y-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <span className="flex items-center justify-center text-blue-700 bg-blue-100 h-11 w-11 shrink-0 rounded-xl">{feature.icon}</span>

                  <div>
                    <h3 className="font-bold text-slate-900">{feature.title}</h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
