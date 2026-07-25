from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import PaymentSlip


class SlipRepository:
    def __init__(self, db: Session):
        self.db = db

    # ทั้งสองเมธอดคืน "ใบแรกสุด" เสมอ เพราะภาพเดิม/ref เดิมอาจมีหลายแถวได้
    # (ทุกครั้งที่มีคนพยายามใช้สลิปซ้ำ เราบันทึกแถว duplicate ไว้ให้แอดมินเห็นด้วย)
    def get_by_transaction_ref(self, transaction_ref: str) -> PaymentSlip | None:
        return self.db.execute(
            select(PaymentSlip)
            .where(PaymentSlip.transaction_ref == transaction_ref)
            .order_by(PaymentSlip.id.asc())
        ).scalars().first()

    def get_by_image_hash(self, image_hash: str) -> PaymentSlip | None:
        return self.db.execute(
            select(PaymentSlip)
            .where(PaymentSlip.image_hash == image_hash)
            .order_by(PaymentSlip.id.asc())
        ).scalars().first()

    def list_for_order(self, order_id: int) -> list[PaymentSlip]:
        return list(
            self.db.execute(
                select(PaymentSlip)
                .where(PaymentSlip.order_id == order_id)
                .order_by(PaymentSlip.created_at.desc())
            ).scalars()
        )

    def add(self, slip: PaymentSlip) -> PaymentSlip:
        self.db.add(slip)
        self.db.flush()
        return slip

    def get(self, slip_id: int) -> PaymentSlip | None:
        return self.db.get(PaymentSlip, slip_id)
