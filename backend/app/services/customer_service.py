"""ฐานข้อมูลลูกค้าของเราเอง — export ออกได้เสมอ ไม่ถูกล็อกกับ provider เจ้าไหน"""

import csv
import io
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.order import Address
from app.repositories.customer_repository import CustomerRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.orders import AddressItem, CustomerItem

CSV_COLUMNS = [
    "customer_id",
    "name",
    "phone",
    "email",
    "total_orders",
    "total_spent",
    "flags",
    "first_order_at",
    "last_order_at",
    "recipient_name",
    "recipient_phone",
    "address_line",
    "tambon",
    "tambon_code",
    "amphoe",
    "amphoe_code",
    "province",
    "province_code",
    "zipcode",
    "delivery_note",
]


class CustomerNotFound(Exception):
    pass


class CustomerService:
    def __init__(self, db: Session):
        self.db = db
        self.customers = CustomerRepository(db)
        self.orders = OrderRepository(db)

    def list_customers(self) -> list[CustomerItem]:
        return [CustomerItem.model_validate(c) for c in self.customers.list_all()]

    def export_csv(self) -> str:
        """หนึ่งแถวต่อที่อยู่ — ที่อยู่แยกฟิลด์ครบ พร้อมยัดเข้าระบบขนส่งเจ้าไหนก็ได้"""
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for customer in self.customers.list_all():
            base = {
                "customer_id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email or "",
                "total_orders": customer.total_orders,
                "total_spent": f"{customer.total_spent:.2f}",
                "flags": ",".join(customer.flags or []),
                "first_order_at": _iso(customer.first_order_at),
                "last_order_at": _iso(customer.last_order_at),
            }
            if not customer.addresses:
                writer.writerow(base)
                continue
            for address in customer.addresses:
                writer.writerow({**base, **_address_columns(address)})
        return buffer.getvalue()

    def addresses_of(self, customer_id: int) -> list[AddressItem]:
        customer = self.customers.get(customer_id)
        if customer is None:
            raise CustomerNotFound
        return [AddressItem.model_validate(a) for a in customer.addresses]

    def soft_delete(self, customer_id: int) -> None:
        """PDPA: ลูกค้าขอลบข้อมูล — ล้างข้อมูลระบุตัวตน แต่คงยอดขาย/ประวัติไว้"""
        customer = self.customers.get(customer_id)
        if customer is None:
            raise CustomerNotFound
        self.customers.soft_delete(customer, datetime.now(timezone.utc))
        self.orders.commit()

    def set_flags(self, customer_id: int, flags: list[str]) -> None:
        customer = self.customers.get(customer_id)
        if customer is None:
            raise CustomerNotFound
        customer.flags = flags
        self.orders.commit()


def _address_columns(address: Address) -> dict[str, str]:
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


def _iso(value: datetime | None) -> str:
    return value.isoformat() if value else ""
