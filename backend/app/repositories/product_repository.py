from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.product import (
    Favorite,
    Product,
    ProductSnapshot,
    ThailandCheck,
    ThailandStatus,
)
from app.schemas.search import SearchParams

# แถวผลลัพธ์ของ query ค้นหา: (Product, ProductSnapshot | None, ThailandCheck | None, favorite_id | None)
SearchRow = tuple[Product, ProductSnapshot | None, ThailandCheck | None, int | None]


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def _latest_snapshot_join(self) -> Select:
        """Products joined กับ snapshot ล่าสุด + thailand check ล่าสุด + favorite"""
        latest_snap = (
            select(
                ProductSnapshot.product_id,
                func.max(ProductSnapshot.snapshot_date).label("max_date"),
            )
            .group_by(ProductSnapshot.product_id)
            .subquery()
        )
        latest_check = (
            select(
                ThailandCheck.product_id,
                func.max(ThailandCheck.check_date).label("max_date"),
            )
            .group_by(ThailandCheck.product_id)
            .subquery()
        )
        return (
            select(Product, ProductSnapshot, ThailandCheck, Favorite.id)
            .outerjoin(latest_snap, latest_snap.c.product_id == Product.id)
            .outerjoin(
                ProductSnapshot,
                (ProductSnapshot.product_id == Product.id)
                & (ProductSnapshot.snapshot_date == latest_snap.c.max_date),
            )
            .outerjoin(latest_check, latest_check.c.product_id == Product.id)
            .outerjoin(
                ThailandCheck,
                (ThailandCheck.product_id == Product.id)
                & (ThailandCheck.check_date == latest_check.c.max_date),
            )
            .outerjoin(Favorite, Favorite.product_id == Product.id)
        )

    def _apply_filters(self, stmt: Select, params: SearchParams) -> Select:
        if params.keyword:
            stmt = stmt.where(Product.name.ilike(f"%{params.keyword}%"))
        if params.category:
            stmt = stmt.where(Product.category == params.category)
        if params.country:
            stmt = stmt.where(Product.country == params.country)
        if params.marketplace:
            stmt = stmt.where(Product.marketplace == params.marketplace)
        if params.price_min is not None:
            stmt = stmt.where(ProductSnapshot.price >= params.price_min)
        if params.price_max is not None:
            stmt = stmt.where(ProductSnapshot.price <= params.price_max)
        if params.thailand_status == ThailandStatus.FOUND:
            stmt = stmt.where(ThailandCheck.status == ThailandStatus.FOUND)
        elif params.thailand_status == ThailandStatus.NOT_FOUND:
            stmt = stmt.where(
                or_(
                    ThailandCheck.status == ThailandStatus.NOT_FOUND,
                    ThailandCheck.status.is_(None),
                )
            )
        orders_col = self._orders_column(params.period)
        if params.min_orders is not None:
            stmt = stmt.where(orders_col >= params.min_orders)
        return stmt

    @staticmethod
    def _orders_column(period: str):
        return {
            "1d": ProductSnapshot.orders_1d,
            "7d": ProductSnapshot.orders_7d,
            "30d": ProductSnapshot.orders_30d,
        }[period]

    def search(self, params: SearchParams) -> tuple[list[SearchRow], int]:
        stmt = self._apply_filters(self._latest_snapshot_join(), params)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        orders_col = self._orders_column(params.period)
        rows = self.db.execute(
            stmt.order_by(orders_col.desc().nulls_last(), Product.id)
            .offset((params.page - 1) * params.page_size)
            .limit(params.page_size)
        ).all()
        return [tuple(row) for row in rows], total

    def get_detail(self, product_id: int) -> Product | None:
        return self.db.execute(
            select(Product)
            .where(Product.id == product_id)
            .options(
                selectinload(Product.snapshots),
                selectinload(Product.thailand_checks),
                selectinload(Product.favorite),
            )
        ).scalar_one_or_none()

    def get(self, product_id: int) -> Product | None:
        return self.db.get(Product, product_id)

    def list_categories(self) -> list[str]:
        rows = self.db.execute(
            select(Product.category).where(Product.category.is_not(None)).distinct()
        ).scalars()
        return sorted(rows)
