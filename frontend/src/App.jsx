import React, { useState, useEffect } from "react";
import axios from "axios";

const Header = () => (
  <div>
    <div className="p-1 text-xs text-white bg-gray-700">powered by Sean</div>
    <h1 className="p-4 text-4xl font-bold text-center text-white bg-black">台灣銀行代碼查詢</h1>
  </div>
);

const BankNameSection = ({ handleSearch, filteredBanks, setSelectedBank }) => {
  const [isDropdownActive, setDropdownActive] = useState(false);
  const [inputWidth, setInputWidth] = useState(""); // 用於設置下拉選單寬度
  const [bankData, setBankData] = useState([]); // 新增 bankData 狀態

  // 修改 fetchBankData 函數，將資料存入狀態
  const fetchBankData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/all-bank-data/");
      console.log("API response:", response.data);
      setBankData(response.data || []); // 確保資料存入 bankData 狀態
    } catch (error) {
      console.error("Error fetching bank data:", error);
      setBankData([]); // 錯誤時設置 bankData 為空數組
    }
  };

  // 在元件初次渲染時呼叫 fetchBankData
  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  const handleInputBlur = () => setTimeout(() => setDropdownActive(false), 100); // 確保焦點轉移時不會立即隱藏下拉選單
  const handleArrowClick = () => {
    setDropdownActive((prev) => !prev); // 切換下拉選單的顯示狀態
  };

  const handleInputFocus = () => {
    setDropdownActive(true); // 激活下拉選單
  };

  // 設定下拉選單寬度
  useEffect(() => {
    const updateWidth = () => {
      const inputElement = document.querySelector("input");
      if (inputElement) {
        setInputWidth(inputElement.offsetWidth + "px");
      }
    };

    updateWidth(); // 初次渲染時設置寬度

    window.addEventListener("resize", updateWidth); // 當窗口大小改變時更新寬度

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // 點擊外部隱藏下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setDropdownActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full pr-4 mb-4 md:w-1/2 lg:w-1/3 md:mb-0 sm:px-4">
      <h2 className="mb-2 text-xl font-semibold">銀行名稱</h2>
      <div className="relative">
        <input
          type="text"
          className={`w-full p-2 pr-10 border rounded-md ${isDropdownActive ? "border-blue-500 border-2" : "border-gray-300"} focus:outline-none`}
          placeholder="請輸入關鍵字或銀行代碼"
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
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
          className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg"
          style={{ width: inputWidth }} // 設置下拉選單寬度
        >
          {bankData.length > 0 ? (
            bankData.map((bank) => (
              <li key={bank.code} className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => setSelectedBank(`${bank.code} ${bank.name}`)}>
                {bank.code} {bank.name}
              </li>
            ))
          ) : (
            <li className="p-2 text-gray-500">無資料</li>
          )}
        </ul>
      )}
      <div>可使用下拉選單或直接輸入關鍵字查詢</div>
    </div>
  );
};

const BranchNameSection = ({ selectedBank, handleSearch, filteredBranches }) => (
  <div className="w-full pl-4 mb-4 md:w-1/2 lg:w-1/3 md:mb-0">
    <h2 className="mb-2 text-xl font-semibold">分行名稱</h2>
    <div className="relative">
      <input
        type="text"
        className={`w-full p-2 border rounded-md pr-10 ${!selectedBank ? "bg-gray-200" : ""}`}
        placeholder="請選擇分行名稱"
        disabled={!selectedBank}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <div className="w-px h-4 mr-2 bg-gray-300"></div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
    {filteredBranches.length > 0 && (
      <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
        {filteredBranches.map((branch) => (
          <li
            key={branch}
            className="p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => {
              /* 處理分行選擇 */
              console.log("Selected branch:", branch);
            }}
          >
            {branch}
          </li>
        ))}
      </ul>
    )}
  </div>
);

function App() {
  const [bankData, setBankData] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);

  useEffect(() => {
    const loadBankData = async () => {
      const data = await fetchBankData();
      if (data && Array.isArray(data)) {
        setBankData(data);
      } else {
        console.error("Failed to load bank data");
      }
    };
    loadBankData();
  }, []);

  const handleBankSearch = (searchTerm) => {
    const filtered = bankData.filter((bank) => bank.code.includes(searchTerm) || bank.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredBanks(filtered);
    // 更新 selectedBank 應該是基於使用者選擇的銀行
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
      <div className="container flex flex-wrap justify-center mx-auto mt-8">
        <BankNameSection handleSearch={handleBankSearch} filteredBanks={filteredBanks} setSelectedBank={setSelectedBank} />
        <BranchNameSection selectedBank={selectedBank} handleSearch={handleBranchSearch} filteredBranches={filteredBranches} />
      </div>
    </div>
  );
}

export default App;
