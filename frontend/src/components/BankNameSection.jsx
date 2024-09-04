import React, { useState, useEffect } from "react";

const BankNameSection = ({ handleSearch, filteredBanks, setSelectedBank }) => {
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
                    setSelectedBank(`${bank.code} ${bank.name}`);
                    setSearchTerm(`${bank.code} ${bank.name}`);
                    setDropdownActive(false);
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

export default BankNameSection;