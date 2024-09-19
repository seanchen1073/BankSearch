import React from "react";

const BranchDetails = ({ selectedBank, selectedBranch }) => {
    if (!selectedBank || !selectedBranch) return null;

    const bankCode = selectedBank.split(" ")[0];
    const bankName = selectedBank.split(" ").slice(1).join(" ");

    return (
        <div className="flex flex-col items-start justify-between px-4 py-4 mt-4 border border-gray-700 border-dotted rounded bg-green-50">
        <h2 className="text-2xl font-bold">{`${bankName} (${bankCode}) ${selectedBranch.name}`}</h2>
        <p className="mt-2">分行代碼：{selectedBranch.code}</p>
        <p className="mt-2">地址：{selectedBranch.address}</p>
        <p className="mt-2">電話：{selectedBranch.tel}</p>
        </div>
    );
};

export default BranchDetails;
