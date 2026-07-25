import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, favorites, health, orders, payments, products, search
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import order as order_models  # noqa: F401  — ให้ metadata เห็นตารางฝั่งขาย
from app.models import product as product_models  # noqa: F401

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    # บน serverless ไม่มีขั้นตอน migrate แยก — สร้างตารางที่ยังไม่มีตอน cold start
    # create_all ข้ามตารางที่มีอยู่แล้ว จึงปลอดภัยที่จะรันซ้ำ
    if settings.auto_create_tables:
        try:
            Base.metadata.create_all(bind=engine)
        except Exception:  # cold start พร้อมกันหลายตัวอาจชนกันได้ — ไม่ควรทำให้ทั้งแอปล่ม
            logger.exception("auto create_all failed")
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(search.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(favorites.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(payments.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
