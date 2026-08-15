from django.urls import path

from . import views


urlpatterns = [
    # API 首頁
    path(
        "",
        views.api_root,
        name="api_root",
    ),

    # 取得銀行清單 不包含所有分行
    path(
        "banks/",
        views.get_banks,
        name="get_banks",
    ),

    # 使用者選擇銀行後才取得該銀行的分行
    path(
        "banks/<str:bank_code>/branches/",
        views.get_branches,
        name="get_branches",
    ),

    # 根據使用者位置取得最近分行
    # 必須放在下方動態路由之前
    # 避免 branches/nearby 被誤判成銀行代碼與分行代碼
    path(
        "branches/nearby/",
        views.get_nearby_branches,
        name="get_nearby_branches",
    ),

    # 使用者要開 Google 地圖時才查 Google Place
    # 平常搜尋銀行和分行時不會呼叫這支 API
    path(
        "places/resolve/",
        views.resolve_google_place,
        name="resolve_google_place",
    ),

    # 根據銀行代碼與分行代碼取得詳細資料
    path(
        "<str:bank_code>/<str:branch_code>/",
        views.get_branch_details,
        name="get_branch_details",
    ),

    # 含銀行名稱與分行名稱的完整網址
    path(
        (
            "<str:bank_code>/"
            "<str:branch_code>/"
            "<str:bank_name>-<str:branch_name>.html"
        ),
        views.bank_branch_detail,
        name="bank_branch_detail",
    ),
]