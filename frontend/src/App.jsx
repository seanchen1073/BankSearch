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

  return (
    <div className="w-full pr-4 mb-4 md:w-1/2 lg:w-1/3 md:mb-0 sm:px-4">
      <h2 className="mb-2 text-xl font-semibold">銀行名稱</h2>
      <div className="relative">
        <input
          type="text"
          className={`w-full p-2 pr-10 border rounded-md ${isDropdownActive ? "border-blue-500 border-2" : "border-gray-300"} focus:outline-none`}
          placeholder="請輸入關鍵字或銀行代碼"
          onChange={(e) => handleSearch(e.target.value)}
          onClick={handleArrowClick}
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
          {bankData.length > 0
            ? bankData.map((bank) => (
                <li key={bank.code} className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => setSelectedBank(`${bank.code} ${bank.name}`)}>
                  {bank.code} {bank.name}
                </li>
              ))
            : null}
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
        return response.data; // 返回資料
      } else {
        console.error(`Error: Received status code ${response.status}`);
        return []; // 如果狀態碼不是 200，返回空數組
      }
    } catch (error) {
      console.error("Error fetching bank data:", error);
      return []; // 錯誤時返回空數組
    }
  };

  useEffect(() => {
    const loadBankData = async () => {
      console.log("Loading bank data..."); // 確認函數被呼叫
      const data = await fetchBankData();
      if (data && Array.isArray(data)) {
        setBankData(data); // 更新狀態
        console.log("Bank data loaded successfully:", data); // 確認資料已加載
      } else {
        console.error("Failed to load bank data");
      }
    };
    loadBankData();
  }, []);

  const handleBankSearch = (searchTerm) => {
    const filtered = bankData.filter((bank) => bank.code.includes(searchTerm) || bank.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
      <div className="container flex flex-wrap justify-center mx-auto mt-8">
        <BankNameSection
          handleSearch={handleBankSearch}
          filteredBanks={filteredBanks}
          setSelectedBank={setSelectedBank}
          bankData={bankData} // 傳遞 bankData
        />
        <BranchNameSection selectedBank={selectedBank} handleSearch={handleBranchSearch} filteredBranches={filteredBranches} />
      </div>
    </div>
  );
}

export default App;
