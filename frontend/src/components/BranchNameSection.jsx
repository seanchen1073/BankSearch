import React, { useState, useEffect } from "react";

const BranchNameSection = ({ selectedBank, handleSearch, filteredBranches }) => {
    const [isDropdownActive, setDropdownActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const handleKeyDown = (e) => {
        if (!isDropdownActive) return;

        switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prevIndex) => (prevIndex < filteredBranches.length - 1 ? prevIndex + 1 : prevIndex));
            break;
        case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
            break;
        case "Enter":
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < filteredBranches.length) {
            setSearchTerm(filteredBranches[selectedIndex].name); // 使用分行名稱
            setDropdownActive(false);
            setIsFocused(false);
            setSelectedIndex(-1);
            }
            break;
        case "Escape":
            setDropdownActive(false);
            setSelectedIndex(-1);
            break;
        default:
            break;
        }
    };

    const handleArrowClick = () => {
        setDropdownActive((prev) => !prev);
        setIsFocused((prev) => !prev);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        handleSearch(value);

        if (!isDropdownActive) {
        setDropdownActive(true);
        setIsFocused(true);
        }
    };

    const handleInputClick = () => {
        setDropdownActive((prev) => !prev);
        setIsFocused((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (!event.target.closest(".relative")) {
            setDropdownActive(false);
            setIsFocused(false);
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
            onKeyDown={handleKeyDown}
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
            {isDropdownActive && (
            <ul className="absolute left-0 right-0 z-10 mt-1 overflow-y-auto bg-white border rounded-md shadow-lg" style={{ maxHeight: "290px" }}>
                {filteredBranches && filteredBranches.length > 0 ? (
                filteredBranches.map((branch, index) => (
                    <li
                    key={branch.code}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${index === selectedIndex ? "bg-gray-200" : ""}`}
                    onClick={() => {
                        setSearchTerm(branch.name); // 使用分行名稱
                        setDropdownActive(false);
                        setIsFocused(false);
                        setSelectedIndex(-1);
                    }}
                    >
                    {branch.code} {branch.name}
                    </li>
                ))
                ) : (
                <li className="p-2 text-center text-gray-500">無相關資料</li>
                )}
            </ul>
            )}
        </div>
        </div>
    );
    };

export default BranchNameSection;