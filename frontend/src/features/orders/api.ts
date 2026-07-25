import { ApiError, apiFetch } from "@/lib/api";

import type { Customer, Order, PaymentStatus, UnmatchedPayment } from "./types";

const TOKEN_KEY = "scout_admin_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setAdminToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { "X-Admin-Token": token } : {};
}

export function listOrders(status?: PaymentStatus): Promise<Order[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<Order[]>(`/admin/orders${query}`, { headers: adminHeaders() });
}

export function markPaid(orderCode: string, note?: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/admin/orders/${orderCode}/mark-paid`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ note: note ?? null }),
  });
}

export function setTracking(
  orderCode: string,
  trackingNo: string,
  courier?: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/admin/orders/${orderCode}/tracking`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ tracking_no: trackingNo, courier: courier ?? null }),
  });
}

export function listUnmatchedPayments(): Promise<UnmatchedPayment[]> {
  return apiFetch<UnmatchedPayment[]>("/admin/unmatched-payments", {
    headers: adminHeaders(),
  });
}

export function resolveUnmatchedPayment(
  paymentId: number,
  orderCode: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/admin/unmatched-payments/${paymentId}/resolve`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ order_code: orderCode }),
  });
}

export function listCustomers(): Promise<Customer[]> {
  return apiFetch<Customer[]>("/admin/customers", { headers: adminHeaders() });
}

export function deleteCustomer(customerId: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/admin/customers/${customerId}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
}

/** โหลดรูปสลิปมาเป็น object URL — ต้องยิงเองเพราะ <img> ส่ง header โทเคนไม่ได้ */
export async function fetchSlipImage(slipId: number): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/admin/slips/${slipId}/image`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, `โหลดรูปสลิปไม่สำเร็จ (${res.status})`);
  return URL.createObjectURL(await res.blob());
}

/** ดาวน์โหลด CSV — ต้องยิงเองเพราะ response เป็นไฟล์ ไม่ใช่ JSON */
export async function downloadCustomersCsv(): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/admin/customers/export.csv`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "customers.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
