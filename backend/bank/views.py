import heapq
import json
import math
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET


# bank_data.json 與 views.py 位於同一個 bank 資料夾
DATA_FILE_PATH = Path(__file__).resolve().parent / "bank_data.json"


# Google Places Text Search API
PLACES_TEXT_SEARCH_URL = (
    "https://places.googleapis.com/v1/places:searchText"
)


# Places 查過一次就先記住結果
# 同一間分行再次開地圖時就不用再打 Google
_PLACE_RESOLVE_CACHE = {}


# 將 JSON 資料暫存在伺服器記憶體中
# 避免每次 API 請求都重新讀取並解析完整 JSON
_BANK_DATA_CACHE = {
    "modified_time_ns": None,
    "banks": [],
    "bank_by_code": {},
    "geocoded_branches": [],
}


def parse_float(value):
    """
    嘗試把資料轉換成浮點數

    無法轉換或資料為空時回傳 None
    避免某一筆錯誤座標造成整支 API 失敗
    """
    try:
        if value in (None, ""):
            return None

        return float(value)
    except (TypeError, ValueError):
        return None


def load_bank_data():
    """
    載入 bank_data.json 並建立快取

    當 JSON 檔案沒有變更時直接使用記憶體中的資料
    如果 JSON 的修改時間改變則自動重新讀取檔案

    回傳內容包含
    1 banks 完整銀行資料
    2 bank_by_code 依銀行代碼建立的快速查詢字典
    3 geocoded_branches 已經有經緯度的分行平面清單
    """
    modified_time_ns = DATA_FILE_PATH.stat().st_mtime_ns

    # 檔案沒有變更時直接使用現有快取
    if (
        _BANK_DATA_CACHE["modified_time_ns"] == modified_time_ns
        and _BANK_DATA_CACHE["banks"]
    ):
        return _BANK_DATA_CACHE

    with open(DATA_FILE_PATH, "r", encoding="utf-8") as file:
        raw_data = json.load(file)

    # 銀行資料有更新時就把舊的 Places 結果清掉
    _PLACE_RESOLVE_CACHE.clear()

    banks = raw_data.get("banks", [])

    if not isinstance(banks, list):
        raise ValueError("bank_data.json 的 banks 必須是陣列")

    bank_by_code = {}
    geocoded_branches = []

    for bank in banks:
        bank_code = str(bank.get("code", "")).strip()
        bank_name = str(bank.get("name", "")).strip()

        if not bank_code:
            continue

        # 建立銀行代碼索引讓後續查詢可以直接取得銀行
        bank_by_code[bank_code] = bank

        branches = bank.get("branches", [])

        if not isinstance(branches, list):
            continue

        for branch in branches:
            latitude = parse_float(branch.get("latitude"))
            longitude = parse_float(branch.get("longitude"))

            # 附近分行功能只使用已經具有經緯度的資料
            if latitude is None or longitude is None:
                continue

            geocoded_branches.append(
                {
                    "bank_code": bank_code,
                    "bank_name": bank_name,
                    "code": branch.get("code"),
                    "name": branch.get("name"),
                    "address": branch.get("address"),
                    "tel": branch.get("tel"),
                    "latitude": latitude,
                    "longitude": longitude,
                }
            )

    # 更新伺服器記憶體中的快取
    _BANK_DATA_CACHE.update(
        {
            "modified_time_ns": modified_time_ns,
            "banks": banks,
            "bank_by_code": bank_by_code,
            "geocoded_branches": geocoded_branches,
        }
    )

    return _BANK_DATA_CACHE


def create_data_error_response(error):
    """
    統一處理 JSON 檔案不存在與格式錯誤等問題
    """
    if isinstance(error, FileNotFoundError):
        return JsonResponse(
            {"error": "銀行資料文件未找到"},
            status=500,
        )

    if isinstance(error, json.JSONDecodeError):
        return JsonResponse(
            {"error": "銀行資料 JSON 格式錯誤"},
            status=500,
        )

    return JsonResponse(
        {"error": "銀行資料載入失敗"},
        status=500,
    )


