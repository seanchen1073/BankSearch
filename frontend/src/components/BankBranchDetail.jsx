import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BankingForm from "./BankingForm";

const BankBranchDetail = ({ selectedBank, setSelectedBank, selectedBranch, setSelectedBranch }) => {
    const { bankCode, branchCode, bankName, branchName } = useParams();
    const [branchDetails, setBranchDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBranchDetails = async () => {
        try {
            // 使用 decodeURIComponent 來解碼 bankName 和 branchName
            const decodedBankName = decodeURIComponent(bankName);
            const decodedBranchName = decodeURIComponent(branchName);

            // 確保 API 路徑正確
            const apiUrl = `http://localhost:8000/api/${bankCode}/${branchCode}/${encodeURIComponent(decodedBankName)}-${encodeURIComponent(
            decodedBranchName
            )}.html`;

            console.log("Fetching data from:", apiUrl); // 調試用

            const response = await axios.get(apiUrl);
            if (response.status === 200) {
            setBranchDetails(response.data);
            } else {
            setError("分行資料未找到");
            }
        } catch (error) {
            console.error("Error fetching branch details:", error);
            setError("資料載入失敗");
        }
        };

        fetchBranchDetails();
    }, [bankCode, branchCode, bankName, branchName]);

    if (error) {
        return <div className="px-8 pt-6 pb-8 mb-4 text-red-500 bg-white rounded shadow-md">{error}</div>;
    }

    if (!branchDetails) {
        return <div className="px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">Loading...</div>;
    }

    return (
        <div className="px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
        <h2 className="mb-4 text-2xl font-bold">
            {decodeURIComponent(bankName)} - {decodeURIComponent(branchName)}
        </h2>
        <p>
            <strong>銀行代碼：</strong> {bankCode}
        </p>
        <p>
            <strong>分行代碼：</strong> {branchCode}
        </p>
        <p>
            <strong>地址：</strong> {branchDetails.address}
        </p>
        <p>
            <strong>電話：</strong> {branchDetails.tel}
        </p>
        <BankingForm
            selectedBank={selectedBank}
            setSelectedBank={setSelectedBank}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
        />
        </div>
    );
};

export default BankBranchDetail;
