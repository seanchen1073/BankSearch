import React from "react";
import { Routes, Route } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";

import Header from "./components/Header";
import BankingForm from "./components/BankingForm";
import BranchDetails from "./components/BranchDetails";
import AboutSection from "./components/AboutSection";
import Footer from "./components/Footer";
import NotFound from "./components/NotFoundPage";
import { BankProvider } from "./contexts/BankContext";

function App() {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <BankProvider>
        <LoadScript
          googleMapsApiKey={googleMapsApiKey}
          loadingElement={<div className="flex min-h-[320px] items-center justify-center px-4 text-slate-500">正在載入地圖服務…</div>}
        >
          <main>
            {/* 銀行與分行搜尋區 */}
            <BankingForm />

            {/* 選擇分行後，詳細資料與地圖會出現在這裡 */}
            <Routes>
              <Route path="/" element={null} />

              <Route path="/:bankCode/:branchCode/:names" element={<BranchDetails />} />

              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* 網站功能介紹 */}
            <AboutSection />
          </main>
        </LoadScript>
      </BankProvider>

      <Footer />
    </div>
  );
}

export default App;
