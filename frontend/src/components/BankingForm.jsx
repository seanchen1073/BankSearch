import React, { useState, useEffect, useRef } from "react";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";

const BankingForm = ({ bankData, selectedBank, setSelectedBank, updateUrl, selectedBranch, setSelectedBranch }) => {
  const [filteredBanks, setFilteredBanks] = useState(bankData);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const [mouseHoveredIndex, setMouseHoveredIndex] = useState(-1);
  const formRef = useRef(null);

  useEffect(() => {
    if (selectedBank) {
      setBankSearchTerm(selectedBank);
    }
  }, [selectedBank]);

  useEffect(() => {
    if (selectedBranch) {
      setBranchSearchTerm(`${selectedBranch.code} ${selectedBranch.name}`);
    }
  }, [selectedBranch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setSelectedIndex(-1);
        setMouseHoveredIndex(-1);
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

  const handleKeyDown = (event) => {
    if (!activeDropdown) return;

    const currentList = activeDropdown === "bank" ? filteredBanks : filteredBranches;
    const listElement = document.querySelector(activeDropdown === "bank" ? ".bank-dropdown" : ".branch-dropdown");

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev === -1 ? (mouseHoveredIndex !== -1 ? mouseHoveredIndex : 0) : Math.min(prev + 1, currentList.length - 1);
          const selectedElement = listElement?.children[nextIndex];
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
          setMouseHoveredIndex(-1); // 清除滑鼠懸停狀態
          return nextIndex;
        });
        break;

      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev === -1 ? (mouseHoveredIndex !== -1 ? mouseHoveredIndex : 0) : Math.max(prev - 1, 0);
          const selectedElement = listElement?.children[nextIndex];
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
          setMouseHoveredIndex(-1); // 清除滑鼠懸停狀態
          return nextIndex;
        });
        break;

      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0) {
          if (activeDropdown === "bank") {
            handleBankSelect(filteredBanks[selectedIndex]);
          } else {
            handleBranchSelect(filteredBranches[selectedIndex]);
          }
        }
        break;

      case "Escape":
        setActiveDropdown(null);
        setSelectedIndex(-1);
        setMouseHoveredIndex(-1);
        break;
    }
  };

  const handleMouseEnter = (index) => {
    setMouseHoveredIndex(index);
    setSelectedIndex(-1); // 確保鍵盤選中效果消失
  };

  const handleMouseLeave = () => {
    setMouseHoveredIndex(-1);
  };


  const handleBankSelect = (bank) => {
    const bankString = `${bank.code} ${bank.name}`;
    if (bankString !== selectedBank) {
      setSelectedBank(bankString);
      setBankSearchTerm(bankString);
      setSelectedBranch(null);
      setBranchSearchTerm("");
    }
    setActiveDropdown(null);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setBranchSearchTerm(`${branch.code} ${branch.name}`);
    updateUrl();
    setActiveDropdown(null);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);
  };

  const handleBankSearch = (searchTerm) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = bankData.filter(
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || 
                bank.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredBanks(filtered);
    setBankSearchTerm(searchTerm);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);
    if (searchTerm === "") {
      setSelectedBank(null);
    }
  };

  const handleBranchSearch = (searchTerm) => {
    setBranchSearchTerm(searchTerm);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);
    if (selectedBank) {
      const selectedBankData = bankData.find((bank) => bank.code === selectedBank.split(" ")[0]);
      if (selectedBankData) {
        const filtered = selectedBankData.branches.filter(
          (branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      branch.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBranches(filtered);
      }
    }
    if (searchTerm === "") {
      setSelectedBranch(null);
    }
  };

  return (
    <main className="flex flex-col items-center w-full max-w-[600px] mx-auto">
      <section className="flex flex-col w-full md:flex-row md:justify-between">
        <article className="w-full md:w-[290px] mb-4 md:mb-0" ref={formRef}>
          <BankNameSection
            selectedBank={selectedBank}
            filteredBanks={filteredBanks}
            isDropdownActive={activeDropdown === "bank"}
            setActiveDropdown={setActiveDropdown}
            bankSearchTerm={bankSearchTerm}
            handleBankSearch={handleBankSearch}
            handleBankSelect={handleBankSelect}
            selectedIndex={selectedIndex}
            mouseHoveredIndex={mouseHoveredIndex}
            setMouseHoveredIndex={setMouseHoveredIndex}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            handleKeyDown={handleKeyDown}
          />
        </article>
        <article className="w-full md:w-[290px]" ref={formRef}>
          <BranchNameSection
            selectedBank={selectedBank}
            selectedBranch={selectedBranch}
            filteredBranches={filteredBranches}
            isDropdownActive={activeDropdown === "branch"}
            setActiveDropdown={setActiveDropdown}
            branchSearchTerm={branchSearchTerm}
            handleBranchSearch={handleBranchSearch}
            handleBranchSelect={handleBranchSelect}
            selectedIndex={selectedIndex}
            mouseHoveredIndex={mouseHoveredIndex}
            setMouseHoveredIndex={setMouseHoveredIndex}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            handleKeyDown={handleKeyDown}
          />
        </article>
      </section>
    </main>
  );
};

export default BankingForm;