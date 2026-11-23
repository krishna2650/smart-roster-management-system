import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "datastraw-super-secret-production-key-2026")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/datastraw_roster")
    DB_NAME = os.getenv("DB_NAME", "datastraw_roster")
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("FLASK_ENV") == "development"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
