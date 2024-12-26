import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const [countdown, setCountdown] = useState(3); // 設置倒數初始值
    const navigate = useNavigate();

    useEffect(() => {
        if (countdown === 0) {
        navigate("/"); // 倒數結束後，導航到首頁
        }

        const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer); // 清理定時器
    }, [countdown, navigate]);

    return (
        <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">網址錯誤！</h1>
        <p>系統將在 {countdown} 秒後導回首頁</p>
        </div>
    );
};

export default NotFoundPage;
