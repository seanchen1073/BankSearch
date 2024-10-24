import React, { useState, useEffect, useRef } from "react";

const BankNameSection = ({
    filteredBanks, selectedBank, isDropdownActive, setActiveDropdown, bankSearchTerm, handleBankSearch, handleBankSelect }) => {
    const [inputWidth, setInputWidth] = useState("");
    const inputRef = useRef(null);

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

    const handleInputChange = (e) => {
        handleBankSearch(e.target.value);
        setActiveDropdown("bank");
    };

    const handleInputClick = () => {
        setActiveDropdown("bank");
    };

    return (
        <section className="w-full bank-input-field">
        <h2 className="mb-2 text-xl font-semibold">銀行名稱</h2>
        <div className="relative w-full">
            <input
            ref={inputRef}
            type="text"
            id="bank-selection"
            name="bank"
            className={`w-full p-2 pr-10 border rounded-md ${isDropdownActive ? "border-blue-500 border-2" : "border-gray-300"} focus:outline-none`}
            placeholder="請輸入關鍵字或銀行代碼"
            value={bankSearchTerm}
            onChange={handleInputChange}
            onClick={handleInputClick}
            />
            <button
            className={`absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer ${isDropdownActive ? "text-black-500" : "text-gray-400"}`}
            onClick={handleInputClick}
            >
            <div className="w-px h-6 mr-2 bg-gray-300"></div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
            </svg>
            </button>
        </div>
        {isDropdownActive && (
            <ul
            className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border rounded-md shadow-lg max-h-60"
            style={{ width: inputWidth, maxHeight: "290px" }}
            onMouseDown={(e) => e.stopPropagation()}
            >
            {filteredBanks.length > 0 ? (
                filteredBanks.map((bank) => (
                <li key={bank.code} className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleBankSelect(bank)}>
                    {bank.code} {bank.name}
                </li>
                ))
            ) : (
                <li className="p-2 text-center text-gray-500">無相關資料</li>
            )}
            </ul>
        )}
        <p className="mt-1 text-left">可使用下拉選單或直接輸入關鍵字查詢</p>
        </section>
    );
};

export default BankNameSection;
