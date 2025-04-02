import axios from "axios";

// 使用具名匯出
export const fetchBankData = async (bankCode = null) => {
    let apiUrl = "https://banksearch-backend.zeabur.app/";
    if (bankCode) {
        apiUrl += `${bankCode}/branches/`;
    }
    try {
        const response = await axios.get(apiUrl, {
        headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
        },
        });

        if (response.status === 200) {
        return response.data;
        }
    } catch (error) {
        console.error("獲取資料失敗:", error);
        return null;
    }
};

// export default BankGetApi;不需要這行，因為使用了具名匯出
