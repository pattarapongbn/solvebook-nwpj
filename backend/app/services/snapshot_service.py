from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crawlers.base import CrawledProduct
from app.models.product import Product, ProductSnapshot


class SnapshotService:
    """บันทึกผล crawl เป็น daily snapshot — append only, วันละหนึ่งแถวต่อสินค้า"""

    def __init__(self, db: Session):
        self.db = db

    def record(self, item: CrawledProduct, snapshot_date: date | None = None) -> bool:
        """คืน True ถ้าสร้าง snapshot ใหม่, False ถ้าวันนี้มีอยู่แล้ว (ไม่แตะของเดิม)"""
        snapshot_date = snapshot_date or date.today()

        product = self.db.execute(
            select(Product).where(
                Product.marketplace == item.marketplace,
                Product.external_id == item.external_id,
            )
        ).scalar_one_or_none()

        if product is None:
            product = Product(
                external_id=item.external_id,
                marketplace=item.marketplace,
                country=item.country,
                name=item.name,
                category=item.category,
                image_url=item.image_url,
                product_url=item.product_url,
            )
            self.db.add(product)
            self.db.flush()
        else:
            # identity fields อัปเดตได้ (ชื่อ/รูปเปลี่ยนบนต้นทาง) — history อยู่ใน snapshot ไม่แตะ
            product.name = item.name
            product.image_url = item.image_url or product.image_url
            product.product_url = item.product_url or product.product_url
            if item.category:
                product.category = item.category

        exists = self.db.execute(
            select(ProductSnapshot.id).where(
                ProductSnapshot.product_id == product.id,
                ProductSnapshot.snapshot_date == snapshot_date,
            )
        ).first()
        if exists:
            self.db.commit()
            return False

        self.db.add(
            ProductSnapshot(
                product_id=product.id,
                snapshot_date=snapshot_date,
                price=item.price,
                currency=item.currency,
                orders_1d=item.orders_1d,
                orders_7d=item.orders_7d,
                orders_30d=item.orders_30d,
                revenue_30d=item.revenue_30d,
                rating=item.rating,
                review_count=item.review_count,
            )
        )
        self.db.commit()
        return True
