import React, { useState } from "react";
import BankNameSection from "./BankNameSection";
import BranchNameSection from "./BranchNameSection";

const BankingForm = ({ handleBankSearch, handleBranchSearch, filteredBanks, filteredBranches, selectedBank, setSelectedBank }) => {
    const [activeDropdown, setActiveDropdown] = useState(null);

    const handleBankSelect = (bank) => {
        setSelectedBank(bank);
        setActiveDropdown(null);
    };

    return (
        <div className="flex flex-wrap justify-center">
        <BankNameSection
            handleSearch={handleBankSearch}
            filteredBanks={filteredBanks}
            selectedBank={selectedBank}
            setSelectedBank={handleBankSelect}
            isDropdownActive={activeDropdown === "bank"}
            setActiveDropdown={setActiveDropdown}
        />
        <BranchNameSection
            selectedBank={selectedBank}
            handleSearch={handleBranchSearch}
            filteredBranches={filteredBranches}
            isDropdownActive={activeDropdown === "branch"}
            setActiveDropdown={setActiveDropdown}
        />
        </div>
    );
};

export default BankingForm;
