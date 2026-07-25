import type { FulfillmentStatus, PaymentStatus, SlipCheckStatus } from "./types";

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  awaiting_payment: "รอโอนเงิน",
  slip_submitted: "แนบสลิปแล้ว",
  paid: "เงินเข้าแล้ว",
  refunded: "คืนเงินแล้ว",
  cancelled: "ยกเลิก",
};

export const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  pending: "ยังไม่จัดส่ง",
  ready_to_ship: "พร้อมส่ง",
  shipped: "ส่งแล้ว",
  cancelled: "ยกเลิก",
};

export const SLIP_LABEL: Record<SlipCheckStatus, string> = {
  qr_ok: "อ่าน QR ผ่าน",
  duplicate: "สลิปซ้ำ",
  qr_unreadable: "อ่าน QR ไม่ได้ — ต้องตรวจเอง",
};

export function formatBaht(amount: string): string {
  return `${Number(amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}