def add_public_cache_header(response, max_age=86400):
    """
    靜態銀行資料不會頻繁更新
    允許瀏覽器在指定秒數內使用快取

    預設 86400 秒也就是 24 小時
    """
    response["Cache-Control"] = f"public, max-age={max_age}"
    return response


def find_branch(bank, branch_code):
    """
    在指定銀行中尋找分行
    """
    for branch in bank.get("branches", []):
        if str(branch.get("code", "")) == str(branch_code):
            return branch

    return None


def build_branch_detail(bank, branch):
    """
    將銀行與分行資料整理成統一的 API 回傳格式
    """
    result = {
        "bank_name": bank.get("name"),
        "bank_code": bank.get("code"),
        "branch_name": branch.get("name"),
        "branch_code": branch.get("code"),
        "address": branch.get("address"),
        "tel": branch.get("tel"),
    }

    latitude = parse_float(branch.get("latitude"))
    longitude = parse_float(branch.get("longitude"))

    # 已有經緯度時才回傳避免輸出無效值
    if latitude is not None and longitude is not None:
        result["latitude"] = latitude
        result["longitude"] = longitude

    return result


def haversine_distance_meters(
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
):
    """
    使用 Haversine 公式計算兩個經緯度之間的直線距離

    回傳單位為公尺
    這是地球表面的近似直線距離不是實際道路距離
    """
    earth_radius_meters = 6371000

    start_latitude_radians = math.radians(start_latitude)
    end_latitude_radians = math.radians(end_latitude)

    latitude_difference = math.radians(
        end_latitude - start_latitude
    )

    longitude_difference = math.radians(
        end_longitude - start_longitude
    )

    haversine_value = (
        math.sin(latitude_difference / 2) ** 2
        + math.cos(start_latitude_radians)
        * math.cos(end_latitude_radians)
        * math.sin(longitude_difference / 2) ** 2
    )

    central_angle = 2 * math.atan2(
        math.sqrt(haversine_value),
        math.sqrt(1 - haversine_value),
    )

    return earth_radius_meters * central_angle


def normalize_place_name(value):
    """
    把銀行名稱整理成比較好比對的格式

    這裡只拿來判斷 Google 找到的地點是不是同一家銀行
    不會改到畫面上真正顯示的名稱
    """
    text = str(value or "").strip().lower()
    text = text.replace("臺", "台")

    removable_words = [
        "金融控股股份有限公司",
        "商業銀行股份有限公司",
        "銀行股份有限公司",
        "股份有限公司",
        "商業銀行",
        "有限公司",
        "代表人辦事處",
        "代表處",
        "辦事處",
        "營業部",
        "總行",
        "分行",
        "銀行",
    ]

    for word in removable_words:
        text = text.replace(word, "")

    return re.sub(
        r"[^0-9a-z\u4e00-\u9fff]",
        "",
        text,
    )


def clean_navigation_address(address):
    """
    把完整地址整理成 Google 地圖比較容易找到的門牌

    原本完整地址還是會保留
    這個結果只拿來開啟 Google 地圖
    """
    address_text = str(address or "").strip()

    if not address_text:
        return ""

    address_text = address_text.replace("臺", "台")
    address_text = re.sub(r"\s+", "", address_text)

    address_match = re.match(
        r"^(.+?號(?:之\d+)?)",
        address_text,
    )

    if address_match:
        return address_match.group(1).strip()

    return address_text


def extract_street_address_key(address):
    """
    把地址裡的道路和門牌抓出來

    這樣 Google 地址多了郵遞區號也還是能正常比對
    """
    address_text = str(address or "").strip()

    if not address_text:
        return ""

    address_text = address_text.replace("臺", "台")
    address_text = re.sub(r"\s+", "", address_text)

    address_match = re.search(
        (
            r"([^縣市區鄉鎮村里]{1,20}"
            r"(?:大道|路|街)"
            r"[^號]{0,30}號(?:之\d+)?)"
        ),
        address_text,
    )

    if not address_match:
        return ""

    return address_match.group(1)


