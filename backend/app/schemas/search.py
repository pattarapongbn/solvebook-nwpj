from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.product import Country, Marketplace, ThailandStatus

SalesPeriod = Literal["1d", "7d", "30d"]


class SearchParams(BaseModel):
    keyword: str | None = None
    category: str | None = None
    country: Country | None = None
    marketplace: Marketplace | None = None
    price_min: float | None = Field(default=None, ge=0)
    price_max: float | None = Field(default=None, ge=0)
    period: SalesPeriod = "7d"
    thailand_status: ThailandStatus | None = None
    min_orders: int | None = Field(default=None, ge=0)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)


class ProductListItem(BaseModel):
    """แถวใน result list — เฉพาะ field ที่หน้า list ต้องใช้"""

    id: int
    name: str
    image_url: str | None
    marketplace: Marketplace
    country: Country
    category: str | None
    price: float | None
    currency: str | None
    orders: int | None
    thailand_status: ThailandStatus | None
    is_favorite: bool
    last_updated: date | None


class SearchResponse(BaseModel):
    items: list[ProductListItem]
    total: int
    page: int
    page_size: int


class SnapshotPoint(BaseModel):
    snapshot_date: date
    price: float
    currency: str
    orders_1d: int | None
    orders_7d: int | None
    orders_30d: int | None
    revenue_30d: float | None
    rating: float | None
    review_count: int | None


class ThailandCheckPoint(BaseModel):
    check_date: date
    status: ThailandStatus
    matched_url: str | None
    matched_price_thb: float | None
    seller_count: int | None


class ProductDetail(BaseModel):
    id: int
    external_id: str
    name: str
    image_url: str | None
    product_url: str | None
    marketplace: Marketplace
    country: Country
    category: str | None
    created_at: datetime
    is_favorite: bool
    snapshots: list[SnapshotPoint]
    thailand_checks: list[ThailandCheckPoint]


class FavoriteItem(BaseModel):
    id: int
    product: ProductListItem
    note: str | None
    created_at: datetime


class FavoriteCreate(BaseModel):
    product_id: int
    note: str | None = None
