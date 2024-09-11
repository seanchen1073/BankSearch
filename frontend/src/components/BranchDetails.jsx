import React from "react";

const BranchDetails = ({ selectedBank, selectedBranch }) => {
    if (!selectedBank || !selectedBranch) return null;

    const bankCode = selectedBank.split(" ")[0];
    const bankName = selectedBank.split(" ").slice(1).join(" ");

    return (
        <div className="p-4 mt-4 bg-green-100 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold">{`${bankName} (${bankCode}) - ${selectedBranch.name}`}</h2>
        <p>分行代碼：{selectedBranch.code}</p>
        <p>地址：{selectedBranch.address}</p>
        <p>電話：{selectedBranch.tel}</p>
        </div>
    );
};

export default BranchDetails;
