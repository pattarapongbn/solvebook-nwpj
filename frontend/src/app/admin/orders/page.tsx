"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listOrders,
  listUnmatchedPayments,
  markPaid,
  resolveUnmatchedPayment,
  setTracking,
} from "@/features/orders/api";
import {
  FULFILLMENT_LABEL,
  PAYMENT_LABEL,
  SLIP_LABEL,
  formatBaht,
  formatDateTime,
} from "@/features/orders/status";
import type { Order, PaymentStatus } from "@/features/orders/types";

const STATUS_OPTIONS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "ทุกสถานะ" },
  { value: "slip_submitted", label: "แนบสลิปแล้ว — รอยืนยัน" },
  { value: "awaiting_payment", label: "รอโอนเงิน" },
  { value: "paid", label: "เงินเข้าแล้ว" },
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const queryClient = useQueryClient();

  const orders = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () => listOrders(status || undefined),
  });
  const unmatched = useQuery({
    queryKey: ["unmatched-payments"],
    queryFn: listUnmatchedPayments,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["unmatched-payments"] });
  };

  const confirmPaid = useMutation({
    mutationFn: (orderCode: string) => markPaid(orderCode),
    onSuccess: invalidate,
  });
  const saveTracking = useMutation({
    mutationFn: (vars: { orderCode: string; trackingNo: string }) =>
      setTracking(vars.orderCode, vars.trackingNo),
    onSuccess: invalidate,
  });
  const resolvePayment = useMutation({
    mutationFn: (vars: { paymentId: number; orderCode: string }) =>
      resolveUnmatchedPayment(vars.paymentId, vars.orderCode),
    onSuccess: invalidate,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500">
            ยอดโอนของแต่ละออเดอร์มีเศษสตางค์ไม่ซ้ำกัน — ใช้จับคู่เงินเข้าได้ทันที
          </p>
        </div>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as PaymentStatus | "")}
          className="w-56"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {unmatched.data && unmatched.data.length > 0 && (
        <Card className="space-y-3 p-4">
          <div>
            <h2 className="text-sm font-semibold">เงินเข้าที่จับคู่ออเดอร์ไม่ได้</h2>
            <p className="text-xs text-gray-500">
              ใส่รหัสออเดอร์เพื่อผูกเข้าด้วยตัวเอง แล้วระบบจะยืนยันว่าเงินเข้าแล้วให้
            </p>
          </div>
          <div className="space-y-2">
            {unmatched.data.map((payment) => (
              <UnmatchedRow
                key={payment.id}
                amount={formatBaht(payment.amount)}
                receivedAt={formatDateTime(payment.received_at)}
                onResolve={(orderCode) =>
                  resolvePayment.mutate({ paymentId: payment.id, orderCode })
                }
              />
            ))}
          </div>
        </Card>
      )}

      {orders.isLoading && (
        <Card className="py-12 text-center text-sm text-gray-500">กำลังโหลด...</Card>
      )}

      {orders.isError && (
        <Card className="py-12 text-center text-sm text-gray-500">
          โหลดออเดอร์ไม่สำเร็จ — ตรวจว่า backend เปิดอยู่ และตั้งโทเคนแอดมินถูกต้อง
        </Card>
      )}

      {orders.data && orders.data.length === 0 && (
        <Card className="py-12 text-center text-sm text-gray-500">ยังไม่มีออเดอร์</Card>
      )}

      {orders.data && orders.data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ออเดอร์</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>ยอดที่ต้องโอน</TableHead>
              <TableHead>สลิป</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>จัดส่ง</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onConfirmPaid={() => confirmPaid.mutate(order.order_code)}
                onSaveTracking={(trackingNo) =>
                  saveTracking.mutate({ orderCode: order.order_code, trackingNo })
                }
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function OrderRow({
  order,
  onConfirmPaid,
  onSaveTracking,
}: {
  order: Order;
  onConfirmPaid: () => void;
  onSaveTracking: (trackingNo: string) => void;
}) {
  const [tracking, setTrackingValue] = useState("");
  const latestSlip = order.slips[0];
  const address = order.shipping_snapshot;

  return (
    <TableRow className="align-top">
      <TableCell>
        <div className="font-medium">{order.order_code}</div>
        <div className="text-xs text-gray-500">{formatDateTime(order.created_at)}</div>
        <div className="text-xs text-gray-500">
          {order.product_name} × {order.quantity}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{order.customer_name}</div>
        <div className="text-xs text-gray-500">{order.customer_phone}</div>
        <div className="mt-1 max-w-60 text-xs text-gray-500">
          {address.address_line} ต.{address.tambon} อ.{address.amphoe} จ.{address.province}{" "}
          {address.zipcode}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-semibold">{formatBaht(order.amount_due)}</div>
        <div className="text-xs text-gray-500">ราคาสินค้า {formatBaht(order.amount_base)}</div>
      </TableCell>
      <TableCell>
        {latestSlip ? (
          <div className="space-y-1">
            <Badge variant={latestSlip.check_status === "qr_ok" ? "default" : "outline"}>
              {SLIP_LABEL[latestSlip.check_status]}
            </Badge>
            {latestSlip.transaction_ref && (
              <div className="max-w-40 truncate text-xs text-gray-500">
                ref {latestSlip.transaction_ref}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">ยังไม่แนบ</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={order.payment_status === "paid" ? "default" : "outline"}>
          {PAYMENT_LABEL[order.payment_status]}
        </Badge>
        {order.payment_status !== "paid" && (
          <Button size="sm" variant="outline" className="mt-2" onClick={onConfirmPaid}>
            ยืนยันเงินเข้า
          </Button>
        )}
      </TableCell>
      <TableCell>
        <div className="text-xs text-gray-500">
          {FULFILLMENT_LABEL[order.fulfillment_status]}
        </div>
        {order.tracking_no ? (
          <div className="mt-1 text-xs font-medium">{order.tracking_no}</div>
        ) : (
          <div className="mt-1 flex gap-1">
            <Input
              value={tracking}
              onChange={(event) => setTrackingValue(event.target.value)}
              placeholder="เลขพัสดุ"
              className="h-8 w-28 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={tracking.trim().length < 4}
              onClick={() => onSaveTracking(tracking.trim())}
            >
              บันทึก
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function UnmatchedRow({
  amount,
  receivedAt,
  onResolve,
}: {
  amount: string;
  receivedAt: string;
  onResolve: (orderCode: string) => void;
}) {
  const [orderCode, setOrderCode] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
      <span className="font-medium">{amount}</span>
      <span className="text-xs text-gray-500">{receivedAt}</span>
      <Input
        value={orderCode}
        onChange={(event) => setOrderCode(event.target.value)}
        placeholder="รหัสออเดอร์"
        className="h-8 w-40 text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={orderCode.trim().length < 4}
        onClick={() => onResolve(orderCode.trim())}
      >
        ผูกออเดอร์
      </Button>
    </div>
  );
}
