from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import FavoriteCreate, FavoriteItem
from app.services.favorite_service import (
    FavoriteNotFound,
    FavoriteService,
    ProductNotFound,
)

router = APIRouter(tags=["favorites"])


@router.get("/favorites", response_model=list[FavoriteItem])
def list_favorites(db: Annotated[Session, Depends(get_db)]) -> list[FavoriteItem]:
    return FavoriteService(db).list_favorites()


@router.post("/favorites", status_code=201)
def add_favorite(
    payload: FavoriteCreate, db: Annotated[Session, Depends(get_db)]
) -> dict[str, bool]:
    try:
        FavoriteService(db).add(payload.product_id, payload.note)
    except ProductNotFound:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@router.delete("/favorites/{product_id}", status_code=200)
def remove_favorite(
    product_id: int, db: Annotated[Session, Depends(get_db)]
) -> dict[str, bool]:
    try:
        FavoriteService(db).remove(product_id)
    except FavoriteNotFound:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"ok": True}
