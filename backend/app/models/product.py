import enum
from datetime import date, datetime, timezone

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Marketplace(str, enum.Enum):
    AMAZON_US = "amazon_us"
    ALIBABA_1688 = "1688"
    SHOPEE_TH = "shopee_th"


class Country(str, enum.Enum):
    US = "US"
    CN = "CN"


class ThailandStatus(str, enum.Enum):
    FOUND = "found"
    NOT_FOUND = "not_found"


class Product(Base):
    """สินค้าจาก marketplace ต้นทาง — ข้อมูลคงที่ (identity) ส่วนราคา/ยอดขายอยู่ใน snapshot"""

    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("marketplace", "external_id", name="uq_product_source"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[str] = mapped_column(String(128), index=True)
    marketplace: Mapped[Marketplace] = mapped_column(Enum(Marketplace), index=True)
    country: Mapped[Country] = mapped_column(Enum(Country), index=True)
    name: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(64), index=True)
    image_url: Mapped[str | None] = mapped_column(Text)
    product_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    snapshots: Mapped[list["ProductSnapshot"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    thailand_checks: Mapped[list["ThailandCheck"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    favorite: Mapped["Favorite | None"] = relationship(
        back_populates="product", cascade="all, delete-orphan", uselist=False
    )


class ProductSnapshot(Base):
    """Daily snapshot ของราคา/ยอดขาย — append only ห้าม update ย้อนหลัง"""

    __tablename__ = "product_snapshots"
    __table_args__ = (
        UniqueConstraint("product_id", "snapshot_date", name="uq_snapshot_per_day"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    snapshot_date: Mapped[date] = mapped_column(Date, index=True)
    price: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    orders_1d: Mapped[int | None] = mapped_column(Integer)
    orders_7d: Mapped[int | None] = mapped_column(Integer)
    orders_30d: Mapped[int | None] = mapped_column(Integer)
    revenue_30d: Mapped[float | None] = mapped_column(Float)
    rating: Mapped[float | None] = mapped_column(Float)
    review_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(back_populates="snapshots")


class ThailandCheck(Base):
    """ผลการเช็ค Shopee Thailand รายวัน — append only"""

    __tablename__ = "thailand_checks"
    __table_args__ = (UniqueConstraint("product_id", "check_date", name="uq_check_per_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    check_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[ThailandStatus] = mapped_column(Enum(ThailandStatus))
    matched_url: Mapped[str | None] = mapped_column(Text)
    matched_price_thb: Mapped[float | None] = mapped_column(Float)
    seller_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(back_populates="thailand_checks")


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), unique=True, index=True)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(back_populates="favorite")
