from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.crawlers.base import CrawledProduct
from app.db.base import Base
from app.models.product import Country, Marketplace, Product, ProductSnapshot
from app.services.snapshot_service import SnapshotService


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as session:
        yield session


def make_item(price: float = 19.99) -> CrawledProduct:
    return CrawledProduct(
        external_id="B0TEST123",
        marketplace=Marketplace.AMAZON_US,
        country=Country.US,
        name="Portable Blender",
        product_url="https://www.amazon.com/dp/B0TEST123",
        price=price,
        currency="USD",
        orders_30d=1000,
    )


def test_record_creates_product_and_snapshot(db):
    assert SnapshotService(db).record(make_item()) is True
    assert db.execute(select(Product)).scalar_one().external_id == "B0TEST123"
    snap = db.execute(select(ProductSnapshot)).scalar_one()
    assert snap.price == 19.99
    assert snap.orders_30d == 1000


def test_record_same_day_is_idempotent(db):
    service = SnapshotService(db)
    assert service.record(make_item()) is True
    # ครั้งที่สองวันเดียวกัน — ห้ามเขียนทับ ห้ามเพิ่มแถว
    assert service.record(make_item(price=25.0)) is False
    snaps = db.execute(select(ProductSnapshot)).scalars().all()
    assert len(snaps) == 1
    assert snaps[0].price == 19.99  # ค่าเดิมคงอยู่ (append-only)


def test_record_new_day_appends(db):
    service = SnapshotService(db)
    yesterday = date.today() - timedelta(days=1)
    assert service.record(make_item(price=18.0), snapshot_date=yesterday) is True
    assert service.record(make_item(price=19.99)) is True
    snaps = db.execute(select(ProductSnapshot)).scalars().all()
    assert len(snaps) == 2
    assert db.execute(select(Product)).scalar_one()  # product เดียว ไม่ซ้ำ
