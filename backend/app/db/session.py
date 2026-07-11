import os
from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

# บน serverless (Vercel) ห้ามถือ connection pool ข้าม invocation — ใช้ NullPool
# แล้วปล่อยให้ Supabase pooler (pgbouncer) จัดการ pooling ฝั่ง server แทน
engine_kwargs: dict[str, Any] = (
    {"poolclass": NullPool} if os.environ.get("VERCEL") else {"pool_pre_ping": True}
)
engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
