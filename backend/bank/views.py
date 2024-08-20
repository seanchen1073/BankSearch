# bank/views.py
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from pathlib import Path
from django.core.exceptions import ObjectDoesNotExist
from .models import Bank, Branch

# 定義 BASE_DIR
BASE_DIR = Path(__file__).resolve().parent.parent

@require_http_methods(["GET"])
def get_banks(request):
    banks = Bank.objects.all().values('code', 'name')
    return JsonResponse(list(banks), safe=False)

@require_http_methods(["GET"])
def get_branches(request, bank_code):
    branches = Branch.objects.filter(bank__code=bank_code).values('code', 'name')
    return JsonResponse(list(branches), safe=False)

@require_http_methods(["GET"])
def get_branch_details(request, branch_code):
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
    json_file_path = BASE_DIR / 'bank' / 'bank_data.json'
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
