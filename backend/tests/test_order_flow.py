from datetime import datetime, timezone
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.order import Customer, Order, PaymentStatus, SlipCheckStatus
from app.schemas.orders import (
    AddressInput,
    BankNotification,
    OrderCreate,
    SlipSubmit,
)
from app.services.customer_service import CustomerService
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.promptpay import build_payload
from app.services.slip_service import SlipService


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine, expire_on_commit=False)() as session:
        yield session


def make_order(phone: str = "0812345678", name: str = "สมชาย ใจดี") -> OrderCreate:
    return OrderCreate(
        customer_name=name,
        customer_phone=phone,
        product_name="Kirkland Glucosamine 375 เม็ด",
        quantity=1,
        unit_price=Decimal("890.00"),
        address=AddressInput(
            recipient_name=name,
            recipient_phone=phone,
            address_line="99/1 ถนนสุขุมวิท",
            tambon="คลองเตย",
            amphoe="คลองเตย",
            province="กรุงเทพมหานคร",
            zipcode="10110",
        ),
    )


def slip(payload: str | None, image_hash: str = "a" * 64) -> SlipSubmit:
    return SlipSubmit(image_hash=image_hash, qr_payload=payload)


# QR สลิปตัวอย่าง: tag 01 = { 01: รหัสธนาคาร, 02: เลขอ้างอิงธุรกรรม }
def slip_qr(ref: str, bank: str = "014") -> str:
    inner = f"01{len(bank):02d}{bank}" + f"02{len(ref):02d}{ref}"
    return "000201" + f"01{len(inner):02d}{inner}"


def test_two_orders_get_different_amounts(db):
    first = OrderService(db).create_order(make_order("0812345678"))
    second = OrderService(db).create_order(make_order("0898765432", "สมหญิง"))

    assert first.amount_base == Decimal("890.00")
    assert first.amount_due != second.amount_due
    for payment in (first, second):
        satang = (payment.amount_due - payment.amount_base) * 100
        assert 1 <= satang <= 99


def test_promptpay_qr_carries_amount_due(db):
    payment = OrderService(db).create_order(make_order())
    amount_field = f"54{len(f'{payment.amount_due:.2f}'):02d}{payment.amount_due:.2f}"
    assert amount_field in payment.promptpay_payload
    assert payment.promptpay_payload == build_payload(
        payment.promptpay_target, payment.amount_due
    )


def test_repeat_customer_reuses_record(db):
    service = OrderService(db)
    service.create_order(make_order())
    service.create_order(make_order())

    customer = db.execute(select(Customer)).scalar_one()
    assert customer.total_orders == 2
    assert customer.first_order_at is not None


def test_slip_records_transaction_ref(db):
    payment = OrderService(db).create_order(make_order())
    result = SlipService(db).submit(payment.order_code, slip(slip_qr("2024061512345678")))

    assert result.check_status == SlipCheckStatus.QR_OK
    assert result.transaction_ref == "2024061512345678"
    order = db.execute(select(Order)).scalar_one()
    assert order.payment_status == PaymentStatus.SLIP_SUBMITTED


def test_same_slip_on_another_order_is_rejected(db):
    first = OrderService(db).create_order(make_order("0812345678"))
    second = OrderService(db).create_order(make_order("0898765432", "สมหญิง"))
    qr = slip_qr("2024061512345678")

    SlipService(db).submit(first.order_code, slip(qr))
    result = SlipService(db).submit(second.order_code, slip(qr, image_hash="b" * 64))

    assert result.check_status == SlipCheckStatus.DUPLICATE
    assert result.accepted is False


def test_same_image_reused_on_another_order_is_rejected(db):
    first = OrderService(db).create_order(make_order("0812345678"))
    second = OrderService(db).create_order(make_order("0898765432", "สมหญิง"))

    SlipService(db).submit(first.order_code, slip(None))
    result = SlipService(db).submit(second.order_code, slip(None))

    assert result.check_status == SlipCheckStatus.DUPLICATE


