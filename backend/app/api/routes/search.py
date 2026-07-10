from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import SearchParams, SearchResponse
from app.services.search_service import SearchService

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponse)
def search(
    params: Annotated[SearchParams, Query()],
    db: Annotated[Session, Depends(get_db)],
) -> SearchResponse:
    return SearchService(db).search(params)


@router.get("/categories", response_model=list[str])
def list_categories(db: Annotated[Session, Depends(get_db)]) -> list[str]:
    return SearchService(db).list_categories()
