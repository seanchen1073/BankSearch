# 台灣銀行代碼查詢系統 BankSearch

🔗 網站：https://banksearchbysean.zeabur.app/

提供台灣銀行與分行查詢功能，目前收錄 **98 家銀行、4,554 筆分行資料**，整合銀行代碼搜尋、附近分行定位與 Google Maps 導航。

> 目前資料不包含中華郵政及農漁會。

## 功能

### 銀行與分行搜尋

支援銀行名稱、銀行代碼與常見簡稱搜尋，例如：

- `004`
- `台灣銀行`
- `台銀`
- `一銀`
- `中信`

搜尋支援 台 / 臺 正規化、銀行簡稱，以及滑鼠與鍵盤無縫切換操作。

### 分行資訊

選擇分行後可查看：

- 銀行與分行代碼
- 地址
- 電話
- Google Maps 地圖位置
- 地址與分行代碼快速複製

### 附近分行

透過 Browser Geolocation API 取得使用者位置，搜尋 **10 公里內最近的 10 間分行**。

後端使用 Haversine Formula 計算直線距離，並提供 Google Maps 導航功能。

### Google Maps

整合 Google Maps JavaScript API 顯示分行位置與附近分行。

導航優先使用可信 Google Place ID，若無可信 Place ID，則使用官方銀行地址作為 fallback，降低錯誤導航風險。

## 效能優化

### Lazy Loading

首頁僅載入銀行清單：

```http
GET /banks/
```

選擇銀行後才取得該銀行分行：

```http
GET /banks/{bank_code}/branches/
```

避免首頁一次載入全部 4,554 筆分行資料。

### Frontend Cache

已取得的分行資料會暫存在前端記憶體，同一頁面生命週期內再次選擇相同銀行時，不會重複呼叫 API。

### Backend Cache

Django 將銀行 JSON 資料暫存在伺服器記憶體，資料未異動時不重複解析檔案。

銀行資料 API 同時加入：

```http
Cache-Control: public, max-age=86400
```

### Google API 成本控制

Google Place 驗證主要於資料預處理階段完成，正式網站不會因每次開啟地圖而重新進行 Places Text Search。

## SEO

使用 `react-helmet-async` 管理：

- Title
- Meta Description
- Keywords
- Canonical URL
- Open Graph
- Twitter Card

Production Build 會額外產生每間分行的靜態 HTML：

```text
分行靜態頁面：4,554
網站總頁面數：4,555
```

並建立：

```text
robots.txt
sitemap.xml
```

一般分行網址：

```text
/{bank_code}/{branch_code}/{bank_name}-{branch_name}.html
```

沒有分行代碼的代表人辦事處使用：

```text
/{bank_code}/{bank_name}-{branch_name}.html
```

前端另外提供自訂 Not Found 頁面；未知網址的 HTTP Status 目前仍受 Zeabur Static Hosting 的 SPA fallback 行為影響。

## 資料處理

目前資料：

```text
銀行：98 家
分行：4,554 筆
可信 Google Place ID：2,959 筆
官方地址 fallback：1,595 筆
```

Google Place 僅在能安全確認銀行身分時採用；無法確認時保留官方地址，避免錯誤綁定其他銀行、ATM 或錯誤位置。

## API

### 銀行列表

```http
GET /banks/
```

### 指定銀行分行

```http
GET /banks/{bank_code}/branches/
```

### 分行詳細資料

```http
GET /{bank_code}/{branch_code}/
```

### 附近分行

```http
GET /branches/nearby/?lat={latitude}&lng={longitude}&limit=10&radius=10
```

## 技術

### Frontend

- React
- JavaScript
- Vite
- React Router
- Tailwind CSS
- Axios
- React Helmet Async
- Google Maps JavaScript API
- Browser Geolocation API

### Backend

- Python
- Django
- JSON
- Haversine Formula
- In-memory Cache

## Deployment

- Zeabur
- GitHub

Frontend：

```text
https://banksearchbysean.zeabur.app/
```

Backend：

```text
https://banksearch-backend.zeabur.app/
```
