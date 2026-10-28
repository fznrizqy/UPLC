from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "UPLC : Unified Pharmacy Learning Center"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "supersecretkey_for_jwt_change_in_production_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Server / LAN settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:admin@localhost:5432/lab_elearning"
    
    # Local / Serverless Storage directories
    STORAGE_DIR: str = os.getenv(
        "STORAGE_DIR",
        "/tmp/storage" if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") else str(BASE_DIR.parent / "storage")
    )
    UPLOAD_MAX_FILE_SIZE_MB: int = 200      # 200 MB for PDF/PPT
    UPLOAD_MAX_VIDEO_SIZE_MB: int = 2000    # 2 GB for Video recordings
    UPLOAD_MAX_IMAGE_SIZE_MB: int = 10      # 10 MB for Quiz Question Images
    
    @property
    def FILES_DIR(self) -> Path:
        p = Path(self.STORAGE_DIR) / "files"
        p.mkdir(parents=True, exist_ok=True)
        return p
        
    @property
    def VIDEOS_DIR(self) -> Path:
        p = Path(self.STORAGE_DIR) / "videos"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def IMAGES_DIR(self) -> Path:
        p = Path(self.STORAGE_DIR) / "images"
        p.mkdir(parents=True, exist_ok=True)
        return p

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
