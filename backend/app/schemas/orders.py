from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import FulfillmentStatus, PaymentStatus, SlipCheckStatus


class AddressInput(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=200)
    recipient_phone: str = Field(pattern=r"^0\d{9}$")
    address_line: str = Field(min_length=1, max_length=500)
    tambon: str = Field(min_length=1, max_length=128)
    amphoe: str = Field(min_length=1, max_length=128)
    province: str = Field(min_length=1, max_length=128)
    zipcode: str = Field(pattern=r"^\d{5}$")
    tambon_code: str | None = Field(default=None, pattern=r"^\d{6}$")
    amphoe_code: str | None = Field(default=None, pattern=r"^\d{4}$")
    province_code: str | None = Field(default=None, pattern=r"^\d{2}$")
    delivery_note: str | None = Field(default=None, max_length=500)
    label: str | None = Field(default=None, max_length=64)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=200)
    customer_phone: str = Field(pattern=r"^0\d{9}$")
    customer_email: str | None = Field(default=None, max_length=255)
    product_name: str = Field(min_length=1, max_length=300)
    quantity: int = Field(default=1, ge=1, le=99)
    unit_price: Decimal = Field(gt=0)
    address: AddressInput
    # โอนเข้าพร้อมเพย์ หรือเก็บเงินปลายทาง — ค่าเริ่มต้นคือโอน เพื่อให้ของเดิมทำงานเหมือนเดิม
    payment_method: Literal["promptpay_transfer", "cod"] = "promptpay_transfer"
    # PDPA: หน้าเว็บต้องให้ลูกค้ากดยินยอมก่อนส่งข้อมูล
    consent: bool = True


class OrderPayment(BaseModel):
    """ข้อมูลที่หน้าเว็บใช้แสดงหน้าจ่ายเงิน"""

    order_code: str
    amount_base: Decimal
    amount_due: Decimal
    promptpay_payload: str
    promptpay_target: str
    payment_expires_at: datetime | None
    payment_method: str


class SlipSubmit(BaseModel):
    image_hash: str = Field(min_length=16, max_length=64)
    image_url: str | None = None
    qr_payload: str | None = Field(default=None, max_length=1024)
    # รูปสลิปแบบ base64 (ไม่มี data: prefix) — หน้าร้านย่อภาพให้เหลือ ~150–250 KB ก่อนส่ง
    # 4 MB คือเพดานกันภาพหลุดขนาด ไม่ใช่ขนาดที่คาดหวัง
    image_base64: str | None = Field(default=None, max_length=4_000_000)
    image_content_type: str = Field(default="image/jpeg", max_length=32)


class SlipResult(BaseModel):
    check_status: SlipCheckStatus
    accepted: bool
    message: str
    transaction_ref: str | None = None


class SlipItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    check_status: SlipCheckStatus
    transaction_ref: str | None
    sending_bank: str | None
    image_url: str | None
    has_image: bool = False
    verified_by: str | None
    verified_at: datetime | None
    created_at: datetime


class OrderItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_code: str
    customer_name: str
    customer_phone: str
    product_name: str
    quantity: int
    amount_base: Decimal
    amount_due: Decimal
    payment_method: str
    payment_status: PaymentStatus
    fulfillment_status: FulfillmentStatus
    tracking_no: str | None
    paid_at: datetime | None
    created_at: datetime
    shipping_snapshot: dict[str, str]
    slips: list[SlipItem] = []


class BankNotification(BaseModel):
    """payload จาก Zapier ที่ parse อีเมล/SMS แจ้งเงินเข้าของธนาคารมาแล้ว"""

    amount: Decimal = Field(gt=0)
    received_at: datetime | None = None
    raw_message: str | None = Field(default=None, max_length=2000)


class BankNotificationResult(BaseModel):
    matched: bool
    order_code: str | None = None
    unmatched_payment_id: int | None = None


class MarkPaidInput(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class PaymentStatusInput(BaseModel):
    status: PaymentStatus


class ResolveUnmatchedInput(BaseModel):
    order_code: str


class TrackingInput(BaseModel):
    tracking_no: str = Field(min_length=4, max_length=64)
    courier: str | None = Field(default=None, max_length=64)


class UnmatchedPaymentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: Decimal
    received_at: datetime
    raw_message: str | None
    resolved_order_id: int | None
    created_at: datetime


class AddressItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str | None
    recipient_name: str
    recipient_phone: str
    address_line: str
    tambon: str
    tambon_code: str | None
    amphoe: str
    amphoe_code: str | None
    province: str
    province_code: str | None
    zipcode: str
    delivery_note: str | None
    is_default: bool


class CustomerItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    name: str
    email: str | None
    total_orders: int
    total_spent: Decimal
    flags: list[str]
    first_order_at: datetime | None
    last_order_at: datetime | None
    created_at: datetime
    addresses: list[AddressItem] = []
