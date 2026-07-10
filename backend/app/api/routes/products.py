from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import ProductDetail
from app.services.search_service import SearchService

router = APIRouter(tags=["products"])


@router.get("/products/{product_id}", response_model=ProductDetail)
def get_product(
    product_id: int, db: Annotated[Session, Depends(get_db)]
) -> ProductDetail:
    detail = SearchService(db).get_detail(product_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return detail