def test_third_attempt_with_the_same_slip_still_answers(db):
    """ภาพเดิมถูกใช้ซ้ำหลายรอบ = มีแถว duplicate หลายแถว ต้องไม่ทำให้ระบบพัง"""
    service = OrderService(db)
    first = service.create_order(make_order("0812345678"))
    others = [
        service.create_order(make_order("089876543%d" % i, "ลูกค้า %d" % i)) for i in range(2)
    ]
    qr = slip_qr("2024061512345678")
    SlipService(db).submit(first.order_code, slip(qr))

    for order in others:
        result = SlipService(db).submit(order.order_code, slip(qr))
        assert result.check_status == SlipCheckStatus.DUPLICATE


def test_unreadable_qr_passes_but_is_flagged(db):
    payment = OrderService(db).create_order(make_order())
    result = SlipService(db).submit(payment.order_code, slip(None))

    assert result.accepted is True
    assert result.check_status == SlipCheckStatus.QR_UNREADABLE
    order = db.execute(select(Order)).scalar_one()
    assert order.slips[0].verified_by is None  # รอแอดมินตรวจ


def test_bank_notification_matches_order_by_exact_amount(db):
    payment = OrderService(db).create_order(make_order())
    result = PaymentService(db).handle_bank_notification(
        BankNotification(amount=payment.amount_due, raw_message="เงินเข้า")
    )

    assert result.matched is True
    assert result.order_code == payment.order_code
    order = db.execute(select(Order)).scalar_one()
    assert order.payment_status == PaymentStatus.PAID
    assert order.paid_at is not None


def test_unmatched_amount_is_kept_for_admin(db):
    OrderService(db).create_order(make_order())
    result = PaymentService(db).handle_bank_notification(
        BankNotification(amount=Decimal("123.45"), received_at=datetime.now(timezone.utc))
    )

    assert result.matched is False
    assert result.unmatched_payment_id is not None


def test_paid_amount_frees_the_satang_slot(db):
    service = OrderService(db)
    first = service.create_order(make_order("0812345678"))
    PaymentService(db).handle_bank_notification(BankNotification(amount=first.amount_due))

    # ยอดเดิมกลับมาใช้ได้แล้ว เพราะออเดอร์แรกไม่ได้รอจ่ายอยู่
    assert first.amount_due not in OrderService(db).orders.pending_amounts()


def test_old_order_keeps_the_address_it_shipped_to(db):
    service = OrderService(db)
    first = service.create_order(make_order())

    moved = make_order()
    moved.address.address_line = "1 ถนนใหม่"
    moved.address.tambon = "บางรัก"
    service.create_order(moved)

    old_order = db.execute(
        select(Order).where(Order.order_code == first.order_code)
    ).scalar_one()
    assert old_order.shipping_snapshot["address_line"] == "99/1 ถนนสุขุมวิท"
    assert old_order.shipping_snapshot["tambon"] == "คลองเตย"


def test_customer_csv_export_has_split_address_fields(db):
    OrderService(db).create_order(make_order())
    csv_text = CustomerService(db).export_csv()

    header, row = csv_text.strip().splitlines()[:2]
    assert "tambon_code" in header and "zipcode" in header
    assert "คลองเตย" in row
    assert "10110" in row


def test_pdpa_soft_delete_scrubs_identity_but_keeps_history(db):
    OrderService(db).create_order(make_order())
    customer = db.execute(select(Customer)).scalar_one()

    CustomerService(db).soft_delete(customer.id)

    db.refresh(customer)
    assert customer.deleted_at is not None
    assert "0812345678" not in customer.phone
    assert customer.total_orders == 1
    assert db.execute(select(Order)).scalar_one() is not None


def test_admin_can_change_payment_status(db):
    service = OrderService(db)
    payment = service.create_order(make_order())

    service.set_payment_status(payment.order_code, PaymentStatus.CANCELLED)

    order = db.execute(
        select(Order).where(Order.order_code == payment.order_code)
    ).scalar_one()
    assert order.payment_status is PaymentStatus.CANCELLED
    # ยกเลิกแล้วต้องไม่มีเวลาที่จ่ายเงินค้างอยู่ ไม่งั้นออเดอร์ขัดกันเอง
    assert order.paid_at is None


