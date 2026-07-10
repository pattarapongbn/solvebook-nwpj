from app.core.config import settings


def to_thb(price: float | None, currency: str | None) -> float | None:
    """แปลงราคาเป็นบาทตามเรตใน settings — คืน None ถ้าสกุลเงินไม่รู้จัก"""
    if price is None or currency is None:
        return None
    rate = {
        "USD": settings.usd_thb_rate,
        "CNY": settings.cny_thb_rate,
        "THB": 1.0,
    }.get(currency)
    if rate is None:
        return None
    return round(price * rate, 2)
