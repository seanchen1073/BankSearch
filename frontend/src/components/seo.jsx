import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "台灣銀行代碼查詢｜全台銀行分行代碼與地址查詢",
  description = "提供全台銀行代碼、分行名稱、地址與 Google 地圖位置查詢，快速查找銀行分行資訊。",
  keywords = "銀行代碼,銀行分行,銀行查詢,分行地址,台灣銀行代碼",
  image = "https://banksearchbysean.zeabur.app/og-image.png",
  url = "https://banksearchbysean.zeabur.app/",
}) => {
  return (
    <Helmet>
      {/* 基本 SEO */}
      <title>{title}</title>

      <meta name="description" content={description} />

      <meta name="keywords" content={keywords} />

      <meta name="author" content="台灣銀行代碼查詢系統" />

      {/* Open Graph / Facebook / LINE */}
      <meta property="og:type" content="website" />

      <meta property="og:title" content={title} />

      <meta property="og:description" content={description} />

      <meta property="og:url" content={url} />

      <meta property="og:image" content={image} />

      <meta property="og:image:width" content="1200" />

      <meta property="og:image:height" content="630" />

      <meta property="og:locale" content="zh_TW" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />

      <meta name="twitter:title" content={title} />

      <meta name="twitter:description" content={description} />

      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
