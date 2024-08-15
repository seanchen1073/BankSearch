import os
import django
import csv

# 設置 Django 環境
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from bank.models import Bank  # 導入你的模型

# 使用環境變量或直接指定 CSV 文件路徑
CSV_FILE_PATH = r"C:\Users\Joe\BankSearchData\banks.csv"

def import_data():
    with open(CSV_FILE_PATH, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            Bank.objects.create(
                code=row['code'],    # 這裡的 'code' 和 'name' 等字段需要與 CSV 文件的列名一致
                name=row['name'],
                # 根據你的模型和 CSV 結構添加其他字段
            )

if __name__ == "__main__":
    import_data()
    print("Data import completed.")
