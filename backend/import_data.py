import os
import django
import csv

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from bank.models import Bank, Branch

CSV_FILE_PATH = r"C:\Users\Joe\BankSearchData\banks.csv"

def import_data():
    with open(CSV_FILE_PATH, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            bank_code = row['總機構代號']
            branch_code = row['機構代號']
            full_name = row['機構名稱']
            address = row['地址']
            tel = row['電話']

            # 分離銀行名稱和分行名稱
            bank_name = full_name.split(maxsplit=1)[0]
            branch_name = full_name[len(bank_name):].strip()

            # 獲取或創建銀行
            bank, created = Bank.objects.get_or_create(
                code=bank_code,
                defaults={
                    'name': bank_name,
                    'address': address,
                    'tel': tel
                }
            )

            # 創建分行
            Branch.objects.create(
                bank=bank,
                code=branch_code,
                name=branch_name,
                address=address,
                tel=tel
            )

if __name__ == "__main__":
    import_data()
    print("Data import completed.")