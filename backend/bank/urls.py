from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_root, name='api_root'),
    path('banks/', views.get_banks, name='get_banks'),
    path('banks/<str:bank_code>/branches/', views.get_branches, name='get_branches'),
    path('<str:bank_code>/<str:branch_code>/', views.get_branch_details, name='get_branch_details'),
    path('<str:bank_code>/<str:branch_code>/<str:bank_name>-<str:branch_name>.html', views.bank_branch_detail, name='bank_branch_detail'),
]
