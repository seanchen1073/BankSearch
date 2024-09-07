import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BankingForm from "./BankingForm";

const BankBranchDetail = ({ selectedBank, setSelectedBank, selectedBranch, setSelectedBranch }) => {
    const { bankCode, branchCode, bankName, branchName } = useParams();
    const [branchDetails, setBranchDetails] = useState(null);

    useEffect(() => {
        const fetchBranchDetails = async () => {
        try {
            // 使用 decodeURIComponent 來解碼 bankName 和 branchName
            const decodedBankName = decodeURIComponent(bankName);
            const decodedBranchName = decodeURIComponent(branchName);

            const response = await axios.get(
            `http://localhost:8000/api/${bankCode}/${branchCode}/${encodeURIComponent(decodedBankName)}-${encodeURIComponent(decodedBranchName)}.html`
            );
            setBranchDetails(response.data);
        } catch (error) {
            console.error("Error fetching branch details:", error);
        }
        };

        fetchBranchDetails();
    }, [bankCode, branchCode, bankName, branchName]);

    if (!branchDetails) {
        return <div>Loading...</div>;
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
        {/* 在這裡添加 BankingForm 組件 */}
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
