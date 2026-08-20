import argparse
import json
import math
import os
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent

# 自動讀取 backend 裡面的 .env
load_dotenv(BACKEND_DIR / ".env")

DEFAULT_DATA_FILE_PATH = BASE_DIR / "bank_data.json"

# Google Geocoding API 網址
GOOGLE_GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# Google Places Text Search API 網址
GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# 中文段數轉成阿拉伯數字方便地址比對
CHINESE_NUMBER_MAP = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}

# 全形數字轉成半形數字方便地址比對
FULLWIDTH_NUMBER_TRANSLATION = str.maketrans(
    "０１２３４５６７８９",
    "0123456789",
)


def load_json_file(file_path):
    """
    讀取 JSON 檔案
    """
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def write_json_atomically(file_path, data):
    """
    使用暫存檔寫入 JSON 再取代原始檔案

    避免程式在寫入途中中斷
    造成 bank_data.json 整份損壞
    """
    temporary_path = file_path.with_suffix(file_path.suffix + ".tmp")

    with open(temporary_path, "w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2,
        )

    temporary_path.replace(file_path)


def has_valid_coordinates(branch):
    """
    檢查分行是不是已經有有效的經緯度
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


def chinese_number_to_int(value):
    """
    把常見中文數字轉成整數

    主要用來統一道路段數
    """
    text = str(value or "").strip()

    if not text:
        return None

    if text == "十":
        return 10

    if "十" in text:
        left_text, right_text = text.split("十", 1)

        left_value = (
            CHINESE_NUMBER_MAP.get(left_text, 1)
            if left_text
            else 1
        )

        right_value = (
            CHINESE_NUMBER_MAP.get(right_text, 0)
            if right_text
            else 0
        )

        return left_value * 10 + right_value

    return CHINESE_NUMBER_MAP.get(text)


def normalize_section_numbers(value):
    """
    把一段二段這類寫法轉成 1 段 2 段
    """
    text = str(value or "")

    def replace_section_number(match):
        section_value = chinese_number_to_int(match.group(1))

        if section_value is None:
            return match.group(0)

        return f"{section_value}段"

    return re.sub(
        r"([一二三四五六七八九十]+)段",
        replace_section_number,
        text,
    )


def normalize_address_text(value):
    """
    把地址轉成方便程式比較的格式

    這個結果只拿來定位和驗證
    不會寫回原本的 address
    """
    text = str(value or "").strip()

    if not text:
        return ""

    text = text.translate(FULLWIDTH_NUMBER_TRANSLATION)

    text = text.replace("臺", "台")
    text = text.replace("－", "-")
    text = text.replace("–", "-")
    text = text.replace("—", "-")

    text = re.sub(
        r"\s+",
        "",
        text,
    )

    # 把兩種常見的附號寫法統一
    text = re.sub(
        r"(\d+)號之(\d+)",
        r"\1-\2號",
        text,
    )

    text = re.sub(
        r"(\d+)之(\d+)號",
        r"\1-\2號",
        text,
    )

    return normalize_section_numbers(text)


def compact_address_for_parsing(value):
    """
    整理地址字串方便拆解多門牌

    這裡只處理空白和常見符號
    不會改掉原本的縣市行政區里別和中文段數
    """
    text = str(value or "").strip()

    if not text:
        return ""

    text = text.translate(FULLWIDTH_NUMBER_TRANSLATION)

    text = text.replace("－", "-")
    text = text.replace("–", "-")
    text = text.replace("—", "-")

    text = text.replace("；", "、")
    text = text.replace(";", "、")
    text = text.replace("，", "、")
    text = text.replace(",", "、")

    return re.sub(
        r"\s+",
        "",
        text,
    )


def extract_administrative_prefix(address):
    """
    取得道路前面的行政區資訊

    像縣市區里都會完整保留下來
    """
    address_text = compact_address_for_parsing(address)

    if not address_text:
        return ""

    prefix_match = re.match(
        r"^(.+(?:區|鄉|鎮|市|里|村))(?=[^、]*(?:大道|路|街))",
        address_text,
    )

    if not prefix_match:
        return ""

    return prefix_match.group(1)


def extract_city_district_hint(address):
    """
    取得縣市與行政區作為 Places 搜尋提示

    這個提示不會用來決定建議導航位置
    """
    address_text = compact_address_for_parsing(address)

    if not address_text:
        return ""

    hint_match = re.match(
        r"^(.+?(?:縣|市).+?(?:區|鄉|鎮|市))",
        address_text,
    )

    if hint_match:
        return hint_match.group(1)

    city_match = re.match(
        r"^(.+?(?:縣|市))",
        address_text,
    )

    if city_match:
        return city_match.group(1)

    return ""


def get_navigation_location_key(address):
    """
    產生候選地址的去重比對值

    這個值只拿來程式內部比較
    不會拿去顯示或導航
    """
    return normalize_address_text(address)


def get_relative_location_prefix(location):
    """
    取得巷弄前綴方便延續後面的相同門牌
    """
    prefix_match = re.match(
        r"^((?:\d+巷)(?:\d+弄)?)\d",
        str(location or ""),
    )

    if not prefix_match:
        return ""

    return prefix_match.group(1)


def extract_navigation_locations(address):
    """
    把一筆多門牌地址拆成多個可導航候選

    原始 address 完全不會修改
    每個候選都會保留完整行政區和道路資訊
    """
    address_text = compact_address_for_parsing(address)

    if not address_text:
        return []

    administrative_prefix = extract_administrative_prefix(
        address_text
    )

    address_parts = [
        part
        for part in re.split(
            r"、|及",
            address_text,
        )
        if part
    ]

    road_pattern = re.compile(
        r"^(?P<road>.+?(?:大道|路|街)(?:[一二三四五六七八九十\d]+段)?)(?P<rest>.*)$"
    )

    explicit_location_pattern = re.compile(
        r"^(?P<location>(?:(?:\d+巷)?(?:\d+弄)?\d+(?:[-之]\d+)?號(?:之\d+)?))"
    )

    pending_location_pattern = re.compile(
        r"^(?P<location>(?:(?:\d+巷)?(?:\d+弄)?\d+(?:[-之]\d+)?))$"
    )

    navigation_locations = []
    navigation_location_keys = set()

    current_road = ""
    current_relative_prefix = ""
    pending_locations = []

    def add_navigation_location(
        road,
        location,
        relative_prefix="",
    ):
        if not road or not location:
            return

        final_location = location

        if (
            "巷" not in final_location
            and "弄" not in final_location
            and relative_prefix
        ):
            final_location = (
                f"{relative_prefix}"
                f"{final_location}"
            )

        navigation_address = (
            f"{administrative_prefix}"
            f"{road}"
            f"{final_location}"
        )

        navigation_key = get_navigation_location_key(
            navigation_address
        )

        if (
            not navigation_key
            or navigation_key
            in navigation_location_keys
        ):
            return

        navigation_location_keys.add(
            navigation_key
        )

        navigation_locations.append(
            navigation_address
        )

    def flush_pending_locations():
        nonlocal pending_locations

        for (
            pending_road,
            pending_location,
            pending_relative_prefix,
        ) in pending_locations:
            add_navigation_location(
                pending_road,
                f"{pending_location}號",
                pending_relative_prefix,
            )

        pending_locations = []

    for address_part in address_parts:
        working_part = address_part

        if (
            administrative_prefix
            and working_part.startswith(
                administrative_prefix
            )
        ):
            working_part = working_part[
                len(administrative_prefix):
            ]

        road_match = road_pattern.match(
            working_part
        )

        if road_match:
            # 換到另一條道路時不延續前一條道路的未完成門牌
            pending_locations = []

            current_road = road_match.group(
                "road"
            )

            current_relative_prefix = ""

            working_part = road_match.group(
                "rest"
            )

        if not current_road:
            continue

        explicit_location_match = (
            explicit_location_pattern.match(
                working_part
            )
        )

        if explicit_location_match:
            # 後面出現正式的號時代表前面的簡寫數字也是門牌
            flush_pending_locations()

            explicit_location = (
                explicit_location_match.group(
                    "location"
                )
            )

            if (
                "巷" in explicit_location
                or "弄" in explicit_location
            ):
                add_navigation_location(
                    current_road,
                    explicit_location,
                )

                current_relative_prefix = (
                    get_relative_location_prefix(
                        explicit_location
                    )
                )

            else:
                add_navigation_location(
                    current_road,
                    explicit_location,
                    current_relative_prefix,
                )

            continue

        pending_location_match = (
            pending_location_pattern.match(
                working_part
            )
        )
               # 遇到樓層資訊時清掉前面暫存的裸數字
        # 避免把 1、2、4樓裡的 2 誤判成 2號
        if re.search(
            r"樓|層|室|地下|F",
            working_part,
            re.IGNORECASE,
        ):
            pending_locations = []
            continue

        pending_location_match = (
            pending_location_pattern.match(
                working_part
            )
        )

        if (
            pending_location_match
            and not re.search(
                r"樓|層|室|地下|F",
                working_part,
                re.IGNORECASE,
            )
        ):
            pending_locations.append(
                (
                    current_road,
                    pending_location_match.group(
                        "location"
                    ),
                    current_relative_prefix,
                )
            )

    return navigation_locations


def clean_geocoding_address(address):
    """
    產生目前主要使用的定位地址

    多門牌會先解析成所有候選
    一般舊流程仍使用第一個候選
    """
    navigation_locations = (
        extract_navigation_locations(
            address
        )
    )

    if navigation_locations:
        return navigation_locations[0]

    return compact_address_for_parsing(
        address
    )


def is_complex_address(address):
    """
    判斷地址是不是多門牌格式

    repair-complex 會使用這個結果挑出候選資料
    """
    navigation_locations = (
        extract_navigation_locations(
            address
        )
    )

    if len(navigation_locations) > 1:
        return True

    address_text = normalize_address_text(
        address
    )

    if not address_text:
        return False

    first_house_match = re.search(
        r"\d+(?:[-之]\d+)?號",
        address_text,
    )

    if not first_house_match:
        return False

    separator_match = re.search(
        r"[、,，；;]|(?<=\d)及(?=\d)",
        address_text,
    )

    # 這段保留舊判斷避免特殊格式暫時沒有被解析器抓到
    if (
        separator_match
        and separator_match.start()
        < first_house_match.start()
    ):
        return True

    house_matches = list(
        re.finditer(
            r"\d+(?:[-之]\d+)?號",
            address_text,
        )
    )

    if len(house_matches) > 1:
        return True

    remaining_text = address_text[
        first_house_match.end():
    ]

    if re.search(
        r"[、,，；;]\d+(?:[-之]\d+)?號",
        remaining_text,
    ):
        return True

    if re.search(
        r"及\d+(?:[-之]\d+)?(?:號|$)",
        remaining_text,
    ):
        return True

    return False


def strip_administrative_prefix(address):
    """
    拿掉縣市和行政區方便抓道路名稱
    """
    address_text = normalize_address_text(
        address
    )

    if not address_text:
        return ""

    # Google 有時會把郵遞區號放在最前面
    address_text = re.sub(
        r"^\d{3,6}",
        "",
        address_text,
    )

    # Google 有時會在地址前面加上台灣
    if address_text.startswith("台灣"):
        address_text = address_text[
            len("台灣"):
        ]

    address_text = re.sub(
        r"^.{1,8}?(?:縣|市)",
        "",
        address_text,
        count=1,
    )

    address_text = re.sub(
        r"^.{1,8}?(?:區|鄉|鎮|市)",
        "",
        address_text,
        count=1,
    )

    # 里別和村別保留在顯示地址
    # 但不參與道路名稱驗證
    address_text = re.sub(
        r"^.{1,12}?(?:里|村)",
        "",
        address_text,
        count=1,
    )

    return address_text


def normalize_house_number(value):
    """
    統一門牌裡的連字號和之字
    """
    text = str(
        value or ""
    ).strip()

    text = text.translate(
        FULLWIDTH_NUMBER_TRANSLATION
    )

    text = text.replace("－", "-")
    text = text.replace("–", "-")
    text = text.replace("—", "-")
    text = text.replace("之", "-")
    text = text.replace("號", "")

    return re.sub(
        r"\s+",
        "",
        text,
    )


def extract_expected_address_parts(address):
    """
    從定位地址抓出道路和第一個門牌

    Google 回傳結果會用這兩個值做驗證
    """
    address_text = strip_administrative_prefix(
        address
    )

    route_match = re.search(
        r"(.+?(?:大道|路|街)(?:\d+段)?)",
        address_text,
    )

    expected_route = (
        route_match.group(1)
        if route_match
        else ""
    )

    house_match = re.search(
        r"(\d+(?:[-之]\d+)?)號",
        address_text,
    )

    expected_house_number = (
        house_match.group(1)
        if house_match
        else ""
    )

    return (
        normalize_address_text(
            expected_route
        ),
        normalize_house_number(
            expected_house_number
        ),
    )


def get_address_component(
    result,
    component_type,
    use_short_name=False,
):
    """
    從 Geocoding 結果取得指定地址欄位
    """
    for component in result.get(
        "address_components",
        [],
    ):
        component_types = component.get(
            "types",
            [],
        )

        if component_type not in component_types:
            continue

        if use_short_name:
            return str(
                component.get(
                    "short_name",
                    "",
                )
            ).strip()

        return str(
            component.get(
                "long_name",
                "",
            )
        ).strip()

    return ""


def validate_geocoding_result(
    requested_address,
    result,
):
    """
    檢查 Geocoding 找到的位置是不是同一個行政區道路和門牌

    行政區道路或門牌對不上就不接受這筆座標
    """
    expected_route, expected_house_number = (
        extract_expected_address_parts(
            requested_address
        )
    )

    formatted_address = (
        normalize_address_text(
            result.get(
                "formatted_address",
                "",
            )
        )
    )

    # 行政區也必須和定位地址一致
    # 避免同路名同門牌被定位到其他區
    expected_city_district = (
        normalize_address_text(
            extract_city_district_hint(
                requested_address
            )
        )
    )

    if (
        expected_city_district
        and expected_city_district
        not in formatted_address
    ):
        return (
            False,
            "Google 回傳行政區與定位地址不一致",
        )

    google_country = (
        get_address_component(
            result,
            "country",
            use_short_name=True,
        )
        .upper()
    )

    # Google 明確回傳其他國家時直接拒絕
    if (
        google_country
        and google_country != "TW"
    ):
        return (
            False,
            "Google 回傳位置不在台灣",
        )

    # Google 只找到部分地址時不要直接接受
    if result.get("partial_match") is True:
        return (
            False,
            "Google 只找到部分地址",
        )

    google_route = (
        normalize_address_text(
            get_address_component(
                result,
                "route",
            )
        )
    )

    google_house_number = (
        normalize_house_number(
            get_address_component(
                result,
                "street_number",
            )
        )
    )

    if expected_route:
        route_matches = False

        if google_route:
            route_matches = (
                expected_route
                == google_route
                or expected_route
                in google_route
                or google_route
                in expected_route
            )

            # 有段數時一定要確認沒有跑到其他段
            if re.search(
                r"\d+段",
                expected_route,
            ):
                route_matches = (
                    expected_route
                    == google_route
                    or expected_route
                    in google_route
                    or expected_route
                    in formatted_address
                )

        if not google_route:
            route_matches = (
                expected_route
                in formatted_address
            )

        if not route_matches:
            return (
                False,
                "Google 回傳道路與定位地址不一致",
            )

    if expected_house_number:
        house_number_matches = (
            google_house_number
            == expected_house_number
        )

        if not house_number_matches:
            expected_house_pattern = (
                rf"(?<!\d)"
                rf"{re.escape(expected_house_number)}"
                rf"號"
            )

            house_number_matches = bool(
                re.search(
                    expected_house_pattern,
                    formatted_address,
                )
            )

        if not house_number_matches:
            return (
                False,
                "Google 回傳門牌與定位地址不一致",
            )

    return True, ""


def normalize_place_name(value):
    """
    把銀行和分行名稱整理成適合比對的格式

    這個結果只拿來驗證 Place
    不會改到原始銀行資料
    """
    text = str(
        value or ""
    ).strip().lower()

    if not text:
        return ""

    text = text.replace(
        "臺",
        "台",
    )

    removable_words = [
        "金融控股股份有限公司",
        "商業銀行股份有限公司",
        "銀行股份有限公司",
        "股份有限公司",
        "商業銀行",
        "代表人辦事處",
        "代表處",
        "辦事處",
        "營業部",
        "自動櫃員機",
        "分行",
        "銀行",
        "atm",
    ]

    for word in removable_words:
        text = text.replace(
            word,
            "",
        )

    return re.sub(
        r"[^0-9a-z\u4e00-\u9fff]",
        "",
        text,
    )

def get_place_display_name(place):
    """
    取得 Places API 回傳的地點名稱
    """
    return str(
        place
        .get(
            "displayName",
            {},
        )
        .get(
            "text",
            "",
        )
    ).strip()


def is_atm_place_name(value):
    """
    判斷 Google 地點是不是 ATM
    """
    text = str(
        value or ""
    ).strip().lower()

    if not text:
        return False

    atm_keywords = [
        "atm",
        "自動櫃員機",
        "提款機",
        "自動提款機",
    ]

    return any(
        keyword in text
        for keyword in atm_keywords
    )


def validate_place_address(
    requested_address,
    google_address,
):
    """
    驗證 Places 回傳地址

    第一優先是道路
    第二優先是完整門牌
    附號找不到時允許同一個主門牌
    """
    expected_route, expected_house_number = (
        extract_expected_address_parts(
            requested_address
        )
    )

    normalized_google_address = (
        normalize_address_text(
            google_address
        )
    )

    if expected_route:
        if (
            expected_route
            not in normalized_google_address
        ):
            return (
                False,
                "",
                "Places 回傳道路與定位地址不一致",
            )

    if not expected_house_number:
        return (
            True,
            "route",
            "",
        )

    exact_house_pattern = (
        rf"(?<!\d)"
        rf"{re.escape(expected_house_number)}"
        rf"(?:號|[、,，])"
    )

    if re.search(
        exact_house_pattern,
        normalized_google_address,
    ):
        return (
            True,
            "exact",
            "",
        )

    # 68-2 找不到時允許 Google 記成 68 號
    # 這種情況還需要搭配銀行名稱才能通過
    if "-" in expected_house_number:
        main_house_number = (
            expected_house_number.split(
                "-",
                1,
            )[0]
        )

        main_house_pattern = (
            rf"(?<!\d)"
            rf"{re.escape(main_house_number)}"
            rf"號"
        )

        if re.search(
            main_house_pattern,
            normalized_google_address,
        ):
            return (
                True,
                "main",
                "",
            )

    return (
        False,
        "",
        "Places 回傳門牌與定位地址不一致",
    )


def validate_place_candidate(
    bank_name,
    branch_name,
    requested_address,
    place,
):
    """
    檢查 Places 找到的地點是不是我們要的銀行

    修復資料時不會使用舊座標來判斷
    """
    google_name = (
        get_place_display_name(
            place
        )
    )

    # ATM 不能當成正式分行
    if is_atm_place_name(
        google_name
    ):
        return (
            False,
            None,
            "Places 回傳的是 ATM 不是正式分行",
        )

    google_address = str(
        place.get(
            "formattedAddress",
            "",
        )
    ).strip()

    normalized_bank_name = (
        normalize_place_name(
            bank_name
        )
    )

    normalized_branch_name = (
        normalize_place_name(
            branch_name
        )
    )

    normalized_google_name = (
        normalize_place_name(
            google_name
        )
    )

    # 銀行名稱一定要能對上
    if normalized_bank_name:
        bank_name_matches = (
            normalized_bank_name
            in normalized_google_name
            or normalized_google_name
            in normalized_bank_name
        )

        if not bank_name_matches:
            return (
                False,
                None,
                "Places 回傳銀行名稱不一致",
            )

    (
        address_matches,
        address_quality,
        address_error,
    ) = validate_place_address(
        requested_address,
        google_address,
    )

    if not address_matches:
        return (
            False,
            None,
            address_error,
        )

    branch_name_matches = (
        bool(normalized_branch_name)
        and normalized_branch_name
        in normalized_google_name
    )

    # 地址只對到主門牌時要再確認分行名稱
    if (
        address_quality == "main"
        and normalized_branch_name
        and not branch_name_matches
    ):
        return (
            False,
            None,
            "Places 只有主門牌吻合但分行名稱不同",
        )

    score = 1000

    # 完整門牌最可信
    if address_quality == "exact":
        score -= 500

    # 主門牌吻合也可以但權重比較低
    elif address_quality == "main":
        score -= 300

    elif address_quality == "route":
        score -= 100

    # 分行名稱也對上時再提高可信度
    if branch_name_matches:
        score -= 250

    return (
        True,
        score,
        "",
    )

def build_geocoding_address_variants(address):
    """
    建立 Geocoding 地址搜尋變體

    台灣附號常同時存在 68-2號和68之2號兩種寫法
    """
    address_text = str(
        address or ""
    ).strip()

    if not address_text:
        return []

    address_variants = [
        address_text
    ]

    alternate_address = re.sub(
        r"(\d+)-(\d+)號",
        r"\1之\2號",
        address_text,
    )

    if (
        alternate_address
        and alternate_address
        != address_text
    ):
        address_variants.append(
            alternate_address
        )

    return address_variants

def request_geocoding(
    address,
    api_key,
    max_retries=3,
):
    """
    呼叫 Google Geocoding API

    成功時回傳經緯度與 Google 地址
    附號地址失敗時會自動改用之字格式再搜尋
    """
    address_variants = (
        build_geocoding_address_variants(
            address
        )
    )

    if not address_variants:
        return (
            None,
            "沒有可用的定位地址",
        )

    variant_errors = []

    for search_address in address_variants:
        query_parameters = {
            "address": search_address,
            "key": api_key,
            "language": "zh-TW",
            # 讓 Google 優先判斷台灣地址
            "region": "tw",
            # 再限制一次國家避免找到台灣以外的位置
            "components": "country:TW",
        }

        request_url = (
            f"{GOOGLE_GEOCODING_API_URL}?"
            f"{urlencode(query_parameters)}"
        )

        for attempt in range(
            max_retries
        ):
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
                        response
                        .read()
                        .decode("utf-8")
                    )

                response_data = json.loads(
                    response_text
                )

                status = response_data.get(
                    "status"
                )

                if status == "OK":
                    results = response_data.get(
                        "results",
                        [],
                    )

                    if not results:
                        variant_errors.append(
                            (
                                f"{search_address}："
                                "API 沒有回傳地址結果"
                            )
                        )

                        break

                    rejected_results = []

                    # 搜尋地址可以使用變體
                    # 驗證仍然使用原始候選地址
                    for result in results:
                        (
                            is_valid_result,
                            validation_error,
                        ) = validate_geocoding_result(
                            address,
                            result,
                        )

                        formatted_address = str(
                            result.get(
                                "formatted_address",
                                "",
                            )
                        ).strip()

                        if not is_valid_result:
                            rejected_results.append(
                                formatted_address
                                or validation_error
                            )

                            continue

                        location = (
                            result
                            .get(
                                "geometry",
                                {},
                            )
                            .get(
                                "location",
                                {},
                            )
                        )

                        latitude = location.get(
                            "lat"
                        )

                        longitude = location.get(
                            "lng"
                        )

                        if (
                            latitude is None
                            or longitude is None
                        ):
                            continue

                        return (
                            {
                                "latitude": float(
                                    latitude
                                ),
                                "longitude": float(
                                    longitude
                                ),
                                "formatted_address": (
                                    formatted_address
                                ),
                                "source": (
                                    "geocoding"
                                ),
                                "search_address": (
                                    search_address
                                ),
                            },
                            None,
                        )

                    if rejected_results:
                        rejected_preview = (
                            " | ".join(
                                rejected_results[
                                    :3
                                ]
                            )
                        )

                        variant_errors.append(
                            (
                                f"{search_address}："
                                "Google 回傳結果與定位地址不一致 "
                                f"{rejected_preview}"
                            )
                        )

                    else:
                        variant_errors.append(
                            (
                                f"{search_address}："
                                "API 沒有回傳可用的經緯度"
                            )
                        )

                    # 這個搜尋格式已經有結果但驗證失敗
                    # 接著嘗試下一個地址格式
                    break

                if status == "ZERO_RESULTS":
                    variant_errors.append(
                        (
                            f"{search_address}："
                            "找不到對應地址"
                        )
                    )

                    break

                # 這些狀態可能只是暫時失敗
                # 稍等一下後重新嘗試
                if status in {
                    "UNKNOWN_ERROR",
                    "OVER_QUERY_LIMIT",
                }:
                    wait_seconds = min(
                        2 ** attempt,
                        8,
                    )

                    time.sleep(
                        wait_seconds
                    )

                    continue

                error_message = (
                    response_data.get(
                        "error_message",
                        status
                        or "未知錯誤",
                    )
                )

                variant_errors.append(
                    (
                        f"{search_address}："
                        f"{error_message}"
                    )
                )

                break

            except (
                HTTPError,
                URLError,
                TimeoutError,
                json.JSONDecodeError,
            ) as error:
                # 網路暫時失敗時再試一次
                if (
                    attempt
                    < max_retries - 1
                ):
                    wait_seconds = min(
                        2 ** attempt,
                        8,
                    )

                    time.sleep(
                        wait_seconds
                    )

                    continue

                variant_errors.append(
                    (
                        f"{search_address}："
                        f"{error}"
                    )
                )

    if variant_errors:
        return (
            None,
            " | ".join(
                variant_errors
            ),
        )

    return (
        None,
        "超過最大重試次數",
    )

def request_places_search(
    bank_name,
    branch_name,
    address,
    api_key,
    max_retries=3,
):
    """
    Geocoding 找不到可信地址時改用 Places

    Places 會用銀行名稱和分行名稱一起找
    舊座標不會拿來當搜尋條件
    """
    if not api_key:
        return (
            None,
            "尚未設定 GOOGLE_PLACES_API_KEY",
        )

    search_query = " ".join(
        part
        for part in [
            str(
                bank_name or ""
            ).strip(),
            str(
                branch_name or ""
            ).strip(),
            str(
                address or ""
            ).strip(),
        ]
        if part
    )

    if not search_query:
        return (
            None,
            "沒有可用的 Places 搜尋內容",
        )

    request_body = json.dumps(
        {
            "textQuery": (
                search_query
            ),
            "languageCode": (
                "zh-TW"
            ),
            "regionCode": (
                "TW"
            ),
            "pageSize": 5,
        }
    ).encode(
        "utf-8"
    )

    field_mask = (
        "places.id,"
        "places.displayName,"
        "places.formattedAddress,"
        "places.location"
    )

    for attempt in range(
        max_retries
    ):
        try:
            request = Request(
                GOOGLE_PLACES_TEXT_SEARCH_URL,
                data=request_body,
                method="POST",
                headers={
                    "Content-Type": (
                        "application/json"
                    ),
                    "X-Goog-Api-Key": (
                        api_key
                    ),
                    "X-Goog-FieldMask": (
                        field_mask
                    ),
                    "User-Agent": (
                        "BankSearch-Geocoder/1.0"
                    ),
                },
            )

            with urlopen(
                request,
                timeout=20,
            ) as response:
                response_text = (
                    response
                    .read()
                    .decode("utf-8")
                )

            response_data = json.loads(
                response_text
            )

            places = response_data.get(
                "places",
                [],
            )

            if not places:
                return (
                    None,
                    "Places API 沒有找到候選地點",
                )

            best_candidate = None
            best_score = None
            rejected_places = []

            # 每個候選都重新驗證名稱和地址
            for place in places:
                (
                    is_valid_place,
                    score,
                    validation_error,
                ) = validate_place_candidate(
                    bank_name,
                    branch_name,
                    address,
                    place,
                )

                google_name = (
                    get_place_display_name(
                        place
                    )
                )

                google_address = str(
                    place.get(
                        "formattedAddress",
                        "",
                    )
                ).strip()

                if not is_valid_place:
                    rejected_places.append(
                        (
                            f"{google_name} "
                            f"{google_address} "
                            f"{validation_error}"
                        ).strip()
                    )

                    continue

                location = place.get(
                    "location",
                    {},
                )

                latitude = location.get(
                    "latitude"
                )

                longitude = location.get(
                    "longitude"
                )

                if (
                    latitude is None
                    or longitude is None
                ):
                    continue

                candidate = {
                    "latitude": float(
                        latitude
                    ),
                    "longitude": float(
                        longitude
                    ),
                    "formatted_address": (
                        google_address
                    ),
                    "place_id": str(
                        place.get(
                            "id",
                            "",
                        )
                    ).strip(),
                    "place_name": (
                        google_name
                    ),
                    "source": (
                        "places"
                    ),
                }

                if (
                    best_score is None
                    or score < best_score
                ):
                    best_score = score
                    best_candidate = (
                        candidate
                    )

            if best_candidate:
                return (
                    best_candidate,
                    None,
                )

            if rejected_places:
                rejected_preview = (
                    " | ".join(
                        rejected_places[
                            :3
                        ]
                    )
                )

                return (
                    None,
                    (
                        "Places 找到候選但驗證沒有通過 "
                        f"{rejected_preview}"
                    ),
                )

            return (
                None,
                "Places API 沒有可用的座標",
            )

        except HTTPError as error:
            # Google 暫時出錯時再試一次
            if (
                error.code
                in {
                    429,
                    500,
                    502,
                    503,
                    504,
                }
                and attempt
                < max_retries - 1
            ):
                wait_seconds = min(
                    2 ** attempt,
                    8,
                )

                time.sleep(
                    wait_seconds
                )

                continue

            return (
                None,
                (
                    "Places API HTTP 錯誤 "
                    f"{error.code}"
                ),
            )

        except (
            URLError,
            TimeoutError,
            json.JSONDecodeError,
        ) as error:
            # 網路暫時失敗時再試一次
            if (
                attempt
                < max_retries - 1
            ):
                wait_seconds = min(
                    2 ** attempt,
                    8,
                )

                time.sleep(
                    wait_seconds
                )

                continue

            return (
                None,
                str(error),
            )

    return (
        None,
        "Places API 超過最大重試次數",
    )


def request_branch_places_search(
    bank_name,
    branch_name,
    navigation_locations,
    api_key,
    max_retries=3,
):
    """
    第二階段只搜尋一次分行 Place

    不使用舊 Marker 當搜尋偏好
    避免錯誤舊座標把正確分行排除
    """
    if not api_key:
        return (
            None,
            "尚未設定 GOOGLE_PLACES_API_KEY",
        )

    location_hint = ""

    if navigation_locations:
        location_hint = (
            extract_city_district_hint(
                navigation_locations[0]
            )
        )

    search_query = " ".join(
        part
        for part in [
            str(
                bank_name or ""
            ).strip(),
            str(
                branch_name or ""
            ).strip(),
            location_hint,
        ]
        if part
    )

    if not search_query:
        return (
            None,
            "沒有可用的 Places 搜尋內容",
        )

    request_body = json.dumps(
        {
            "textQuery": (
                search_query
            ),
            "languageCode": (
                "zh-TW"
            ),
            "regionCode": (
                "TW"
            ),
            "pageSize": 5,
        }
    ).encode(
        "utf-8"
    )

    field_mask = (
        "places.id,"
        "places.displayName,"
        "places.formattedAddress,"
        "places.location"
    )

    for attempt in range(
        max_retries
    ):
        try:
            request = Request(
                GOOGLE_PLACES_TEXT_SEARCH_URL,
                data=request_body,
                method="POST",
                headers={
                    "Content-Type": (
                        "application/json"
                    ),
                    "X-Goog-Api-Key": (
                        api_key
                    ),
                    "X-Goog-FieldMask": (
                        field_mask
                    ),
                    "User-Agent": (
                        "BankSearch-Geocoder/2.0"
                    ),
                },
            )

            with urlopen(
                request,
                timeout=20,
            ) as response:
                response_text = (
                    response
                    .read()
                    .decode("utf-8")
                )

            response_data = json.loads(
                response_text
            )

            places = response_data.get(
                "places",
                [],
            )

            if not places:
                return (
                    [],
                    "Places API 沒有找到候選地點",
                )

            return (
                places,
                None,
            )

        except HTTPError as error:
            if (
                error.code
                in {
                    429,
                    500,
                    502,
                    503,
                    504,
                }
                and attempt
                < max_retries - 1
            ):
                wait_seconds = min(
                    2 ** attempt,
                    8,
                )

                time.sleep(
                    wait_seconds
                )

                continue

            return (
                None,
                (
                    "Places API HTTP 錯誤 "
                    f"{error.code}"
                ),
            )

        except (
            URLError,
            TimeoutError,
            json.JSONDecodeError,
        ) as error:
            if (
                attempt
                < max_retries - 1
            ):
                wait_seconds = min(
                    2 ** attempt,
                    8,
                )

                time.sleep(
                    wait_seconds
                )

                continue

            return (
                None,
                str(error),
            )

    return (
        None,
        "Places API 超過最大重試次數",
    )


def haversine_distance_meters(
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
):
    """
    計算兩個座標之間的直線距離
    """
    earth_radius_meters = 6371000

    start_latitude_radians = (
        math.radians(
            start_latitude
        )
    )

    end_latitude_radians = (
        math.radians(
            end_latitude
        )
    )

    latitude_difference = (
        math.radians(
            end_latitude
            - start_latitude
        )
    )

    longitude_difference = (
        math.radians(
            end_longitude
            - start_longitude
        )
    )

    haversine_value = (
        math.sin(
            latitude_difference / 2
        ) ** 2
        + math.cos(
            start_latitude_radians
        )
        * math.cos(
            end_latitude_radians
        )
        * math.sin(
            longitude_difference / 2
        ) ** 2
    )

    central_angle = (
        2
        * math.atan2(
            math.sqrt(
                haversine_value
            ),
            math.sqrt(
                1
                - haversine_value
            ),
        )
    )

    return (
        earth_radius_meters
        * central_angle
    )


def get_place_location(place):
    """
    取得 Places 候選的座標
    """
    location = place.get(
        "location",
        {},
    )

    try:
        latitude = float(
            location.get(
                "latitude"
            )
        )

        longitude = float(
            location.get(
                "longitude"
            )
        )

    except (
        TypeError,
        ValueError,
    ):
        return None

    return {
        "latitude": latitude,
        "longitude": longitude,
    }


def evaluate_branch_place_candidate(
    bank_name,
    branch_name,
    navigation_locations,
    geocoded_locations,
    place,
):
    """
    把分行 Place 跟所有候選門牌一起比對

    地址完全吻合優先
    地址無法直接吻合時才看已驗證座標距離
    """
    google_name = (
        get_place_display_name(
            place
        )
    )

    # ATM 不參與建議導航位置判斷
    if is_atm_place_name(
        google_name
    ):
        return None

    google_address = str(
        place.get(
            "formattedAddress",
            "",
        )
    ).strip()

    normalized_google_name = (
        normalize_place_name(
            google_name
        )
    )

    normalized_bank_name = (
        normalize_place_name(
            bank_name
        )
    )

    normalized_branch_name = (
        normalize_place_name(
            branch_name
        )
    )

    bank_name_matches = (
        bool(
            normalized_bank_name
        )
        and bool(
            normalized_google_name
        )
        and (
            normalized_bank_name
            in normalized_google_name
            or normalized_google_name
            in normalized_bank_name
        )
    )

    if not bank_name_matches:
        return None

    branch_name_matches = (
        bool(
            normalized_branch_name
        )
        and normalized_branch_name
        in normalized_google_name
    )

    exact_matches = []
    main_matches = []

    for (
        location_index,
        navigation_address,
    ) in enumerate(
        navigation_locations
    ):
        (
            address_matches,
            address_quality,
            _,
        ) = validate_place_address(
            navigation_address,
            google_address,
        )

        if not address_matches:
            continue

        if address_quality == "exact":
            exact_matches.append(
                location_index
            )

        elif address_quality == "main":
            main_matches.append(
                location_index
            )

        # 完整門牌對上時可信度最高
    # 同一個 Places 同時涵蓋多個官方門牌時沿用官方地址順序
    if exact_matches:
        matched_index = (
            exact_matches[0]
        )

        score = 0

        if branch_name_matches:
            score -= 100

        return {
            "place": place,
            "matched_index": (
                matched_index
            ),
            "match_method": (
                "exact_address"
            ),
            "score": score,
            "distance_meters": None,
        }

    # 只有一個主門牌候選時才允許使用主門牌判斷
    # 多個附號共用相同主門牌時不能直接猜第一個
    if (
        len(main_matches) == 1
        and branch_name_matches
    ):
        matched_index = (
            main_matches[0]
        )

        return {
            "place": place,
            "matched_index": (
                matched_index
            ),
            "match_method": (
                "main_house"
            ),
            "score": 200,
            "distance_meters": None,
        }

    # 地址格式真的無法直接比對時
    # 才使用已經通過 Geocoding 驗證的候選座標
    place_location = (
        get_place_location(
            place
        )
    )

    if (
        not place_location
        or not branch_name_matches
    ):
        return None

    distance_candidates = []

    for (
        location_index,
        geocoded_location,
    ) in enumerate(
        geocoded_locations
    ):
        if not geocoded_location:
            continue

        distance_meters = (
            haversine_distance_meters(
                geocoded_location[
                    "latitude"
                ],
                geocoded_location[
                    "longitude"
                ],
                place_location[
                    "latitude"
                ],
                place_location[
                    "longitude"
                ],
            )
        )

        distance_candidates.append(
            (
                distance_meters,
                location_index,
            )
        )

    distance_candidates.sort(
        key=lambda item: item[0]
    )

    if not distance_candidates:
        return None

    (
        nearest_distance,
        nearest_index,
    ) = distance_candidates[0]

    second_nearest_distance = (
        distance_candidates[1][0]
        if len(
            distance_candidates
        ) > 1
        else None
    )

    # 80 公尺內才允許用距離作為第二層判斷
    # 如果多個候選距離太接近就不猜哪一個才是正確入口
    distance_is_distinct = (
        second_nearest_distance is None
        or (
            second_nearest_distance
            - nearest_distance
        )
        >= 15
    )

    if (
        nearest_distance <= 80
        and distance_is_distinct
    ):
        return {
            "place": place,
            "matched_index": (
                nearest_index
            ),
            "match_method": (
                "verified_coordinate"
            ),
            "score": (
                400
                + nearest_distance
            ),
            "distance_meters": (
                nearest_distance
            ),
        }

    return None


def select_recommended_navigation_location(
    bank_name,
    branch_name,
    navigation_locations,
    geocoded_locations,
    places,
):
    """
    從 Places 候選中找出可信的分行位置

    回傳的 matched_index 就是建議導航候選
    """
    best_match = None

    for place in places or []:
        place_match = (
            evaluate_branch_place_candidate(
                bank_name,
                branch_name,
                navigation_locations,
                geocoded_locations,
                place,
            )
        )

        if not place_match:
            continue

        if (
            best_match is None
            or place_match[
                "score"
            ]
            < best_match[
                "score"
            ]
        ):
            best_match = (
                place_match
            )

    return best_match

def build_navigation_location_records(
    navigation_locations,
    geocoded_locations,
    recommended_match=None,
):
    """
    建立可以寫入 bank_data.json 的導航位置資料

    官方解析地址永遠保留
    一般候選使用已驗證 Geocoding 座標
    建議導航位置優先使用可信 Places 座標
    """
    recommended_index = None
    recommended_place_id = ""
    recommended_place_location = None

    if recommended_match:
        recommended_index = (
            recommended_match.get(
                "matched_index"
            )
        )

        recommended_place = (
            recommended_match.get(
                "place"
            )
            or {}
        )

        recommended_place_id = str(
            recommended_place.get(
                "id",
                "",
            )
        ).strip()

        recommended_place_location = (
            get_place_location(
                recommended_place
            )
        )

    records = []

    for (
        location_index,
        navigation_address,
    ) in enumerate(
        navigation_locations
    ):
        geocoded_location = (
            geocoded_locations[
                location_index
            ]
            if location_index
            < len(
                geocoded_locations
            )
            else None
        )

        latitude = None
        longitude = None

        if geocoded_location:
            latitude = (
                geocoded_location.get(
                    "latitude"
                )
            )

            longitude = (
                geocoded_location.get(
                    "longitude"
                )
            )

        is_recommended = (
            recommended_index
            == location_index
        )

        # 建議導航位置優先使用正式 Place 座標
        if (
            is_recommended
            and recommended_place_location
        ):
            latitude = (
                recommended_place_location[
                    "latitude"
                ]
            )

            longitude = (
                recommended_place_location[
                    "longitude"
                ]
            )

        records.append(
            {
                "address": (
                    navigation_address
                ),
                "latitude": (
                    latitude
                ),
                "longitude": (
                    longitude
                ),
                "place_id": (
                    recommended_place_id
                    if is_recommended
                    else ""
                ),
                "is_recommended": (
                    is_recommended
                ),
            }
        )

    return records

def print_navigation_location_records(
    navigation_location_records,
):
    """
    印出預計寫入的導航位置資料
    """
    print(
        "  navigation_locations 預覽："
    )

    for (
        location_index,
        location_record,
    ) in enumerate(
        navigation_location_records,
        start=1,
    ):
        print(
            "    "
            f"[{location_index}] "
            f"{location_record['address']}"
        )

        latitude = (
            location_record.get(
                "latitude"
            )
        )

        longitude = (
            location_record.get(
                "longitude"
            )
        )

        if (
            latitude is not None
            and longitude is not None
        ):
            print(
                "        座標："
                f"{latitude}, {longitude}"
            )

        else:
            print(
                "        座標：無可信座標"
            )

        place_id = str(
            location_record.get(
                "place_id",
                "",
            )
        ).strip()

        if place_id:
            print(
                "        Place ID："
                f"{place_id}"
            )

        print(
            "        建議導航位置："
            + (
                "是"
                if location_record.get(
                    "is_recommended"
                )
                else "否"
            )
        )

def inspect_complex_branch(
    bank_name,
    branch_name,
    navigation_locations,
    geocoding_api_key,
    places_api_key,
    sleep_seconds=0.2,
):
    """
    第二階段檢查多門牌分行

    每個候選地址各自驗證 Geocoding
    分行 Places Text Search 只執行一次
    全程只回傳檢查結果不修改資料
    """
    geocoded_locations = []

    print(
        "  候選地址定位檢查："
    )

    for (
        location_index,
        navigation_address,
    ) in enumerate(
        navigation_locations,
        start=1,
    ):
        print(
            "    "
            f"[{location_index}] "
            f"{navigation_address}"
        )

        (
            geocoding_result,
            geocoding_error,
        ) = request_geocoding(
            navigation_address,
            geocoding_api_key,
        )

        geocoded_locations.append(
            geocoding_result
        )

        if geocoding_result:
            print(
                "        Geocoding：成功"
            )

            print(
                "        Google 地址："
                f"{geocoding_result.get('formatted_address', '')}"
            )

            print(
                "        座標："
                f"{geocoding_result['latitude']}, "
                f"{geocoding_result['longitude']}"
            )

        else:
            print(
                "        Geocoding：失敗"
            )

            print(
                "        原因："
                f"{geocoding_error}"
            )

        if (
            sleep_seconds > 0
            and location_index
            < len(
                navigation_locations
            )
        ):
            time.sleep(
                sleep_seconds
            )

    print(
        "  分行 Places 搜尋：1 次"
    )

    (
        places,
        places_error,
    ) = request_branch_places_search(
        bank_name,
        branch_name,
        navigation_locations,
        places_api_key,
    )

    if places is None:
        print(
            "  Places 搜尋失敗："
            f"{places_error}"
        )

        navigation_location_records = (
            build_navigation_location_records(
                navigation_locations,
                geocoded_locations,
            )
        )

        print_navigation_location_records(
            navigation_location_records
        )

        return {
            "geocoded_locations": (
                geocoded_locations
            ),
            "places": [],
            "recommended_match": None,
            "navigation_location_records": (
                navigation_location_records
            ),
            "places_error": (
                places_error
            ),
            "places_search_failed": True,
        }

    if not places:
        print(
            "  Places 沒有找到分行候選"
        )

        if places_error:
            print(
                "  原因："
                f"{places_error}"
            )

        navigation_location_records = (
            build_navigation_location_records(
                navigation_locations,
                geocoded_locations,
            )
        )

        print_navigation_location_records(
            navigation_location_records
        )

        return {
            "geocoded_locations": (
                geocoded_locations
            ),
            "places": [],
            "recommended_match": None,
            "navigation_location_records": (
                navigation_location_records
            ),
            "places_error": (
                places_error
            ),
            "places_search_failed": False,
        }

    print(
        "  Places 候選："
    )

    for (
        place_index,
        place,
    ) in enumerate(
        places,
        start=1,
    ):
        google_name = (
            get_place_display_name(
                place
            )
        )

        google_address = str(
            place.get(
                "formattedAddress",
                "",
            )
        ).strip()

        print(
            "    "
            f"[{place_index}] "
            f"{google_name}"
        )

        print(
            "        地址："
            f"{google_address}"
        )

    recommended_match = (
        select_recommended_navigation_location(
            bank_name,
            branch_name,
            navigation_locations,
            geocoded_locations,
            places,
        )
    )

    if not recommended_match:
        print(
            "  Places 有候選但沒有足夠可信的門牌匹配"
        )

        print(
            "  目前不設定建議導航位置"
        )

        navigation_location_records = (
            build_navigation_location_records(
                navigation_locations,
                geocoded_locations,
            )
        )

        print_navigation_location_records(
            navigation_location_records
        )

        return {
            "geocoded_locations": (
                geocoded_locations
            ),
            "places": places,
            "recommended_match": None,
            "navigation_location_records": (
                navigation_location_records
            ),
            "places_error": None,
            "places_search_failed": False,
        }

    place = (
        recommended_match[
            "place"
        ]
    )

    matched_index = (
        recommended_match[
            "matched_index"
        ]
    )

    google_name = (
        get_place_display_name(
            place
        )
    )

    google_address = str(
        place.get(
            "formattedAddress",
            "",
        )
    ).strip()

    place_id = str(
        place.get(
            "id",
            "",
        )
    ).strip()

    place_location = (
        get_place_location(
            place
        )
    )

    print(
        "  Google 分行地點："
        f"{google_name}"
    )

    print(
        "  Google 分行地址："
        f"{google_address}"
    )

    if place_id:
        print(
            "  Place ID："
            f"{place_id}"
        )

    if place_location:
        print(
            "  Places 座標："
            f"{place_location['latitude']}, "
            f"{place_location['longitude']}"
        )

    print(
        "  匹配方式："
        f"{recommended_match['match_method']}"
    )

    if (
        recommended_match.get(
            "distance_meters"
        )
        is not None
    ):
        print(
            "  匹配距離："
            f"{recommended_match['distance_meters']:.1f} 公尺"
        )

    print(
        "  匹配候選："
        f"[{matched_index + 1}] "
        f"{navigation_locations[matched_index]}"
    )

    print(
        "  建議導航位置："
        f"{navigation_locations[matched_index]}"
    )

    navigation_location_records = (
        build_navigation_location_records(
            navigation_locations,
            geocoded_locations,
            recommended_match,
        )
    )

    print_navigation_location_records(
        navigation_location_records
    )

    return {
        "geocoded_locations": (
            geocoded_locations
        ),
        "places": places,
        "recommended_match": (
            recommended_match
        ),
        "navigation_location_records": (
            navigation_location_records
        ),
        "places_error": None,
        "places_search_failed": False,
    }


def save_progress(
    data_file_path,
    bank_data,
):
    """
    儲存目前處理進度
    """
    write_json_atomically(
        data_file_path,
        bank_data,
    )

def parse_arguments():
    """
    讀取終端機參數
    """
    parser = argparse.ArgumentParser(
        description=(
            "將 bank_data.json 中的分行地址"
            "轉換為經緯度"
        )
    )

    parser.add_argument(
        "--data-file",
        default=str(
            DEFAULT_DATA_FILE_PATH
        ),
        help=(
            "bank_data.json 的完整路徑"
        ),
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help=(
            "本次最多處理幾筆 "
            "第一次建議先使用 --limit 10"
        ),
    )

    parser.add_argument(
        "--sleep",
        type=float,
        default=0.2,
        help=(
            "每次 API 請求之間等待幾秒"
        ),
    )

    parser.add_argument(
        "--save-every",
        type=int,
        default=20,
        help=(
            "每處理幾筆就儲存一次進度"
        ),
    )

    process_mode = (
        parser.add_mutually_exclusive_group()
    )

    process_mode.add_argument(
        "--overwrite",
        action="store_true",
        help=(
            "重新處理已經具有經緯度的分行"
        ),
    )

    process_mode.add_argument(
        "--repair-complex",
        action="store_true",
        help=(
            "驗證並修復多門牌與複雜地址"
        ),
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "不寫入 bank_data.json "
            "repair-complex 模式仍會呼叫 Google API 做驗證"
        ),
    )

    parser.add_argument(
        "--bank-code",
        default=None,
        help=(
            "只處理指定銀行代碼"
        ),
    )

    parser.add_argument(
        "--branch-code",
        default=None,
        help=(
            "只處理指定分行代碼"
        ),
    )

    return parser.parse_args()


def main():
    """
    批次轉換分行地址的主程式
    """
    arguments = (
        parse_arguments()
    )
    data_file_path = Path(
    arguments.data_file
    ).resolve()

    geocoding_api_key = None
    places_api_key = None

    # 一般 Dry Run 不呼叫 Google
    # repair-complex Dry Run 會進行第二階段驗證
    should_call_google = (
        not arguments.dry_run
        or arguments.repair_complex
    )

    if should_call_google:
        geocoding_api_key = (
            os.getenv(
                "GOOGLE_GEOCODING_API_KEY"
            )
        )

        places_api_key = (
            os.getenv(
                "GOOGLE_PLACES_API_KEY"
            )
        )

        if not geocoding_api_key:
            print(
                "錯誤：尚未設定 "
                "GOOGLE_GEOCODING_API_KEY"
            )

            print(
                "請確認 backend/.env 裡面有設定"
            )

            return 1

        if (
            arguments.repair_complex
            and not places_api_key
        ):
            print(
                "錯誤：第二階段多門牌檢查需要 "
                "GOOGLE_PLACES_API_KEY"
            )

            print(
                "請確認 backend/.env 裡面有設定"
            )

            return 1

        if (
            not arguments.repair_complex
            and not places_api_key
        ):
            print(
                "提醒：目前沒有設定 "
                "GOOGLE_PLACES_API_KEY"
            )

            print(
                "Geocoding 失敗時將無法使用 Places 備用搜尋"
            )

    if not data_file_path.exists():
        print(
            "錯誤：找不到資料檔案 "
            f"{data_file_path}"
        )

        return 1

    if (
        arguments.limit is not None
        and arguments.limit <= 0
    ):
        print(
            "錯誤：limit 必須大於 0"
        )

        return 1

    if arguments.save_every <= 0:
        print(
            "錯誤：save-every 必須大於 0"
        )

        return 1

    bank_data = (
        load_json_file(
            data_file_path
        )
    )

    banks = bank_data.get(
        "banks",
        [],
    )

    if not isinstance(
        banks,
        list,
    ):
        print(
            "錯誤：bank_data.json 的 banks "
            "不是陣列"
        )

        return 1

    processed_count = 0
    success_count = 0
    geocoding_success_count = 0
    places_success_count = 0
    failure_count = 0
    skipped_count = 0
    navigation_locations_written_count = 0
    recommended_navigation_count = 0
    top_level_coordinates_updated_count = 0

    try:
        for bank in banks:
            bank_code = str(
                bank.get(
                    "code",
                    "",
                )
            ).strip()

            bank_name = str(
                bank.get(
                    "name",
                    "",
                )
            ).strip()

            # 指定銀行代碼時其他銀行完全不碰
            if (
                arguments.bank_code
                and bank_code
                != str(
                    arguments.bank_code
                ).strip()
            ):
                continue

            branches = bank.get(
                "branches",
                [],
            )

            for branch in branches:
                branch_code = str(
                    branch.get(
                        "code",
                        "",
                    )
                ).strip()

                branch_name = str(
                    branch.get(
                        "name",
                        "",
                    )
                ).strip()

                address = str(
                    branch.get(
                        "address",
                        "",
                    )
                ).strip()

                # 指定分行代碼時其他分行完全不碰
                if (
                    arguments.branch_code
                    and branch_code
                    != str(
                        arguments.branch_code
                    ).strip()
                ):
                    continue

                complex_address = (
                    is_complex_address(
                        address
                    )
                )

                # repair-complex 只處理複雜地址
                if (
                    arguments.repair_complex
                    and not complex_address
                ):
                    skipped_count += 1

                    continue

                # 一般模式預設不碰已經有座標的分行
                # repair-complex 可以重新確認複雜地址
                if (
                    not arguments.overwrite
                    and not arguments.repair_complex
                    and has_valid_coordinates(
                        branch
                    )
                ):
                    skipped_count += 1

                    continue

                # 已經達到這次設定的處理上限
                if (
                    arguments.limit
                    is not None
                    and processed_count
                    >= arguments.limit
                ):
                    break

                processed_count += 1

                print(
                    f"[{processed_count}] "
                    f"{bank_code} {bank_name} / "
                    f"{branch_code} {branch_name}"
                )

                if not address:
                    failure_count += 1

                    continue

                navigation_locations = (
                    extract_navigation_locations(
                        address
                    )
                )

                geocoding_address = (
                    clean_geocoding_address(
                        address
                    )
                )

                print(
                    "  原始地址："
                    f"{address}"
                )

                if navigation_locations:
                    print(
                        "  解析位置："
                        f"{len(navigation_locations)}"
                    )

                    for (
                        location_index,
                        navigation_location,
                    ) in enumerate(
                        navigation_locations,
                        start=1,
                    ):
                        print(
                            "    "
                            f"[{location_index}] "
                            f"{navigation_location}"
                        )

                    print(
                        "  第一候選地址："
                        f"{navigation_locations[0]}"
                    )

                else:
                    print(
                        "  解析位置：0"
                    )

                    print(
                        "  第一候選地址："
                        f"{geocoding_address}"
                    )

                if has_valid_coordinates(
                    branch
                ):
                    print(
                        "  目前座標："
                        f"{branch.get('latitude')}, "
                        f"{branch.get('longitude')}"
                    )

                # 第二階段多門牌檢查
                # Dry Run 只預覽正式模式才寫入 JSON
                if arguments.repair_complex:
                    # 完全沒有可用門牌時才略過第二階段
                    if not navigation_locations:
                        print(
                            "  複雜地址沒有解析出可信候選"
                        )

                        print(
                            "  暫時不進行第二階段定位"
                        )

                        if arguments.dry_run:
                            print(
                                "  Dry run 不會修改資料"
                            )

                        continue

                    # 只有一個唯一門牌也要驗證目前座標
                    if len(navigation_locations) == 1:
                        print(
                            "  複雜地址解析後只有一個唯一門牌"
                        )

                        print(
                            "  仍進行第二階段定位驗證"
                        )

                    inspection_result = (
                        inspect_complex_branch(
                            bank_name,
                            branch_name,
                            navigation_locations,
                            geocoding_api_key,
                            places_api_key,
                            arguments.sleep,
                        )
                    )

                    navigation_location_records = (
                        inspection_result.get(
                            "navigation_location_records",
                            [],
                        )
                    )

                    if arguments.dry_run:
                        print(
                            "  Dry run 不會修改資料"
                        )

                        continue

                    if inspection_result.get(
                        "places_search_failed"
                    ):
                        failure_count += 1

                        print(
                            "  Places 搜尋失敗"
                        )

                        print(
                            "  本筆不寫入 navigation_locations"
                        )

                        print(
                            "  原本分行資料保留不變"
                        )

                        continue

                    branch[
                        "navigation_locations"
                    ] = navigation_location_records

                    navigation_locations_written_count += 1

                    recommended_location = next(
                        (
                            location_record
                            for location_record
                            in navigation_location_records
                            if location_record.get(
                                "is_recommended"
                            )
                        ),
                        None,
                    )

                    if recommended_location:
                        recommended_navigation_count += 1

                        recommended_latitude = (
                            recommended_location.get(
                                "latitude"
                            )
                        )

                        recommended_longitude = (
                            recommended_location.get(
                                "longitude"
                            )
                        )

                        if (
                            recommended_latitude is not None
                            and recommended_longitude is not None
                        ):
                            old_latitude = (
                                branch.get(
                                    "latitude"
                                )
                            )

                            old_longitude = (
                                branch.get(
                                    "longitude"
                                )
                            )

                            branch[
                                "latitude"
                            ] = recommended_latitude

                            branch[
                                "longitude"
                            ] = recommended_longitude

                            if (
                                old_latitude
                                != recommended_latitude
                                or old_longitude
                                != recommended_longitude
                            ):
                                top_level_coordinates_updated_count += 1

                            print(
                                "  已更新分行導航座標："
                                f"{recommended_latitude}, "
                                f"{recommended_longitude}"
                            )

                        else:
                            print(
                                "  建議導航位置沒有可信座標"
                            )

                            print(
                                "  原本分行座標保留不變"
                            )

                    else:
                        print(
                            "  沒有可信建議導航位置"
                        )

                        print(
                            "  原本分行座標保留不變"
                        )

                    if (
                        processed_count
                        % arguments.save_every
                        == 0
                    ):
                        save_progress(
                            data_file_path,
                            bank_data,
                        )

                        print(
                            "  已儲存目前進度"
                        )

                    continue
                    # 只有一個唯一門牌也要驗證目前座標
                    if len(navigation_locations) == 1:
                        print(
                            "  複雜地址解析後只有一個唯一門牌"
                        )

                        print(
                            "  仍進行第二階段定位驗證"
                        )

                    inspect_complex_branch(
                        bank_name,
                        branch_name,
                        navigation_locations,
                        geocoding_api_key,
                        places_api_key,
                        arguments.sleep,
                    )

                    print(
                        "  Dry run 不會修改資料"
                    )

                    continue

                # 一般 Dry run 維持原本只列資料
                if arguments.dry_run:
                    print(
                        "  Dry run 不會修改資料"
                    )

                    continue

                old_latitude = (
                    branch.get(
                        "latitude"
                    )
                )

                old_longitude = (
                    branch.get(
                        "longitude"
                    )
                )

                # 第一層先用 Geocoding API
                (
                    coordinates,
                    geocoding_error,
                ) = request_geocoding(
                    geocoding_address,
                    geocoding_api_key,
                )

                places_error = None

                if coordinates:
                    geocoding_success_count += 1

                    print(
                        "  Geocoding 驗證成功"
                    )

                else:
                    print(
                        "  Geocoding 驗證失敗："
                        f"{geocoding_error}"
                    )

                    # Geocoding 不可信時才使用 Places
                    if places_api_key:
                        print(
                            "  改用 Places 搜尋銀行地點"
                        )

                        (
                            coordinates,
                            places_error,
                        ) = request_places_search(
                            bank_name,
                            branch_name,
                            geocoding_address,
                            places_api_key,
                        )

                        if coordinates:
                            places_success_count += 1

                            print(
                                "  Places 驗證成功"
                            )

                if coordinates:
                    branch["latitude"] = (
                        coordinates[
                            "latitude"
                        ]
                    )

                    branch["longitude"] = (
                        coordinates[
                            "longitude"
                        ]
                    )

                    success_count += 1

                    source = (
                        coordinates.get(
                            "source",
                            "",
                        )
                    )

                    if (
                        source
                        == "geocoding"
                    ):
                        print(
                            "  定位來源：Geocoding API"
                        )

                    elif (
                        source
                        == "places"
                    ):
                        print(
                            "  定位來源：Places API"
                        )

                    google_place_name = (
                        coordinates.get(
                            "place_name",
                            "",
                        )
                    )

                    if google_place_name:
                        print(
                            "  Google 地點："
                            f"{google_place_name}"
                        )

                    formatted_address = (
                        coordinates.get(
                            "formatted_address",
                            "",
                        )
                    )

                    if formatted_address:
                        print(
                            "  Google 地址："
                            f"{formatted_address}"
                        )

                    place_id = (
                        coordinates.get(
                            "place_id",
                            "",
                        )
                    )

                    if place_id:
                        print(
                            "  Place ID："
                            f"{place_id}"
                        )

                    print(
                        "  成功："
                        f"{branch['latitude']}, "
                        f"{branch['longitude']}"
                    )

                    if (
                        old_latitude
                        is not None
                        or old_longitude
                        is not None
                    ):
                        print(
                            "  原本座標："
                            f"{old_latitude}, "
                            f"{old_longitude}"
                        )

                else:
                    failure_count += 1

                    error_parts = []

                    if geocoding_error:
                        error_parts.append(
                            (
                                "Geocoding："
                                f"{geocoding_error}"
                            )
                        )

                    if places_error:
                        error_parts.append(
                            (
                                "Places："
                                f"{places_error}"
                            )
                        )

                    if (
                        not places_api_key
                    ):
                        error_parts.append(
                            (
                                "Places："
                                "沒有設定 API Key"
                            )
                        )

                    combined_error = (
                        " | ".join(
                            error_parts
                        )
                        or "定位失敗"
                    )

                    print(
                        "  最後失敗："
                        f"{combined_error}"
                    )

                    # 兩邊都失敗時保留舊座標
                    print(
                        "  原本座標沒有修改"
                    )

                # 每處理指定筆數就先存一次
                # 程式中斷時就不用全部重來
                if (
                    processed_count
                    % arguments.save_every
                    == 0
                ):
                    save_progress(
                        data_file_path,
                        bank_data,
                    )

                    print(
                        "  已儲存目前進度"
                    )

                if arguments.sleep > 0:
                    time.sleep(
                        arguments.sleep
                    )

            if (
                arguments.limit
                is not None
                and processed_count
                >= arguments.limit
            ):
                break

    except KeyboardInterrupt:
        if arguments.dry_run:
            print(
                "\n收到中斷指令"
            )

        else:
            print(
                "\n收到中斷指令 "
                "正在儲存目前進度"
            )

    finally:
        # Dry run 完全不會寫入任何檔案
        if not arguments.dry_run:
            save_progress(
                data_file_path,
                bank_data,
            )

    print("")

    if arguments.dry_run:
        print(
            "Dry run 完成"
        )

        print(
            f"本次候選：{processed_count}"
        )

        print(
            f"略過：{skipped_count}"
        )

        if arguments.repair_complex:
            print(
                "repair-complex 已呼叫 Google API 做第二階段驗證"
            )

        print(
            "沒有修改 bank_data.json"
        )

    if arguments.repair_complex:
        print(
            "複雜地址修復完成"
        )

        print(
            f"本次處理：{processed_count}"
        )

        print(
            "寫入 navigation_locations："
            f"{navigation_locations_written_count}"
        )

        print(
            "可信建議導航位置："
            f"{recommended_navigation_count}"
        )

        print(
            "更新分行頂層座標："
            f"{top_level_coordinates_updated_count}"
        )

        print(
            f"失敗：{failure_count}"
        )

        print(
            f"略過：{skipped_count}"
        )

        return 0

    print(
        "地址轉換完成"
    )

    print(
        f"本次處理：{processed_count}"
    )

    print(
        f"成功：{success_count}"
    )

    print(
        "Geocoding 成功："
        f"{geocoding_success_count}"
    )

    print(
        "Places 備用成功："
        f"{places_success_count}"
    )

    print(
        f"失敗：{failure_count}"
    )

    print(
        f"略過已有座標：{skipped_count}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(
        main()
    )