"""ลูกค้า / ที่อยู่ / ออเดอร์ / สลิปโอนเงิน

หลักการที่ยึดตามสเปก:
- ที่อยู่เก็บ "แยกฟิลด์" เสมอ (ตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์ + รหัสราชการ)
  เพื่อส่งต่อให้ระบบขนส่งเจ้าไหนก็ได้ ไม่ต้องมานั่งแยกทีหลัง
- ออเดอร์เก็บ shipping_snapshot (สำเนาที่อยู่ ณ เวลาสั่ง) ไว้แช่แข็ง
  ลูกค้าย้ายบ้านแล้วออเดอร์เก่าต้องยังแสดงที่อยู่ที่ส่งไปจริง
- payment_slips เป็น append-only ห้าม update ย้อนหลัง (ยกเว้นผลการตรวจของแอดมิน)
"""

import enum
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PaymentStatus(str, enum.Enum):
    AWAITING_PAYMENT = "awaiting_payment"
    SLIP_SUBMITTED = "slip_submitted"
    PAID = "paid"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class SlipCheckStatus(str, enum.Enum):
    QR_OK = "qr_ok"
    DUPLICATE = "duplicate"
    QR_UNREADABLE = "qr_unreadable"


class FulfillmentStatus(str, enum.Enum):
    PENDING = "pending"
    READY_TO_SHIP = "ready_to_ship"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class AddressSource(str, enum.Enum):
    WEB_FORM = "web_form"
    MANUAL = "manual"
    IMPORT = "import"


class Customer(Base):
    """"คน" แยกจาก "ออเดอร์" — ใช้เบอร์โทรเป็นตัวระบุตัวตนหลัก"""

    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(String(255))
    line_id: Mapped[str | None] = mapped_column(String(128))
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    total_spent: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    first_order_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_order_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # PDPA: ลูกค้าขอลบข้อมูลได้ — soft delete เพื่อไม่ให้ประวัติออเดอร์พัง
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    addresses: Mapped[list["Address"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(back_populates="customer")


class Address(Base):
    """ลูกค้า 1 คนมีได้หลายที่อยู่ (บ้าน/ที่ทำงาน)"""

    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    label: Mapped[str | None] = mapped_column(String(64))
    recipient_name: Mapped[str] = mapped_column(Text)
    recipient_phone: Mapped[str] = mapped_column(String(20))
    address_line: Mapped[str] = mapped_column(Text)
    tambon: Mapped[str] = mapped_column(String(128))
    tambon_code: Mapped[str | None] = mapped_column(String(6))
    amphoe: Mapped[str] = mapped_column(String(128))
    amphoe_code: Mapped[str | None] = mapped_column(String(4))
    province: Mapped[str] = mapped_column(String(128))
    province_code: Mapped[str | None] = mapped_column(String(2))
    zipcode: Mapped[str] = mapped_column(String(5), index=True)
    delivery_note: Mapped[str | None] = mapped_column(Text)
    is_default: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[AddressSource] = mapped_column(
        Enum(AddressSource), default=AddressSource.WEB_FORM
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    customer: Mapped[Customer] = relationship(back_populates="addresses")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_code: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    address_id: Mapped[int] = mapped_column(ForeignKey("addresses.id"), index=True)
    # สำเนาที่อยู่ ณ เวลาที่สั่ง — แช่แข็งไว้ ห้ามแก้ตามที่อยู่ปัจจุบันของลูกค้า
    shipping_snapshot: Mapped[dict[str, str]] = mapped_column(JSON)

    product_name: Mapped[str] = mapped_column(Text)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    amount_base: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    # ยอดที่ต้องโอนจริง = amount_base + เศษสตางค์สุ่ม (ไม่ซ้ำกับออเดอร์ที่ยังรอจ่าย)
    amount_due: Mapped[Decimal] = mapped_column(Numeric(10, 2), index=True)

    payment_method: Mapped[str] = mapped_column(String(32), default="promptpay_transfer")
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.AWAITING_PAYMENT, index=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payment_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    fulfillment_status: Mapped[FulfillmentStatus] = mapped_column(
        Enum(FulfillmentStatus), default=FulfillmentStatus.PENDING, index=True
    )
    fulfillment_provider: Mapped[str | None] = mapped_column(String(32))
    tracking_no: Mapped[str | None] = mapped_column(String(64))
    courier: Mapped[str | None] = mapped_column(String(64))
    label_url: Mapped[str | None] = mapped_column(Text)
    provider_ref: Mapped[str | None] = mapped_column(String(128))

    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    admin_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    customer: Mapped[Customer] = relationship(back_populates="orders")
    address: Mapped[Address] = relationship()
    slips: Mapped[list["PaymentSlip"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class PaymentSlip(Base):
    """สลิปที่ลูกค้าแนบ — append only ต่อการแนบแต่ละครั้ง"""

    __tablename__ = "payment_slips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    image_url: Mapped[str | None] = mapped_column(Text)
    image_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    qr_payload: Mapped[str | None] = mapped_column(Text)
    transaction_ref: Mapped[str | None] = mapped_column(String(128), unique=True)
    sending_bank: Mapped[str | None] = mapped_column(String(8))
    check_status: Mapped[SlipCheckStatus] = mapped_column(Enum(SlipCheckStatus))
    verified_by: Mapped[str | None] = mapped_column(String(16))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="slips")
    image: Mapped["PaymentSlipImage | None"] = relationship(
        back_populates="slip", cascade="all, delete-orphan", uselist=False, lazy="selectin"
    )

    @property
    def has_image(self) -> bool:
        return self.image is not None


class PaymentSlipImage(Base):
    """รูปสลิป เก็บแยกตารางเพื่อไม่ให้ตารางหลักอืดเวลา query รายการออเดอร์

    เก็บเป็น base64 ในฐานข้อมูลเพื่อไม่ต้องพึ่ง object storage ตั้งแต่วันแรก
    ถ้าออเดอร์เยอะจนฐานข้อมูลเริ่มโต ให้ย้ายไป Supabase Storage / S3 แล้วเก็บ
    ที่อยู่ไฟล์ลง payment_slips.image_url แทน (คอลัมน์มีรออยู่แล้ว)
    """

    __tablename__ = "payment_slip_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slip_id: Mapped[int] = mapped_column(
        ForeignKey("payment_slips.id"), unique=True, index=True
    )
    content_type: Mapped[str] = mapped_column(String(32), default="image/jpeg")
    data_base64: Mapped[str] = mapped_column(Text)
    byte_size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    slip: Mapped[PaymentSlip] = relationship(back_populates="image")


class UnmatchedPayment(Base):
    """เงินเข้าที่จับคู่ออเดอร์ไม่ได้ — ให้แอดมินจัดการเอง"""

    __tablename__ = "unmatched_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    raw_message: Mapped[str | None] = mapped_column(Text)
    resolved_order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
