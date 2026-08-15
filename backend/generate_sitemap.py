import json
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape


BASE_URL = "https://banksearchbysean.zeabur.app"

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = PROJECT_ROOT / "backend" / "bank" / "bank_data.json"
SITEMAP_FILE = PROJECT_ROOT / "frontend" / "public" / "sitemap.xml"


def build_branch_url(bank, branch):
    bank_code = str(bank.get("code", "")).strip()
    bank_name = str(bank.get("name", "")).strip()

    branch_code = str(branch.get("code", "")).strip()
    branch_name = str(branch.get("name", "")).strip()

    filename = f"{bank_name}-{branch_name}.html"

    encoded_filename = quote(filename, safe=".()-_")

    return f"{BASE_URL}/{bank_code}/{branch_code}/{encoded_filename}"


def generate_sitemap():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    banks = data.get("banks", [])

    urls = [
        """  <url>
    <loc>{}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>""".format(escape(f"{BASE_URL}/"))
    ]

    branch_count = 0

    for bank in banks:
        branches = bank.get("branches", [])

        for branch in branches:
            branch_url = build_branch_url(bank, branch)

            urls.append(
                """  <url>
    <loc>{}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>""".format(escape(branch_url))
            )

            branch_count += 1

    sitemap = """<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{}
</urlset>
""".format("\n\n".join(urls))

    SITEMAP_FILE.write_text(sitemap, encoding="utf-8")

    print("Sitemap generated successfully.")
    print(f"Banks: {len(banks)}")
    print(f"Branches: {branch_count}")
    print(f"Total URLs: {branch_count + 1}")
    print(f"Output: {SITEMAP_FILE}")


if __name__ == "__main__":
    generate_sitemap()