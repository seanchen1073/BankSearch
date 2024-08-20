# bank/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/banks/', views.get_banks, name='get_banks'),
    path('api/branches/<str:bank_code>/', views.get_branches, name='get_branches'),
    path('api/branch/<str:branch_code>/', views.get_branch_details, name='get_branch_details'),
    path('api/bank-data/', views.get_bank_data, name='get_bank_data'),
    path('api/all-bank-data/', views.get_all_bank_data, name='get_all_bank_data'),
]