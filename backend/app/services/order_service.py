"""สร้างออเดอร์ + ยอดโอนไม่ซ้ำ (เศษสตางค์) + snapshot ที่อยู่

เศษสตางค์คือหัวใจของการจับคู่เงินเข้า: ทุกคนโอน 890 เท่ากันหมดจนแยกไม่ออก
ว่าเงินก้อนไหนของออเดอร์ไหน พอเติมเศษสตางค์ไม่ซ้ำ (890.37) ก็จับคู่ได้ทันที
โดยไม่ต้องเดา และไม่ต้องพึ่ง API ธนาคารที่เสียเงิน
"""

import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import (
    Address,
    AddressSource,
    Customer,
    Order,
    PaymentStatus,
)
from app.repositories.customer_repository import CustomerRepository, address_fingerprint
from app.repositories.order_repository import OrderRepository
from app.schemas.orders import AddressInput, OrderCreate, OrderPayment
from app.services import promptpay

SATANG_CHOICES = tuple(range(1, 100))


class NoAmountSlotAvailable(Exception):
    """เศษสตางค์ทั้ง 99 ค่าของยอดนี้ถูกใช้โดยออเดอร์ที่ยังรอจ่ายอยู่ทั้งหมด"""


class OrderNotFound(Exception):
    pass


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)
        self.customers = CustomerRepository(db)

    # ---------- create ----------

    def create_order(self, payload: OrderCreate) -> OrderPayment:
        now = datetime.now(timezone.utc)
        amount_base = (payload.unit_price * payload.quantity).quantize(Decimal("0.01"))
        amount_due = self._allocate_amount_due(amount_base)

        customer = self._get_or_create_customer(payload, now)
        address = self._get_or_create_address(customer, payload.address)

        order = Order(
            order_code=self._next_order_code(now),
            customer_id=customer.id,
            address_id=address.id,
            shipping_snapshot=_snapshot(address),
            product_name=payload.product_name,
            quantity=payload.quantity,
            unit_price=payload.unit_price,
            amount_base=amount_base,
            amount_due=amount_due,
            payment_status=PaymentStatus.AWAITING_PAYMENT,
            payment_expires_at=now + timedelta(minutes=settings.payment_window_minutes),
            consent_at=now if payload.consent else None,
        )
        self.orders.add(order)
        self.customers.record_order(customer, amount_due, now)
        self.orders.commit()

        return self.payment_info(order)

    def payment_info(self, order: Order) -> OrderPayment:
        return OrderPayment(
            order_code=order.order_code,
            amount_base=Decimal(order.amount_base),
            amount_due=Decimal(order.amount_due),
            promptpay_payload=promptpay.build_payload(
                settings.promptpay_target, Decimal(order.amount_due)
            ),
            promptpay_target=settings.promptpay_target,
            payment_expires_at=order.payment_expires_at,
        )

    def get_payment_info(self, order_code: str) -> OrderPayment:
        order = self.orders.get_by_code(order_code)
        if order is None:
            raise OrderNotFound
        return self.payment_info(order)

    def renew_payment_window(self, order_code: str) -> OrderPayment:
        """หมดเวลาแล้วขอ QR ใหม่ — ยอดเดิม เพราะยังจองสลอตเศษสตางค์นั้นอยู่"""
        order = self.orders.get_by_code(order_code)
        if order is None:
            raise OrderNotFound
        order.payment_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.payment_window_minutes
        )
        self.orders.commit()
        return self.payment_info(order)

    # ---------- internals ----------

    def _allocate_amount_due(self, amount_base: Decimal) -> Decimal:
        taken = self.orders.pending_amounts()
        free = [
            candidate
            for satang in SATANG_CHOICES
            if (candidate := amount_base + Decimal(satang) / 100) not in taken
        ]
        if not free:
            raise NoAmountSlotAvailable
        return random.choice(free)

    def _get_or_create_customer(self, payload: OrderCreate, now: datetime) -> Customer:
        customer = self.customers.get_by_phone(payload.customer_phone)
        if customer is None:
            return self.customers.create(
                phone=payload.customer_phone,
                name=payload.customer_name,
                email=payload.customer_email,
                consent_at=now if payload.consent else None,
            )
        # ลูกค้าเดิมสั่งซ้ำ — อัปเดตข้อมูลล่าสุด ไม่สร้างแถวใหม่
        customer.name = payload.customer_name
        if payload.customer_email:
            customer.email = payload.customer_email
        if payload.consent:
            customer.consent_at = now
        return customer

    def _get_or_create_address(self, customer: Customer, data: AddressInput) -> Address:
        address = Address(
            customer_id=customer.id,
            label=data.label,
            recipient_name=data.recipient_name,
            recipient_phone=data.recipient_phone,
            address_line=data.address_line,
            tambon=data.tambon,
            tambon_code=data.tambon_code,
            amphoe=data.amphoe,
            amphoe_code=data.amphoe_code,
            province=data.province,
            province_code=data.province_code,
            zipcode=data.zipcode,
            delivery_note=data.delivery_note,
            is_default=True,
            source=AddressSource.WEB_FORM,
        )
        existing = self.customers.find_matching_address(
            customer.id, address_fingerprint(address)
        )
        if existing is not None:
            existing.delivery_note = data.delivery_note or existing.delivery_note
            return existing
        self.customers.clear_default(customer.id)
        return self.customers.add_address(address)

    def _next_order_code(self, now: datetime) -> str:
        return f"SC{now:%y%m%d}-{self.orders.next_sequence():04d}"


def _snapshot(address: Address) -> dict[str, str]:
    """แช่แข็งที่อยู่ ณ เวลาสั่ง — ลูกค้าย้ายบ้านทีหลังก็ไม่กระทบออเดอร์เก่า"""
    return {
        "recipient_name": address.recipient_name,
        "recipient_phone": address.recipient_phone,
        "address_line": address.address_line,
        "tambon": address.tambon,
        "tambon_code": address.tambon_code or "",
        "amphoe": address.amphoe,
        "amphoe_code": address.amphoe_code or "",
        "province": address.province,
        "province_code": address.province_code or "",
        "zipcode": address.zipcode,
        "delivery_note": address.delivery_note or "",
    }
