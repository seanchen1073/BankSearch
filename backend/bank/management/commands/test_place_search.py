import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


PLACES_NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby"


class Command(BaseCommand):
    help = "測試 Google Places Nearby Search 並顯示 Marker 周圍的 Google Place"

    def add_arguments(self, parser):
        parser.add_argument(
            "--lat",
            required=True,
            type=float,
            help="目前資料的緯度",
        )

        parser.add_argument(
            "--lng",
            required=True,
            type=float,
            help="目前資料的經度",
        )

        parser.add_argument(
            "--radius",
            type=float,
            default=50.0,
            help="搜尋半徑 單位為公尺",
        )

    def handle(self, *args, **options):
        api_key = settings.GOOGLE_PLACES_API_KEY

        if not api_key:
            raise CommandError(
                "找不到 GOOGLE_PLACES_API_KEY 請確認 backend/.env"
            )

        latitude = options["lat"]
        longitude = options["lng"]
        radius = options["radius"]

        payload = {
            "maxResultCount": 20,
            "rankPreference": "DISTANCE",
            "languageCode": "zh-TW",
            "regionCode": "TW",
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude,
                    },
                    "radius": radius,
                }
            },
        }

        request_body = json.dumps(payload).encode("utf-8")

        request = Request(
            PLACES_NEARBY_SEARCH_URL,
            data=request_body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": (
                    "places.id,"
                    "places.displayName,"
                    "places.formattedAddress,"
                    "places.location,"
                    "places.primaryType,"
                    "places.types"
                ),
            },
        )

        self.stdout.write("")
        self.stdout.write(
            self.style.NOTICE(
                "搜尋 Marker 周圍的 Google Places"
            )
        )

        self.stdout.write(
            f"Marker 座標：{latitude}, {longitude}"
        )

        self.stdout.write(
            f"搜尋半徑：{radius:.0f} 公尺"
        )

        self.stdout.write("")

        try:
            with urlopen(request, timeout=20) as response:
                response_body = response.read().decode("utf-8")
                data = json.loads(response_body)

        except HTTPError as error:
            error_body = error.read().decode(
                "utf-8",
                errors="replace",
            )

            raise CommandError(
                f"Places API HTTP 錯誤 {error.code}\n{error_body}"
            ) from error

        except URLError as error:
            raise CommandError(
                f"無法連線到 Google Places API：{error}"
            ) from error

        except json.JSONDecodeError as error:
            raise CommandError(
                "Google Places API 回傳的資料不是有效 JSON"
            ) from error

        places = data.get("places", [])

        if not places:
            self.stdout.write(
                self.style.WARNING(
                    "Marker 周圍找不到 Google Place"
                )
            )

            return

        self.stdout.write(
            self.style.SUCCESS(
                f"找到 {len(places)} 筆附近 Place"
            )
        )

        for index, place in enumerate(places, start=1):
            display_name = (
                place
                .get("displayName", {})
                .get("text", "")
            )

            formatted_address = place.get(
                "formattedAddress",
                "",
            )

            place_id = place.get(
                "id",
                "",
            )

            location = place.get(
                "location",
                {},
            )

            place_latitude = location.get(
                "latitude",
                "",
            )

            place_longitude = location.get(
                "longitude",
                "",
            )

            primary_type = place.get(
                "primaryType",
                "",
            )

            place_types = place.get(
                "types",
                [],
            )

            self.stdout.write("")
            self.stdout.write(
                self.style.SUCCESS(
                    f"候選 {index}"
                )
            )

            self.stdout.write(
                f"Google 名稱：{display_name}"
            )

            self.stdout.write(
                f"Google 地址：{formatted_address}"
            )

            self.stdout.write(
                f"Place ID：{place_id}"
            )

            self.stdout.write(
                f"Google 座標：{place_latitude}, {place_longitude}"
            )

            self.stdout.write(
                f"主要類型：{primary_type}"
            )

            self.stdout.write(
                f"所有類型：{', '.join(place_types)}"
            )