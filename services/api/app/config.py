from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/rampready",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    jwt_secret: str = Field(default="change-me-in-production", alias="JWT_SECRET")
    jwt_expire_minutes: int = Field(default=1440, alias="JWT_EXPIRE_MINUTES")
    nws_user_agent: str = Field(
        default="(rampready.local, contact@example.com)", alias="NWS_USER_AGENT"
    )
    enable_open_meteo: bool = Field(default=False, alias="ENABLE_OPEN_METEO")
    open_meteo_api_key: str | None = Field(default=None, alias="OPEN_METEO_API_KEY")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    chat_enabled: bool = Field(default=True, alias="CHAT_ENABLED")
    chat_candidate_limit: int = Field(default=5, alias="CHAT_CANDIDATE_LIMIT")
    chat_source_timeout_seconds: float = Field(default=8.0, alias="CHAT_SOURCE_TIMEOUT_SECONDS")
    chat_openai_timeout_seconds: float = Field(default=20.0, alias="CHAT_OPENAI_TIMEOUT_SECONDS")
    chat_use_openai_in_tests: bool = Field(default=False, alias="CHAT_USE_OPENAI_IN_TESTS")
    default_region: str = Field(default="tampa-bay", alias="DEFAULT_REGION")
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:19006", alias="CORS_ORIGINS"
    )
    admin_email: str = Field(default="admin@rampready.local", alias="ADMIN_EMAIL")
    admin_password: str = Field(default="admin123!", alias="ADMIN_PASSWORD")


@lru_cache
def get_settings() -> Settings:
    return Settings()
