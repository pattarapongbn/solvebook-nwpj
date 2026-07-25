"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTokenGate } from "@/features/orders/admin-token-gate";
import { deleteCustomer, downloadCustomersCsv, listCustomers } from "@/features/orders/api";
import { formatBaht, formatDateTime } from "@/features/orders/status";
import type { Customer } from "@/features/orders/types";
import { ApiError } from "@/lib/api";

export default function AdminCustomersPage() {
  const [keyword, setKeyword] = useState("");
  const queryClient = useQueryClient();

  const customers = useQuery({ queryKey: ["admin-customers"], queryFn: listCustomers });
  const remove = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-customers"] }),
  });

  const rows = (customers.data ?? []).filter((customer) => matches(customer, keyword));

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-sm text-gray-500">
            ข้อมูลลูกค้าอยู่ในฐานข้อมูลของเราเอง — export ออกไปใช้กับขนส่งเจ้าไหนก็ได้
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="ค้นหาชื่อ / เบอร์ / จังหวัด"
            className="w-56"
          />
          <Button variant="outline" onClick={() => void downloadCustomersCsv()}>
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      </div>

      {customers.isLoading && (
        <Card className="py-12 text-center text-sm text-gray-500">กำลังโหลด...</Card>
      )}

      {customers.isError &&
        (customers.error instanceof ApiError && customers.error.status === 401 ? (
          <AdminTokenGate onSaved={() => void customers.refetch()} />
        ) : (
          <Card className="py-12 text-center text-sm text-gray-500">
            โหลดข้อมูลลูกค้าไม่สำเร็จ — ตรวจว่า backend เปิดอยู่และ DATABASE_URL ถูกต้อง
          </Card>
        ))}

      {customers.data && rows.length === 0 && (
        <Card className="py-12 text-center text-sm text-gray-500">ไม่พบลูกค้าที่ตรงเงื่อนไข</Card>
      )}

      {rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>ที่อยู่ล่าสุด</TableHead>
              <TableHead>ออเดอร์</TableHead>
              <TableHead>ยอดสะสม</TableHead>
              <TableHead>สั่งล่าสุด</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((customer) => {
              const address =
                customer.addresses.find((item) => item.is_default) ?? customer.addresses[0];
              return (
                <TableRow key={customer.id} className="align-top">
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.phone}</div>
                    <div className="mt-1 flex gap-1">
                      {customer.flags.map((flag) => (
                        <Badge key={flag} variant="outline">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-72 text-xs text-gray-600">
                    {address ? (
                      <>
                        {address.address_line} ต.{address.tambon} อ.{address.amphoe} จ.
                        {address.province} {address.zipcode}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{customer.total_orders}</TableCell>
                  <TableCell>{formatBaht(customer.total_spent)}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDateTime(customer.last_order_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (window.confirm(`ลบข้อมูลส่วนตัวของ ${customer.name}? (PDPA)`)) {
                          remove.mutate(customer.id);
                        }
                      }}
                    >
                      ลบข้อมูล
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function matches(customer: Customer, keyword: string): boolean {
  const query = keyword.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    customer.name,
    customer.phone,
    customer.email ?? "",
    ...customer.addresses.map((address) => `${address.province} ${address.amphoe}`),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}
