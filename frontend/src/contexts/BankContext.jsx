import React, { createContext, useState, useRef } from "react";

export const BankContext = createContext();

export const BankProvider = ({ children }) => {
  const [bankData, setBankData] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const [mouseHoveredIndex, setMouseHoveredIndex] = useState(-1);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const [inputWidth, setInputWidth] = useState("");
  const formRef = useRef(null);

  const contextValue = {
    bankData,
    setBankData,
    filteredBanks,
    setFilteredBanks,
    filteredBranches,
    setFilteredBranches,
    selectedBank,
    setSelectedBank,
    selectedBranch,
    setSelectedBranch,
    activeDropdown,
    setActiveDropdown,
    selectedIndex,
    setSelectedIndex,
    bankSearchTerm,
    setBankSearchTerm,
    branchSearchTerm,
    setBranchSearchTerm,
    mouseHoveredIndex,
    setMouseHoveredIndex,
    isKeyboardNavigation,
    setIsKeyboardNavigation,
    inputWidth,
    setInputWidth,
    formRef,
  };

  return <BankContext.Provider value={contextValue}>{children}</BankContext.Provider>;
};
