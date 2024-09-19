import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";
import BranchDetails from "./BranchDetails";

const BankingForm = ({ handleBankSearch, handleBranchSearch, filteredBanks, filteredBranches, selectedBank, setSelectedBank }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const formRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 處理點擊外部時關閉下拉選單
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

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setSelectedBranch(null); // 清空選擇的分行
    setActiveDropdown(null);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setActiveDropdown(null);

    if (selectedBank && branch) {
      const bankCode = selectedBank.split(" ")[0];
      const bankName = selectedBank.split(" ").slice(1).join(" ");
      const url = `/${bankCode}/${branch.code}/${encodeURIComponent(bankName)}-${encodeURIComponent(branch.name)}.html`;
      console.log(url);
      // 只更新網址，不跳轉頁面
      window.history.pushState({}, "", url);
    }
  };

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown((prevDropdown) => (prevDropdown === dropdownName ? null : dropdownName)); // 切換下拉選單顯示狀態
  };

  return (
    <div className="flex flex-wrap justify-center" ref={formRef}>
      <BankNameSection
        handleSearch={handleBankSearch}
        filteredBanks={filteredBanks}
        selectedBank={selectedBank}
        setSelectedBank={handleBankSelect}
        isDropdownActive={activeDropdown === "bank"}
        setActiveDropdown={() => handleDropdownToggle("bank")}
      />
      <BranchNameSection
        selectedBank={selectedBank}
        handleSearch={handleBranchSearch}
        filteredBranches={filteredBranches}
        isDropdownActive={activeDropdown === "branch"}
        setActiveDropdown={() => handleDropdownToggle("branch")}
        handleBranchSelect={handleBranchSelect}
      />
      <BranchDetails selectedBank={selectedBank} selectedBranch={selectedBranch} />
    </div>
  );
};

export default BankingForm;
