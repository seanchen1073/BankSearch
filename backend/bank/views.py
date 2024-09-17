import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from pathlib import Path
from django.core.exceptions import ObjectDoesNotExist
from .models import Bank, Branch

# 設定 BASE_DIR 為 `backend` 資料夾的上層目錄
BASE_DIR = Path(__file__).resolve().parent.parent / 'bank'

@require_http_methods(["GET"])
def get_banks(request):
    """獲取所有銀行的 API，包含每家銀行的分行資料"""
    # 讀取 bank_data.json 文件
    file_path = BASE_DIR / 'bank_data.json'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            banks = data.get('banks', [])
            # 提取銀行資料
            bank_list = []
            for bank in banks:
                bank_info = {
                    'code': bank.get('code'),
                    'name': bank.get('name'),
                    'address': bank.get('address'),
                    'tel': bank.get('tel'),
                    'branches': bank.get('branches', [])  # 包含分行資料
                }
                bank_list.append(bank_info)
            return JsonResponse(bank_list, safe=False)
    except FileNotFoundError:
        return JsonResponse({'error': '銀行資料文件未找到'}, status=500)
    except json.JSONDecodeError:
        return JsonResponse({'error': '解析銀行資料文件錯誤'}, status=500)

@require_http_methods(["GET"])
def get_branches(request, bank_code):
    """根據銀行代碼獲取所有分行的 API"""
    # 讀取 bank_data.json 文件
    file_path = BASE_DIR / 'bank_data.json'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            branches = []
            for bank in data.get('banks', []):
                if bank['code'] == bank_code:
                    branches = bank.get('branches', [])
                    break
            return JsonResponse(branches, safe=False)
    except FileNotFoundError:
        return JsonResponse({'error': '銀行資料文件未找到'}, status=500)
    except json.JSONDecodeError:
        return JsonResponse({'error': '解析銀行資料文件錯誤'}, status=500)

@require_http_methods(["GET"])
def get_branch_details(request, bank_code, branch_code):
    """根據銀行代碼和分行代碼獲取分行詳細資訊的 API"""
    file_path = BASE_DIR / 'bank_data.json'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for bank in data.get('banks', []):
                if bank['code'] == bank_code:
                    for branch in bank.get('branches', []):
                        if branch['code'] == branch_code:
                            data = {
                                'bank_name': bank['name'],
                                'bank_code': bank['code'],
                                'branch_name': branch['name'],
                                'branch_code': branch['code'],
                                'address': branch['address'],
                                'tel': branch['tel']
                            }
                            return JsonResponse(data)
            return JsonResponse({'error': '分行不存在'}, status=404)
    except FileNotFoundError:
        return JsonResponse({'error': '銀行資料文件未找到'}, status=500)
    except json.JSONDecodeError:
        return JsonResponse({'error': '解析銀行資料文件錯誤'}, status=500)

@require_http_methods(["GET"])
def bank_branch_detail(request, bank_code, branch_code, bank_name, branch_name):
    """提供特定銀行和分行的詳細資訊"""
    file_path = BASE_DIR / 'bank_data.json'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for bank in data.get('banks', []):
                if bank['code'] == bank_code and bank['name'] == bank_name:
                    for branch in bank.get('branches', []):
                        if branch['code'] == branch_code and branch['name'] == branch_name:
                            data = {
                                'bank_code': bank_code,
                                'branch_code': branch_code,
                                'bank_name': bank_name,
                                'branch_name': branch_name,
                                'address': branch['address'],
                                'tel': branch['tel']
                            }
                            return JsonResponse(data)
            return JsonResponse({'error': '銀行或分行名稱不匹配'}, status=400)
    except FileNotFoundError:
        return JsonResponse({'error': '銀行資料文件未找到'}, status=500)
    except json.JSONDecodeError:
        return JsonResponse({'error': '解析銀行資料文件錯誤'}, status=500)

def api_root(request):
    """API 入口，提供可用端點"""
    return JsonResponse({
        "message": "Welcome to the Bank API",
        "endpoints": {
            "banks": "/api/banks/",
            "branches": "/api/banks/<bank_code>/branches/",
            "branch_details": "/api/<bank_code>/<branch_code>/",
            "bank_branch_detail": "/<bank_code>/<branch_code>/<bank_name>-<branch_name>.html"
        }
    })
