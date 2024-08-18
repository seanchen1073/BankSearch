# bank/views.py
import json
from django.http import JsonResponse
from pathlib import Path

# 定義 BASE_DIR
BASE_DIR = Path(__file__).resolve().parent.parent

def get_banks(request):
    banks = Bank.objects.all().values('code', 'name')
    return JsonResponse(list(banks), safe=False)

def get_branches(request, bank_code):
    branches = Branch.objects.filter(bank__code=bank_code).values('code', 'name')
    return JsonResponse(list(branches), safe=False)

def get_branch_details(request, branch_code):
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
