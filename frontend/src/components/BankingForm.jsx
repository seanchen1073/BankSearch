import React, { useState, useEffect, useRef } from "react";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";

const BankingForm = ({ handleBankSearch, handleBranchSearch, filteredBanks, filteredBranches, selectedBank, setSelectedBank, updateUrl, selectedBranch, setSelectedBranch, children, }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
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

  const handleBankSelect = (bank) => {
    if (bank !== selectedBank) {
      setSelectedBank(bank);
      setSelectedBranch(null); 
      handleBranchSearch(""); 
    }
    setActiveDropdown(null);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    updateUrl();
    setActiveDropdown(null);
  };

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown((prevDropdown) => (prevDropdown === dropdownName ? null : dropdownName));
  };

  return (
    <main className="flex flex-col items-center w-full max-w-[600px] mx-auto" ref={formRef}>
      <section className="flex flex-col md:flex-row md:justify-between w-full">
        <article className="w-full md:w-[290px] mb-4 md:mb-0">
          <BankNameSection
            handleSearch={handleBankSearch}
            filteredBanks={filteredBanks}
            selectedBank={selectedBank}
            setSelectedBank={handleBankSelect}
            isDropdownActive={activeDropdown === "bank"}
            setActiveDropdown={handleDropdownToggle}
          />
        </article>
        <article className="w-full md:w-[290px]">
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
        </article>
      </section>
      {children}
    </main>
  );
};

export default BankingForm;
