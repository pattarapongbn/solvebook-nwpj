from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# บน Render เป็น process ที่รันค้างไว้ ถือ pool ได้ตามปกติ (ไม่เหมือน serverless เดิม)
# แต่ Neon ตัด connection ที่ idle นาน ๆ ทิ้ง — pool_pre_ping จึงจำเป็น
# ไม่งั้น query แรกหลัง service ตื่นจากหลับจะพังเพราะหยิบ connection ที่ตายแล้วมาใช้
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