def build_place_fallback(branch, reason):
    """
    Google 沒有找到可信地點時就回到自己的官方資料

    前端之後會優先拿整理過的地址開 Google 地圖
    地址也沒有時才會用經緯度
    """
    latitude = parse_float(branch.get("latitude"))
    longitude = parse_float(branch.get("longitude"))

    result = {
        "resolved": False,
        "place_id": "",
        "google_name": "",
        "google_address": "",
        "navigation_address": clean_navigation_address(
            branch.get("address")
        ),
        "reason": reason,
    }

    if latitude is not None:
        result["latitude"] = latitude

    if longitude is not None:
        result["longitude"] = longitude

    return result


def resolve_branch_google_place(bank, branch):
    """
    用 Google Places 找目前分行真正對應的 Google 地點

    Google 找到候選後還會再比銀行名稱
    地址和 Marker 距離也會一起檢查
    不夠確定時就不會硬綁到其他商家
    """
    bank_code = str(bank.get("code", "")).strip()
    branch_code = str(branch.get("code", "")).strip()
    branch_name = str(branch.get("name", "")).strip()
    address = str(branch.get("address", "")).strip()
    latitude = parse_float(branch.get("latitude"))
    longitude = parse_float(branch.get("longitude"))

    cache_key = (
        bank_code,
        branch_code,
        branch_name,
        address,
        latitude,
        longitude,
    )

    # 已經查過就直接用記憶體裡的結果
    if cache_key in _PLACE_RESOLVE_CACHE:
        return _PLACE_RESOLVE_CACHE[cache_key]

    api_key = getattr(
        settings,
        "GOOGLE_PLACES_API_KEY",
        "",
    )

    if not api_key:
        return build_place_fallback(
            branch,
            "places_key_missing",
        )

    bank_name = str(bank.get("name", "")).strip()
    navigation_address = clean_navigation_address(address)

    search_query = " ".join(
        part
        for part in [
            bank_name,
            branch_name,
            navigation_address,
        ]
        if part
    )

    if not search_query:
        result = build_place_fallback(
            branch,
            "missing_search_data",
        )
        _PLACE_RESOLVE_CACHE[cache_key] = result
        return result

    payload = {
        "textQuery": search_query,
        "languageCode": "zh-TW",
        "regionCode": "TW",
        "pageSize": 5,
    }

    # 有 Marker 時就讓 Google 優先找 Marker 附近
    # 最後還會自己算距離所以不會只相信 Google 排序
    if latitude is not None and longitude is not None:
        payload["locationBias"] = {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "radius": 300.0,
            }
        }

    request_body = json.dumps(
        payload
    ).encode("utf-8")

    places_request = Request(
        PLACES_TEXT_SEARCH_URL,
        data=request_body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": (
                "places.id,"
                "places.displayName,"
                "places.formattedAddress,"
                "places.location"
            ),
        },
    )

    try:
        with urlopen(
            places_request,
            timeout=5,
        ) as response:
            response_body = (
                response
                .read()
                .decode("utf-8")
            )
            places_data = json.loads(
                response_body
            )

    except HTTPError as error:
        print(
            "Google Places API HTTP 錯誤",
            error.code,
        )
        return build_place_fallback(
            branch,
            "places_unavailable",
        )

    except (
        URLError,
        TimeoutError,
        json.JSONDecodeError,
    ) as error:
        print(
            "Google Places API 查詢失敗",
            error,
        )
        return build_place_fallback(
            branch,
            "places_unavailable",
        )

    places = places_data.get("places", [])

    if not places:
        result = build_place_fallback(
            branch,
            "place_not_found",
        )
        _PLACE_RESOLVE_CACHE[cache_key] = result
        return result

    normalized_bank_name = normalize_place_name(
        bank_name
    )

    normalized_branch_name = normalize_place_name(
        branch_name
    )

    official_address_key = extract_street_address_key(
        navigation_address
    )

    best_place = None
    best_score = None

    for place in places:
        google_name = (
            place
            .get("displayName", {})
            .get("text", "")
        )

        google_address = place.get(
            "formattedAddress",
            "",
        )

        google_location = place.get(
            "location",
            {},
        )

        google_latitude = parse_float(
            google_location.get("latitude")
        )

        google_longitude = parse_float(
            google_location.get("longitude")
        )

        normalized_google_name = normalize_place_name(
            google_name
        )

        # Google 名稱至少要看得出是同一家銀行
        bank_name_matches = (
            bool(normalized_bank_name)
            and bool(normalized_google_name)
            and (
                normalized_bank_name
                in normalized_google_name
                or normalized_google_name
                in normalized_bank_name
            )
        )

        if not bank_name_matches:
            continue

        google_address_key = extract_street_address_key(
            google_address
        )

        address_matches = (
            bool(official_address_key)
            and bool(google_address_key)
            and (
                official_address_key
                in google_address_key
                or google_address_key
                in official_address_key
            )
        )

        branch_name_matches = (
            bool(normalized_branch_name)
            and normalized_branch_name
            in normalized_google_name
        )

        distance_meters = None

        if (
            latitude is not None
            and longitude is not None
            and google_latitude is not None
            and google_longitude is not None
        ):
            distance_meters = haversine_distance_meters(
                latitude,
                longitude,
                google_latitude,
                google_longitude,
            )

            # 距離自己的 Marker 太遠就直接不要
            if distance_meters > 250:
                continue

        # 門牌不同時只有非常靠近 Marker 才繼續考慮
        if (
            official_address_key
            and google_address_key
            and not address_matches
            and (
                distance_meters is None
                or distance_meters > 80
            )
        ):
            continue

        score = (
            distance_meters
            if distance_meters is not None
            else 1000
        )

        if address_matches:
            score -= 500

        if branch_name_matches:
            score -= 250

        if best_score is None or score < best_score:
            best_score = score
            best_place = place

    if best_place is None:
        result = build_place_fallback(
            branch,
            "place_not_confident",
        )
        _PLACE_RESOLVE_CACHE[cache_key] = result
        return result

    google_location = best_place.get(
        "location",
        {},
    )

    result = {
        "resolved": True,
        "place_id": best_place.get(
            "id",
            "",
        ),
        "google_name": (
            best_place
            .get("displayName", {})
            .get("text", "")
        ),
        "google_address": best_place.get(
            "formattedAddress",
            "",
        ),
        "navigation_address": navigation_address,
        "latitude": parse_float(
            google_location.get("latitude")
        ),
        "longitude": parse_float(
            google_location.get("longitude")
        ),
        "reason": "place_resolved",
    }

    _PLACE_RESOLVE_CACHE[cache_key] = result
    return result


