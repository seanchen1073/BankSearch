import React, { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import BankingForm from "./components/BankingForm";
import BranchDetails from "./components/BranchDetails";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bankData, setBankData] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const fetchBankData = async (bankCode = null) => {
    let apiUrl = "http://banksearch-backend.hkg1.zeabur.app/";
    if (bankCode) {
      apiUrl += `${bankCode}/branches/`;
    }
    try {
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
    } catch (error) {
      console.error("獲取資料失敗:", error);
      if (bankCode) {
        // 只有在獲取分行資料失敗時才導回首頁
        navigate("/");
      }
      return null;
    }
  };

  // 初始載入銀行資料
  useEffect(() => {
    const loadBankData = async () => {
      console.log("載入銀行資料中...");
      const data = await fetchBankData();
      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data); // 確保銀行資料正確設置
        console.log("銀行資料載入成功：", data);
      } else {
        console.error("無法載入銀行資料");
      }
    };
    loadBankData();
  }, []);

  // 從 URL 解析銀行和分行資料// 從 URL 解析銀行和分行資料
  useEffect(() => {
    const initializeFromUrl = async () => {
      const pathParts = location.pathname.split("/");
      if (pathParts.length === 4 && bankData.length > 0) {
        // 確保 bankData 已載入
        const [, bankCode, branchCode] = pathParts;

        try {
          // 找到對應的銀行
          const bank = bankData.find((b) => b.code === bankCode);
          if (bank) {
            const bankWithCode = `${bank.code} ${bank.name}`;
            setSelectedBank(bankWithCode);

            // 獲取該銀行的所有分行
            const branches = await fetchBankData(bankCode);
            if (branches) {
              setFilteredBranches(branches);

              // 找到對應的分行
              const branch = branches.find((b) => b.code === branchCode);
              if (branch) {
                setSelectedBranch(branch);
              }
            }
          }
        } catch (error) {
          console.error("初始化資料失敗:", error);
          navigate("/");
        }
      }
    };

    initializeFromUrl();
  }, [location.pathname, bankData]); // 只依賴這兩個值

  useEffect(() => {
    if (selectedBank) {
      const fetchBranches = async () => {
        const bankCode = selectedBank.split(" ")[0];
        const branches = await fetchBankData(bankCode);
        if (branches) {
          setFilteredBranches(branches);
        }
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
          bankData={bankData}
          filteredBanks={filteredBanks}
          filteredBranches={filteredBranches}
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
