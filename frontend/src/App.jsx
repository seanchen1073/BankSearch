import React, { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate, } from "react-router-dom";
import Header from "./components/Header";
import BankingForm from "./components/BankingForm";
import BranchDetails from "./components/BranchDetails";

function App() {
  const navigate = useNavigate();
  const [bankData, setBankData] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);

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

    useEffect(() => {
      updateUrl();
    }, [selectedBank, selectedBranch]);

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

  const updateUrl = () => {
    if (selectedBank && selectedBranch) {
      const bankCode = selectedBank.split(" ")[0];
      const branchCode = selectedBranch.code;
      const bankName = encodeURIComponent(selectedBank.split(" ")[1]);
      const branchName = encodeURIComponent(selectedBranch.name);
      navigate(`/${bankCode}/${branchCode}/${bankName}-${branchName}.html`);
    }
  };

  return (
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
                  updateUrl={updateUrl}
                >
                  {selectedBranch && <BranchDetails selectedBank={selectedBank} selectedBranch={selectedBranch} />}
                </BankingForm>
              }
            />
            <Route
              path="/:bankCode/:branchCode/:bankName-:branchName.html"
              element={<BranchDetails selectedBank={selectedBank} selectedBranch={selectedBranch} />}
            />
          </Routes>
        </div>
      </div>
  );
}

export default App;
