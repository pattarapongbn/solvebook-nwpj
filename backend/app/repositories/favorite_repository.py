from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Favorite


class FavoriteRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_ids(self) -> list[int]:
        return list(self.db.execute(select(Favorite.product_id)).scalars())

    def get_by_product(self, product_id: int) -> Favorite | None:
        return self.db.execute(
            select(Favorite).where(Favorite.product_id == product_id)
        ).scalar_one_or_none()

    def add(self, product_id: int, note: str | None = None) -> Favorite:
        favorite = Favorite(product_id=product_id, note=note)
        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)
        return favorite

    def remove(self, favorite: Favorite) -> None:
        self.db.delete(favorite)
        self.db.commit()
