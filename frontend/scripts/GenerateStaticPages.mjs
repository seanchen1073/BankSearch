import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 先抓到目前這支腳本的位置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 找到 frontend 跟 dist 資料夾
const FRONTEND_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(FRONTEND_DIR, "dist");

// Build 完後會用到這兩支檔案
const INDEX_FILE = path.join(DIST_DIR, "index.html");
const SITEMAP_FILE = path.join(DIST_DIR, "sitemap.xml");

// 正式網站網址
const BASE_URL = "https://banksearchbysean.zeabur.app";

// 避免銀行名稱或分行名稱裡的特殊字元弄壞 HTML
const escapeHtml = (value = "") =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

// 沒有 index.html 代表前端還沒 Build
if (!fs.existsSync(INDEX_FILE)) {
  console.error("找不到 dist/index.html，請先執行 npm run build");
  process.exit(1);
}

// 沒有 sitemap 就不知道有哪些分行頁面要產生
if (!fs.existsSync(SITEMAP_FILE)) {
  console.error("找不到 dist/sitemap.xml");
  process.exit(1);
}

// 把首頁 HTML 當成所有分行頁面的基礎模板
const template = fs.readFileSync(INDEX_FILE, "utf8");

// 讀取剛剛做好的完整 sitemap
const sitemap = fs.readFileSync(SITEMAP_FILE, "utf8");

// 把 sitemap 裡所有網址抓出來
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

// 首頁本來就有 index.html 所以只處理分行頁
const branchUrls = urls.filter((url) => url !== `${BASE_URL}/`);

let generatedCount = 0;

// 一筆一筆建立分行 HTML
for (const pageUrl of branchUrls) {
  const parsedUrl = new URL(pageUrl);

  // 把網址拆成銀行代碼 分行代碼 檔名
  const pathParts = parsedUrl.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));

  // 正常分行網址至少會有三個部分
  if (pathParts.length < 3) {
    console.warn(`略過無法解析的網址：${pageUrl}`);
    continue;
  }

  const bankCode = pathParts[0];
  const branchCode = pathParts[1];
  const filename = pathParts[2];

  // 把 .html 拿掉方便取得銀行跟分行名稱
  const pageName = filename.replace(/\.html$/i, "");

  // 網址格式是 銀行名稱-分行名稱.html
  const separatorIndex = pageName.indexOf("-");

  // 找不到分隔符號就先跳過避免產生錯誤頁面
  if (separatorIndex === -1) {
    console.warn(`略過無法解析銀行與分行名稱的網址：${pageUrl}`);
    continue;
  }

  const bankName = pageName.slice(0, separatorIndex);
  const branchName = pageName.slice(separatorIndex + 1);

  // 每一個分行都建立自己的 SEO 標題
  const title = `${bankName}${branchName}｜分行代碼 ${branchCode}｜銀行代碼查詢`;

  // 每一個分行都建立自己的 SEO 描述
  const description = `查詢${bankName}${branchName}資訊，` + `銀行代碼 ${bankCode}、分行代碼 ${branchCode}，` + `並提供地址、電話與 Google 地圖位置`;

  // 建立分行專屬搜尋關鍵字
  const keywords = `${bankName},${branchName},${bankName}${branchName},` + `${bankCode},${branchCode},銀行代碼,分行代碼,銀行地址`;

  // 每一頁都先複製首頁 HTML
  let html = template;

  // 換成這個分行自己的頁面標題
  html = html.replace(/<title[^>]*data-static-seo[^>]*>[\s\S]*?<\/title>/i, `<title data-static-seo>${escapeHtml(title)}</title>`);

  // 換成這個分行自己的 description
  html = html.replace(
    /<meta[^>]*data-static-seo[^>]*name="description"[^>]*>/i,
    `<meta data-static-seo name="description" content="${escapeHtml(description)}" />`
  );

  // 換成這個分行自己的 keywords
  html = html.replace(
    /<meta[^>]*data-static-seo[^>]*name="keywords"[^>]*>/i,
    `<meta data-static-seo name="keywords" content="${escapeHtml(keywords)}" />`
  );

  // Open Graph 標題也換成目前分行
  html = html.replace(
    /<meta[^>]*data-static-seo[^>]*property="og:title"[^>]*>/i,
    `<meta data-static-seo property="og:title" content="${escapeHtml(title)}" />`
  );

  // Open Graph 描述也換成目前分行
  html = html.replace(
    /<meta[^>]*data-static-seo[^>]*property="og:description"[^>]*>/i,
    `<meta data-static-seo property="og:description" content="${escapeHtml(description)}" />`
  );

  // Open Graph 網址改成目前分行的網址
  html = html.replace(
    /<meta[^>]*data-static-seo[^>]*property="og:url"[^>]*>/i,
    `<meta data-static-seo property="og:url" content="${escapeHtml(pageUrl)}" />`
  );

  // Twitter 標題也換成目前分行
  html = html.replace(
    /<meta[^>]*data-static-seo[^>]*name="twitter:title"[^>]*>/i,
    `<meta data-static-seo name="twitter:title" content="${escapeHtml(title)}" />`
  );

  // Twitter 描述也換成目前分行
  html = html.replace(
    /<meta[^>]*data-static-seo[^>]*name="twitter:description"[^>]*>/i,
    `<meta data-static-seo name="twitter:description" content="${escapeHtml(description)}" />`
  );

  // Canonical 一定要指向目前這個分行自己的正式網址
  html = html.replace(
    /<link[^>]*data-static-seo[^>]*rel="canonical"[^>]*>/i,
    `<link data-static-seo rel="canonical" href="${escapeHtml(pageUrl)}" />`
  );

  // 先塞一份搜尋引擎不用執行 React 就能看到的基本內容
  const staticContent = `
    <main>
      <h1>${escapeHtml(bankName)} ${escapeHtml(branchName)}</h1>

      <p>
        銀行代碼：${escapeHtml(bankCode)}
      </p>

      <p>
        分行代碼：${escapeHtml(branchCode)}
      </p>

      <p>
        查詢${escapeHtml(bankName)}${escapeHtml(branchName)}的銀行代碼、分行資訊、地址、電話與 Google 地圖位置
      </p>
    </main>
  `;

  // 把靜態內容先放進 React 的 root 裡
  html = html.replace('<div id="root"></div>', `<div id="root">${staticContent}</div>`);

  // 每個銀行跟分行都建立自己的資料夾
  const outputDirectory = path.join(DIST_DIR, bankCode, branchCode);

  fs.mkdirSync(outputDirectory, {
    recursive: true,
  });

  // 最後把實體 HTML 寫進對應資料夾
  const outputFile = path.join(outputDirectory, filename);

  fs.writeFileSync(outputFile, html, "utf8");

  generatedCount++;
}

// Build 完後直接顯示總共產生多少頁
console.log("");
console.log("靜態分行頁面產生完成");
console.log(`分行頁面：${generatedCount}`);
console.log(`總頁面數：${generatedCount + 1}`);
console.log("");
