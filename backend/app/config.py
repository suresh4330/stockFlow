import os


class Settings:
    app_name: str = os.getenv("APP_NAME", "StockFlow API")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./stockflow.db")
    jwt_secret: str = os.getenv("JWT_SECRET", "change_this_secret")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    auto_create_tables: bool = os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true"
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:5173").split(",")
        if origin.strip()
    ]


settings = Settings()

