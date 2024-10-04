import React, { useEffect, useState } from "react";

const BranchDetails = ({ selectedBank, selectedBranch }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        setIsCopied(false);
        setLinkCopied(false);
    }, [selectedBranch]);

    const handleCopyBranchCode = () => {
        navigator.clipboard.writeText(selectedBranch.code);
        setIsCopied(true);
    };

    const handleCopyLink = () => {
        const currentUrl = window.location.href;
        const encodedUrl = encodeURI(currentUrl); // 使用 encodeURI 處理 URL
        navigator.clipboard.writeText(encodedUrl);
        setLinkCopied(true);

        setTimeout(() => {
        setLinkCopied(false);
        }, 2000);
    };

    if (!selectedBank || !selectedBranch) return null;

    const bankCode = selectedBank.split(" ")[0];
    const bankName = selectedBank.split(" ").slice(1).join(" ");

    return (
        <div className="flex flex-col w-full">
        <section className="primary flex flex-col px-4 py-4 mt-4 border border-gray-700 border-dotted rounded bg-green-50">
            <div className="flex flex-col sm:flex-row sm:justify-between">
            <article className="flex flex-col">
                <h2 className="text-2xl font-bold">{`${bankName} (${bankCode}) ${selectedBranch.name}`}</h2>
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
            <div className="mt-4 text-green-900 self-end">
            資料來源：
            <a className="gov-link font-bold text-green-900 hover:text-blue-700" href="https://data.gov.tw/dataset/6041">
                政府資料開放平台
            </a>
            </div>
        </section>
        <section className="secondary mt-2">
            <a href="/" className="btn px-2 py-1 text-sm mr-2 border border-black rounded">
            重新查詢
            </a>
            <button className="copy-btn px-2 py-1 text-sm border-black rounded hover:bg-blue-400 bg-blue-500 text-blue-50 btn" onClick={handleCopyLink}>
            {linkCopied ? "已複製" : "複製此頁面連結"}
            </button>
        </section>
        </div>
    );
};

export default BranchDetails;
