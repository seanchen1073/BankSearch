import React, { useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  clickableIcons: true,
};

// 將經緯度轉成 Google 地圖格式
const createCoordinates = (latitude, longitude) => {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  const isValidLatitude = Number.isFinite(parsedLatitude) && parsedLatitude >= -90 && parsedLatitude <= 90;

  const isValidLongitude = Number.isFinite(parsedLongitude) && parsedLongitude >= -180 && parsedLongitude <= 180;

  if (!isValidLatitude || !isValidLongitude) {
    return null;
  }

  return {
    lat: parsedLatitude,
    lng: parsedLongitude,
  };
};

const BankMap = ({ address, latitude, longitude, selectedBranch, userLocation, nearbyBranches = [], isNearbySearch = false }) => {
  const [coordinates, setCoordinates] = useState(null);

  const [mapInstance, setMapInstance] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  // 讀取後端提供的分行座標
  const backendCoordinates = useMemo(() => createCoordinates(latitude, longitude), [latitude, longitude]);

  // 讀取使用者目前位置
  const validUserLocation = useMemo(() => createCoordinates(userLocation?.lat, userLocation?.lng), [userLocation]);

  // 過濾具有有效座標的附近分行
  const validNearbyBranches = useMemo(() => {
    if (!Array.isArray(nearbyBranches)) {
      return [];
    }

    return nearbyBranches
      .map((branch) => {
        const branchCoordinates = createCoordinates(branch.latitude, branch.longitude);

        if (!branchCoordinates) {
          return null;
        }

        return {
          ...branch,
          coordinates: branchCoordinates,
        };
      })
      .filter(Boolean);
  }, [nearbyBranches]);

  // 優先使用後端座標
  // 沒有座標時才使用地址轉換
  useEffect(() => {
    let isComponentMounted = true;

    const loadLocation = () => {
      setIsLoading(true);
      setErrorMessage("");
      setCoordinates(null);

      // 後端已有座標時不再呼叫 Geocoder
      if (backendCoordinates) {
        setCoordinates(backendCoordinates);
        setIsLoading(false);
        return;
      }

      if (!address) {
        setErrorMessage("目前沒有可顯示的分行地址");

        setIsLoading(false);
        return;
      }

      const googleMapsReady = typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.Geocoder;

      if (!googleMapsReady) {
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
            console.error("地址轉換座標失敗", status);

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
  }, [address, backendCoordinates]);

  // 附近分行模式自動調整地圖範圍
  useEffect(() => {
    if (!mapInstance || !coordinates || !window.google?.maps) {
      return;
    }

    if (!isNearbySearch) {
      mapInstance.panTo(coordinates);
      mapInstance.setZoom(16);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    let markerCount = 0;

    if (validUserLocation) {
      bounds.extend(validUserLocation);
      markerCount += 1;
    }

    validNearbyBranches.forEach((branch) => {
      bounds.extend(branch.coordinates);
      markerCount += 1;
    });

    // 確保目前選取的分行一定在範圍內
    bounds.extend(coordinates);

    if (markerCount > 0) {
      mapInstance.fitBounds(bounds, 60);
    }

    // 只有一個位置時維持一般分行縮放
    if (markerCount <= 1) {
      mapInstance.setZoom(16);
    }
  }, [mapInstance, coordinates, isNearbySearch, validUserLocation, validNearbyBranches]);

  // 產生 Google 地圖網址
  const createGoogleMapsUrl = (targetCoordinates, targetAddress) => {
    const query = targetCoordinates ? `${targetCoordinates.lat},${targetCoordinates.lng}` : targetAddress;

    if (!query) {
      return null;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // 開啟目前選取的分行
  const handleOpenGoogleMaps = () => {
    const googleMapsUrl = createGoogleMapsUrl(coordinates, address);

    if (!googleMapsUrl) {
      return;
    }

    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  // 開啟指定的附近分行
  const handleOpenNearbyBranch = (branch) => {
    const googleMapsUrl = createGoogleMapsUrl(branch.coordinates, branch.address);

    if (!googleMapsUrl) {
      return;
    }

    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  // 判斷是否為目前選取的分行
  const isSelectedNearbyBranch = (branch) => {
    if (!selectedBranch) {
      return false;
    }

    return branch.code === selectedBranch.code && (!branch.bank_code || !selectedBranch.bank_code || branch.bank_code === selectedBranch.bank_code);
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

          {(address || backendCoordinates) && (
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
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={coordinates}
        zoom={16}
        options={mapOptions}
        onLoad={(map) => setMapInstance(map)}
        onUnmount={() => setMapInstance(null)}
      >
        {/* 一般搜尋只顯示目前分行 */}
        {!isNearbySearch && <Marker position={coordinates} title={selectedBranch?.name || address || "分行位置"} onClick={handleOpenGoogleMaps} />}

        {/* 附近搜尋顯示使用者位置 */}
        {isNearbySearch && validUserLocation && (
          <Marker
            position={validUserLocation}
            title="你目前的位置"
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        )}

        {/* 附近搜尋顯示最近分行 */}
        {isNearbySearch &&
          validNearbyBranches.map((branch) => {
            const isSelected = isSelectedNearbyBranch(branch);

            return (
              <Marker
                key={`${branch.bank_code || "bank"}-${branch.code}`}
                position={branch.coordinates}
                title={`${branch.bank_name || ""} ${branch.name || ""}`.trim()}
                zIndex={isSelected ? 10 : 1}
                icon={
                  isSelected
                    ? undefined
                    : {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: "#2563eb",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                      }
                }
                onClick={() => handleOpenNearbyBranch(branch)}
              />
            );
          })}

        {/* 附近清單缺少目前分行時補上標記 */}
        {isNearbySearch && !validNearbyBranches.some(isSelectedNearbyBranch) && (
          <Marker position={coordinates} title={selectedBranch?.name || address || "目前選取的分行"} zIndex={10} onClick={handleOpenGoogleMaps} />
        )}
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

            <div>
              {isNearbySearch && <p className="mb-1 text-xs font-bold text-emerald-700">附近分行搜尋結果</p>}

              <p className="text-sm font-semibold leading-6 break-words text-slate-800">{address || selectedBranch?.name || "目前選取的分行"}</p>
            </div>
          </div>
        </div>
      </div>

      {isNearbySearch && (
        <div className="absolute pointer-events-none left-4 bottom-4">
          <div className="px-3 py-2 text-xs font-bold border shadow-lg rounded-xl border-white/80 bg-white/95 text-slate-700 backdrop-blur">
            綠色圓點是你的位置
          </div>
        </div>
      )}

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
