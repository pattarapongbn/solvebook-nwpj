"""แปลงออเดอร์เป็น canonical shipment แล้วส่งให้ provider ที่เลือกไว้ใน env"""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import settings
from app.fulfillment import CanonicalShipment, Parcel, Recipient, get_provider
from app.models.order import FulfillmentStatus, Order, PaymentStatus
from app.repositories.order_repository import OrderRepository
from app.schemas.orders import TrackingInput


class OrderNotFound(Exception):
    pass


class OrderNotPaid(Exception):
    pass


class FulfillmentService:
    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)

    def create_shipment(self, order_code: str) -> None:
        order = self.orders.get_by_code(order_code)
        if order is None:
            raise OrderNotFound
        if order.payment_status != PaymentStatus.PAID:
            raise OrderNotPaid

        provider = get_provider()
        result = provider.create_shipment(_to_canonical(order))

        order.fulfillment_provider = provider.name
        order.provider_ref = result.provider_ref
        order.tracking_no = result.tracking_no
        order.courier = result.courier
        order.label_url = result.label_url
        order.fulfillment_status = (
            FulfillmentStatus.SHIPPED if result.tracking_no else FulfillmentStatus.READY_TO_SHIP
        )
        self.orders.commit()

    def set_tracking(self, order_code: str, payload: TrackingInput) -> None:
        """provider แบบ manual — แอดมินได้เลขพัสดุจาก cargo agent แล้วมากรอกเอง"""
        order = self.orders.get_by_code(order_code)
        if order is None:
            raise OrderNotFound
        order.tracking_no = payload.tracking_no
        order.courier = payload.courier or order.courier
        order.fulfillment_status = FulfillmentStatus.SHIPPED
        self.orders.commit()


def _to_canonical(order: Order) -> CanonicalShipment:
    snapshot = order.shipping_snapshot
    return CanonicalShipment(
        order_code=order.order_code,
        recipient=Recipient(
            name=snapshot["recipient_name"],
            phone=snapshot["recipient_phone"],
            address_line=snapshot["address_line"],
            tambon=snapshot["tambon"],
            tambon_code=snapshot.get("tambon_code") or None,
            amphoe=snapshot["amphoe"],
            amphoe_code=snapshot.get("amphoe_code") or None,
            province=snapshot["province"],
            province_code=snapshot.get("province_code") or None,
            zipcode=snapshot["zipcode"],
            note=snapshot.get("delivery_note") or None,
        ),
        parcel=Parcel(
            weight_gram=settings.default_parcel_weight_gram * order.quantity,
            width_cm=settings.default_parcel_width_cm,
            length_cm=settings.default_parcel_length_cm,
            height_cm=settings.default_parcel_height_cm,
        ),
        cod_amount=Decimal("0"),  # โอนก่อนส่งเสมอ ไม่มีเก็บปลายทาง
        declared_value=Decimal(order.amount_base),
    )
