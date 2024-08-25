import React, { useState, useEffect } from "react";
import axios from "axios";

const Header = () => (
  <div>
    <div className="p-1 text-xs text-white bg-gray-700">powered by Sean</div>
    <h1 className="p-4 text-4xl font-bold text-center text-white bg-black">台灣銀行代碼查詢</h1>
  </div>
);

const BankNameSection = ({ handleSearch, filteredBanks, setSelectedBank, bankData }) => {
  const [isDropdownActive, setDropdownActive] = useState(false);
  const [inputWidth, setInputWidth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleArrowClick = () => {
    setDropdownActive((prev) => !prev);
  };

  useEffect(() => {
    const updateWidth = () => {
      const inputElement = document.querySelector("input");
      if (inputElement) {
        setInputWidth(inputElement.offsetWidth + "px");
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setDropdownActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);

    if (!isDropdownActive) {
      setDropdownActive(true);
    }
  };

  const handleInputClick = () => {
    if (isDropdownActive) {
      setDropdownActive(false);
    } else {
      setDropdownActive(true);
      setSearchTerm("");
      handleSearch("");
    }
  };

  return (
    <div className="relative w-full pr-4 mb-4 md:w-1/2 lg:w-1/3 md:mb-0 sm:px-4">
      <h2 className="mb-2 text-xl font-semibold">銀行名稱</h2>
      <div className="relative w-full max-w-md">
        <input
          type="text"
          className={`w-full p-2 pr-10 border rounded-md ${isDropdownActive ? "border-blue-500 border-2" : "border-gray-300"} focus:outline-none`}
          placeholder="請輸入關鍵字或銀行代碼"
          value={searchTerm}
          onChange={handleInputChange}
          onClick={handleInputClick}
        />
        <div
          className={`absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer ${isDropdownActive ? "text-black-500" : "text-gray-400"}`}
          onClick={handleArrowClick}
        >
          <div className="w-px h-6 mr-2 bg-gray-300"></div>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      {isDropdownActive && (
        <ul className="absolute z-10 mt-1 overflow-y-auto bg-white border rounded-md shadow-lg" style={{ width: inputWidth, maxHeight: "290px" }}>
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank) => (
              <li
                key={bank.code}
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSelectedBank(`${bank.code} ${bank.name}`); // 設置選擇的銀行
                  setSearchTerm(`${bank.code} ${bank.name}`); // 將選擇的銀行名稱設置到輸入框
                  setDropdownActive(false); // 關閉下拉選單
                }}
              >
                {bank.code} {bank.name}
              </li>
            ))
          ) : (
            <li className="p-2 text-center text-gray-500">無相關資料</li>
          )}
        </ul>
      )}
      <div className="text-center">可使用下拉選單或直接輸入關鍵字查詢</div>
    </div>
  );
};

const BranchNameSection = ({ selectedBank, handleSearch, filteredBranches }) => {
  const [isDropdownActive, setDropdownActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false); // 用於追蹤焦點狀態

  const handleArrowClick = () => {
    setDropdownActive((prev) => !prev);
    setIsFocused((prev) => !prev); // 切換焦點狀態
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);

    if (!isDropdownActive) {
      setDropdownActive(true);
      setIsFocused(true); // 當輸入框被點擊時設置為焦點
    }
  };

  const handleInputClick = () => {
    setDropdownActive((prev) => !prev);
    setIsFocused((prev) => !prev); // 切換焦點狀態
  };

  // 監聽點擊事件以取消選取
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setDropdownActive(false);
        setIsFocused(false); // 點擊外部時移除焦點樣式
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full pl-4 mb-4 md:w-1/2 lg:w-1/3 md:mb-0 sm:px-4">
      <h2 className="mb-2 text-xl font-semibold">分行名稱</h2>
      <div className="relative w-full max-w-md">
        <input
          type="text"
          className={`w-full p-2 pr-10 border rounded-md ${isFocused ? "border-blue-500 border-2" : "border-gray-300"} focus:outline-none`}
          placeholder="請選擇分行名稱"
          value={searchTerm}
          onChange={handleInputChange}
          onClick={handleInputClick}
          disabled={!selectedBank}
        />
        <div
          className={`absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer ${isDropdownActive ? "text-black-500" : "text-gray-400"}`}
          onClick={handleArrowClick}
        >
          <div className="w-px h-6 mr-2 bg-gray-300"></div>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      {isDropdownActive && (
        <ul
          className="absolute left-0 right-0 z-10 mt-1 overflow-y-auto bg-white border rounded-md shadow-lg"
          style={{ width: "100%", maxHeight: "290px" }}
        >
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch) => (
              <li
                key={branch}
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSearchTerm(branch);
                  setDropdownActive(false);
                  setIsFocused(false); // 點選後關閉下拉選單並移除焦點
                }}
              >
                {branch}
              </li>
            ))
          ) : (
            <li className="p-2 text-center text-gray-500">無相關資料</li>
          )}
        </ul>
      )}
    </div>
  );
};

function App() {
  const [bankData, setBankData] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);

  const fetchBankData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/all-bank-data/", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Error: Received status code ${response.status}`);
        return [];
      }
    } catch (error) {
      console.error("Error fetching bank data:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadBankData = async () => {
      console.log("Loading bank data...");
      const data = await fetchBankData();
      if (data && Array.isArray(data)) {
        setBankData(data);
        setFilteredBanks(data);
        console.log("Bank data loaded successfully:", data);
      } else {
        console.error("Failed to load bank data");
      }
    };
    loadBankData();
  }, []);

  const handleBankSearch = (searchTerm) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = bankData.filter(
      (bank) => bank.code.toLowerCase().includes(lowerCaseSearchTerm) || bank.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredBanks(filtered);
    setSelectedBank(filtered.length > 0 ? filtered[0].code : "");
  };

  const handleBranchSearch = (searchTerm) => {
    if (!selectedBank) return;
    const selectedBankData = bankData.find((bank) => bank.code === selectedBank.split(" ")[0]);
    if (selectedBankData) {
      const filtered = selectedBankData.branches.filter((branch) => branch.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredBranches(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-wrap justify-center">
          <BankNameSection handleSearch={handleBankSearch} filteredBanks={filteredBanks} setSelectedBank={setSelectedBank} bankData={bankData} />
          <BranchNameSection selectedBank={selectedBank} handleSearch={handleBranchSearch} filteredBranches={filteredBranches} />
        </div>
      </div>
    </div>
  );
}

export default App;
