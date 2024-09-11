import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BankingForm from "./BankingForm";
import BranchDetails from "./BranchDetails";

const BankBranchDetail = ({ selectedBank, setSelectedBank, selectedBranch, setSelectedBranch }) => {
    const { bankCode, branchCode, bankName, branchName } = useParams();
    const [branchDetails, setBranchDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBranchDetails = async () => {
        if (selectedBank && selectedBranch) {
            setBranchDetails(selectedBranch);
        } else {
            try {
            const decodedBankName = decodeURIComponent(bankName);
            const decodedBranchName = decodeURIComponent(branchName);
            const apiUrl = `http://localhost:8000/api/${bankCode}/${branchCode}/${encodeURIComponent(decodedBankName)}-${encodeURIComponent(
                decodedBranchName
            )}.html`;

            console.log("Fetching data from:", apiUrl);

            const response = await axios.get(apiUrl);
            if (response.status === 200) {
                setBranchDetails(response.data);
                setSelectedBank(`${bankCode} ${decodedBankName}`);
                setSelectedBranch({
                code: branchCode,
                name: decodedBranchName,
                ...response.data,
                });
            } else {
                setError("分行資料未找到");
            }
            } catch (error) {
            console.error("Error fetching branch details:", error);
            setError("資料載入失敗");
            }
        }
        };

        fetchBranchDetails();
    }, [bankCode, branchCode, bankName, branchName, selectedBank, selectedBranch, setSelectedBank, setSelectedBranch]);

    if (error) {
        return <div className="px-8 pt-6 pb-8 mb-4 text-red-500 bg-white rounded shadow-md">{error}</div>;
    }

    if (!branchDetails) {
        return <div className="px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">Loading...</div>;
    }

    return (
        <div className="px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
        <BranchDetails selectedBank={selectedBank} selectedBranch={selectedBranch} />
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
