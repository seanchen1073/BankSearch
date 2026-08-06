import React, { createContext, useState } from "react";

/**
 * 建立銀行查詢共用 Context
 *
 * Header、搜尋表單、附近分行 Modal、
 * 分行詳細資料與 Google 地圖都會共用這些狀態
 */
export const BankContext = createContext();

export const BankProvider = ({ children }) => {
  /**
   * 銀行與分行基本資料
   */

  // 所有銀行的清單
  // 現在後端只會回傳銀行代碼與名稱，不會一次載入全部分行
  const [bankData, setBankData] = useState([]);

  // 目前選取銀行所屬的分行清單
  const [branchData, setBranchData] = useState([]);

  /**
   * 搜尋結果
   */

  // 銀行搜尋後的過濾結果
  const [filteredBanks, setFilteredBanks] = useState([]);

  // 分行搜尋後的過濾結果
  const [filteredBranches, setFilteredBranches] = useState([]);

  /**
   * 目前選取的銀行與分行
   */

  // selectedBank 目前沿用原專案格式：
  // 例如「004 臺灣銀行」
  const [selectedBank, setSelectedBank] = useState(null);

  // selectedBranch 儲存完整分行物件
  const [selectedBranch, setSelectedBranch] = useState(null);

  /**
   * 搜尋下拉選單控制
   */

  // 目前開啟的下拉選單：
  // bank、branch 或 null
  const [activeDropdown, setActiveDropdown] = useState(null);

  // 鍵盤操作時目前選中的項目索引
  const [selectedIndex, setSelectedIndex] = useState(-1);

  /**
   * 搜尋欄文字
   */

  // 銀行搜尋欄目前顯示的文字
  const [bankSearchTerm, setBankSearchTerm] = useState("");

  // 分行搜尋欄目前顯示的文字
  const [branchSearchTerm, setBranchSearchTerm] = useState("");

  /**
   * 滑鼠與鍵盤操作狀態
   */

  // 滑鼠目前停留的搜尋結果索引
  const [mouseHoveredIndex, setMouseHoveredIndex] = useState(-1);

  // 判斷使用者目前是否使用鍵盤操作搜尋結果
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);

  /**
   * 附近分行功能
   */

  // 控制「允許網站取得目前位置」說明視窗
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);

  // 儲存使用者目前位置
  // 格式：
  // {
  //   lat: 25.033,
  //   lng: 121.565
  // }
  const [userLocation, setUserLocation] = useState(null);

  // 儲存後端回傳的附近分行
  // 預設最多取得距離最近的 10 間
  const [nearbyBranches, setNearbyBranches] = useState([]);

  // 使用者按下定位按鈕後，顯示讀取中狀態
  const [isLocating, setIsLocating] = useState(false);

  // 儲存定位失敗、拒絕授權或 API 錯誤訊息
  const [locationError, setLocationError] = useState("");

  // 判斷目前顯示的是一般銀行搜尋，
  // 還是「附近分行」搜尋結果
  const [isNearbySearch, setIsNearbySearch] = useState(false);

  /**
   * 清除附近分行相關狀態
   *
   * 之後使用者按下「重新查詢」，
   * 或改用一般銀行搜尋時可以呼叫
   */
  const resetNearbyState = () => {
    setIsNearbyModalOpen(false);
    setUserLocation(null);
    setNearbyBranches([]);
    setIsLocating(false);
    setLocationError("");
    setIsNearbySearch(false);
  };

  /**
   * 提供給所有子元件使用的共用資料
   */
  const contextValue = {
    // 銀行資料
    bankData,
    setBankData,

    // 分行資料
    branchData,
    setBranchData,

    // 過濾後的銀行資料
    filteredBanks,
    setFilteredBanks,

    // 過濾後的分行資料
    filteredBranches,
    setFilteredBranches,

    // 目前選取銀行
    selectedBank,
    setSelectedBank,

    // 目前選取分行
    selectedBranch,
    setSelectedBranch,

    // 下拉選單控制
    activeDropdown,
    setActiveDropdown,

    // 鍵盤選取索引
    selectedIndex,
    setSelectedIndex,

    // 銀行搜尋欄文字
    bankSearchTerm,
    setBankSearchTerm,

    // 分行搜尋欄文字
    branchSearchTerm,
    setBranchSearchTerm,

    // 滑鼠停留索引
    mouseHoveredIndex,
    setMouseHoveredIndex,

    // 鍵盤操作狀態
    isKeyboardNavigation,
    setIsKeyboardNavigation,

    // 附近分行定位視窗
    isNearbyModalOpen,
    setIsNearbyModalOpen,

    // 使用者目前位置
    userLocation,
    setUserLocation,

    // 附近分行清單
    nearbyBranches,
    setNearbyBranches,

    // 是否正在取得位置
    isLocating,
    setIsLocating,

    // 定位錯誤訊息
    locationError,
    setLocationError,

    // 是否為附近分行模式
    isNearbySearch,
    setIsNearbySearch,

    // 清除附近分行狀態
    resetNearbyState,
  };

  return <BankContext.Provider value={contextValue}>{children}</BankContext.Provider>;
};
