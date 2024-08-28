import json
from import_data import import_data, CSV_FILE_PATH, JSON_OUTPUT_PATH

def convert_csv_to_json(csv_file_path=CSV_FILE_PATH, json_file_path=JSON_OUTPUT_PATH):
    # 使用 import_data 函數處理 CSV 數據
    data = import_data(csv_file_path)
    
    if data:
        # 將數據寫入 JSON 文件
        with open(json_file_path, mode='w', encoding='utf-8') as json_file:
            json.dump({"banks": data}, json_file, indent=4, ensure_ascii=False)
        
        print(f"CSV 文件已成功轉換為 JSON 文件並保存到 {json_file_path}")
    else:
        print("轉換失敗，沒有數據被處理。")

if __name__ == "__main__":
    convert_csv_to_json()