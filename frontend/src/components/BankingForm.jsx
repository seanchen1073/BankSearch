import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";
import BranchDetails from "./BranchDetails";

const BankingForm = ({ handleBankSearch, handleBranchSearch, filteredBanks, filteredBranches, selectedBank, setSelectedBank }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
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
    if (bank !== selectedBank) {
      setSelectedBank(bank);
      setSelectedBranch(null);
      setBranchSearchTerm("");
      handleBranchSearch("");
      window.history.pushState({}, "", "/");
    }
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
      window.history.pushState({}, "", url);
    }
  };

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown((prevDropdown) => (prevDropdown === dropdownName ? null : dropdownName));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto" ref={formRef}>
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <div className="w-full md:w-[290px] mb-4 md:mb-0">
          <BankNameSection
            handleSearch={handleBankSearch}
            filteredBanks={filteredBanks}
            selectedBank={selectedBank}
            setSelectedBank={handleBankSelect}
            isDropdownActive={activeDropdown === "bank"}
            setActiveDropdown={handleDropdownToggle}
          />
        </div>
        <div className="w-full md:w-[290px]">
          <BranchNameSection
            selectedBank={selectedBank}
            handleSearch={handleBranchSearch}
            filteredBranches={filteredBranches}
            isDropdownActive={activeDropdown === "branch"}
            setActiveDropdown={handleDropdownToggle}
            handleBranchSelect={handleBranchSelect}
            searchTerm={branchSearchTerm}
            setSearchTerm={setBranchSearchTerm}
          />
        </div>
      </div>
      <div className="w-full mt-4">
        <BranchDetails selectedBank={selectedBank} selectedBranch={selectedBranch} />
      </div>
    </div>
  );
};

export default BankingForm;
