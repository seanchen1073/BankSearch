from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import BankViewSet, BranchViewSet

router = DefaultRouter()
router.register(r'banks', BankViewSet)
router.register(r'branches', BranchViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]