import React, { useContext } from "react";
import { BankContext } from "../contexts/BankContext";

const BranchNameSection = ({
  handleBranchSearch,
  handleBranchSelect,
  handleKeyDown,
  handleMouseEnter,
  handleMouseLeave,
  handleMouseMove,
  getItemClassName,
}) => {
  const { selectedBank, selectedBranch, filteredBranches, activeDropdown, setActiveDropdown, branchSearchTerm } = useContext(BankContext);

  const isOpen = activeDropdown === "branch";
  const isDisabled = !selectedBank;

  const handleInputChange = (event) => {
    handleBranchSearch(event.target.value);
  };

  const handleDropdownToggle = () => {
    if (isDisabled) {
      return;
    }

    setActiveDropdown(isOpen ? null : "branch");
  };

  return (
    <section className="relative w-full branch-input-field">
      <label htmlFor="branch-selection" className="block mb-2 text-sm font-bold text-slate-800 sm:text-base">
        分行名稱或代碼
      </label>

      <div className="relative w-full">
        {/* 左側位置圖示 */}
        <span className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 ${isDisabled ? "text-slate-300" : "text-slate-400"}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        </span>

        <input
          type="text"
          id="branch-selection"
          name="branch"
          className={`h-[52px] w-full rounded-xl border py-3 pl-12 pr-12 text-base outline-none transition placeholder:text-slate-400 ${
            isDisabled
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : isOpen
              ? "border-blue-500 bg-white text-slate-900 ring-4 ring-blue-100"
              : "border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          }`}
          placeholder={isDisabled ? "請先選擇銀行" : "例如：台北分行、信義分行"}
          value={branchSearchTerm}
          onChange={handleInputChange}
          onClick={handleDropdownToggle}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls="branch-options"
        />

        {/* 右側箭頭 */}
        <button
          type="button"
          className={`absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl transition ${
            isDisabled ? "cursor-not-allowed text-slate-300" : isOpen ? "text-blue-700" : "text-slate-400"
          }`}
          onClick={handleDropdownToggle}
          disabled={isDisabled}
          aria-label={isDisabled ? "請先選擇銀行" : isOpen ? "關閉分行選單" : "開啟分行選單"}
        >
          <svg
            className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* 分行下拉選單 */}
      {isOpen && !isDisabled && (
        <ul
          id="branch-options"
          role="listbox"
          className="branch-dropdown absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl shadow-slate-900/15"
          onKeyDown={handleKeyDown}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch, index) => {
              // 分行代碼可能是空的 所以要一起比對分行名稱
              const isSelected = selectedBranch?.code === branch.code && selectedBranch?.name === branch.name;

              const isHighlighted = Boolean(getItemClassName(index));

              return (
                <li
                  key={`${branch.code || "no-code"}-${branch.name}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm transition sm:text-base ${
                    isSelected ? "bg-blue-700 text-white" : isHighlighted ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => handleBranchSelect(branch)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                >
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {branch.code || "無代碼"}
                  </span>

                  <span className="min-w-0 break-words">{branch.name}</span>
                </li>
              );
            })
          ) : (
            <li className="px-3 py-6 text-sm text-center text-slate-500">找不到相關分行</li>
          )}
        </ul>
      )}
    </section>
  );
};

export default BranchNameSection;
