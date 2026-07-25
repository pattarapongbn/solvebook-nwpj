"""การยืนยันตัวตนแบบเบาๆ สำหรับ endpoint ที่ไม่ใช่หน้าร้าน

เป็นเครื่องมือใช้คนเดียว จึงใช้ shared secret ผ่าน header ก็พอ
ถ้าไม่ตั้งค่าใน env จะไม่ตรวจ (สำหรับ dev บนเครื่องตัวเอง) — บน production ต้องตั้ง
"""

from typing import Annotated

from fastapi import Header, HTTPException

from app.core.config import settings


def require_admin(x_admin_token: Annotated[str | None, Header()] = None) -> None:
    if not settings.admin_token:
        return
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


def require_webhook_secret(x_webhook_secret: Annotated[str | None, Header()] = None) -> None:
    if not settings.bank_webhook_secret:
        return
    if x_webhook_secret != settings.bank_webhook_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")
