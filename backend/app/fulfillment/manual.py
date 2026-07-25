"""ส่งเอง / ฝาก cargo agent — ใช้ตอนนี้

ไม่ยิง API ที่ไหน แค่ mark ว่าพร้อมส่ง แล้วให้แอดมินกรอกเลขพัสดุเองทีหลัง
พอพร้อมค่อยสลับไป shippop.py โดยไม่ต้องรื้อโค้ดส่วนอื่น
"""

from datetime import datetime, timezone

from app.fulfillment.types import CanonicalShipment, ShipmentResult, ShipmentStatus


class ManualProvider:
    name = "manual"

    def create_shipment(self, shipment: CanonicalShipment) -> ShipmentResult:
        return ShipmentResult(
            tracking_no=None,
            label_url=None,
            provider_ref=f"manual:{shipment.order_code}",
            courier="manual",
        )

    def cancel_shipment(self, provider_ref: str) -> bool:
        return True

    def get_status(self, tracking_no: str) -> ShipmentStatus:
        return ShipmentStatus(
            status="manual", updated_at=datetime.now(timezone.utc).isoformat()
        )
