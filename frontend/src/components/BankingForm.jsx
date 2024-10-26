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

  // 監聽 selectedBank 變化，更新 bankSearchTerm
  useEffect(() => {
    if (selectedBank) {
      setBankSearchTerm(selectedBank);
    }
  }, [selectedBank]);

  // 監聽 selectedBranch 變化，更新 branchSearchTerm
  useEffect(() => {
    if (selectedBranch) {
      setBranchSearchTerm(`${selectedBranch.code} ${selectedBranch.name}`);
    }
  }, [selectedBranch]);

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

  useEffect(() => {
    if (selectedBank) {
      const selectedBankData = bankData.find((bank) => bank.code === selectedBank.split(" ")[0]);
      if (selectedBankData) {
        setFilteredBranches(selectedBankData.branches);
      }
    } else {
      setFilteredBranches([]);
      setBranchSearchTerm("");
      setSelectedBranch(null);
    }
  }, [selectedBank, bankData, setSelectedBranch]);

  const handleBankSelect = (bank) => {
    const bankString = `${bank.code} ${bank.name}`;
    if (bankString !== selectedBank) {
      setSelectedBank(bankString);
      setBankSearchTerm(bankString);
      setSelectedBranch(null);
      setBranchSearchTerm("");
    }
    setActiveDropdown(null);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setBranchSearchTerm(`${branch.code} ${branch.name}`);
    updateUrl();
    setActiveDropdown(null);
  };

  const handleBankSearch = (searchTerm) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = bankData.filter(
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || bank.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredBanks(filtered);
    setBankSearchTerm(searchTerm);
    if (searchTerm === "") {
      setSelectedBank(null);
    }
  };

  const handleBranchSearch = (searchTerm) => {
    setBranchSearchTerm(searchTerm);
    if (selectedBank) {
      const selectedBankData = bankData.find((bank) => bank.code === selectedBank.split(" ")[0]);
      if (selectedBankData) {
        const filtered = selectedBankData.branches.filter(
          (branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || branch.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBranches(filtered);
      }
    }
    if (searchTerm === "") {
      setSelectedBranch(null);
    }
  };

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown((prevDropdown) => (prevDropdown === dropdownName ? null : dropdownName));
  };

  return (
    <main className="flex flex-col items-center w-full max-w-[600px] mx-auto">
      <section className="flex flex-col w-full md:flex-row md:justify-between">
        <article className="w-full md:w-[290px] mb-4 md:mb-0" ref={formRef}>
          <BankNameSection
            selectedBank={selectedBank}
            filteredBanks={filteredBanks}
            isDropdownActive={activeDropdown === "bank"}
            setActiveDropdown={handleDropdownToggle}
            bankSearchTerm={bankSearchTerm}
            handleBankSearch={handleBankSearch}
            handleBankSelect={handleBankSelect}
          />
        </article>
        <article className="w-full md:w-[290px]" ref={formRef}>
          <BranchNameSection
            selectedBank={selectedBank}
            selectedBranch={selectedBranch}
            filteredBranches={filteredBranches}
            isDropdownActive={activeDropdown === "branch"}
            setActiveDropdown={handleDropdownToggle}
            branchSearchTerm={branchSearchTerm}
            handleBranchSearch={handleBranchSearch}
            handleBranchSelect={handleBranchSelect}
          />
        </article>
      </section>
    </main>
  );
};

export default BankingForm;
