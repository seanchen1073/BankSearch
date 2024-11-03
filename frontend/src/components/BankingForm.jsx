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
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
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
  switch (activeDropdown) {
    case "bank": {
      const index = selectedBank ? filteredBanks.findIndex((bank) => `${bank.code} ${bank.name}` === selectedBank) : -1;
      setSelectedIndex(index);
      setMouseHoveredIndex(index === -1 && filteredBanks.length > 0 ? 0 : -1); // Set to 0 if there are items

      if (index !== -1) {
        setTimeout(() => {
          const listElement = document.querySelector(".bank-dropdown");
          const selectedElement = listElement?.children[index];
          if (selectedElement) {
            const containerHeight = listElement.clientHeight;
            const itemHeight = selectedElement.offsetHeight;
            const scrollPosition = selectedElement.offsetTop;
            const targetScroll = Math.max(0, scrollPosition - (containerHeight - itemHeight));
            listElement.scrollTop = targetScroll;
          }
        }, 0);
      }
      break;
    }
    case "branch": {
      const index = selectedBranch ? filteredBranches.findIndex((branch) => branch.code === selectedBranch.code) : -1;
      setSelectedIndex(index);
      setMouseHoveredIndex(index === -1 && filteredBranches.length > 0 ? 0 : -1); // 如果有項目則設為 0

      if (index !== -1) {
        setTimeout(() => {
          const listElement = document.querySelector(".branch-dropdown");
          const selectedElement = listElement?.children[index];
          if (selectedElement) {
            const containerHeight = listElement.clientHeight;
            const itemHeight = selectedElement.offsetHeight;
            const scrollPosition = selectedElement.offsetTop;
            const targetScroll = Math.max(0, scrollPosition - (containerHeight - itemHeight));
            listElement.scrollTop = targetScroll;
          }
        }, 0);
      }
      break;
    }
    default:
      setSelectedIndex(-1);
      setMouseHoveredIndex(-1);
      break;
  }
}, [activeDropdown, selectedBank, selectedBranch, filteredBanks, filteredBranches]);


  useEffect(() => {
    setFilteredBanks(bankData);
  }, [bankData]);

  useEffect(() => {
    if (activeDropdown === "bank") {
      setFilteredBanks(bankData);
    }
  }, [activeDropdown, bankData]);

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

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    setIsKeyboardNavigation(true);
    setMouseHoveredIndex(-1);
  }

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      setSelectedIndex((prev) => {
        let startIndex;
        if(prev === -1) {
          startIndex = mouseHoveredIndex !== -1 ? mouseHoveredIndex : -1 ;
        } else {
          startIndex = prev;
        }

        let nextIndex;

        if (startIndex === -1) {
          nextIndex = 0;
        } else if (startIndex === currentList.length - 1) {
          nextIndex = 0;
          listElement.scrollTop = 0;
        } else {
          nextIndex = startIndex + 1;
        }

        // 滾動到選中項目
        const selectedElement = listElement?.children[nextIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest", behavior: "auto" });
        }

        return nextIndex;
      });
      break;

    case "ArrowUp":
      event.preventDefault();
      setSelectedIndex((prev) => {
        let startIndex;
        if (prev === -1) {
          startIndex = mouseHoveredIndex !== -1 ? mouseHoveredIndex : -1;
        } else {
          startIndex = prev;
        }

        let nextIndex;

        if (startIndex === -1) {
          nextIndex = currentList.length - 1;
        } else if (startIndex === 0) {
          nextIndex = currentList.length - 1;
          listElement.scrollTop = listElement.scrollHeight;
        } else {
          nextIndex = startIndex - 1;
        }

        // 滾動到選中項目
        const selectedElement = listElement?.children[nextIndex];
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest", behavior: "auto" });
        }

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
      } else if (mouseHoveredIndex >= 0) {
        if (activeDropdown === "bank") {
          handleBankSelect(filteredBanks[mouseHoveredIndex]);
        } else {
          handleBranchSelect(filteredBranches[mouseHoveredIndex]);
        }
      }
      break;

    case "Escape":
      setActiveDropdown(null);
      setSelectedIndex(-1);
      setMouseHoveredIndex(-1);
      setIsKeyboardNavigation(false);
      break;
  }
};

  const handleMouseEnter = (index) => {
    if (!isKeyboardNavigation) {
      setMouseHoveredIndex(index);
      setSelectedIndex(-1);
    }
  };

  const handleMouseLeave = () => {
    if (!isKeyboardNavigation) {
      setMouseHoveredIndex(-1);
    }
  };

  const handleMouseMove = (event) => {
    setIsKeyboardNavigation(false);
  };

  const getItemClassName = (index) => {
    if (isKeyboardNavigation) {
      return selectedIndex === index ? 'hover-style' : "";
    }
      return mouseHoveredIndex === index ? 'hover-style' : "";
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
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || bank.name.toLowerCase().includes(lowerCaseSearchTerm)
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
          (branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || branch.code.toLowerCase().includes(searchTerm.toLowerCase())
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
            handleMouseMove={handleMouseMove}
            getItemClassName={getItemClassName}
            isKeyboardNavigation={isKeyboardNavigation}
            setIsKeyboardNavigation={setIsKeyboardNavigation}
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
            handleMouseMove={handleMouseMove}
            getItemClassName={getItemClassName}
            isKeyboardNavigation={isKeyboardNavigation}
            setIsKeyboardNavigation={setIsKeyboardNavigation}
          />
        </article>
      </section>
    </main>
  );
};

export default BankingForm;