def test_marking_paid_then_reverting_clears_paid_at(db):
    service = OrderService(db)
    payment = service.create_order(make_order())

    service.set_payment_status(payment.order_code, PaymentStatus.PAID)
    order = db.execute(
        select(Order).where(Order.order_code == payment.order_code)
    ).scalar_one()
    assert order.paid_at is not None

    service.set_payment_status(payment.order_code, PaymentStatus.AWAITING_PAYMENT)
    db.refresh(order)
    assert order.paid_at is None


def test_delete_order_removes_slips_and_frees_the_satang_slot(db):
    service = OrderService(db)
    payment = service.create_order(make_order())
    SlipService(db).submit(
        payment.order_code,
        SlipSubmit(
            transaction_ref="TESTREF0001",
            image_hash="a" * 64,
            qr_payload=None,
            sending_bank="014",
        ),
    )

    service.delete_order(payment.order_code)

    assert db.execute(select(Order)).scalars().all() == []
    # สลิปต้องหายตามไปด้วย ไม่งั้นเลขอ้างอิงค้างเป็น unique index กันสลิปใบเดิมใช้ซ้ำไม่ได้
    from app.models.order import PaymentSlip

    assert db.execute(select(PaymentSlip)).scalars().all() == []

    # ยอดสะสมของลูกค้าต้องถูกถอนคืน ไม่ค้างจากออเดอร์ที่ไม่มีแล้ว
    customer = db.execute(select(Customer)).scalar_one()
    assert customer.total_orders == 0
    assert Decimal(customer.total_spent) == Decimal("0")

    # เศษสตางค์เดิมต้องกลับมาว่าง ไม่งั้นสลอตรั่วไปเรื่อย ๆ จนยอดนี้จองไม่ได้อีก
    from app.repositories.order_repository import OrderRepository

    assert payment.amount_due not in OrderRepository(db).pending_amounts()


def test_delete_missing_order_raises(db):
    from app.services.order_service import OrderNotFound

    with pytest.raises(OrderNotFound):
        OrderService(db).delete_order("SC999999-9999")


def make_cod_order(phone: str = "0898887777", name: str = "สมหญิง รักดี") -> OrderCreate:
    payload = make_order(phone=phone, name=name)
    return payload.model_copy(update={"payment_method": "cod"})


def test_cod_order_has_no_satang_and_no_deadline(db):
    payment = OrderService(db).create_order(make_cod_order())

    # ยอดต้องเป็นราคาเต็มพอดี ลูกค้าจ่ายเงินสดกับคนส่งของ เศษสตางค์ไม่มีประโยชน์
    assert payment.amount_due == Decimal("890.00")
    assert payment.payment_expires_at is None
    # ไม่มี QR ให้เผลอโชว์
    assert payment.promptpay_payload == ""
    assert payment.payment_method == "cod"


def test_two_cod_orders_can_share_the_same_amount(db):
    service = OrderService(db)
    first = service.create_order(make_cod_order(phone="0811111111"))
    second = service.create_order(make_cod_order(phone="0822222222"))

    # ปลายทางไม่ได้จองสลอต ยอดเท่ากันจึงต้องสร้างได้ทั้งคู่
    assert first.amount_due == second.amount_due == Decimal("890.00")


def test_cod_order_does_not_block_a_transfer_order_satang_slot(db):
    service = OrderService(db)
    service.create_order(make_cod_order(phone="0833333333"))

    transfer = service.create_order(make_order(phone="0844444444"))

    # ออเดอร์โอนยังต้องได้เศษสตางค์ปกติ ไม่โดนออเดอร์ปลายทางกินสลอต
    assert transfer.amount_due != Decimal("890.00")
    assert Decimal("890.00") < transfer.amount_due < Decimal("891.00")


def test_bank_notification_never_matches_a_cod_order(db):
    service = OrderService(db)
    cod = service.create_order(make_cod_order(phone="0855555555"))

    result = PaymentService(db).handle_bank_notification(
        BankNotification(amount=Decimal("890.00"), raw_message="เงินเข้า 890.00")
    )

    # เงินโอนเข้าห้ามไปมาร์คออเดอร์ปลายทางว่าจ่ายแล้ว ทั้งที่ยังไม่ได้เก็บเงินจากลูกค้า
    assert result.matched is False
    order = db.execute(select(Order).where(Order.order_code == cod.order_code)).scalar_one()
    assert order.payment_status is PaymentStatus.AWAITING_PAYMENT
