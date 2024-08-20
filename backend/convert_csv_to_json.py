import csv
import json

def convert_csv_to_json():
    # 定義 CSV 文件路徑
    csv_file_path = r"C:\Users\Joe\BankSearchData\banks.csv"
    
    # 定義輸出的 JSON 文件路徑
    json_file_path = r"C:\Users\Joe\BankSearch\backend\bank\bank_data.json"
    
    # 打開 CSV 文件並讀取
    with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        data = [row for row in csv_reader]
    
    # 將數據寫入 JSON 文件
    with open(json_file_path, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)
    
    print(f"CSV 文件已成功轉換為 JSON 文件並保存到 {json_file_path}")

if __name__ == "__main__":
    convert_csv_to_json()