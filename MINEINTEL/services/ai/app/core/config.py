import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "mineintel-ai-service"
    VERSION: str = "0.1.0"
    ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Abstraction configuration
    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: str = ""
    EMBEDDING_PROVIDER: str = "mock"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    OCR_ENGINE: str = "tesseract"

    STORAGE_DIR: str = os.path.join(os.path.dirname(__file__), "../../../storage")
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "../../../data")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
