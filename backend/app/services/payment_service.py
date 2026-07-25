"""ตรวจสลิปชั้นที่ 2 — จับคู่เงินเข้าจริงกับออเดอร์ด้วยยอดที่ไม่ซ้ำ

Zapier อ่านอีเมล/SMS แจ้งเงินเข้าจากธนาคาร แล้วยิงเข้ามาที่ /payments/bank-notify
ยอดตรงกับออเดอร์ไหนที่ยังรอจ่าย = เงินก้อนนั้นของออเดอร์นั้น จับคู่ได้โดยไม่ต้องเดา
จับคู่ไม่ได้ก็เก็บไว้ใน unmatched_payments ให้แอดมินสางเอง ไม่ปล่อยเงินหาย
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order import PaymentStatus, UnmatchedPayment
from app.repositories.order_repository import OrderRepository
from app.schemas.orders import BankNotification, BankNotificationResult


class OrderNotFound(Exception):
    pass


class UnmatchedPaymentNotFound(Exception):
    pass


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)

    def handle_bank_notification(self, payload: BankNotification) -> BankNotificationResult:
        received_at = payload.received_at or datetime.now(timezone.utc)
        amount = Decimal(payload.amount).quantize(Decimal("0.01"))
        matches = self.orders.find_pending_by_amount(amount)

        # ยอดตรงกันเป๊ะแค่ใบเดียวเท่านั้นถึงจะ auto-match
        # ถ้ามีมากกว่าหนึ่ง (ไม่ควรเกิด เพราะจองสลอตเศษสตางค์ไว้) ให้แอดมินตัดสินเอง
        if len(matches) == 1:
            order = matches[0]
            self.orders.mark_paid(order, received_at)
            self.orders.commit()
            return BankNotificationResult(matched=True, order_code=order.order_code)

        unmatched = self.orders.add_unmatched(
            UnmatchedPayment(
                amount=amount, received_at=received_at, raw_message=payload.raw_message
            )
        )
        self.orders.commit()
        return BankNotificationResult(matched=False, unmatched_payment_id=unmatched.id)

    def mark_paid_manually(self, order_code: str, note: str | None) -> None:
        order = self.orders.get_by_code(order_code)
        if order is None:
            raise OrderNotFound
        self.orders.mark_paid(order, datetime.now(timezone.utc))
        for slip in order.slips:
            if slip.verified_at is None:
                slip.verified_by = "admin"
                slip.verified_at = datetime.now(timezone.utc)
        if note:
            order.admin_note = note
        self.orders.commit()

    def resolve_unmatched(self, payment_id: int, order_code: str) -> None:
        payment = self.orders.get_unmatched(payment_id)
        if payment is None:
            raise UnmatchedPaymentNotFound
        order = self.orders.get_by_code(order_code)
        if order is None:
            raise OrderNotFound
        payment.resolved_order_id = order.id
        if order.payment_status != PaymentStatus.PAID:
            self.orders.mark_paid(order, payment.received_at)
        self.orders.commit()
