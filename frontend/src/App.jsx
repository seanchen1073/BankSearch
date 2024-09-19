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

  const fetchBankData = async (bankCode = null) => {
    try {
      let apiUrl = "http://localhost:8000/api/banks/";
      if (bankCode) {
        apiUrl += `${bankCode}/branches/`; // 請求特定銀行的分行資料
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
      console.error("抓取資料時發生錯誤：", error);
      return [];
    }
  };

  useEffect(() => {
    const loadBankData = async () => {
      console.log("載入銀行資料中...");
      const data = await fetchBankData(); // 初次載入頁面時抓取所有銀行資料
      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data);
        console.log("銀行資料載入成功：", data);
      } else {
        console.error("無法載入銀行資料");
      }
    };
    loadBankData();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      const fetchBranches = async () => {
        const bankCode = selectedBank.split(" ")[0];
        const branches = await fetchBankData(bankCode);
        setFilteredBranches(branches);
      };
      fetchBranches();
    } else {
      setFilteredBranches([]);
    }
  }, [selectedBank]);

  const handleBankSearch = (searchTerm) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = bankData.filter(
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || bank.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredBanks(filtered);
  };

  const handleBranchSearch = (searchTerm) => {
    if (!selectedBank) return;
    const filtered = filteredBranches.filter((branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredBranches(filtered);
  };

  const handleSubmit = () => {
    if (selectedBank && selectedBranch) {
      const bankCode = selectedBank.split(" ")[0];
      const branchCode = selectedBranch.code;
      const bankName = encodeURIComponent(selectedBank.split(" ")[1]);
      const branchName = encodeURIComponent(selectedBranch.name);

      // 更新網址而不跳轉頁面
      window.history.pushState({}, "", `/${bankCode}/${branchCode}/${bankName}-${branchName}.html`);
    }
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
                  handleSubmit={handleSubmit}
                />
              }
            />
            <Route path="/:bankCode/:branchCode/:bankName-:branchName.html" element={<BankBranchDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
