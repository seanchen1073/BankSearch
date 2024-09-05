import React, { useState, useEffect, useRef } from "react";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";

const BankingForm = ({ handleBankSearch, handleBranchSearch, filteredBanks, filteredBranches, selectedBank, setSelectedBank }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
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

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setActiveDropdown(null);
  };

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown((prevDropdown) => (prevDropdown === dropdownName ? null : dropdownName));
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
      />
    </div>
  );
};

export default BankingForm;
