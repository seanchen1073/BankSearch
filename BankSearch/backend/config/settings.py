import os
from pathlib import Path

# BASE_DIR 是專案根目錄的路徑
BASE_DIR = Path(__file__).resolve().parent.parent

# 安裝的應用程式
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',  # Django REST framework
    'corsheaders',     # 處理跨域請求
    'bank',             # 你的自訂應用程式
]

# 中介軟體
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 處理 CORS 請求
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 允許所有來源的跨域請求（僅用於開發環境）
CORS_ALLOW_ALL_ORIGINS = True

# 資料庫設定
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 靜態檔案設定
STATIC_URL = '/static/'

# 上傳檔案設定
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 模板設定
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # 這是你存放模板文件的目錄
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# 項目名稱和時區
ROOT_URLCONF = 'config.urls'  # 確保這裡填寫了正確的專案名稱
LANGUAGE_CODE = 'zh-tw'
TIME_ZONE = 'Asia/Taipei'

# 安全設定
SECRET_KEY = 'your_secret_key'  # 確保這裡填寫了適合你的專案的密鑰
DEBUG = True
ALLOWED_HOSTS = []  # 若要部署到生產環境，應該填寫有效的主機名稱

# 其他設定...