@require_GET
def resolve_google_place(request):
    """
    找目前選取分行對應的 Google Place

    一般分行用 bank_code 和 branch_code
    沒有分行代碼時改用 bank_code 和 branch_name
    """
    bank_code = str(
        request.GET.get(
            "bank_code",
            "",
        )
    ).strip()

    branch_code = str(
        request.GET.get(
            "branch_code",
            "",
        )
    ).strip()

    branch_name = str(
        request.GET.get(
            "branch_name",
            "",
        )
    ).strip()

    if not bank_code:
        return JsonResponse(
            {
                "error": "缺少 bank_code"
            },
            status=400,
        )

    try:
        bank_data = load_bank_data()

        bank = bank_data[
            "bank_by_code"
        ].get(bank_code)

        if bank is None:
            return JsonResponse(
                {
                    "error": "銀行不存在"
                },
                status=404,
            )

        branch = None

        # 有分行代碼時只用分行代碼找
        if branch_code:
            branch = find_branch(
                bank,
                branch_code,
            )

        # 沒有分行代碼時才改用分行名稱找
        elif branch_name:
            branch = next(
                (
                    item
                    for item in bank.get(
                        "branches",
                        [],
                    )
                    if not str(
                        item.get(
                            "code",
                            "",
                        )
                    ).strip()
                    and str(
                        item.get(
                            "name",
                            "",
                        )
                    ).strip()
                    == branch_name
                ),
                None,
            )

        if branch is None:
            return JsonResponse(
                {
                    "error": "分行不存在"
                },
                status=404,
            )

        result = resolve_branch_google_place(
            bank,
            branch,
        )

        response = JsonResponse(result)

        # Google 暫時連不上時不要把錯誤結果留在瀏覽器
        if result.get("reason") in {
            "places_key_missing",
            "places_unavailable",
        }:
            response["Cache-Control"] = "no-store"
        else:
            # 查詢成功或確定找不到時一天內直接用瀏覽器快取
            response["Cache-Control"] = (
                "public, max-age=86400"
            )

        return response

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        ValueError,
        OSError,
    ) as error:
        return create_data_error_response(error)


