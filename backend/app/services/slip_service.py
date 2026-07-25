"""ตรวจสลิปชั้นที่ 1 — เลขอ้างอิงจาก QR บนสลิป (ฟรี ไม่ใช้ API เสียเงิน)

หลักการ: เลขอ้างอิงธุรกรรมไม่ซ้ำกันทั้งระบบ เก็บเป็น unique key แล้วสลิปซ้ำ
จะชนทันที ส่วนภาพที่อ่าน QR ไม่ออก "ห้ามบล็อกลูกค้า" เพราะสลิปจริงบางใบ
(ถ่ายจากจอ/ธนาคารบางเจ้า) ก็อ่านไม่ออกเหมือนกัน — ปล่อยผ่านแล้ว flag ให้แอดมินตรวจ

ถ้าวันหนึ่งออเดอร์เยอะจนคุ้มค่าบริการรายเดือน (SlipOK / EasySlip) ให้เพิ่ม
การเรียก API ไว้ในเมธอด submit() นี้ที่เดียว ไม่ต้องแก้ที่อื่น
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.order import Order, PaymentSlip, PaymentStatus, SlipCheckStatus
from app.repositories.order_repository import OrderRepository
from app.repositories.slip_repository import SlipRepository
from app.schemas.orders import SlipResult, SlipSubmit
from app.services.slip_qr import parse_slip_qr

MSG_OK = "ตรวจสอบสลิปเบื้องต้นผ่านแล้ว"
MSG_DUPLICATE = "สลิปนี้เคยถูกใช้แล้ว กรุณาแนบสลิปที่ถูกต้อง"
MSG_UNREADABLE = "ระบบอ่านสลิปอัตโนมัติไม่ได้ ร้านจะตรวจสอบด้วยตนเอง"


class OrderNotFound(Exception):
    pass


class SlipService:
    def __init__(self, db: Session):
        self.db = db
        self.slips = SlipRepository(db)
        self.orders = OrderRepository(db)

    def submit(self, order_code: str, payload: SlipSubmit) -> SlipResult:
        order = self.orders.get_by_code(order_code)
        if order is None:
            raise OrderNotFound

        parsed = parse_slip_qr(payload.qr_payload)

        already = self._find_same_order_slip(order, parsed.transaction_ref, payload.image_hash)
        if already is not None:
            # แนบใบเดิมซ้ำในออเดอร์ตัวเอง (กดพลาด/แนบใหม่) — ไม่ใช่การโกง ตอบผลเดิมกลับไป
            return SlipResult(
                check_status=already.check_status,
                accepted=already.check_status != SlipCheckStatus.DUPLICATE,
                message=MSG_OK
                if already.check_status == SlipCheckStatus.QR_OK
                else MSG_UNREADABLE,
                transaction_ref=already.transaction_ref,
            )

        duplicate_of = self._find_duplicate(order, parsed.transaction_ref, payload.image_hash)

        if duplicate_of is not None:
            # บันทึกความพยายามไว้ให้แอดมินเห็น แต่ไม่แตะ transaction_ref (unique)
            self.slips.add(
                PaymentSlip(
                    order_id=order.id,
                    image_url=payload.image_url,
                    image_hash=payload.image_hash,
                    qr_payload=payload.qr_payload,
                    transaction_ref=None,
                    sending_bank=parsed.sending_bank,
                    check_status=SlipCheckStatus.DUPLICATE,
                )
            )
            self.orders.commit()
            return SlipResult(
                check_status=SlipCheckStatus.DUPLICATE, accepted=False, message=MSG_DUPLICATE
            )

        check_status = (
            SlipCheckStatus.QR_OK if parsed.transaction_ref else SlipCheckStatus.QR_UNREADABLE
        )
        self.slips.add(
            PaymentSlip(
                order_id=order.id,
                image_url=payload.image_url,
                image_hash=payload.image_hash,
                qr_payload=payload.qr_payload,
                transaction_ref=parsed.transaction_ref,
                sending_bank=parsed.sending_bank,
                check_status=check_status,
                verified_by="auto" if parsed.transaction_ref else None,
                verified_at=datetime.now(timezone.utc) if parsed.transaction_ref else None,
            )
        )
        if order.payment_status == PaymentStatus.AWAITING_PAYMENT:
            order.payment_status = PaymentStatus.SLIP_SUBMITTED
        self.orders.commit()

        return SlipResult(
            check_status=check_status,
            accepted=True,
            message=MSG_OK if parsed.transaction_ref else MSG_UNREADABLE,
            transaction_ref=parsed.transaction_ref,
        )

    def _find_same_order_slip(
        self, order: Order, transaction_ref: str | None, image_hash: str
    ) -> PaymentSlip | None:
        for slip in self.slips.list_for_order(order.id):
            if slip.image_hash == image_hash:
                return slip
            if transaction_ref and slip.transaction_ref == transaction_ref:
                return slip
        return None

    def _find_duplicate(
        self, order: Order, transaction_ref: str | None, image_hash: str
    ) -> PaymentSlip | None:
        """สลิปเดิมที่ถูกใช้กับ *ออเดอร์อื่น* เท่านั้นที่ถือว่าซ้ำ

        ลูกค้าแนบสลิปใบเดิมซ้ำในออเดอร์ตัวเองไม่ผิด (กดพลาด/แนบใหม่) — ปล่อยผ่าน
        """
        candidates: list[PaymentSlip | None] = [self.slips.get_by_image_hash(image_hash)]
        if transaction_ref:
            candidates.append(self.slips.get_by_transaction_ref(transaction_ref))
        return next(
            (slip for slip in candidates if slip is not None and slip.order_id != order.id),
            None,
        )
