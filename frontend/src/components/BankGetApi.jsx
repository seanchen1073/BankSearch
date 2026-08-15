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
 * 預設搜尋十公里內的分行
 * 最多回傳距離最近的十間
 */
export const fetchNearbyBranches = async (latitude, longitude, limit = 10, radius = 10) => {
  // 檢查經緯度格式
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.error("附近分行查詢失敗 經緯度格式錯誤");

    return null;
  }

  // 檢查搜尋筆數
  if (!Number.isFinite(limit) || limit < 1) {
    console.error("附近分行查詢失敗 limit 格式錯誤");

    return null;
  }

  // 檢查搜尋半徑
  if (!Number.isFinite(radius) || radius <= 0) {
    console.error("附近分行查詢失敗 radius 格式錯誤");

    return null;
  }

  try {
    const response = await bankApi.get("/branches/nearby/", {
      params: {
        lat: latitude,
        lng: longitude,
        limit,
        radius,
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

/**
 * 取得目前分行對應的 Google Place
 *
 * 一般分行使用銀行代碼與分行代碼
 * 沒有分行代碼時改用銀行代碼與分行名稱
 *
 * 這支 API 只會在前端主動呼叫時執行
 * 不會影響首頁與搜尋下拉選單載入
 */
export const resolveGooglePlace = async (bankCode, branchCode = "", branchName = "") => {
  const normalizedBankCode = String(bankCode || "").trim();
  const normalizedBranchCode = String(branchCode || "").trim();
  const normalizedBranchName = String(branchName || "").trim();

  // 沒有銀行代碼就不送出請求
  if (!normalizedBankCode) {
    console.error("Google Place 查詢失敗 缺少銀行代碼");

    return null;
  }

  // 分行代碼和分行名稱至少要有一個
  if (!normalizedBranchCode && !normalizedBranchName) {
    console.error("Google Place 查詢失敗 缺少分行資料");

    return null;
  }

  const params = {
    bank_code: normalizedBankCode,
  };

  // 一般分行使用分行代碼
  if (normalizedBranchCode) {
    params.branch_code = normalizedBranchCode;
  }

  // 沒有分行代碼時才使用分行名稱
  if (!normalizedBranchCode && normalizedBranchName) {
    params.branch_name = normalizedBranchName;
  }

  try {
    const response = await bankApi.get("/places/resolve/", {
      params,
    });

    if (response.status === 200 && response.data && typeof response.data === "object" && typeof response.data.resolved === "boolean") {
      return response.data;
    }

    console.error("Google Place API 回傳格式錯誤", response.data);

    return null;
  } catch (error) {
    if (error.response) {
      console.error("取得 Google Place 失敗", error.response.status, error.response.data);

      return null;
    }

    if (error.request) {
      console.error("Google Place 後端沒有回應", error.request);

      return null;
    }

    console.error("取得 Google Place 失敗", error.message);

    return null;
  }
};
