import heapq
import json
import math
from pathlib import Path

from django.http import JsonResponse
from django.views.decorators.http import require_GET


# bank_data.json 與 views.py 位於同一個 bank 資料夾
DATA_FILE_PATH = Path(__file__).resolve().parent / "bank_data.json"


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
    嘗試把資料轉換成浮點數。

    無法轉換或資料為空時回傳 None，
    避免某一筆錯誤座標造成整支 API 失敗。
    """
    try:
        if value in (None, ""):
            return None

        return float(value)
    except (TypeError, ValueError):
        return None


def load_bank_data():
    """
    載入 bank_data.json 並建立快取。

    當 JSON 檔案沒有變更時，直接使用記憶體中的資料。
    如果 JSON 的修改時間改變，則自動重新讀取檔案。

    回傳內容包含：
    1. banks：完整銀行資料
    2. bank_by_code：依銀行代碼建立的快速查詢字典
    3. geocoded_branches：已經有經緯度的分行平面清單
    """
    modified_time_ns = DATA_FILE_PATH.stat().st_mtime_ns

    # 檔案沒有變更時，直接使用現有快取
    if (
        _BANK_DATA_CACHE["modified_time_ns"] == modified_time_ns
        and _BANK_DATA_CACHE["banks"]
    ):
        return _BANK_DATA_CACHE

    with open(DATA_FILE_PATH, "r", encoding="utf-8") as file:
        raw_data = json.load(file)

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

        # 建立銀行代碼索引，之後不必每次逐筆尋找銀行
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
    統一處理 JSON 檔案不存在、格式錯誤等問題。
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
    靜態銀行資料不會頻繁更新，
    允許瀏覽器在指定秒數內使用快取。

    預設 86400 秒，也就是 24 小時。
    """
    response["Cache-Control"] = f"public, max-age={max_age}"
    return response


def find_branch(bank, branch_code):
    """
    在指定銀行中尋找分行。
    """
    for branch in bank.get("branches", []):
        if str(branch.get("code", "")) == str(branch_code):
            return branch

    return None


def build_branch_detail(bank, branch):
    """
    將銀行與分行資料整理成統一的 API 回傳格式。
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

    # 已有經緯度時才回傳，避免輸出無效值
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
    使用 Haversine 公式計算兩個經緯度之間的直線距離。

    回傳單位為公尺。
    這是地球表面的近似直線距離，不是實際道路距離。
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


@require_GET
def get_banks(request):
    """
    取得所有銀行基本清單。

    只回傳銀行代碼與名稱，
    不再把 4,554 間分行全部放進首頁 API。
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

        response = JsonResponse(bank_list, safe=False)

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
    根據銀行代碼取得該銀行的分行。

    使用者選擇銀行後才呼叫此 API，
    避免首頁一次載入所有銀行的分行。
    """
    try:
        bank_data = load_bank_data()

        bank = bank_data["bank_by_code"].get(bank_code)

        if bank is None:
            return JsonResponse(
                {"error": "銀行不存在"},
                status=404,
            )

        branches = bank.get("branches", [])

        response = JsonResponse(branches, safe=False)

        return add_public_cache_header(response)

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        ValueError,
        OSError,
    ) as error:
        return create_data_error_response(error)


@require_GET
def get_branch_details(request, bank_code, branch_code):
    """
    根據銀行代碼與分行代碼取得分行詳細資訊。
    """
    try:
        bank_data = load_bank_data()

        bank = bank_data["bank_by_code"].get(bank_code)

        if bank is None:
            return JsonResponse(
                {"error": "銀行不存在"},
                status=404,
            )

        branch = find_branch(bank, branch_code)

        if branch is None:
            return JsonResponse(
                {"error": "分行不存在"},
                status=404,
            )

        response = JsonResponse(
            build_branch_detail(bank, branch)
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
    驗證網址中的銀行名稱與分行名稱，
    並回傳指定分行詳細資訊。
    """
    try:
        bank_data = load_bank_data()

        bank = bank_data["bank_by_code"].get(bank_code)

        if bank is None:
            return JsonResponse(
                {"error": "銀行不存在"},
                status=404,
            )

        branch = find_branch(bank, branch_code)

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
                {"error": "銀行或分行名稱不匹配"},
                status=404,
            )

        response = JsonResponse(
            build_branch_detail(bank, branch)
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
    根據使用者目前位置回傳最近的分行。

    使用方式：
    /branches/nearby/?lat=25.033&lng=121.565&limit=10

    前端只會收到最近的幾間分行，
    不會下載完整 4,554 筆分行資料。
    """
    latitude_value = request.GET.get("lat")
    longitude_value = request.GET.get("lng")
    limit_value = request.GET.get("limit", "10")

    # 必須同時提供緯度與經度
    if latitude_value is None or longitude_value is None:
        return JsonResponse(
            {"error": "請提供 lat 與 lng 參數"},
            status=400,
        )

    try:
        user_latitude = float(latitude_value)
        user_longitude = float(longitude_value)
        limit = int(limit_value)
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "lat、lng 或 limit 格式錯誤"},
            status=400,
        )

    # 驗證經緯度範圍
    if not -90 <= user_latitude <= 90:
        return JsonResponse(
            {"error": "緯度必須介於 -90 至 90"},
            status=400,
        )

    if not -180 <= user_longitude <= 180:
        return JsonResponse(
            {"error": "經度必須介於 -180 至 180"},
            status=400,
        )

    # 限制單次最多取得 50 間，避免 API 被不當大量查詢
    if not 1 <= limit <= 50:
        return JsonResponse(
            {"error": "limit 必須介於 1 至 50"},
            status=400,
        )

    try:
        bank_data = load_bank_data()

        geocoded_branches = bank_data["geocoded_branches"]

        if not geocoded_branches:
            return JsonResponse(
                {
                    "error": (
                        "目前尚無分行座標資料，"
                        "請先執行 geocode_branches.py"
                    )
                },
                status=503,
            )

        # 使用產生器逐筆計算距離
        distance_candidates = (
            (
                haversine_distance_meters(
                    user_latitude,
                    user_longitude,
                    branch["latitude"],
                    branch["longitude"],
                ),
                branch,
            )
            for branch in geocoded_branches
        )

        # nsmallest 只保留距離最近的指定筆數，
        # 不需要把全部 4,554 筆完整排序
        nearest_branch_pairs = heapq.nsmallest(
            limit,
            distance_candidates,
            key=lambda item: item[0],
        )

        nearby_branches = []

        for distance_meters, branch in nearest_branch_pairs:
            nearby_branches.append(
                {
                    **branch,
                    "distance_meters": round(distance_meters),
                }
            )

        response = JsonResponse(
            nearby_branches,
            safe=False,
        )

        # 定位結果與使用者位置有關，不應由瀏覽器長期快取
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
    API 入口，顯示目前可以使用的 API。
    """
    return JsonResponse(
        {
            "message": "Welcome to the Bank API",
            "endpoints": {
                "banks": "/banks/",
                "branches": (
                    "/banks/<bank_code>/branches/"
                ),
                "nearby_branches": (
                    "/branches/nearby/"
                    "?lat=<latitude>"
                    "&lng=<longitude>"
                    "&limit=10"
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