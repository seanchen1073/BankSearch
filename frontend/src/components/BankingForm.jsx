import React, { useCallback, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";
import { BankContext } from "../contexts/BankContext";
import { fetchBankData } from "./BankGetApi.jsx";
import { normalizeKeyword, expandKeyword } from "../utils/SearchUtils.jsx";

const BankingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    bankData,
    setBankData,
    branchData,
    setBranchData,
    filteredBanks,
    filteredBranches,
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
    isNearbySearch,
    resetNearbyState,
  } = useContext(BankContext);

  // 統一處理分行搜尋框顯示文字
  // 沒有分行代碼時只顯示分行名稱避免前面多一個空白
  const formatBranchSearchTerm = (branch) => {
    const branchDisplayName = String(branch?.name || "").trim() || String(branch?.address || "").trim();

    return [branch?.code, branchDisplayName].filter(Boolean).join(" ");
  };

  // 安全解碼網址裡的中文名稱
  const decodePathPart = (value) => {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      console.error("網址解碼失敗:", error);
      return value;
    }
  };

  // 暫存已經載入過的分行資料
  // 同一家銀行在目前頁面生命週期內只需要向後端取得一次
  const branchDataCacheRef = useRef(new Map());

  // 暫存目前正在進行中的分行 API 請求
  // 避免網址初始化與選擇銀行同時觸發相同 API
  const branchRequestCacheRef = useRef(new Map());

  // 統一取得指定銀行的分行資料
  // 已有快取時直接重用資料
  // API 還在進行時直接共用同一個 Promise
  const getBranchesForBank = useCallback(async (bankCode) => {
    const normalizedBankCode = String(bankCode || "").trim();

    if (!normalizedBankCode) {
      return null;
    }

    if (branchDataCacheRef.current.has(normalizedBankCode)) {
      return branchDataCacheRef.current.get(normalizedBankCode);
    }

    if (branchRequestCacheRef.current.has(normalizedBankCode)) {
      return branchRequestCacheRef.current.get(normalizedBankCode);
    }

    const request = fetchBankData(normalizedBankCode)
      .then((branches) => {
        if (branches && Array.isArray(branches)) {
          branchDataCacheRef.current.set(normalizedBankCode, branches);
        }

        return branches;
      })
      .finally(() => {
        branchRequestCacheRef.current.delete(normalizedBankCode);
      });

    branchRequestCacheRef.current.set(normalizedBankCode, request);

    return request;
  }, []);

  // 初始化銀行資料
  useEffect(() => {
    const loadBankData = async () => {
      const data = await fetchBankData();

      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data);
      } else {
        console.error("無法載入銀行資料");
      }
    };

    loadBankData();
  }, [setBankData, setFilteredBanks]);

  // 從網址還原銀行與分行資料
  useEffect(() => {
    const initializeFromUrl = async () => {
      const pathParts = location.pathname.split("/").filter(Boolean);

      // 一般分行會有三段網址
      // 沒有分行代碼的代表人辦事處會有兩段網址
      const isRegularBranchRoute = pathParts.length === 3;
      const isNoCodeBranchRoute = pathParts.length === 2;

      if ((isRegularBranchRoute || isNoCodeBranchRoute) && bankData.length > 0) {
        const bankCode = pathParts[0];
        const branchCode = isRegularBranchRoute ? pathParts[1] : "";
        const names = isRegularBranchRoute ? pathParts[2] : pathParts[1];

        try {
          const bank = bankData.find((item) => item.code === bankCode);

          if (!bank) {
            navigate("/not-found", { replace: true });
            return;
          }

          const bankWithCode = `${bank.code} ${bank.name}`;

          setSelectedBank(bankWithCode);
          setBankSearchTerm(bankWithCode);

          const branches = await getBranchesForBank(bankCode);

          if (branches && Array.isArray(branches)) {
            setBranchData(branches);
            setFilteredBranches(branches);

            let branch = null;

            if (isRegularBranchRoute) {
              // 一般分行直接使用分行代碼找到資料
              branch = branches.find((item) => item.code === branchCode);
            } else {
              // 沒有分行代碼時改用網址裡的銀行名稱與分行名稱找資料
              const decodedNames = decodePathPart(names).replace(/\.html$/i, "");
              const bankNamePrefix = `${bank.name}-`;

              if (!decodedNames.startsWith(bankNamePrefix)) {
                navigate("/not-found", { replace: true });
                return;
              }

              const branchName = decodedNames.slice(bankNamePrefix.length);

              branch = branches.find((item) => !String(item.code || "").trim() && item.name === branchName);
            }

            if (!branch) {
              navigate("/not-found", { replace: true });
              return;
            }

            // 保留附近分行 API 提供的經緯度與距離資料
            // 避免網址更新後被一般分行資料覆蓋
            setSelectedBranch((currentBranch) => {
              if (currentBranch && currentBranch.code === branch.code && currentBranch.name === branch.name) {
                return {
                  ...branch,
                  ...currentBranch,
                };
              }

              return branch;
            });

            setBranchSearchTerm(formatBranchSearchTerm(branch));
          }
        } catch (error) {
          console.error("初始化資料失敗:", error);
          navigate("/not-found");
        }
      }
    };

    initializeFromUrl();
  }, [
    location.pathname,
    bankData,
    getBranchesForBank,
    navigate,
    setBranchData,
    setBranchSearchTerm,
    setFilteredBranches,
    setSelectedBank,
    setSelectedBranch,
    setBankSearchTerm,
  ]);

  // 選擇銀行與分行後更新網址
  useEffect(() => {
    if (selectedBank && selectedBranch) {
      const bankCode = selectedBank.split(" ")[0];
      const branchCode = String(selectedBranch.code || "").trim();
      const bankName = selectedBank.split(" ").slice(1).join(" ");
      const branchName = selectedBranch.name;
      const names = `${bankName}-${branchName}.html`;

      // 一般分行維持原本三段式網址
      // 沒有分行代碼的代表人辦事處改用兩段式網址
      const targetPath = branchCode ? `/${bankCode}/${branchCode}/${names}` : `/${bankCode}/${names}`;

      navigate(encodeURI(targetPath));
    }
  }, [navigate, selectedBank, selectedBranch]);

  // 選擇銀行後載入分行
  useEffect(() => {
    if (!selectedBank) {
      setBranchData([]);
      setFilteredBranches([]);
      setBranchSearchTerm("");
      setSelectedBranch(null);
      return;
    }

    let isCurrentSelection = true;

    const loadBranches = async () => {
      const bankCode = selectedBank.split(" ")[0];
      const branches = await getBranchesForBank(bankCode);

      if (!isCurrentSelection) {
        return;
      }

      if (branches && Array.isArray(branches)) {
        setBranchData(branches);
        setFilteredBranches(branches);
      }
    };

    loadBranches();

    return () => {
      isCurrentSelection = false;
    };
  }, [getBranchesForBank, selectedBank, setBranchData, setBranchSearchTerm, setFilteredBranches, setSelectedBranch]);

  // 開啟選單時定位目前選擇項目
  useEffect(() => {
    switch (activeDropdown) {
      case "bank": {
        const index = selectedBank ? filteredBanks.findIndex((bank) => `${bank.code} ${bank.name}` === selectedBank) : -1;

        setSelectedIndex(index);

        setMouseHoveredIndex(index === -1 && filteredBanks.length > 0 ? 0 : -1);

        if (index !== -1) {
          setTimeout(() => {
            const listElement = document.querySelector(".bank-dropdown");

            const selectedElement = listElement?.children[index];

            selectedElement?.scrollIntoView({
              block: "nearest",
              behavior: "auto",
            });
          }, 0);
        }

        break;
      }

      case "branch": {
        const index = selectedBranch
          ? filteredBranches.findIndex((branch) => branch.code === selectedBranch.code && branch.name === selectedBranch.name)
          : -1;

        setSelectedIndex(index);

        setMouseHoveredIndex(index === -1 && filteredBranches.length > 0 ? 0 : -1);

        if (index !== -1) {
          setTimeout(() => {
            const listElement = document.querySelector(".branch-dropdown");

            const selectedElement = listElement?.children[index];

            selectedElement?.scrollIntoView({
              block: "nearest",
              behavior: "auto",
            });
          }, 0);
        }

        break;
      }

      default:
        setSelectedIndex(-1);
        setMouseHoveredIndex(-1);
        break;
    }
  }, [activeDropdown, selectedBank, selectedBranch, filteredBanks, filteredBranches, setMouseHoveredIndex, setSelectedIndex]);

  // 銀行資料更新時重設銀行搜尋結果
  useEffect(() => {
    setFilteredBanks(bankData);
  }, [bankData, setFilteredBanks]);

  // 每次開啟選單時恢復完整清單
  useEffect(() => {
    if (activeDropdown === "bank") {
      setFilteredBanks(bankData);
    }

    if (activeDropdown === "branch" && selectedBank) {
      setFilteredBranches(branchData);
    }
  }, [activeDropdown, bankData, branchData, selectedBank, setFilteredBanks, setFilteredBranches]);

  // 點擊搜尋區外時關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      const bankInputField = document.querySelector(".bank-input-field");

      const branchInputField = document.querySelector(".branch-input-field");

      const clickedBankInput = bankInputField?.contains(event.target);

      const clickedBranchInput = branchInputField?.contains(event.target);

      if (!clickedBankInput && !clickedBranchInput) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setActiveDropdown]);

  const handleKeyDown = (event) => {
    if (!activeDropdown) {
      return;
    }

    const currentList = activeDropdown === "bank" ? filteredBanks : filteredBranches;

    const listElement = document.querySelector(activeDropdown === "bank" ? ".bank-dropdown" : ".branch-dropdown");

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();

        if (currentList.length === 0) {
          return;
        }

        setIsKeyboardNavigation(true);

        const startIndex = mouseHoveredIndex !== -1 ? mouseHoveredIndex : selectedIndex;

        const nextIndex =
          event.key === "ArrowDown"
            ? startIndex === currentList.length - 1
              ? 0
              : startIndex + 1
            : startIndex === -1 || startIndex === 0
            ? currentList.length - 1
            : startIndex - 1;

        setSelectedIndex(nextIndex);
        setMouseHoveredIndex(-1);

        const selectedElement = listElement?.children[nextIndex];

        selectedElement?.scrollIntoView({
          block: "nearest",
          behavior: "auto",
        });

        break;
      }

      case "Enter": {
        event.preventDefault();

        const indexToUse = mouseHoveredIndex !== -1 ? mouseHoveredIndex : selectedIndex;

        if (indexToUse >= 0) {
          if (activeDropdown === "bank") {
            handleBankSelect(filteredBanks[indexToUse]);
          } else {
            handleBranchSelect(filteredBranches[indexToUse]);
          }
        }

        break;
      }

      case "Escape":
        setActiveDropdown(null);
        setSelectedIndex(-1);
        setMouseHoveredIndex(-1);
        setIsKeyboardNavigation(false);
        break;

      default:
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
      return selectedIndex === index ? "active" : "";
    }

    return mouseHoveredIndex === index ? "active" : "";
  };

  const handleBankSelect = (bank) => {
    // 使用者手動選擇銀行時離開附近分行模式
    if (isNearbySearch) {
      resetNearbyState();
    }

    const bankString = `${bank.code} ${bank.name}`;

    // 只有真的換成另一家銀行時才清除舊分行
    if (bankString !== selectedBank) {
      setSelectedBank(bankString);
      setBankSearchTerm(bankString);

      setSelectedBranch(null);
      setBranchSearchTerm("");

      // 使用者換銀行後舊分行網址已經失效
      // 直接回首頁避免網址還留著上一間分行
      if (location.pathname !== "/") {
        navigate("/", {
          replace: true,
        });
      }
    }

    setActiveDropdown(null);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);
  };

  const handleBranchSelect = (branch) => {
    // 使用者手動選擇分行時離開附近分行模式
    if (isNearbySearch) {
      resetNearbyState();
    }

    setSelectedBranch(branch);

    setBranchSearchTerm(formatBranchSearchTerm(branch));

    setActiveDropdown(null);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);
  };

  const handleBankSearch = (searchTerm) => {
    // 使用者手動輸入銀行時離開附近分行模式
    if (isNearbySearch) {
      resetNearbyState();
    }

    const normalizedSearchTerm = expandKeyword(searchTerm);

    const filtered = bankData.filter((bank) => {
      const bankName = normalizeKeyword(bank.name);

      const bankCode = String(bank.code || "").toLowerCase();

      return bankName.includes(normalizedSearchTerm) || bankCode.includes(searchTerm.trim().toLowerCase());
    });

    setFilteredBanks(filtered);

    setBankSearchTerm(searchTerm);

    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);

    setActiveDropdown("bank");

    if (searchTerm === "") {
      setSelectedBank(null);
    }
  };

  const handleBranchSearch = (searchTerm) => {
    // 使用者手動輸入分行時離開附近分行模式
    if (isNearbySearch) {
      resetNearbyState();
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    setBranchSearchTerm(searchTerm);
    setSelectedIndex(-1);
    setMouseHoveredIndex(-1);

    if (selectedBank) {
      const filtered = branchData.filter((branch) => {
        const branchName = String(branch.name || "").toLowerCase();
        const branchCode = String(branch.code || "").toLowerCase();
        const branchAddress = String(branch.address || "").toLowerCase();

        return branchName.includes(normalizedSearchTerm) || branchCode.includes(normalizedSearchTerm) || branchAddress.includes(normalizedSearchTerm);
      });

      setFilteredBranches(filtered);
      setActiveDropdown("branch");
    }

    if (searchTerm === "") {
      setSelectedBranch(null);
    }
  };

  return (
    <section id="search" className="relative z-20 px-4 -mt-12 sm:-mt-14 sm:px-6 lg:-mt-16 lg:px-8">
      <div className="w-full max-w-5xl p-5 mx-auto bg-white border shadow-xl rounded-2xl border-slate-200 shadow-slate-900/10 sm:p-7 lg:p-8">
        <div className="mb-6 text-left">
          <p className="text-sm font-semibold text-blue-700">銀行分行查詢</p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">查詢銀行與分行</h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">輸入銀行名稱、簡稱或代碼，再選擇欲查詢的分行。</p>
        </div>

        {/* 手機單欄 平板與桌機雙欄 */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <article className="relative w-full">
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

          <article className="relative w-full">
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
        </div>

        <div className="flex items-start gap-2 px-4 py-3 mt-5 text-sm leading-6 text-left text-blue-900 rounded-xl bg-blue-50">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10v6" />
            <path d="M12 7h.01" />
          </svg>

          <p>可使用下拉選單，或直接輸入銀行名稱、銀行代碼與關鍵字查詢。</p>
        </div>
      </div>
    </section>
  );
};

export default BankingForm;
