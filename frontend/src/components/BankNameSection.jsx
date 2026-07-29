import React, { useContext } from "react";
import { BankContext } from "../contexts/BankContext";

const BankNameSection = ({
  handleBankSearch,
  handleBankSelect,
  handleKeyDown,
  handleMouseEnter,
  handleMouseLeave,
  handleMouseMove,
  getItemClassName,
}) => {
  const { selectedBank, filteredBanks, activeDropdown, setActiveDropdown, bankSearchTerm } = useContext(BankContext);

  const isOpen = activeDropdown === "bank";

  const handleInputChange = (event) => {
    handleBankSearch(event.target.value);
  };

  const handleDropdownToggle = () => {
    setActiveDropdown(isOpen ? null : "bank");
  };

  return (
    <section className="bank-input-field relative w-full">
      <label htmlFor="bank-selection" className="mb-2 block text-sm font-bold text-slate-800 sm:text-base">
        銀行名稱或代碼
      </label>

      <div className="relative w-full">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 9h18" />
            <path d="M5 9v8" />
            <path d="M9 9v8" />
            <path d="M15 9v8" />
            <path d="M19 9v8" />
            <path d="M3 17h18" />
            <path d="M2 21h20" />
            <path d="M12 3 3 7h18L12 3Z" />
          </svg>
        </span>

        <input
          type="text"
          id="bank-selection"
          name="bank"
          className={`h-[52px] w-full rounded-xl border bg-white py-3 pl-12 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 ${
            isOpen
              ? "border-blue-500 ring-4 ring-blue-100"
              : "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          }`}
          placeholder="例如：第一銀行、007、台銀"
          value={bankSearchTerm}
          onChange={handleInputChange}
          onClick={handleDropdownToggle}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls="bank-options"
        />

        <button
          type="button"
          className={`absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl transition ${
            isOpen ? "text-blue-700" : "text-slate-400"
          }`}
          onClick={handleDropdownToggle}
          aria-label={isOpen ? "關閉銀行選單" : "開啟銀行選單"}
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

      {isOpen && (
        <ul
          id="bank-options"
          role="listbox"
          className="bank-dropdown absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl shadow-slate-900/15"
          onKeyDown={handleKeyDown}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank, index) => {
              const isSelected = selectedBank === `${bank.code} ${bank.name}`;

              const isHighlighted = Boolean(getItemClassName(index));

              return (
                <li
                  key={bank.code}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm transition sm:text-base ${
                    isSelected ? "bg-blue-700 text-white" : isHighlighted ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => handleBankSelect(bank)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                >
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {bank.code}
                  </span>

                  <span className="min-w-0 break-words">{bank.name}</span>
                </li>
              );
            })
          ) : (
            <li className="px-3 py-6 text-center text-sm text-slate-500">找不到相關銀行</li>
          )}
        </ul>
      )}
    </section>
  );
};

export default BankNameSection;
