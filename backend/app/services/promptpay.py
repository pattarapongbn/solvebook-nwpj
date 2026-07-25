"""สร้าง payload QR พร้อมเพย์ (EMVCo) — ฝั่ง client แค่เอาไป render เป็นภาพ

ยอดที่ฝังใน QR คือ amount_due (มีเศษสตางค์) ลูกค้าสแกนแล้วยอดเด้งมาเป๊ะ
ไม่ต้องพิมพ์เอง จึงไม่มีทางโอนผิดยอดจนจับคู่ออเดอร์ไม่ได้
"""

from decimal import Decimal

AID_PROMPTPAY = "A000000677010111"
CURRENCY_THB = "764"
COUNTRY_TH = "TH"


def _field(tag: str, value: str) -> str:
    return f"{tag}{len(value):02d}{value}"


def _crc16(payload: str) -> str:
    crc = 0xFFFF
    for char in payload.encode("ascii"):
        crc ^= char << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return f"{crc:04X}"


def normalize_target(target: str) -> str:
    """เบอร์มือถือ 10 หลัก -> 0066xxxxxxxxx, เลขบัตรประชาชน/ทะเบียน 13 หลัก -> ใช้ตรงๆ"""
    digits = "".join(ch for ch in target if ch.isdigit())
    if len(digits) == 13:
        return digits
    return "0066" + digits.lstrip("0")


def build_payload(target: str, amount: Decimal) -> str:
    """คืนสตริง EMVCo สำหรับ QR พร้อมเพย์ยอดคงที่"""
    digits = "".join(ch for ch in target if ch.isdigit())
    proxy_tag = "02" if len(digits) == 13 else "01"
    merchant = _field("00", AID_PROMPTPAY) + _field(proxy_tag, normalize_target(target))

    payload = (
        _field("00", "01")
        + _field("01", "12")  # dynamic QR — ใช้ครั้งเดียวต่อออเดอร์
        + _field("29", merchant)
        + _field("53", CURRENCY_THB)
    )
    if amount > 0:
        payload += _field("54", f"{amount:.2f}")
    payload += _field("58", COUNTRY_TH) + "6304"
    return payload + _crc16(payload)
