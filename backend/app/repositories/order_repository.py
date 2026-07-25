from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, PaymentStatus, UnmatchedPayment

# สถานะที่ยัง "รอเงินเข้า" — ยอด amount_due ของออเดอร์กลุ่มนี้ห้ามซ้ำกัน
PENDING_STATUSES = (PaymentStatus.AWAITING_PAYMENT, PaymentStatus.SLIP_SUBMITTED)


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, order_id: int) -> Order | None:
        return self.db.get(Order, order_id)

    def get_by_code(self, order_code: str) -> Order | None:
        return self.db.execute(
            select(Order)
            .options(selectinload(Order.slips), selectinload(Order.customer))
            .where(Order.order_code == order_code)
        ).scalar_one_or_none()

    def list_all(self, status: PaymentStatus | None = None, limit: int = 200) -> list[Order]:
        stmt = select(Order).options(
            selectinload(Order.slips), selectinload(Order.customer)
        )
        if status is not None:
            stmt = stmt.where(Order.payment_status == status)
        return list(
            self.db.execute(stmt.order_by(Order.created_at.desc()).limit(limit)).scalars()
        )

    def list_by_customer(self, customer_id: int) -> list[Order]:
        return list(
            self.db.execute(
                select(Order)
                .where(Order.customer_id == customer_id)
                .order_by(Order.created_at.desc())
            ).scalars()
        )

    def pending_amounts(self) -> set[Decimal]:
        rows = self.db.execute(
            select(Order.amount_due).where(Order.payment_status.in_(PENDING_STATUSES))
        ).scalars()
        return {Decimal(amount) for amount in rows}

    def find_pending_by_amount(self, amount: Decimal) -> list[Order]:
        return list(
            self.db.execute(
                select(Order)
                .where(Order.payment_status.in_(PENDING_STATUSES))
                .where(Order.amount_due == amount)
                .order_by(Order.created_at.asc())
            ).scalars()
        )

    def next_sequence(self) -> int:
        return int(self.db.execute(select(Order.id).order_by(Order.id.desc())).scalars().first() or 0) + 1

    def add(self, order: Order) -> Order:
        self.db.add(order)
        self.db.flush()
        return order

    def mark_paid(self, order: Order, paid_at: datetime) -> None:
        order.payment_status = PaymentStatus.PAID
        order.paid_at = paid_at

    def add_unmatched(self, payment: UnmatchedPayment) -> UnmatchedPayment:
        self.db.add(payment)
        self.db.flush()
        return payment

    def list_unmatched(self, only_open: bool = True) -> list[UnmatchedPayment]:
        stmt = select(UnmatchedPayment)
        if only_open:
            stmt = stmt.where(UnmatchedPayment.resolved_order_id.is_(None))
        return list(
            self.db.execute(stmt.order_by(UnmatchedPayment.received_at.desc())).scalars()
        )

    def get_unmatched(self, payment_id: int) -> UnmatchedPayment | None:
        return self.db.get(UnmatchedPayment, payment_id)

    def commit(self) -> None:
        self.db.commit()
