import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BranchDetails = ({ selectedBank, selectedBranch }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const navigate = useNavigate();
    const { bankCode, branchCode } = useParams();

    useEffect(() => {
        setIsCopied(false);
        setLinkCopied(false);
    }, [selectedBranch]);

    const handleCopyBranchCode = () => {
        navigator.clipboard.writeText(selectedBranch.code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleCopyLink = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl);
        setLinkCopied(true);
        setTimeout(() => {
            setLinkCopied(false);
        }, 2000);
    };

    // 從 props 或 URL 參數獲取資料
    if (!selectedBank || !selectedBranch) {
        if (!bankCode || !branchCode) {
            navigate("/");
            return null;
        }
        return null;
    }

    const displayBankCode = selectedBank.split(" ")[0];
    const displayBankName = selectedBank.split(" ").slice(1).join(" ");

    return (
        <div className="flex flex-col w-full max-w-[600px] mx-auto">
            <section className="flex flex-col px-4 py-4 mt-4 border border-gray-700 border-dotted rounded primary bg-green-50">
            <div className="flex flex-col sm:flex-row sm:justify-between">
                <article className="flex flex-col">
                <h2 className="text-2xl font-bold">{`${displayBankName} (${displayBankCode}) ${selectedBranch.name}`}</h2>
                <p className="mt-2 text-xl">
                    分行代碼：{selectedBranch.code}
                    <button
                    onClick={handleCopyBranchCode}
                    className="px-4 py-1 ml-2 text-sm bg-green-500 border border-black rounded hover:bg-green-400 text-green-50 btn"
                    >
                    {isCopied ? "已複製" : "複製代碼"}
                    </button>
                </p>
                <p className="mt-2 text-xl">地址：{selectedBranch.address}</p>
                <p className="mt-2 text-xl">電話：{selectedBranch.tel}</p>
                </article>
            </div>
            <div className="self-start mt-4 text-green-900 sm:self-end">
                資料來源：
                <a className="font-bold text-green-900 gov-link hover:text-blue-700" href="https://data.gov.tw/dataset/6041" target="_blank">
                政府資料開放平台
                </a>
            </div>
            </section>
            <section className="mt-2 secondary">
            <a href="/" className="px-2 py-1 mr-2 text-sm border border-black rounded btn">
                重新查詢
            </a>
            <button className="px-2 py-1 text-sm bg-blue-500 border-black rounded copy-btn hover:bg-blue-400 text-blue-50 btn" onClick={handleCopyLink}>
                {linkCopied ? "已複製" : "複製此頁面連結"}
            </button>
            </section>
        </div>
    );
};

export default BranchDetails;