import os
import django
import csv
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from bank.models import Bank, Branch

CSV_FILE_PATH = r"C:\Users\Joe\BankSearchData\banks.csv"

def import_data():
    count = 0
    try:
        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            
            print("CSV 標題:", reader.fieldnames)

            for row in reader:
                try:
                    bank_code = row['銀行代碼']
                    branch_code = row['分行代碼']
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
                    count += 1
                    if count % 100 == 0:
                        print(f"已處理 {count} 條記錄")

                except KeyError as e:
                    print(f"錯誤: 在第 {count+1} 行無法找到列 {e}")
                    print("可用的列:", row.keys())
                except Exception as e:
                    print(f"處理第 {count+1} 行時出錯: {e}")

    except KeyboardInterrupt:
        print("\n導入過程被用戶中斷。")
    except Exception as e:
        print(f"發生錯誤: {e}")
    finally:
        print(f"總共處理了 {count} 條記錄。")

if __name__ == "__main__":
    import_data()