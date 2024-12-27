import React, { useState, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

const BankMap = ({ address }) => {
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapStyles = {
    width: "100%",
    height: "400px",
  };

  const defaultCenter = {
    lat: 25.0338, // 台北市預設座標
    lng: 121.5646,
  };

  useEffect(() => {
    const getCoordinates = async () => {
      if (!address) return;

      try {
        setIsLoading(true);
        setError(null);
        const geocoder = new window.google.maps.Geocoder();

        const result = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK") {
              resolve(results[0]);
            } else {
              reject(new Error("無法找到該地址的確切位置"));
            }
          });
        });

        setCoordinates({
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getCoordinates();
  }, [address]);

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
        >
          {coordinates && (
            <Marker
              position={coordinates}
              animation={2}
            />
          )}
        </GoogleMap>
      </div>
      <p className="mt-2 text-sm text-gray-600">{address}</p>
    </div>
  );
};

export default BankMap;
