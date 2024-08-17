# config/urls.py
from django.urls import path
from bank import views  # 從 `bank` 模組導入 `views`

urlpatterns = [
    path('api/banks/', views.get_banks, name='get_banks'),
    path('api/branches/<str:bank_code>/', views.get_branches, name='get_branches'),
    path('api/branch/<str:branch_code>/', views.get_branch_details, name='get_branch_details'),
]
