"""หน้าร้าน: สร้างออเดอร์ → รับยอด+QR พร้อมเพย์ → แนบสลิป"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.orders import OrderCreate, OrderPayment, SlipResult, SlipSubmit
from app.services.order_service import (
    NoAmountSlotAvailable,
    OrderNotFound,
    OrderService,
)
from app.services.slip_service import OrderNotFound as SlipOrderNotFound
from app.services.slip_service import SlipService

router = APIRouter(tags=["orders"])


@router.post("/orders", response_model=OrderPayment, status_code=201)
def create_order(
    payload: OrderCreate, db: Annotated[Session, Depends(get_db)]
) -> OrderPayment:
    try:
        return OrderService(db).create_order(payload)
    except NoAmountSlotAvailable:
        raise HTTPException(
            status_code=503, detail="ระบบกำลังมีออเดอร์รอชำระจำนวนมาก กรุณาลองใหม่อีกครั้ง"
        )


@router.get("/orders/{order_code}/payment", response_model=OrderPayment)
def get_payment(order_code: str, db: Annotated[Session, Depends(get_db)]) -> OrderPayment:
    try:
        return OrderService(db).get_payment_info(order_code)
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์นี้")


@router.post("/orders/{order_code}/payment/renew", response_model=OrderPayment)
def renew_payment(order_code: str, db: Annotated[Session, Depends(get_db)]) -> OrderPayment:
    try:
        return OrderService(db).renew_payment_window(order_code)
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์นี้")


@router.post("/orders/{order_code}/slip", response_model=SlipResult)
def submit_slip(
    order_code: str, payload: SlipSubmit, db: Annotated[Session, Depends(get_db)]
) -> SlipResult:
    try:
        return SlipService(db).submit(order_code, payload)
    except SlipOrderNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์นี้")
