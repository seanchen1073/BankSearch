import os
import django
import csv
from phone_utils import format_phone_number

# 設定 Django 環境變數
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from bank.models import Bank, Branch

# CSV 文件路徑
CSV_FILE_PATH = r"C:\Users\Joe\BankSearchData\banks.csv"

def remove_company_suffixes(name):
    """移除名稱中的「股份有限公司」和「有限公司」"""
    if not name:
        return ""
    return name.replace("股份有限公司", "").replace("有限公司", "").strip()

def import_data():
    """從 CSV 文件導入數據並處理"""
    count = 0
    branch_keywords = ["銀行", "合作社", "處理中心", "辦事處"]  # 定義分行關鍵字
    try:
        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)

            print("CSV 標題:", reader.fieldnames)

            for row in reader:
                try:
                    # 獲取每一行的數據
                    bank_code = row['銀行代碼']
                    branch_code = row['分行代碼']
                    full_name = row['機構名稱']
                    address = row['地址']
                    tel = row['電話']

                    # 格式化電話號碼
                    formatted_tel = format_phone_number(tel)

                    # 移除「股份有限公司」和「有限公司」
                    full_name = remove_company_suffixes(full_name)

                    # 分離銀行名稱和分行名稱
                    bank_name = ""
                    branch_name = ""

                    # 根據關鍵字分離銀行名稱和分行名稱
                    for keyword in branch_keywords:
                        if keyword in full_name:
                            parts = full_name.split(keyword, 1)  # 只分割一次
                            bank_name = parts[0].strip()
                            branch_name = parts[1].strip() if len(parts) > 1 else ""  # 確保分行名稱存在
                            break
                    else:
                        bank_name = full_name  # 如果沒有找到關鍵字，則全名作為銀行名稱

                    # 再次移除銀行名稱和分行名稱中的公司後綴
                    bank_name = remove_company_suffixes(bank_name)
                    branch_name = remove_company_suffixes(branch_name)

                    # 獲取或創建銀行實例
                    bank, created = Bank.objects.get_or_create(
                        code=bank_code,
                        defaults={
                            'name': bank_name,
                            'address': address,
                            'tel': formatted_tel
                        }
                    )

                    # 創建分行實例
                    Branch.objects.create(
                        bank=bank,
                        code=branch_code,
                        name=branch_name,
                        address=address,
                        tel=formatted_tel
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
    # 導入數據
    import_data()