"""สร้างตารางทั้งหมด และ seed ข้อมูลตัวอย่างสำหรับ dev

Usage:
    python -m app.db.init_db          # create tables
    python -m app.db.init_db --seed   # create tables + sample data
"""

import sys
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.product import (
    Country,
    Marketplace,
    Product,
    ProductSnapshot,
    ThailandCheck,
    ThailandStatus,
)

SAMPLE_PRODUCTS = [
    {
        "external_id": "B0XAMPLE01",
        "marketplace": Marketplace.AMAZON_US,
        "country": Country.US,
        "name": "Portable Blender USB Rechargeable 380ml",
        "category": "Kitchen",
        "product_url": "https://www.amazon.com/dp/B0XAMPLE01",
        "price": 19.99,
        "currency": "USD",
        "orders": (42, 310, 1250),
        "thailand": ThailandStatus.FOUND,
    },
    {
        "external_id": "B0XAMPLE02",
        "marketplace": Marketplace.AMAZON_US,
        "country": Country.US,
        "name": "Pet Hair Remover Roller Reusable",
        "category": "Pet",
        "product_url": "https://www.amazon.com/dp/B0XAMPLE02",
        "price": 12.95,
        "currency": "USD",
        "orders": (85, 640, 2870),
        "thailand": ThailandStatus.NOT_FOUND,
    },
    {
        "external_id": "B0XAMPLE03",
        "marketplace": Marketplace.AMAZON_US,
        "country": Country.US,
        "name": "Camping Lantern Solar Rechargeable Collapsible",
        "category": "Sports",
        "product_url": "https://www.amazon.com/dp/B0XAMPLE03",
        "price": 24.50,
        "currency": "USD",
        "orders": (18, 120, 540),
        "thailand": ThailandStatus.NOT_FOUND,
    },
    {
        "external_id": "689001234567",
        "marketplace": Marketplace.ALIBABA_1688,
        "country": Country.CN,
        "name": "หมอนรองคอเมมโมรี่โฟม Travel Neck Pillow",
        "category": "Home",
        "product_url": "https://detail.1688.com/offer/689001234567.html",
        "price": 18.50,
        "currency": "CNY",
        "orders": (150, 980, 4100),
        "thailand": ThailandStatus.FOUND,
    },
    {
        "external_id": "689007654321",
        "marketplace": Marketplace.ALIBABA_1688,
        "country": Country.CN,
        "name": "Car Seat Gap Organizer ที่เก็บของข้างเบาะรถยนต์",
        "category": "Automotive",
        "product_url": "https://detail.1688.com/offer/689007654321.html",
        "price": 9.90,
        "currency": "CNY",
        "orders": (60, 420, 1800),
        "thailand": None,  # ยังไม่เคยเช็ค
    },
    {
        "external_id": "B0XAMPLE04",
        "marketplace": Marketplace.AMAZON_US,
        "country": Country.US,
        "name": "Baby Silicone Feeding Set BPA Free",
        "category": "Baby",
        "product_url": "https://www.amazon.com/dp/B0XAMPLE04",
        "price": 16.99,
        "currency": "USD",
        "orders": (25, 190, 880),
        "thailand": ThailandStatus.FOUND,
    },
]


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def seed(db: Session) -> None:
    if db.execute(select(Product.id).limit(1)).first() is not None:
        print("Database already has products — skipping seed")
        return

    today = date.today()
    for item in SAMPLE_PRODUCTS:
        product = Product(
            external_id=item["external_id"],
            marketplace=item["marketplace"],
            country=item["country"],
            name=item["name"],
            category=item["category"],
            product_url=item["product_url"],
        )
        db.add(product)
        db.flush()

        orders_1d, orders_7d, orders_30d = item["orders"]
        # snapshot ย้อนหลัง 7 วัน ให้มีข้อมูล history ไว้ทดสอบกราฟ
        for days_ago in range(6, -1, -1):
            snap_date = today - timedelta(days=days_ago)
            drift = 1 + (days_ago % 3 - 1) * 0.02  # ราคาแกว่งเล็กน้อยในแต่ละวัน
            db.add(
                ProductSnapshot(
                    product_id=product.id,
                    snapshot_date=snap_date,
                    price=round(item["price"] * drift, 2),
                    currency=item["currency"],
                    orders_1d=orders_1d,
                    orders_7d=orders_7d,
                    orders_30d=orders_30d,
                    revenue_30d=round(item["price"] * orders_30d, 2),
                    rating=4.5,
                    review_count=orders_30d // 10,
                )
            )

        if item["thailand"] is not None:
            db.add(
                ThailandCheck(
                    product_id=product.id,
                    check_date=today,
                    status=item["thailand"],
                    matched_url=(
                        "https://shopee.co.th/product/12345/67890"
                        if item["thailand"] == ThailandStatus.FOUND
                        else None
                    ),
                    matched_price_thb=(
                        399.0 if item["thailand"] == ThailandStatus.FOUND else None
                    ),
                    seller_count=(
                        7 if item["thailand"] == ThailandStatus.FOUND else 0
                    ),
                )
            )

    db.commit()
    print(f"Seeded {len(SAMPLE_PRODUCTS)} products with 7-day snapshots")


def main() -> None:
    create_tables()
    print("Tables created")
    if "--seed" in sys.argv:
        with SessionLocal() as db:
            seed(db)


if __name__ == "__main__":
    main()
