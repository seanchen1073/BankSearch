from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('bank.urls')),  # 保留原有的 API 路徑
    path('', include('bank.urls')),  # 新增這行來處理不帶 'api/' 前綴的 URL
    path('', RedirectView.as_view(url='/api/', permanent=False)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)