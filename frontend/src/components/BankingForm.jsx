import React, { useState, useEffect, useRef } from "react";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";

const BankingForm = ({ bankData, selectedBank, setSelectedBank, updateUrl, selectedBranch, setSelectedBranch }) => {
  const [filteredBanks, setFilteredBanks] = useState(bankData);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setFilteredBanks(bankData);
  }, [bankData]);


  // 處理銀行選擇
  const handleBankSelect = (bank) => {
    if (bank !== selectedBank) {
      setSelectedBank(bank);
      setSelectedBranch(null);
      setBranchSearchTerm(""); // 清空分行搜尋框
      handleBranchSearch(""); // 清空分行結果
    }
    setActiveDropdown(null);
  };

  // 處理銀行搜尋
  const handleBankSearch = (searchTerm) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = bankData.filter(
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || bank.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredBanks(filtered);
    setBankSearchTerm(searchTerm); // 更新銀行搜尋框的值
    setSelectedBank(filtered.length > 0 ? filtered[0].code : "");
    setFilteredBranches([]); // 清空分行結果
  };

  // 處理分行搜尋
  const handleBranchSearch = (searchTerm) => {
    if (!selectedBank) return;
    const selectedBankData = bankData.find((bank) => bank.code === selectedBank.split(" ")[0]);
    if (selectedBankData) {
      const filtered = selectedBankData.branches.filter((branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredBranches(filtered);
    }
    setBranchSearchTerm(searchTerm); // 更新分行搜尋框的值
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setBranchSearchTerm("");
    updateUrl();
    setActiveDropdown(null);
  };

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown((prevDropdown) => (prevDropdown === dropdownName ? null : dropdownName));
  };

  return (
    <main className="flex flex-col items-center w-full max-w-[600px] mx-auto" ref={formRef}>
      <section className="flex flex-col w-full md:flex-row md:justify-between">
        <article className="w-full md:w-[290px] mb-4 md:mb-0">
          <BankNameSection
            selectedBank={selectedBank}
            filteredBanks={filteredBanks}
            isDropdownActive={activeDropdown === "bank"}
            setActiveDropdown={handleDropdownToggle}
            searchTerm={bankSearchTerm}
            setSearchTerm={handleBankSearch} // 更新這裡
            setSelectedBank={handleBankSelect}
            bankData={bankData}
          />
        </article>
        <article className="w-full md:w-[290px]">
          <BranchNameSection
            selectedBank={selectedBank}
            filteredBranches={filteredBranches}
            isDropdownActive={activeDropdown === "branch"}
            setActiveDropdown={handleDropdownToggle}
            handleBranchSelect={handleBranchSelect}
            searchTerm={branchSearchTerm}
            setSearchTerm={handleBranchSearch} //
            setSelectedBranch={handleBranchSelect}
            bankData={bankData}
          />
        </article>
      </section>
    </main>
  );
};

export default BankingForm;
