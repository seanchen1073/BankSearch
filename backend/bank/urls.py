from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_root, name='api_root'),
    path('banks/', views.get_banks, name='get_banks'),
    path('branches/<str:bank_code>/', views.get_branches, name='get_branches'),
    path('branch/<str:branch_code>/', views.get_branch_details, name='get_branch_details'),
    path('bank-data/', views.get_bank_data, name='get_bank_data'),
    path('all-bank-data/', views.all_bank_data, name='all_bank_data'),
    path('bank_data.json', views.get_bank_data, name='get_bank_data_json'),
    path('api/<str:bank_code>/<str:branch_code>/<str:bank_name>-<str:branch_name>.html', views.bank_branch_detail, name='bank_branch_detail'),
]