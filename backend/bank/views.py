import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from pathlib import Path
from django.core.exceptions import ObjectDoesNotExist
from .models import Bank, Branch

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
def get_branch_details(request, bank_code, branch_code):
    """根據銀行代碼和分行代碼獲取分行詳細資訊的 API"""
    try:
        branch = Branch.objects.select_related('bank').get(bank__code=bank_code, code=branch_code)
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
        return JsonResponse({'error': '銀行或分行不存在'}, status=404)

@require_http_methods(["GET"])
def bank_branch_detail(request, bank_code, branch_code, bank_name, branch_name):
    """提供特定銀行和分行的詳細資訊"""
    try:
        bank = Bank.objects.filter(code=bank_code).first()  # 使用 filter() 獲取銀行
        branch = Branch.objects.filter(code=branch_code, bank=bank).first()  # 使用 filter() 獲取分行

        if not branch:
            return JsonResponse({'error': '分行不存在'}, status=404)

        if bank.name != bank_name or branch.name != branch_name:
            return JsonResponse({'error': '銀行或分行名稱不匹配'}, status=400)

        data = {
            'bank_code': bank_code,
            'branch_code': branch_code,
            'bank_name': bank.name,
            'branch_name': branch.name,
            'address': branch.address,
            'tel': branch.tel
        }
        return JsonResponse(data)
    
    except Bank.DoesNotExist:
        return JsonResponse({'error': '銀行不存在'}, status=404)

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
