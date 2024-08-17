# bank/views.py
from django.http import JsonResponse
from .models import Bank, Branch

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
