import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import "./index.css";

// 靜態 HTML 的 SEO 標籤只提供給搜尋引擎與社群爬蟲
// React 啟動後移除，交由 react-helmet-async 管理目前頁面的 SEO
document.querySelectorAll("[data-static-seo]").forEach((element) => {
  element.remove();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
