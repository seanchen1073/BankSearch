import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://banksearch-backend.zeabur.app");

// 建立共用 Axios 設定
const bankApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * 取得銀行或分行資料
 *
 * 未傳入 bankCode 時取得銀行清單
 * 傳入 bankCode 時取得該銀行的分行
 */
export const fetchBankData = async (bankCode = null) => {
  const apiUrl = bankCode ? `/banks/${encodeURIComponent(bankCode)}/branches/` : "/banks/";

  try {
    const response = await bankApi.get(apiUrl);

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data;
    }

    console.error("銀行 API 回傳格式錯誤", response.data);
    return null;
  } catch (error) {
    if (error.response) {
      console.error("取得銀行資料失敗", error.response.status, error.response.data);

      return null;
    }

    if (error.request) {
      console.error("後端沒有回應", error.request);
      return null;
    }

    console.error("取得銀行資料失敗", error.message);
    return null;
  }
};

/**
 * 根據使用者位置取得附近分行
 *
 * 後端只回傳距離最近的指定筆數
 */
export const fetchNearbyBranches = async (latitude, longitude, limit = 10) => {
  // 檢查經緯度格式
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.error("附近分行查詢失敗 經緯度格式錯誤");
    return null;
  }

  try {
    const response = await bankApi.get("/branches/nearby/", {
      params: {
        lat: latitude,
        lng: longitude,
        limit,
      },
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data;
    }

    console.error("附近分行 API 回傳格式錯誤", response.data);

    return null;
  } catch (error) {
    if (error.response) {
      console.error("取得附近分行失敗", error.response.status, error.response.data);

      return null;
    }

    if (error.request) {
      console.error("附近分行後端沒有回應", error.request);

      return null;
    }

    console.error("取得附近分行失敗", error.message);

    return null;
  }
};
