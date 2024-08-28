import os
import django
import csv
import json
from collections import OrderedDict
from phone_utils import format_phone_number

# 設定 Django 環境變數
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from bank.models import Bank, Branch

# CSV 文件路徑
CSV_FILE_PATH = r"C:\Users\Joe\BankSearchData\banks.csv"
# JSON 輸出文件路徑
JSON_OUTPUT_PATH = r"C:\Users\Joe\BankSearch\backend\bank\bank_data.json"

def remove_company_suffixes(name):
    """移除名稱中的「股份有限公司」和「有限公司」"""
    if not name:
        return ""
    return name.replace("股份有限公司", "").replace("有限公司", "").strip()

def process_csv_data(csv_file_path):
    """處理 CSV 數據並返回結構化的銀行數據"""
    banks_data = {}
    count = 0
    branch_keywords = ["銀行", "合作社", "處理中心", "辦事處"]
    skipped_records = []
    duplicate_records = set()

    with open(csv_file_path, 'r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        for row in reader:
            count += 1
            try:
                bank_code = row['銀行代碼']
                branch_code = row['分行代碼']
                full_name = row['機構名稱']
                address = row['地址']
                tel = row['電話']

                # 檢查重複記錄
                record_key = f"{bank_code}_{branch_code}"
                if record_key in duplicate_records:
                    continue
                duplicate_records.add(record_key)

                formatted_tel = format_phone_number(tel)
                full_name = remove_company_suffixes(full_name)

                bank_name = ""
                branch_name = ""

                for keyword in branch_keywords:
                    if keyword in full_name:
                        parts = full_name.split(keyword, 1)
                        bank_name = parts[0].strip() + keyword
                        branch_name = parts[1].strip() if len(parts) > 1 else ""
                        break
                else:
                    bank_name = full_name

                bank_name = remove_company_suffixes(bank_name)
                branch_name = remove_company_suffixes(branch_name)

                # 更新或創建銀行信息
                if bank_code not in banks_data:
                    banks_data[bank_code] = OrderedDict([
                        ("code", bank_code),
                        ("name", bank_name),
                        ("address", address),
                        ("tel", formatted_tel),
                        ("branches", [])
                    ])

                # 添加分行信息
                banks_data[bank_code]["branches"].append({
                    "code": branch_code,
                    "name": branch_name,
                    "address": address,
                    "tel": formatted_tel
                })

                if count % 100 == 0:
                    print(f"已處理 {count} 條記錄")

            except KeyError as e:
                print(f"錯誤: 在第 {count} 行無法找到列 {e}")
                print("可用的列:", row.keys())
                skipped_records.append(count)
            except Exception as e:
                print(f"處理第 {count} 行時出錯: {e}")
                skipped_records.append(count)

    print(f"總共處理了 {count} 條記錄")
    print(f"生成了 {len(banks_data)} 個銀行對象")
    print(f"跳過了 {len(skipped_records)} 條記錄")
    print(f"發現 {len(duplicate_records) - len(banks_data)} 條重複記錄")

    return list(banks_data.values())

def import_data(csv_file_path=CSV_FILE_PATH, json_output_path=None):
    """從 CSV 文件導入數據，處理並可選擇性地輸出為 JSON"""
    try:
        banks_data = process_csv_data(csv_file_path)
        
        # 如果提供了 JSON 輸出路徑，則將數據寫入 JSON 文件
        if json_output_path:
            with open(json_output_path, 'w', encoding='utf-8') as json_file:
                json.dump({"banks": banks_data}, json_file, ensure_ascii=False, indent=2)
            print(f"數據已成功寫入 {json_output_path}")
        
        return banks_data

    except Exception as e:
        print(f"處理數據時出錯: {e}")
        return None

if __name__ == "__main__":
    # 導入數據並輸出為 JSON
    import_data(CSV_FILE_PATH, JSON_OUTPUT_PATH)