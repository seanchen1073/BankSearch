import React, { useState, useEffect } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";

const BankMap = ({ address }) => {
    const [coordinates, setCoordinates] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addressCopied, setAddressCopied] = useState(false);
    const [map, setMap] = useState(null);

    const mapStyles = {
        width: "100%",
        height: "400px",
    };

    const defaultCenter = {
        lat: 25.0338,
        lng: 121.5646,
    };

    // 地址轉換為座標
    useEffect(() => {
        const getCoordinates = async () => {
        if (!address || !window.google) return;

        try {
            setIsLoading(true);
            setError(null);

            const geocoder = new window.google.maps.Geocoder();

            geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK") {
                const location = results[0].geometry.location;
                setCoordinates({
                lat: location.lat(),
                lng: location.lng(),
                });
            } else {
                setError("無法找到該地址的確切位置");
            }
            setIsLoading(false);
            });
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
        };

        getCoordinates();
    }, [address]);

    // 複製地址功能
    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address);
        setAddressCopied(true);
        setTimeout(() => {
        setAddressCopied(false);
        }, 2000);
    };

    const handleMarkerClick = () => {
        if (coordinates) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
        window.open(url, "_blank");
        }
    };

    const onLoad = React.useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, []);

    if (isLoading) {
        return (
        <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 rounded-md">
            <div className="text-gray-600">載入地圖中...</div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 rounded-md">
            <div className="text-red-600">{error}</div>
        </div>
        );
    }

    return (
        <div className="w-full mt-4">
        <h2 className="mb-2 text-xl font-semibold">分行位置</h2>
        <div className="w-full rounded-md overflow-hidden shadow-md">
            <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={17}
            center={coordinates || defaultCenter}
            options={{
                zoomControl: true,
                streetViewControl: true,
                mapTypeControl: true,
                fullscreenControl: true,
            }}
            onLoad={onLoad}
            onUnmount={onUnmount}
            >
            {coordinates && <MarkerF position={coordinates} onClick={handleMarkerClick} animation={window.google?.maps?.Animation?.DROP} />}
            </GoogleMap>
        </div>
        <section className="flex flex-col px-4 py-4 mt-4 border border-gray-700 border-dotted rounded primary bg-green-50">
            <div className="mt-4 flex items-center justify-start gap-2">
            <p className="text-sm text-gray-600">
                <span className="font-bold">詳細分行地址:</span> {address}
            </p>
            <button
                className="px-2 py-1 text-sm bg-blue-500 border-black rounded copy-btn hover:bg-blue-400 text-blue-50 btn"
                onClick={handleCopyAddress}
            >
                {addressCopied ? "已複製" : "複製地址"}
            </button>
            </div>
        </section>
        </div>
    );
};

export default BankMap;
