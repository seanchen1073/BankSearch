import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";

const BankingForm = ({ handleBankSearch, handleBranchSearch, filteredBanks, filteredBranches, selectedBank, setSelectedBank }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const formRef = useRef(null);
  const navigate = useNavigate();

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

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setSelectedBranch(null); // 清空之前選擇的分行
    setActiveDropdown(null);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setActiveDropdown(null);

    if (selectedBank && branch) {
      const bankCode = selectedBank.split(" ")[0]; // 銀行代碼
      const bankName = selectedBank.split(" ").slice(1).join(" "); // 銀行名稱
      const url = `/${bankCode}/${branch.code}/${encodeURIComponent(bankName)}-${encodeURIComponent(branch.name)}.html`;
      console.log(url); // 打印生成的 URL
      navigate(url);
    }
  };

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown((prevDropdown) => (prevDropdown === dropdownName ? null : dropdownName));
  };

  const renderBranchDetails = () => {
    if (!selectedBank || !selectedBranch) return null;

    const bankCode = selectedBank.split(" ")[0]; // 銀行代碼
    const bankName = selectedBank.split(" ").slice(1).join(" "); // 銀行名稱

    return (
      <div className="p-4 mt-4 bg-green-100 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold">{`${bankName} (${bankCode}) - ${selectedBranch.name}`}</h2>
        <p>分行代碼：{selectedBranch.code}</p>
        <p>地址：{selectedBranch.address}</p>
        <p>電話：{selectedBranch.tel}</p>
      </div>
    );
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
      {renderBranchDetails()} {/* 顯示選擇的銀行和分行資訊 */}
    </div>
  );
};

export default BankingForm;