@require_GET
def get_banks(request):
    """
    取得所有銀行基本清單

    只回傳銀行代碼與名稱
    不再把 4554 間分行全部放進首頁 API
    """
    try:
        bank_data = load_bank_data()

        bank_list = [
            {
                "code": bank.get("code"),
                "name": bank.get("name"),
            }
            for bank in bank_data["banks"]
        ]

        response = JsonResponse(
            bank_list,
            safe=False,
        )

        return add_public_cache_header(response)

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        ValueError,
        OSError,
    ) as error:
        return create_data_error_response(error)


@require_GET
def get_branches(request, bank_code):
    """
    根據銀行代碼取得該銀行的分行

    使用者選擇銀行後才呼叫此 API
    避免首頁一次載入所有銀行的分行
    """
    try:
        bank_data = load_bank_data()

        bank = bank_data["bank_by_code"].get(
            bank_code
        )

        if bank is None:
            return JsonResponse(
                {"error": "銀行不存在"},
                status=404,
            )

        branches = bank.get("branches", [])

        response = JsonResponse(
            branches,
            safe=False,
        )

        return add_public_cache_header(response)

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        ValueError,
        OSError,
    ) as error:
        return create_data_error_response(error)


@require_GET
def get_branch_details(
    request,
    bank_code,
    branch_code,
):
    """
    根據銀行代碼與分行代碼取得分行詳細資訊
    """
    try:
        bank_data = load_bank_data()

        bank = bank_data["bank_by_code"].get(
            bank_code
        )

        if bank is None:
            return JsonResponse(
                {"error": "銀行不存在"},
                status=404,
            )

        branch = find_branch(
            bank,
            branch_code,
        )

        if branch is None:
            return JsonResponse(
                {"error": "分行不存在"},
                status=404,
            )

        response = JsonResponse(
            build_branch_detail(
                bank,
                branch,
            )
        )

        return add_public_cache_header(response)

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        ValueError,
        OSError,
    ) as error:
        return create_data_error_response(error)


@require_GET
def bank_branch_detail(
    request,
    bank_code,
    branch_code,
    bank_name,
    branch_name,
):
    """
    驗證網址中的銀行名稱與分行名稱
    並回傳指定分行詳細資訊
    """
    try:
        bank_data = load_bank_data()

        bank = bank_data["bank_by_code"].get(
            bank_code
        )

        if bank is None:
            return JsonResponse(
                {"error": "銀行不存在"},
                status=404,
            )

        branch = find_branch(
            bank,
            branch_code,
        )

        if branch is None:
            return JsonResponse(
                {"error": "分行不存在"},
                status=404,
            )

        if (
            bank.get("name") != bank_name
            or branch.get("name") != branch_name
        ):
            return JsonResponse(
                {
                    "error":
                        "銀行或分行名稱不匹配"
                },
                status=404,
            )

        response = JsonResponse(
            build_branch_detail(
                bank,
                branch,
            )
        )

        return add_public_cache_header(response)

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        ValueError,
        OSError,
    ) as error:
        return create_data_error_response(error)


