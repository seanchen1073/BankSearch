import argparse
import json
import os
import shutil
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_DIR = Path(__file__).resolve().parent

DEFAULT_DATA_FILE_PATH = (
    BASE_DIR / "bank_data.json"
)

DEFAULT_FAILURE_FILE_PATH = (
    BASE_DIR / "geocode_failures.json"
)

# Google Geocoding API 網址
GOOGLE_GEOCODING_API_URL = (
    "https://maps.googleapis.com/maps/api/geocode/json"
)


def load_json_file(file_path):
    """
    讀取 JSON 檔案。
    """
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def write_json_atomically(file_path, data):
    """
    使用暫存檔寫入 JSON，再取代原始檔案。

    避免程式在寫入途中中斷，
    造成 bank_data.json 整份損壞。
    """
    temporary_path = file_path.with_suffix(
        file_path.suffix + ".tmp"
    )

    with open(
        temporary_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2,
        )

    temporary_path.replace(file_path)


def create_backup(file_path):
    """
    執行前先備份原始 bank_data.json。
    """
    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    backup_path = file_path.with_name(
        f"{file_path.stem}_backup_{timestamp}"
        f"{file_path.suffix}"
    )

    shutil.copy2(file_path, backup_path)

    return backup_path


def has_valid_coordinates(branch):
    """
    檢查分行是否已經有有效的經緯度。
    """
    try:
        latitude = float(branch.get("latitude"))
        longitude = float(branch.get("longitude"))

        return (
            -90 <= latitude <= 90
            and -180 <= longitude <= 180
        )
    except (TypeError, ValueError):
        return False


def request_geocoding(
    address,
    api_key,
    max_retries=3,
):
    """
    呼叫 Google Geocoding API，
    將地址轉換成經緯度。

    成功時回傳：
    (
        {
            "latitude": 25.123,
            "longitude": 121.456
        },
        None
    )

    失敗時回傳：
    (None, "錯誤原因")
    """
    query_parameters = {
        "address": address,
        "key": api_key,
        "language": "zh-TW",
        # region 只是優先提示台灣，
        # 並不會強制所有地址都必須在台灣
        "region": "tw",
    }

    request_url = (
        f"{GOOGLE_GEOCODING_API_URL}?"
        f"{urlencode(query_parameters)}"
    )

    for attempt in range(max_retries):
        try:
            request = Request(
                request_url,
                headers={
                    "User-Agent": (
                        "BankSearch-Geocoder/1.0"
                    )
                },
            )

            with urlopen(
                request,
                timeout=20,
            ) as response:
                response_text = (
                    response.read().decode("utf-8")
                )

            response_data = json.loads(response_text)

            status = response_data.get("status")

            if status == "OK":
                results = response_data.get(
                    "results",
                    [],
                )

                if not results:
                    return None, "API 沒有回傳地址結果"

                location = (
                    results[0]
                    .get("geometry", {})
                    .get("location", {})
                )

                latitude = location.get("lat")
                longitude = location.get("lng")

                if (
                    latitude is None
                    or longitude is None
                ):
                    return None, "API 沒有回傳經緯度"

                return (
                    {
                        "latitude": float(latitude),
                        "longitude": float(longitude),
                    },
                    None,
                )

            if status == "ZERO_RESULTS":
                return None, "找不到對應地址"

            # 這些狀態可能是暫時性問題，
            # 稍等後重新嘗試
            if status in {
                "UNKNOWN_ERROR",
                "OVER_QUERY_LIMIT",
            }:
                wait_seconds = min(
                    2 ** attempt,
                    8,
                )

                time.sleep(wait_seconds)
                continue

            error_message = response_data.get(
                "error_message",
                status or "未知錯誤",
            )

            return None, error_message

        except (
            HTTPError,
            URLError,
            TimeoutError,
            json.JSONDecodeError,
        ) as error:
            # 網路暫時失敗時採用簡單重試
            if attempt < max_retries - 1:
                wait_seconds = min(
                    2 ** attempt,
                    8,
                )

                time.sleep(wait_seconds)
                continue

            return None, str(error)

    return None, "超過最大重試次數"


def save_progress(
    data_file_path,
    bank_data,
    failure_file_path,
    failures,
):
    """
    儲存目前處理進度與失敗紀錄。
    """
    write_json_atomically(
        data_file_path,
        bank_data,
    )

    write_json_atomically(
        failure_file_path,
        failures,
    )


def parse_arguments():
    """
    讀取終端機參數。
    """
    parser = argparse.ArgumentParser(
        description=(
            "將 bank_data.json 中的分行地址"
            "轉換為經緯度"
        )
    )

    parser.add_argument(
        "--data-file",
        default=str(DEFAULT_DATA_FILE_PATH),
        help="bank_data.json 的完整路徑",
    )

    parser.add_argument(
        "--failure-file",
        default=str(DEFAULT_FAILURE_FILE_PATH),
        help="失敗地址紀錄檔路徑",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help=(
            "本次最多處理幾筆。"
            "第一次建議先使用 --limit 10"
        ),
    )

    parser.add_argument(
        "--sleep",
        type=float,
        default=0.2,
        help="每次 API 請求之間等待幾秒",
    )

    parser.add_argument(
        "--save-every",
        type=int,
        default=20,
        help="每處理幾筆就儲存一次進度",
    )

    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="重新處理已經具有經緯度的分行",
    )

    return parser.parse_args()


