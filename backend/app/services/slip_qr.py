"""แกะข้อมูลจาก QR บนสลิปโอนเงิน (มาตรฐาน EMVCo Slip Verification)

QR เล็กๆ บนสลิป mobile banking ไทยเก็บ TLV คล้าย QR พร้อมเพย์ โครงหลักคือ
  tag 00 = version, tag 01 = { 01: รหัสธนาคารผู้ส่ง, 02: เลขอ้างอิงธุรกรรม }
แต่ละธนาคารใส่ฟิลด์เสริมไม่เหมือนกัน โค้ดนี้จึงแกะแบบยืดหยุ่น:
อ่านตามโครงมาตรฐานก่อน ถ้าไม่เจอค่อย fallback เป็นการหาค่าที่ยาวที่สุดใน TLV

ตัวเลขอ้างอิงเป็นค่าที่ไม่ซ้ำกันทั้งระบบ จึงใช้เป็น unique key กันสลิปซ้ำได้
"""

from dataclasses import dataclass

MIN_REF_LENGTH = 10


@dataclass(frozen=True)
class SlipQrData:
    transaction_ref: str | None
    sending_bank: str | None


def parse_tlv(payload: str) -> dict[str, str]:
    """แกะ TLV ชั้นเดียว — คืน dict ของ tag -> value (ทนต่อ payload ที่ผิดรูป)"""
    fields: dict[str, str] = {}
    index = 0
    while index + 4 <= len(payload):
        tag = payload[index : index + 2]
        raw_length = payload[index + 2 : index + 4]
        if not tag.isdigit() or not raw_length.isdigit():
            break
        length = int(raw_length)
        value = payload[index + 4 : index + 4 + length]
        if len(value) < length:
            break
        fields[tag] = value
        index += 4 + length
    return fields


def _looks_nested(value: str) -> bool:
    return len(parse_tlv(value)) >= 2


def parse_slip_qr(payload: str | None) -> SlipQrData:
    if not payload:
        return SlipQrData(transaction_ref=None, sending_bank=None)

    cleaned = payload.strip()
    top = parse_tlv(cleaned)

    for tag in ("01", "00"):
        nested_raw = top.get(tag)
        if nested_raw and _looks_nested(nested_raw):
            nested = parse_tlv(nested_raw)
            ref = nested.get("02")
            bank = nested.get("01")
            if ref and len(ref) >= MIN_REF_LENGTH:
                return SlipQrData(transaction_ref=ref, sending_bank=bank)

    # fallback: ค่าที่ยาวที่สุดในโครง TLV มักเป็นเลขอ้างอิงธุรกรรม
    candidates = [
        value
        for value in _all_values(cleaned)
        if len(value) >= MIN_REF_LENGTH and value.isalnum()
    ]
    if candidates:
        ref = max(candidates, key=len)
        bank = next((v for v in _all_values(cleaned) if len(v) == 3 and v.isdigit()), None)
        return SlipQrData(transaction_ref=ref, sending_bank=bank)

    # อ่าน QR ได้แต่แกะโครงไม่ออก — ใช้ payload ดิบเป็น ref ไปเลย
    # ยังกันสลิปซ้ำได้ เพราะ payload ของสลิปแต่ละใบไม่ซ้ำกันอยู่แล้ว
    return SlipQrData(transaction_ref=cleaned[:128] or None, sending_bank=None)


def _all_values(payload: str) -> list[str]:
    values: list[str] = []
    for value in parse_tlv(payload).values():
        if _looks_nested(value):
            values.extend(_all_values(value))
        else:
            values.append(value)
    return values
