import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import BankingForm from "./components/BankingForm";
import BranchDetails from "./components/BranchDetails";
import { BankProvider } from "./contexts/BankContext";
import NotFound from "./components/NotFoundPage"; // 引入404頁面

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <BankProvider>
        <div className="container px-4 py-8 mx-auto">
          <BankingForm />
          <Routes>
            <Route path="/" element={<div />} />
            <Route path="/:bankCode/:branchCode/:names" element={<BranchDetails />} />
            <Route path="*" element={<NotFound />} /> {/* 404 頁面 */}
          </Routes>
        </div>
      </BankProvider>
    </div>
  );
}

export default App;
