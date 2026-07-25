from pydantic import field_validator
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

    # --- ร้านค้า / การรับชำระเงิน ---
    shop_name: str = "ร้านป้าศรี"
    promptpay_target: str = "0987263206"  # เบอร์พร้อมเพย์ หรือเลข 13 หลัก
    payment_window_minutes: int = 15
    # ความลับสำหรับ webhook แจ้งเงินเข้าจาก Zapier — ว่าง = ไม่ตรวจ (dev เท่านั้น)
    bank_webhook_secret: str = ""
    # โทเคนสำหรับหน้า /admin — ว่าง = ไม่ตรวจ (dev เท่านั้น)
    admin_token: str = ""

    # --- การจัดส่ง ---
    fulfillment_provider: str = "manual"
    default_parcel_weight_gram: int = 600
    default_parcel_width_cm: int = 15
    default_parcel_length_cm: int = 20
    default_parcel_height_cm: int = 10

    @field_validator(
        "database_url",
        "redis_url",
        "cors_origins",
        "promptpay_target",
        "bank_webhook_secret",
        "admin_token",
        "fulfillment_provider",
        mode="before",
    )
    @classmethod
    def _strip_whitespace(cls, value: object) -> object:
        # secret ที่ paste จากมือถือมักติด newline มาด้วย — กัน "database \"postgres\\n\" does not exist"
        return value.strip() if isinstance(value, str) else value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
