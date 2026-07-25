from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Address, Customer


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, customer_id: int) -> Customer | None:
        return self.db.get(Customer, customer_id)

    def get_by_phone(self, phone: str) -> Customer | None:
        return self.db.execute(
            select(Customer).where(Customer.phone == phone)
        ).scalar_one_or_none()

    def list_all(self, include_deleted: bool = False) -> list[Customer]:
        stmt = select(Customer).options(selectinload(Customer.addresses))
        if not include_deleted:
            stmt = stmt.where(Customer.deleted_at.is_(None))
        return list(self.db.execute(stmt.order_by(Customer.created_at.desc())).scalars())

    def create(
        self,
        phone: str,
        name: str,
        email: str | None = None,
        consent_at: datetime | None = None,
    ) -> Customer:
        customer = Customer(
            phone=phone, name=name, email=email, flags=[], consent_at=consent_at
        )
        self.db.add(customer)
        self.db.flush()
        return customer

    def record_order(self, customer: Customer, amount: Decimal, ordered_at: datetime) -> None:
        customer.total_orders += 1
        customer.total_spent = Decimal(customer.total_spent) + amount
        customer.last_order_at = ordered_at
        if customer.first_order_at is None:
            customer.first_order_at = ordered_at

    def soft_delete(self, customer: Customer, deleted_at: datetime) -> None:
        """PDPA: ลบข้อมูลระบุตัวตนออก แต่คงแถวไว้ให้ประวัติออเดอร์ไม่พัง"""
        customer.deleted_at = deleted_at
        customer.name = "[ลบตามคำขอ]"
        customer.email = None
        customer.line_id = None
        customer.phone = f"deleted:{customer.id}"

    def add_address(self, address: Address) -> Address:
        self.db.add(address)
        self.db.flush()
        return address

    def find_matching_address(self, customer_id: int, fingerprint: str) -> Address | None:
        addresses = self.db.execute(
            select(Address).where(Address.customer_id == customer_id)
        ).scalars()
        return next((a for a in addresses if address_fingerprint(a) == fingerprint), None)

    def clear_default(self, customer_id: int) -> None:
        for address in self.db.execute(
            select(Address).where(Address.customer_id == customer_id)
        ).scalars():
            address.is_default = False


def address_fingerprint(address: Address) -> str:
    """ใช้เทียบว่าที่อยู่ที่ส่งมาซ้ำกับที่มีอยู่แล้วไหม จะได้ไม่สร้างแถวซ้ำทุกครั้งที่สั่ง"""
    parts = [
        address.recipient_name,
        address.recipient_phone,
        address.address_line,
        address.tambon,
        address.amphoe,
        address.province,
        address.zipcode,
    ]
    return "|".join(part.strip() for part in parts)
