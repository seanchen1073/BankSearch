import React, { useEffect, useState } from "react";

const BranchDetails = ({ selectedBank, selectedBranch }) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        // 當分行資料改變時重置複製狀態
        setIsCopied(false);
    }, [selectedBranch]);

    const handleCopy = () => {
        navigator.clipboard.writeText(selectedBranch.code);
        setIsCopied(true);
    };

    if (!selectedBank || !selectedBranch) return null;

    const bankCode = selectedBank.split(" ")[0];
    const bankName = selectedBank.split(" ").slice(1).join(" ");

    return (
        <div className="flex flex-col items-start w-5/6 px-4 py-4 mt-4 border border-gray-700 border-dotted rounded bg-green-50">
        <h2 className="text-2xl font-bold">{`${bankName} (${bankCode}) ${selectedBranch.name}`}</h2>
        <p className="mt-2 text-xl">
            分行代碼：{selectedBranch.code}
            <button onClick={handleCopy} className="px-4 py-1 ml-2 text-sm bg-green-500 border border-black rounded hover:bg-green-400 text-green-50 btn">
            {isCopied ? "已複製" : "複製代碼"}
            </button>
        </p>
        <p className="mt-2 text-xl">地址：{selectedBranch.address}</p>
        <p className="mt-2 text-xl">電話：{selectedBranch.tel}</p>
        </div>
    );
};

export default BranchDetails;