@require_GET
def get_nearby_branches(request):
    """
    根據使用者目前位置回傳附近分行

    使用方式
    /branches/nearby/?lat=25.033&lng=121.565&limit=10&radius=10

    radius 單位為公里
    預設搜尋半徑為 10 公里

    只回傳搜尋半徑內的分行
    最多回傳 limit 指定的筆數
    """
    latitude_value = request.GET.get("lat")
    longitude_value = request.GET.get("lng")
    limit_value = request.GET.get("limit", "10")
    radius_value = request.GET.get("radius", "10")

    if (
        latitude_value is None
        or longitude_value is None
    ):
        return JsonResponse(
            {
                "error": "請提供 lat 與 lng 參數"
            },
            status=400,
        )

    try:
        user_latitude = float(latitude_value)
        user_longitude = float(longitude_value)
        limit = int(limit_value)
        radius_kilometers = float(radius_value)

    except (TypeError, ValueError):
        return JsonResponse(
            {
                "error": "lat lng limit 或 radius 格式錯誤"
            },
            status=400,
        )

    if not -90 <= user_latitude <= 90:
        return JsonResponse(
            {
                "error": "緯度必須介於 -90 至 90"
            },
            status=400,
        )

    if not -180 <= user_longitude <= 180:
        return JsonResponse(
            {
                "error": "經度必須介於 -180 至 180"
            },
            status=400,
        )

    if not 1 <= limit <= 50:
        return JsonResponse(
            {
                "error": "limit 必須介於 1 至 50"
            },
            status=400,
        )

    if not 1 <= radius_kilometers <= 100:
        return JsonResponse(
            {
                "error": "radius 必須介於 1 至 100 公里"
            },
            status=400,
        )

    maximum_distance_meters = (
        radius_kilometers * 1000
    )

    try:
        bank_data = load_bank_data()

        geocoded_branches = (
            bank_data["geocoded_branches"]
        )

        if not geocoded_branches:
            return JsonResponse(
                {
                    "error": (
                        "目前尚無分行座標資料 "
                        "請先執行 geocode_branches.py"
                    )
                },
                status=503,
            )

        def create_distance_candidates():
            for branch in geocoded_branches:
                distance_meters = (
                    haversine_distance_meters(
                        user_latitude,
                        user_longitude,
                        branch["latitude"],
                        branch["longitude"],
                    )
                )

                if (
                    distance_meters
                    > maximum_distance_meters
                ):
                    continue

                yield (
                    distance_meters,
                    branch,
                )

        nearest_branch_pairs = (
            heapq.nsmallest(
                limit,
                create_distance_candidates(),
                key=lambda item: item[0],
            )
        )

        nearby_branches = []

        for (
            distance_meters,
            branch,
        ) in nearest_branch_pairs:

            nearby_branches.append(
                {
                    **branch,
                    "distance_meters": round(
                        distance_meters
                    ),
                }
            )

        response = JsonResponse(
            nearby_branches,
            safe=False,
        )

        response["Cache-Control"] = "no-store"

        return response

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        ValueError,
        OSError,
    ) as error:
        return create_data_error_response(error)


@require_GET
def api_root(request):
    """
    API 入口顯示目前可以使用的 API
    """
    return JsonResponse(
        {
            "message":
                "Welcome to the Bank API",
            "endpoints": {
                "banks":
                    "/banks/",
                "branches": (
                    "/banks/<bank_code>/branches/"
                ),
                "nearby_branches": (
                    "/branches/nearby/"
                    "?lat=<latitude>"
                    "&lng=<longitude>"
                    "&limit=10"
                    "&radius=10"
                ),
                "google_place": (
                    "/places/resolve/"
                    "?bank_code=<bank_code>"
                    "&branch_code=<branch_code>"
                    "&branch_name=<branch_name>"
                ),
                "branch_details": (
                    "/<bank_code>/<branch_code>/"
                ),
                "bank_branch_detail": (
                    "/<bank_code>/<branch_code>/"
                    "<bank_name>-<branch_name>.html"
                ),
            },
        }
    )