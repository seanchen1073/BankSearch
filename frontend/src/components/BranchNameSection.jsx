import React, { useState, useEffect, useRef } from "react";

const BranchNameSection = ({ selectedBank, setSelectedBranch, filteredBranches, isDropdownActive, setActiveDropdown, searchTerm, setSearchTerm, }) => {
    const [inputWidth, setInputWidth] = useState("");
    const inputRef = useRef(null);

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
        if (selectedBank) {
            setSearchTerm("");
        }
    }, [selectedBank]);


    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setActiveDropdown("branch");
    };

    const handleInputClick = () => {
        setActiveDropdown("branch");
        setSearchTerm("");
    };

    const handleBranchSelect = (branch) => {
        setSelectedBranch(branch);
        setSearchTerm(branch.name);
        setActiveDropdown(null);
        };

    return (
        <section className="w-full branch-input-field">
        <h2 className="mb-2 text-xl font-semibold">分行名稱</h2>
        <div className="relative w-full">
            <input
            ref={inputRef}
            type="text"
            id="branch-selection"
            name="branch"
            className={`w-full p-2 pr-10 border rounded-md ${isDropdownActive ? "border-blue-500 border-2" : "border-gray-300"} focus:outline-none`}
            placeholder="請選擇分行名稱"
            value={searchTerm}
            onChange={handleInputChange}
            onClick={handleInputClick}
            disabled={!selectedBank}
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
            >
            {filteredBranches && filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => (
                <li
                    key={branch.code}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                    setSearchTerm(branch.name);
                    // setActiveDropdown(null);
                    handleBranchSelect(branch);
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
        </section>
    );
};

export default BranchNameSection;
