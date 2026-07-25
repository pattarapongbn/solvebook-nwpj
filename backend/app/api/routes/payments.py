"""รับแจ้งเงินเข้าจากธนาคาร (ผ่าน Zapier) แล้วจับคู่ออเดอร์อัตโนมัติ"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_webhook_secret
from app.db.session import get_db
from app.schemas.orders import BankNotification, BankNotificationResult
from app.services.payment_service import PaymentService

router = APIRouter(tags=["payments"])


@router.post(
    "/payments/bank-notify",
    response_model=BankNotificationResult,
    dependencies=[Depends(require_webhook_secret)],
)
def bank_notify(
    payload: BankNotification, db: Annotated[Session, Depends(get_db)]
) -> BankNotificationResult:
    return PaymentService(db).handle_bank_notification(payload)
