import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import BankingForm from "./components/BankingForm";
import BankBranchDetail from "./components/BankBranchDetail";

function App() {
  const [bankData, setBankData] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);

  // 抓取銀行資料的函數，bankCode 可選參數，用於抓取特定銀行或所有銀行
  const fetchBankData = async (bankCode = null) => {
    try {
      let apiUrl = "http://localhost:8000/api/banks/";
      if (bankCode) {
        apiUrl += `${bankCode}`;
      }
      const response = await axios.get(apiUrl, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`錯誤：收到狀態碼 ${response.status}`);
        return [];
      }
    } catch (error) {
      console.error("抓取銀行資料時發生錯誤：", error);
      return [];
    }
  };

  // 使用 useEffect 在組件掛載時抓取所有銀行資料
  useEffect(() => {
    const loadBankData = async () => {
      console.log("載入銀行資料中...");
      const data = await fetchBankData(); // 初次載入頁面時抓取所有銀行資料
      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data); // 預設將 filteredBanks 設置為完整的銀行列表
        console.log("銀行資料載入成功：", data);
      } else {
        console.error("無法載入銀行資料");
      }
    };
    loadBankData();
  }, []); // 依賴陣列為空，代表只在組件首次掛載時執行

  // 根據使用者輸入的搜尋字詞過濾銀行列表
  const handleBankSearch = (searchTerm) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = bankData.filter(
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || bank.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredBanks(filtered);
  };

  // 當選擇某個銀行時，抓取該銀行的分行資料
  useEffect(() => {
    if (selectedBank) {
      const selectedBankData = bankData.find((bank) => bank.code === selectedBank.split(" ")[0]);
      if (selectedBankData) {
        setFilteredBranches(selectedBankData.branches);
      } else {
        setFilteredBranches([]);
      }
    } else {
      setFilteredBranches([]);
    }
  }, [selectedBank, bankData]);

  // 根據使用者輸入的搜尋字詞過濾分行列表
  const handleBranchSearch = (searchTerm) => {
    if (!selectedBank) return;
    const filtered = filteredBranches.filter((branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredBranches(filtered);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container px-4 py-8 mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <BankingForm
                  handleBankSearch={handleBankSearch}
                  handleBranchSearch={handleBranchSearch}
                  filteredBanks={filteredBanks}
                  filteredBranches={filteredBranches}
                  selectedBank={selectedBank}
                  setSelectedBank={setSelectedBank}
                  selectedBranch={selectedBranch}
                  setSelectedBranch={setSelectedBranch}
                />
              }
            />
            <Route
              path="/:bankCode/:branchCode/:bankName-:branchName.html"
              element={
                <BankBranchDetail
                  selectedBank={selectedBank}
                  setSelectedBank={setSelectedBank}
                  selectedBranch={selectedBranch}
                  setSelectedBranch={setSelectedBranch}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
