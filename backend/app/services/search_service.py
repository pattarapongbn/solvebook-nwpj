from sqlalchemy.orm import Session

from app.models.product import Product, ProductSnapshot, ThailandCheck
from app.repositories.product_repository import ProductRepository
from app.schemas.search import (
    ProductDetail,
    ProductListItem,
    SearchParams,
    SearchResponse,
    SnapshotPoint,
    ThailandCheckPoint,
)


class SearchService:
    def __init__(self, db: Session):
        self.products = ProductRepository(db)

    def search(self, params: SearchParams) -> SearchResponse:
        rows, total = self.products.search(params)
        items = [
            self._to_list_item(product, snapshot, check, favorite_id, params.period)
            for product, snapshot, check, favorite_id in rows
        ]
        return SearchResponse(
            items=items, total=total, page=params.page, page_size=params.page_size
        )

    def get_detail(self, product_id: int) -> ProductDetail | None:
        product = self.products.get_detail(product_id)
        if product is None:
            return None
        snapshots = sorted(product.snapshots, key=lambda s: s.snapshot_date)
        checks = sorted(product.thailand_checks, key=lambda c: c.check_date)
        return ProductDetail(
            id=product.id,
            external_id=product.external_id,
            name=product.name,
            image_url=product.image_url,
            product_url=product.product_url,
            marketplace=product.marketplace,
            country=product.country,
            category=product.category,
            created_at=product.created_at,
            is_favorite=product.favorite is not None,
            snapshots=[
                SnapshotPoint(
                    snapshot_date=s.snapshot_date,
                    price=s.price,
                    currency=s.currency,
                    orders_1d=s.orders_1d,
                    orders_7d=s.orders_7d,
                    orders_30d=s.orders_30d,
                    revenue_30d=s.revenue_30d,
                    rating=s.rating,
                    review_count=s.review_count,
                )
                for s in snapshots
            ],
            thailand_checks=[
                ThailandCheckPoint(
                    check_date=c.check_date,
                    status=c.status,
                    matched_url=c.matched_url,
                    matched_price_thb=c.matched_price_thb,
                    seller_count=c.seller_count,
                )
                for c in checks
            ],
        )

    def list_categories(self) -> list[str]:
        return self.products.list_categories()

    @staticmethod
    def _to_list_item(
        product: Product,
        snapshot: ProductSnapshot | None,
        check: ThailandCheck | None,
        favorite_id: int | None,
        period: str,
    ) -> ProductListItem:
        orders = None
        if snapshot is not None:
            orders = {
                "1d": snapshot.orders_1d,
                "7d": snapshot.orders_7d,
                "30d": snapshot.orders_30d,
            }[period]
        return ProductListItem(
            id=product.id,
            name=product.name,
            image_url=product.image_url,
            marketplace=product.marketplace,
            country=product.country,
            category=product.category,
            price=snapshot.price if snapshot else None,
            currency=snapshot.currency if snapshot else None,
            orders=orders,
            thailand_status=check.status if check else None,
            is_favorite=favorite_id is not None,
            last_updated=snapshot.snapshot_date if snapshot else None,
        )
