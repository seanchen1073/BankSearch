import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from pathlib import Path
from django.core.exceptions import ObjectDoesNotExist
from .models import Bank, Branch

# 定義 BASE_DIR 為專案根目錄
BASE_DIR = Path(__file__).resolve().parent.parent

@require_http_methods(["GET"])
def get_banks(request):
    """獲取所有銀行的 API"""
    banks = Bank.objects.all().values('code', 'name')
    return JsonResponse(list(banks), safe=False)

@require_http_methods(["GET"])
def get_branches(request, bank_code):
    """根據銀行代碼獲取所有分行的 API"""
    branches = Branch.objects.filter(bank__code=bank_code).values('code', 'name')
    return JsonResponse(list(branches), safe=False)

@require_http_methods(["GET"])
def get_branch_details(request, branch_code):
    """根據分行代碼獲取分行詳細資訊的 API"""
    try:
        branch = Branch.objects.select_related('bank').get(code=branch_code)
        data = {
            'bank_name': branch.bank.name,
            'bank_code': branch.bank.code,
            'branch_name': branch.name,
            'branch_code': branch.code,
            'address': branch.address,
            'tel': branch.tel
        }
        return JsonResponse(data)
    except ObjectDoesNotExist:
        return JsonResponse({'error': '分行不存在'}, status=404)

@require_http_methods(["GET"])
def get_bank_data(request):
    """從 JSON 文件中獲取銀行資料的 API"""
    json_file_path = Path(__file__).resolve().parent / 'bank_data.json'  # 修改這行
    try:
        with open(json_file_path, 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
        return JsonResponse(data, safe=False)
    except FileNotFoundError:
        return JsonResponse({'error': '文件未找到'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON 解析錯誤'}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'發生未知錯誤: {str(e)}'}, status=500)

@require_http_methods(["GET"])
def get_all_bank_data(request):
    """獲取所有銀行及其分行資料的 API"""
    banks = Bank.objects.prefetch_related('branches').all()
    data = []
    for bank in banks:
        bank_data = {
            'code': bank.code,
            'name': bank.name,
            'branches': list(bank.branches.values('code', 'name'))
        }
        data.append(bank_data)
    return JsonResponse(data, safe=False)

@require_http_methods(["GET"])
def all_bank_data(request):
    return get_all_bank_data(request)

def api_root(request):
    return JsonResponse({
        "message": "Welcome to the Bank API",
        "endpoints": {
            "banks": "/api/banks/",
            "branches": "/api/branches/<bank_code>/",
            "branch_details": "/api/branch/<branch_code>/",
            "bank_data": "/api/bank-data/",
            "all_bank_data": "/api/all-bank-data/",
            "bank_data_json": "/api/bank_data.json"  # 新增這行
        }
    })