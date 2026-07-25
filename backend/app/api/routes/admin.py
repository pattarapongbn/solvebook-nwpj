"""หน้าหลังร้าน: ดูออเดอร์/ยืนยันเงินเข้า/เลขพัสดุ และฐานข้อมูลลูกค้า"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.order import PaymentStatus
from app.repositories.order_repository import OrderRepository
from app.schemas.orders import (
    CustomerItem,
    MarkPaidInput,
    OrderItem,
    ResolveUnmatchedInput,
    TrackingInput,
    UnmatchedPaymentItem,
)
from app.services.customer_service import CustomerNotFound, CustomerService
from app.services.fulfillment_service import FulfillmentService, OrderNotPaid
from app.services.fulfillment_service import OrderNotFound as ShipOrderNotFound
from app.services.payment_service import OrderNotFound, PaymentService, UnmatchedPaymentNotFound

router = APIRouter(tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/admin/orders", response_model=list[OrderItem])
def list_orders(
    db: Annotated[Session, Depends(get_db)], status: PaymentStatus | None = None
) -> list[OrderItem]:
    orders = OrderRepository(db).list_all(status=status)
    return [
        OrderItem.model_validate(
            {
                **{c.name: getattr(order, c.name) for c in order.__table__.columns},
                "customer_name": order.customer.name,
                "customer_phone": order.customer.phone,
                "slips": order.slips,
            }
        )
        for order in orders
    ]


@router.post("/admin/orders/{order_code}/mark-paid")
def mark_paid(
    order_code: str, payload: MarkPaidInput, db: Annotated[Session, Depends(get_db)]
) -> dict[str, bool]:
    try:
        PaymentService(db).mark_paid_manually(order_code, payload.note)
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์นี้")
    return {"ok": True}


@router.post("/admin/orders/{order_code}/ship")
def create_shipment(order_code: str, db: Annotated[Session, Depends(get_db)]) -> dict[str, bool]:
    try:
        FulfillmentService(db).create_shipment(order_code)
    except ShipOrderNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์นี้")
    except OrderNotPaid:
        raise HTTPException(status_code=409, detail="ออเดอร์นี้ยังไม่ได้ชำระเงิน")
    return {"ok": True}


@router.post("/admin/orders/{order_code}/tracking")
def set_tracking(
    order_code: str, payload: TrackingInput, db: Annotated[Session, Depends(get_db)]
) -> dict[str, bool]:
    try:
        FulfillmentService(db).set_tracking(order_code, payload)
    except ShipOrderNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์นี้")
    return {"ok": True}


@router.get("/admin/unmatched-payments", response_model=list[UnmatchedPaymentItem])
def list_unmatched(db: Annotated[Session, Depends(get_db)]) -> list[UnmatchedPaymentItem]:
    return [
        UnmatchedPaymentItem.model_validate(payment)
        for payment in OrderRepository(db).list_unmatched()
    ]


@router.post("/admin/unmatched-payments/{payment_id}/resolve")
def resolve_unmatched(
    payment_id: int,
    payload: ResolveUnmatchedInput,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, bool]:
    try:
        PaymentService(db).resolve_unmatched(payment_id, payload.order_code)
    except UnmatchedPaymentNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบรายการเงินเข้านี้")
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบออเดอร์นี้")
    return {"ok": True}


@router.get("/admin/customers", response_model=list[CustomerItem])
def list_customers(db: Annotated[Session, Depends(get_db)]) -> list[CustomerItem]:
    return CustomerService(db).list_customers()


@router.get("/admin/customers/export.csv")
def export_customers(db: Annotated[Session, Depends(get_db)]) -> Response:
    csv_text = CustomerService(db).export_csv()
    return Response(
        # BOM ให้ Excel ภาษาไทยเปิดแล้วไม่เป็นตัวต่างดาว
        content="﻿" + csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="customers.csv"'},
    )


@router.delete("/admin/customers/{customer_id}")
def delete_customer(
    customer_id: int, db: Annotated[Session, Depends(get_db)]
) -> dict[str, bool]:
    """PDPA: ลูกค้าขอลบข้อมูลส่วนตัว"""
    try:
        CustomerService(db).soft_delete(customer_id)
    except CustomerNotFound:
        raise HTTPException(status_code=404, detail="ไม่พบลูกค้ารายนี้")
    return {"ok": True}
