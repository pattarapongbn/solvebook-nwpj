from dataclasses import dataclass

from app.models.product import Country, Marketplace


@dataclass
class CrawledProduct:
    """ผลลัพธ์หนึ่งรายการจาก crawler — ข้อมูลดิบก่อนแปลงเป็น Product + Snapshot"""

    external_id: str
    marketplace: Marketplace
    country: Country
    name: str
    product_url: str
    price: float
    currency: str
    category: str | None = None
    image_url: str | None = None
    # ประมาณการยอดขาย (Amazon บอกเฉพาะ "N+ bought in past month")
    orders_30d: int | None = None
    rating: float | None = None
    review_count: int | None = None

    @property
    def orders_7d(self) -> int | None:
        return round(self.orders_30d / 30 * 7) if self.orders_30d is not None else None

    @property
    def orders_1d(self) -> int | None:
        return round(self.orders_30d / 30) if self.orders_30d is not None else None

    @property
    def revenue_30d(self) -> float | None:
        if self.orders_30d is None:
            return None
        return round(self.price * self.orders_30d, 2)
