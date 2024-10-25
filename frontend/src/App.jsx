import React, { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import BankingForm from "./components/BankingForm";
import BranchDetails from "./components/BranchDetails";

function App() {
  const navigate = useNavigate();
  const [bankData, setBankData] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState(bankData); // 新增狀態以存儲過濾的銀行
  const [filteredBranches, setFilteredBranches] = useState([]); // 新增狀態以存儲過濾的分行
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const fetchBankData = async (bankCode = null) => {
    let apiUrl = "http://localhost:8000/api/banks/";
    if (bankCode) {
      apiUrl += `${bankCode}/branches/`;
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
    }
  };

  useEffect(() => {
    const loadBankData = async () => {
      console.log("載入銀行資料中...");
      const data = await fetchBankData();
      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data); // 將銀行數據存儲到過濾的銀行狀態中
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
        setFilteredBranches(branches); // 更新過濾的分行
      };
      fetchBranches();
    } else {
      setFilteredBranches([]);
    }
  }, [selectedBank]);

  useEffect(() => {
    updateUrl();
  }, [selectedBank, selectedBranch]);

  const updateUrl = () => {
    if (selectedBank && selectedBranch) {
      const bankCode = selectedBank.split(" ")[0];
      const branchCode = selectedBranch.code;
      const bankName = selectedBank.split(" ")[1];
      const branchName = selectedBranch.name;
      const names = `${bankName}-${branchName}.html`;
      navigate(encodeURI(`/${bankCode}/${branchCode}/${names}`));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container px-4 py-8 mx-auto">
        <BankingForm
          bankData={bankData} // 傳遞銀行數據
          filteredBanks={filteredBanks} // 傳遞過濾的銀行
          filteredBranches={filteredBranches} // 傳遞過濾的分行
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          updateUrl={updateUrl}
        />
        <Routes>
          <Route path="/" element={<div />} />
          <Route path="/:bankCode/:branchCode/:names" element={<BranchDetails selectedBank={selectedBank} selectedBranch={selectedBranch} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