def main():
    """
    批次轉換分行地址的主程式。
    """
    arguments = parse_arguments()

    data_file_path = Path(
        arguments.data_file
    ).resolve()

    failure_file_path = Path(
        arguments.failure_file
    ).resolve()

    # 使用獨立的後端 Geocoding Key，
    # 不要把 API Key 直接寫在程式碼裡
    api_key = os.getenv(
        "GOOGLE_GEOCODING_API_KEY"
    )

    if not api_key:
        print(
            "錯誤：尚未設定 "
            "GOOGLE_GEOCODING_API_KEY"
        )

        print(
            "PowerShell 設定方式："
        )

        print(
            '$env:GOOGLE_GEOCODING_API_KEY='
            '"你的 API Key"'
        )

        return 1

    if not data_file_path.exists():
        print(
            f"錯誤：找不到資料檔案 "
            f"{data_file_path}"
        )

        return 1

    if arguments.limit is not None:
        if arguments.limit <= 0:
            print("錯誤：limit 必須大於 0")
            return 1

    if arguments.save_every <= 0:
        print(
            "錯誤：save-every 必須大於 0"
        )

        return 1

    bank_data = load_json_file(
        data_file_path
    )

    banks = bank_data.get("banks", [])

    if not isinstance(banks, list):
        print(
            "錯誤：bank_data.json 的 banks"
            " 不是陣列"
        )

        return 1

    backup_path = create_backup(
        data_file_path
    )

    print(
        f"已建立備份：{backup_path}"
    )

    processed_count = 0
    success_count = 0
    failure_count = 0
    skipped_count = 0
    failures = []

    try:
        for bank in banks:
            bank_code = bank.get("code", "")
            bank_name = bank.get("name", "")

            branches = bank.get(
                "branches",
                [],
            )

            for branch in branches:
                # 已達到本次處理上限
                if (
                    arguments.limit is not None
                    and processed_count
                    >= arguments.limit
                ):
                    break

                # 預設略過已經有經緯度的分行
                if (
                    not arguments.overwrite
                    and has_valid_coordinates(branch)
                ):
                    skipped_count += 1
                    continue

                branch_code = branch.get(
                    "code",
                    "",
                )

                branch_name = branch.get(
                    "name",
                    "",
                )

                address = str(
                    branch.get("address", "")
                ).strip()

                processed_count += 1

                print(
                    f"[{processed_count}] "
                    f"{bank_code} {bank_name} / "
                    f"{branch_code} {branch_name}"
                )

                if not address:
                    failure_count += 1

                    failures.append(
                        {
                            "bank_code": bank_code,
                            "bank_name": bank_name,
                            "branch_code": branch_code,
                            "branch_name": branch_name,
                            "address": address,
                            "error": "地址為空白",
                        }
                    )

                    continue

                coordinates, error_message = (
                    request_geocoding(
                        address,
                        api_key,
                    )
                )

                if coordinates:
                    branch["latitude"] = (
                        coordinates["latitude"]
                    )

                    branch["longitude"] = (
                        coordinates["longitude"]
                    )

                    success_count += 1

                    print(
                        "  成功："
                        f"{branch['latitude']}, "
                        f"{branch['longitude']}"
                    )
                else:
                    failure_count += 1

                    failures.append(
                        {
                            "bank_code": bank_code,
                            "bank_name": bank_name,
                            "branch_code": branch_code,
                            "branch_name": branch_name,
                            "address": address,
                            "error": error_message,
                        }
                    )

                    print(
                        f"  失敗：{error_message}"
                    )

                # 每處理指定筆數就儲存，
                # 即使程式中途中斷也不會全部重來
                if (
                    processed_count
                    % arguments.save_every
                    == 0
                ):
                    save_progress(
                        data_file_path,
                        bank_data,
                        failure_file_path,
                        failures,
                    )

                    print("  已儲存目前進度")

                if arguments.sleep > 0:
                    time.sleep(arguments.sleep)

            if (
                arguments.limit is not None
                and processed_count
                >= arguments.limit
            ):
                break

    except KeyboardInterrupt:
        print(
            "\n收到中斷指令，"
            "正在儲存目前進度……"
        )

    finally:
        save_progress(
            data_file_path,
            bank_data,
            failure_file_path,
            failures,
        )

    print("")
    print("地址轉換完成")
    print(f"本次處理：{processed_count}")
    print(f"成功：{success_count}")
    print(f"失敗：{failure_count}")
    print(f"略過已有座標：{skipped_count}")
    print(
        f"失敗紀錄：{failure_file_path}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())