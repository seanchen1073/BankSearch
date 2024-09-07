import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const BankBranchDetail = () => {
    const { bankCode, branchCode, bankName, branchName } = useParams();
    const [branchDetails, setBranchDetails] = useState(null);
    
    useEffect(() => {
        const fetchBranchDetails = async () => {
        try {
            const response = await axios.get(
            `http://localhost:8000/api/${bankCode}/${branchCode}/${encodeURIComponent(bankName)}-${encodeURIComponent(branchName)}.html`
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
            {bankName} - {branchName}
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
        </div>
    );
};

export default BankBranchDetail;
