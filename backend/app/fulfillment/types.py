"""รูปแบบกลาง (canonical shipment) ของเราเอง — ไม่ผูกกับขนส่งเจ้าไหน

เปลี่ยนเจ้าขนส่ง = เปลี่ยน env FULFILLMENT_PROVIDER โค้ดส่วนอื่นไม่ต้องแตะ
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


@dataclass(frozen=True)
class Recipient:
    name: str
    phone: str
    address_line: str
    tambon: str
    amphoe: str
    province: str
    zipcode: str
    tambon_code: str | None = None
    amphoe_code: str | None = None
    province_code: str | None = None
    note: str | None = None


@dataclass(frozen=True)
class Parcel:
    weight_gram: int
    width_cm: int
    length_cm: int
    height_cm: int


@dataclass(frozen=True)
class CanonicalShipment:
    order_code: str
    recipient: Recipient
    parcel: Parcel
    cod_amount: Decimal  # 0 = จ่ายแล้ว ไม่เก็บปลายทาง
    declared_value: Decimal


@dataclass(frozen=True)
class ShipmentResult:
    tracking_no: str | None
    label_url: str | None
    provider_ref: str
    courier: str


@dataclass(frozen=True)
class ShipmentStatus:
    status: str
    updated_at: str


class FulfillmentProvider(Protocol):
    name: str

    def create_shipment(self, shipment: CanonicalShipment) -> ShipmentResult: ...

    def cancel_shipment(self, provider_ref: str) -> bool: ...

    def get_status(self, tracking_no: str) -> ShipmentStatus: ...
