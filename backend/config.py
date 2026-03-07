# backend/config.py

from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./career_platform.db"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Groq
    GROQ_API_KEY: str = ""

    # Paths
    MODELS_PATH: str = "../trained_models"

    # Model settings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    LLM_MODEL: str = "llama-3.1-8b-instant"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure models path is absolute
if not os.path.isabs(settings.MODELS_PATH):
    settings.MODELS_PATH = str(Path(__file__).parent / settings.MODELS_PATH)
