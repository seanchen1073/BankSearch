import React, { useEffect, useMemo, useState } from "react";
import { CircleF, GoogleMap, MarkerF } from "@react-google-maps/api";

import { resolveGooglePlace } from "./BankGetApi.jsx";

const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  clickableIcons: true,
};

// 將經緯度轉成 Google 地圖格式
const createCoordinates = (latitude, longitude) => {
  // 避免空字串或 null 被 Number 轉成 0
  if (latitude === null || latitude === undefined || latitude === "" || longitude === null || longitude === undefined || longitude === "") {
    return null;
  }

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

// 把完整地址整理成 Google 地圖比較容易找到的門牌
const cleanNavigationAddress = (address) => {
  const addressText = String(address || "").trim();

  if (!addressText) {
    return "";
  }

  const normalizedAddress = addressText.replace("臺", "台").replace(/\s+/g, "");

  const addressMatch = normalizedAddress.match(/^(.+?號(?:之\d+)?)/);

  return addressMatch ? addressMatch[1] : normalizedAddress;
};

const BankMap = ({ address, latitude, longitude, bankCode, bankName, selectedBranch, userLocation, nearbyBranches = [], isNearbySearch = false }) => {
  const [coordinates, setCoordinates] = useState(null);

  const [mapInstance, setMapInstance] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  // 記錄 Google 地圖是不是正在準備
  const [isOpeningGoogleMaps, setIsOpeningGoogleMaps] = useState(false);

  // 讀取目前分行的後端座標
  const backendCoordinates = useMemo(() => createCoordinates(latitude, longitude), [latitude, longitude]);

  // 讀取使用者目前位置
  const validUserLocation = useMemo(() => createCoordinates(userLocation?.lat, userLocation?.lng), [userLocation?.lat, userLocation?.lng]);

  // 整理附近分行座標
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

  // 其他附近分行不包含目前選取分行
  const otherNearbyBranches = useMemo(
    () =>
      validNearbyBranches.filter((branch) => {
        if (!selectedBranch) {
          return true;
        }

        const sameBranchCode = String(branch.code || "") === String(selectedBranch.code || "");

        const sameBranchName = String(branch.name || "") === String(selectedBranch.name || "");

        const sameBankCode = !branch.bank_code || !selectedBranch.bank_code || String(branch.bank_code) === String(selectedBranch.bank_code);

        return !(sameBranchCode && sameBranchName && sameBankCode);
      }),
    [validNearbyBranches, selectedBranch]
  );

  // 優先使用後端座標
  // 沒有座標時才使用地址轉換
  useEffect(() => {
    let isComponentMounted = true;

    const loadLocation = () => {
      setIsLoading(true);
      setErrorMessage("");
      setCoordinates(null);

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

  // 控制一般搜尋與附近搜尋的地圖範圍
  useEffect(() => {
    if (!mapInstance || !coordinates || !window.google?.maps) {
      return undefined;
    }

    // 一般搜尋固定顯示目前分行
    if (!isNearbySearch) {
      mapInstance.panTo(coordinates);

      mapInstance.setZoom(16);

      return undefined;
    }

    // 附近搜尋沒有目前位置時顯示最近分行
    if (!validUserLocation) {
      mapInstance.panTo(coordinates);

      mapInstance.setZoom(15);

      return undefined;
    }

    const bounds = new window.google.maps.LatLngBounds();

    // 加入使用者目前位置
    bounds.extend(validUserLocation);

    // 加入最近分行
    bounds.extend(coordinates);

    // 加入其他附近分行
    validNearbyBranches.forEach((branch) => {
      bounds.extend(branch.coordinates);
    });

    const isMobile = window.innerWidth < 768;

    mapInstance.fitBounds(bounds, {
      top: isMobile ? 40 : 100,
      right: isMobile ? 30 : 70,
      bottom: isMobile ? 80 : 100,
      left: isMobile ? 30 : 70,
    });

    const listener = window.google.maps.event.addListenerOnce(mapInstance, "idle", () => {
      const currentZoom = mapInstance.getZoom();

      if (isMobile && currentZoom && currentZoom < 15) {
        mapInstance.setZoom(15);
      }

      if (!isMobile && currentZoom && currentZoom > 15) {
        mapInstance.setZoom(15);
      }
    });

    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [mapInstance, coordinates, isNearbySearch, validUserLocation, validNearbyBranches]);

  // 組合分行名稱
  const createBranchDisplayName = (branch, fallbackBankName = "") => {
    if (!branch) {
      return "";
    }

    const resolvedBankName = branch.bank_name || fallbackBankName;

    return [resolvedBankName, branch.name].filter(Boolean).join(" ");
  };

  // 查目前分行對應的 Google Place
  // 只有真的要開地圖時才會呼叫後端
  const resolveBranchPlace = async (branch, fallbackBankCode = "") => {
    if (!branch) {
      return null;
    }

    const resolvedBankCode = String(branch.bank_code || fallbackBankCode || "").trim();
    const resolvedBranchCode = String(branch.code || "").trim();
    const resolvedBranchName = String(branch.name || "").trim();

    if (!resolvedBankCode || (!resolvedBranchCode && !resolvedBranchName)) {
      return null;
    }

    return resolveGooglePlace(resolvedBankCode, resolvedBranchCode, resolvedBranchName);
  };

  // 產生 Google 地圖位置網址
  const createGoogleMapsUrl = (branchName, branchAddress, targetCoordinates, placeResult = null) => {
    const placeId = String(placeResult?.place_id || "").trim();
    const googleName = String(placeResult?.google_name || "").trim();
    const resolvedNavigationAddress = String(placeResult?.navigation_address || "").trim();

    const navigationAddress = resolvedNavigationAddress || cleanNavigationAddress(branchAddress);

    const coordinateQuery = targetCoordinates ? `${targetCoordinates.lat},${targetCoordinates.lng}` : "";

    // 有正式 Place ID 時直接開 Google 的地點
    if (placeId) {
      const placeQuery = googleName || navigationAddress || branchName || coordinateQuery;

      if (!placeQuery) {
        return null;
      }

      return (
        "https://www.google.com/maps/search/" +
        "?api=1" +
        `&query=${encodeURIComponent(placeQuery)}` +
        `&query_place_id=${encodeURIComponent(placeId)}`
      );
    }

    // 沒有 Place ID 時先用門牌地址
    // 地址也沒有時才使用座標
    const query = navigationAddress || coordinateQuery || branchName;

    if (!query) {
      return null;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // 產生 Google 地圖導航網址
  const createGoogleDirectionsUrl = (origin, destinationName, destinationAddress, targetCoordinates, placeResult = null) => {
    if (!origin) {
      return null;
    }

    const originValue = `${origin.lat},${origin.lng}`;

    const placeId = String(placeResult?.place_id || "").trim();
    const googleName = String(placeResult?.google_name || "").trim();
    const resolvedNavigationAddress = String(placeResult?.navigation_address || "").trim();

    const navigationAddress = resolvedNavigationAddress || cleanNavigationAddress(destinationAddress);

    const coordinateDestination = targetCoordinates ? `${targetCoordinates.lat},${targetCoordinates.lng}` : "";

    // 有正式 Place ID 時直接指定 Google 的目的地
    if (placeId) {
      const placeDestination = googleName || navigationAddress || destinationName || coordinateDestination;

      if (!placeDestination) {
        return null;
      }

      return (
        "https://www.google.com/maps/dir/" +
        "?api=1" +
        `&origin=${encodeURIComponent(originValue)}` +
        `&destination=${encodeURIComponent(placeDestination)}` +
        `&destination_place_id=${encodeURIComponent(placeId)}` +
        "&travelmode=driving"
      );
    }

    // 沒有 Place ID 時先用門牌地址
    // 地址也沒有時才使用座標
    const destinationValue = navigationAddress || coordinateDestination || destinationName;

    if (!destinationValue) {
      return null;
    }

    return (
      "https://www.google.com/maps/dir/" +
      "?api=1" +
      `&origin=${encodeURIComponent(originValue)}` +
      `&destination=${encodeURIComponent(destinationValue)}` +
      "&travelmode=driving"
    );
  };

  // 開啟目前分行或開始導航
  // 按下按鈕後才會查 Google Place
  const handleOpenGoogleMaps = async () => {
    if (isOpeningGoogleMaps) {
      return;
    }

    setIsOpeningGoogleMaps(true);

    const mapWindow = window.open("about:blank", "_blank");

    if (mapWindow) {
      mapWindow.opener = null;
    }

    try {
      const branchDisplayName = createBranchDisplayName(selectedBranch, bankName);

      const placeResult = await resolveBranchPlace(selectedBranch, bankCode);

      let googleMapsUrl = null;

      // 附近模式直接開啟導航
      if (isNearbySearch && validUserLocation) {
        googleMapsUrl = createGoogleDirectionsUrl(validUserLocation, branchDisplayName, address, coordinates, placeResult);
      } else {
        googleMapsUrl = createGoogleMapsUrl(branchDisplayName, address, coordinates, placeResult);
      }

      if (!googleMapsUrl) {
        if (mapWindow && !mapWindow.closed) {
          mapWindow.close();
        }

        return;
      }

      if (mapWindow && !mapWindow.closed) {
        mapWindow.location.href = googleMapsUrl;
        return;
      }

      window.location.href = googleMapsUrl;
    } catch (error) {
      console.error("開啟 Google 地圖失敗", error);

      const branchDisplayName = createBranchDisplayName(selectedBranch, bankName);

      const fallbackGoogleMapsUrl =
        isNearbySearch && validUserLocation
          ? createGoogleDirectionsUrl(validUserLocation, branchDisplayName, address, coordinates)
          : createGoogleMapsUrl(branchDisplayName, address, coordinates);

      if (!fallbackGoogleMapsUrl) {
        if (mapWindow && !mapWindow.closed) {
          mapWindow.close();
        }

        return;
      }

      if (mapWindow && !mapWindow.closed) {
        mapWindow.location.href = fallbackGoogleMapsUrl;
        return;
      }

      window.location.href = fallbackGoogleMapsUrl;
    } finally {
      setIsOpeningGoogleMaps(false);
    }
  };

  // 開啟其他附近分行
  // 這裡維持原本直接開地圖的方式
  const handleOpenNearbyBranch = (branch) => {
    const branchDisplayName = createBranchDisplayName(branch);

    const googleMapsUrl = createGoogleMapsUrl(branchDisplayName, branch.address, branch.coordinates);

    if (!googleMapsUrl) {
      return;
    }

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

          {(address || backendCoordinates) && (
            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              disabled={isOpeningGoogleMaps}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:bg-blue-600"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m4 4 16 7-7 3-3 6-6-16Z" />
              </svg>
              {isOpeningGoogleMaps ? "正在開啟 Google 地圖" : "改用 Google 地圖開啟"}
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
        center={isNearbySearch && validUserLocation ? validUserLocation : coordinates}
        zoom={isNearbySearch ? 14 : 16}
        options={mapOptions}
        onLoad={(map) => setMapInstance(map)}
        onUnmount={() => setMapInstance(null)}
      >
        {/* 一般搜尋顯示目前分行 */}
        {!isNearbySearch && (
          <MarkerF
            position={coordinates}
            title={createBranchDisplayName(selectedBranch, bankName) || address || "分行位置"}
            zIndex={100}
            onClick={handleOpenGoogleMaps}
          />
        )}

        {/* 附近搜尋顯示最近分行 */}
        {isNearbySearch && (
          <MarkerF
            position={coordinates}
            title={createBranchDisplayName(selectedBranch, bankName) || address || "最近分行"}
            zIndex={1000}
            onClick={handleOpenGoogleMaps}
          />
        )}

        {/* 附近搜尋顯示目前位置 */}
        {isNearbySearch && validUserLocation && (
          <CircleF
            center={validUserLocation}
            radius={55}
            options={{
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeOpacity: 1,
              strokeWeight: 4,
              clickable: false,
              zIndex: 900,
            }}
          />
        )}

        {/* 附近搜尋顯示其他分行 */}
        {isNearbySearch &&
          otherNearbyBranches.map((branch) => (
            <CircleF
              key={`${branch.bank_code || "bank"}-${branch.code || "no-code"}-${
                branch.name || `${branch.coordinates.lat}-${branch.coordinates.lng}`
              }`}
              center={branch.coordinates}
              radius={45}
              options={{
                fillColor: "#2563eb",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeOpacity: 1,
                strokeWeight: 3,
                clickable: true,
                zIndex: 500,
              }}
              onClick={() => handleOpenNearbyBranch(branch)}
            />
          ))}
      </GoogleMap>

      {/* 地圖左上角資訊 */}
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
              {isNearbySearch && <p className="mb-1 text-xs font-bold text-emerald-700">距離最近的分行</p>}

              <p className="text-sm font-semibold leading-6 break-words text-slate-800">{address || selectedBranch?.name || "目前選取的分行"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 附近搜尋圖例 */}
      {isNearbySearch && (
        <div className="absolute left-4 bottom-4 pointer-events-none">
          <div className="px-3 py-2 text-xs font-semibold border shadow-lg rounded-xl border-white/80 bg-white/95 text-slate-700 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600 border-2 border-white rounded-full shadow" />

              <span>你的位置</span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow" />

              <span>最近分行</span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow" />

              <span>其他附近分行</span>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpenGoogleMaps}
        disabled={isOpeningGoogleMaps}
        className="absolute bottom-4 right-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:bg-blue-600"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m4 4 16 7-7 3-3 6-6-16Z" />
        </svg>

        {isOpeningGoogleMaps ? (isNearbySearch ? "正在準備導航" : "正在開啟地圖") : isNearbySearch ? "開始導航" : "開啟地圖"}
      </button>
    </div>
  );
};

export default BankMap;
