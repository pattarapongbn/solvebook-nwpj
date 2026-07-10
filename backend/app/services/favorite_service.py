from datetime import date

from sqlalchemy.orm import Session

from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.search import FavoriteItem, ProductListItem
from app.services.currency import to_thb


class FavoriteNotFound(Exception):
    pass


class ProductNotFound(Exception):
    pass


class FavoriteService:
    def __init__(self, db: Session):
        self.favorites = FavoriteRepository(db)
        self.products = ProductRepository(db)

    def list_favorites(self) -> list[FavoriteItem]:
        items: list[FavoriteItem] = []
        for product_id in self.favorites.list_ids():
            favorite = self.favorites.get_by_product(product_id)
            product = self.products.get_detail(product_id)
            if favorite is None or product is None:
                continue
            latest_snap = max(
                product.snapshots, key=lambda s: s.snapshot_date, default=None
            )
            latest_check = max(
                product.thailand_checks, key=lambda c: c.check_date, default=None
            )
            items.append(
                FavoriteItem(
                    id=favorite.id,
                    note=favorite.note,
                    created_at=favorite.created_at,
                    product=ProductListItem(
                        id=product.id,
                        name=product.name,
                        image_url=product.image_url,
                        marketplace=product.marketplace,
                        country=product.country,
                        category=product.category,
                        price=latest_snap.price if latest_snap else None,
                        currency=latest_snap.currency if latest_snap else None,
                        price_thb=(
                            to_thb(latest_snap.price, latest_snap.currency)
                            if latest_snap
                            else None
                        ),
                        orders=latest_snap.orders_7d if latest_snap else None,
                        thailand_status=latest_check.status if latest_check else None,
                        is_favorite=True,
                        last_updated=(
                            latest_snap.snapshot_date if latest_snap else None
                        ),
                    ),
                )
            )
        items.sort(key=lambda item: item.created_at, reverse=True)
        return items

    def add(self, product_id: int, note: str | None) -> None:
        if self.products.get(product_id) is None:
            raise ProductNotFound
        if self.favorites.get_by_product(product_id) is not None:
            return  # idempotent
        self.favorites.add(product_id, note)

    def remove(self, product_id: int) -> None:
        favorite = self.favorites.get_by_product(product_id)
        if favorite is None:
            raise FavoriteNotFound
        self.favorites.remove(favorite)
