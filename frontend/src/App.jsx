import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "./components/Header";
import BankNameSection from "./components/BankNameSection";
import BranchNameSection from "./components/BranchNameSection";

function App() {
  const [bankData, setBankData] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);

  const fetchBankData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/bank_data.json", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (response.status === 200) {
        return response.data.banks;
      } else {
        console.error(`Error: Received status code ${response.status}`);
        return [];
      }
    } catch (error) {
      console.error("Error fetching bank data:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadBankData = async () => {
      console.log("Loading bank data...");
      const data = await fetchBankData();
      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data);
        console.log("Bank data loaded successfully:", data);
      } else {
        console.error("Failed to load bank data");
      }
    };
    loadBankData();
  }, []);

  const handleBankSearch = (searchTerm) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = bankData.filter(
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || bank.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredBanks(filtered);
  };

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

  const handleBranchSearch = (searchTerm) => {
    if (!selectedBank) return;
    const filtered = filteredBranches.filter((branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredBranches(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-wrap justify-center">
          <BankNameSection handleSearch={handleBankSearch} filteredBanks={filteredBanks} setSelectedBank={setSelectedBank} />
          <BranchNameSection selectedBank={selectedBank} handleSearch={handleBranchSearch} filteredBranches={filteredBranches} />
        </div>
      </div>
    </div>
  );
}

export default App;
