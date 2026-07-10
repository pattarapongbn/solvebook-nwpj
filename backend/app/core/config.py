from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Scout API"
    database_url: str = "postgresql+psycopg2://scout:scout@localhost:5432/scout"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:3000"

    # อัตราแลกเปลี่ยนเป็นบาท — fix ไว้ก่อนใน MVP, override ได้ผ่าน env
    usd_thb_rate: float = 36.50
    cny_thb_rate: float = 5.10

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
