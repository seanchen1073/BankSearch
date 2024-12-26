import React, { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";
import { BankContext } from "../contexts/BankContext";
import { fetchBankData } from "./BankGetApi.jsx";

const BankingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    bankData,
    setBankData,
    filteredBanks,
    setFilteredBanks,
    setFilteredBranches,
    selectedBank,
    setSelectedBank,
    selectedBranch,
    setSelectedBranch,
    activeDropdown,
    setActiveDropdown,
    selectedIndex,
    setSelectedIndex,
    setBankSearchTerm,
    setBranchSearchTerm,
    mouseHoveredIndex,
    setMouseHoveredIndex,
    isKeyboardNavigation,
    setIsKeyboardNavigation,
    inputRef,
    setInputWidth,
  } = useContext(BankContext);

  // 初始化銀行資料
  useEffect(() => {
    const loadBankData = async () => {
      console.log("載入銀行資料中...");
      const data = await fetchBankData();
      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data);
        console.log("銀行資料載入成功：", data);
      } else {
        console.error("無法載入銀行資料");
      }
    };
    loadBankData();
  }, []);

  // 從 URL 初始化
  useEffect(() => {
    const initializeFromUrl = async () => {
      const pathParts = location.pathname.split("/");
      if (pathParts.length === 4 && bankData.length > 0) {
        const [, bankCode, branchCode] = pathParts;

        try {
          const bank = bankData.find((b) => b.code === bankCode);
          if (bank) {
            const bankWithCode = `${bank.code} ${bank.name}`;
            setSelectedBank(bankWithCode);
            setBankSearchTerm(bankWithCode);

            const branches = await fetchBankData(bankCode);
            if (branches) {
              setFilteredBranches(branches);

              const branch = branches.find((b) => b.code === branchCode);
              if (branch) {
                setSelectedBranch(branch);
                setBranchSearchTerm(`${branch.code} ${branch.name}`);
              }
            }
          }
        } catch (error) {
          console.error("初始化資料失敗:", error);
          navigate("/");
        }
      }
    };

    initializeFromUrl();
  }, [location.pathname, bankData]);

  // 更新 URL
  useEffect(() => {
    const updateUrl = () => {
      if (selectedBank && selectedBranch) {
        const bankCode = selectedBank.split(" ")[0];
        const branchCode = selectedBranch.code;
        const bankName = selectedBank.split(" ").slice(1).join(" ");
        const branchName = selectedBranch.name;
        const names = `${bankName}-${branchName}.html`;
        navigate(encodeURI(`/${bankCode}/${branchCode}/${names}`));
      }
    };

    updateUrl();
  }, [selectedBank, selectedBranch]);

  // 更新輸入框寬度
  useEffect(() => {
    const updateWidth = () => {
      if (inputRef.current) {
        setInputWidth(inputRef.current.offsetWidth + "px");
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // 當選擇銀行時載入分行資料
  useEffect(() => {
    if (selectedBank) {
      const fetchBranches = async () => {
        const bankCode = selectedBank.split(" ")[0];
        const branches = await fetchBankData(bankCode);
        if (branches) {
          setFilteredBranches(branches);
        }
      };
      fetchBranches();
    } else {
      setFilteredBranches([]);
      setBranchSearchTerm("");
      setSelectedBranch(null);
    }
  }, [selectedBank]);

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
          let startIndex = prev === -1 ? -1 : prev;
          let nextIndex = startIndex === currentList.length - 1 ? 0 : startIndex + 1;

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
          let startIndex = prev === -1 ? 0 : prev;
          let nextIndex = startIndex === 0 ? currentList.length - 1 : startIndex - 1;

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

  const handleMouseMove = () => {
    setIsKeyboardNavigation(false);
  };

  const getItemClassName = (index) => {
    if (isKeyboardNavigation) {
      return selectedIndex === index ? "hover-style" : "";
    }
    return mouseHoveredIndex === index ? "hover-style" : "";
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
      const filtered = filteredBranches.filter(
        (branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || branch.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBranches(filtered);
    }
    if (searchTerm === "") {
      setSelectedBranch(null);
    }
  };

  return (
    <main className="flex flex-col items-center w-full max-w-[600px] mx-auto">
      <section className="flex flex-col w-full md:flex-row md:justify-between">
        <article className="w-full md:w-[290px] mb-4 md:mb-0">
          <BankNameSection
            handleBankSearch={handleBankSearch}
            handleBankSelect={handleBankSelect}
            handleKeyDown={handleKeyDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            handleMouseMove={handleMouseMove}
            getItemClassName={getItemClassName}
          />
        </article>
        <article className="w-full md:w-[290px]">
          <BranchNameSection
            handleBranchSearch={handleBranchSearch}
            handleBranchSelect={handleBranchSelect}
            handleKeyDown={handleKeyDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            handleMouseMove={handleMouseMove}
            getItemClassName={getItemClassName}
          />
        </article>
      </section>
    </main>
  );
};

export default BankingForm;