import os
from pathlib import Path

# BASE_DIR 是项目根目录的路径
BASE_DIR = Path(__file__).resolve().parent.parent

# 安装的应用程序
INSTALLED_APPS = [
    # ...其他应用...
    'rest_framework',
    'corsheaders',
    'api',
]

# 中间件
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...其他中间件...
]

# 允许所有来源的跨域请求（仅用于开发环境）
CORS_ALLOW_ALL_ORIGINS = True

# 数据库设置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 其他设置...
