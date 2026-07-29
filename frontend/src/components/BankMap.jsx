import React, { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  clickableIcons: true,
};

const BankMap = ({ address }) => {
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isComponentMounted = true;

    const loadLocation = () => {
      setIsLoading(true);
      setErrorMessage("");
      setCoordinates(null);

      if (!address) {
        setErrorMessage("目前沒有可顯示的分行地址");
        setIsLoading(false);
        return;
      }

      if (typeof window === "undefined" || !window.google || !window.google.maps || !window.google.maps.Geocoder) {
        setErrorMessage("Google 地圖服務尚未完成載入");
        setIsLoading(false);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode(
        {
          address,
          region: "TW",
        },
        (results, status) => {
          if (!isComponentMounted) {
            return;
          }

          if (status === "OK" && results && results.length > 0) {
            const location = results[0].geometry.location;

            setCoordinates({
              lat: location.lat(),
              lng: location.lng(),
            });

            setErrorMessage("");
          } else {
            console.error("地址轉換座標失敗：", status);

            setErrorMessage("目前無法在地圖上找到這個地址");
          }

          setIsLoading(false);
        }
      );
    };

    loadLocation();

    return () => {
      isComponentMounted = false;
    };
  }, [address]);

  const handleOpenGoogleMaps = () => {
    if (!address) {
      return;
    }

    const query = coordinates ? `${coordinates.lat},${coordinates.lng}` : address;

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center bg-slate-100 sm:h-[380px] lg:h-full lg:min-h-[520px]">
        <div className="px-6 text-center">
          <span className="block w-10 h-10 mx-auto border-4 border-blue-100 rounded-full animate-spin border-t-blue-700" />

          <p className="mt-4 text-sm font-semibold text-slate-600">正在載入 Google 地圖…</p>

          <p className="mt-1 text-xs text-slate-400">正在搜尋分行所在位置</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !coordinates) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center bg-slate-100 px-5 sm:h-[380px] lg:h-full lg:min-h-[520px]">
        <div className="max-w-sm text-center">
          <span className="flex items-center justify-center mx-auto h-14 w-14 rounded-2xl bg-slate-200 text-slate-500">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />

              <circle cx="12" cy="10" r="2" />
            </svg>
          </span>

          <h3 className="mt-4 font-bold text-slate-800">地圖暫時無法顯示</h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">{errorMessage}</p>

          {address && (
            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m4 4 16 7-7 3-3 6-6-16Z" />
              </svg>
              改用 Google 地圖開啟
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[320px] w-full sm:h-[380px] lg:h-full lg:min-h-[520px]">
      <GoogleMap mapContainerClassName="h-full w-full" center={coordinates} zoom={16} options={mapOptions}>
        <Marker position={coordinates} title={address} onClick={handleOpenGoogleMaps} />
      </GoogleMap>

      <div className="absolute pointer-events-none left-4 right-4 top-4 sm:right-auto sm:max-w-sm">
        <div className="p-3 border shadow-lg rounded-xl border-white/80 bg-white/95 backdrop-blur">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-blue-700">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />

                <circle cx="12" cy="10" r="2" />
              </svg>
            </span>

            <p className="text-sm font-semibold leading-6 break-words text-slate-800">{address}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleOpenGoogleMaps}
        className="absolute bottom-4 right-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m4 4 16 7-7 3-3 6-6-16Z" />
        </svg>
        開啟地圖
      </button>
    </div>
  );
};

export default BankMap;
