"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductDetail } from "@/features/search/api";
import { MARKETPLACE_LABELS, type ProductDetail } from "@/features/search/types";
import { cn, formatNumber, formatPrice } from "@/lib/utils";

const TABS = ["Overview", "Price History", "Sales History", "Shopee Thailand"] as const;
type Tab = (typeof TABS)[number];

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const [tab, setTab] = useState<Tab>("Overview");

  const query = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductDetail(productId),
    enabled: Number.isFinite(productId),
  });

  if (query.isLoading) {
    return <Card className="py-12 text-center text-sm text-gray-500">กำลังโหลด...</Card>;
  }
  if (query.isError || !query.data) {
    return <Card className="py-12 text-center text-sm text-red-600">ไม่พบสินค้า</Card>;
  }

  const product = query.data;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={14} /> Back to search
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {MARKETPLACE_LABELS[product.marketplace]} · {product.country} ·{" "}
            {product.category ?? "Uncategorized"}
          </p>
        </div>
        {product.product_url && (
          <a
            href={product.product_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Open source <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              tab === t
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab product={product} />}
      {tab === "Price History" && <PriceHistoryTab product={product} />}
      {tab === "Sales History" && <SalesHistoryTab product={product} />}
      {tab === "Shopee Thailand" && <ThailandTab product={product} />}
    </div>
  );
}

function OverviewTab({ product }: { product: ProductDetail }) {
  const latest = product.snapshots.at(-1);
  const latestCheck = product.thailand_checks.at(-1);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <p className="text-xs text-gray-500">Current Price</p>
        <p className="mt-1 text-lg font-bold tabular-nums">
          {formatPrice(latest?.price ?? null, latest?.currency ?? null)}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-gray-500">Orders (30d)</p>
        <p className="mt-1 text-lg font-bold tabular-nums">
          {formatNumber(latest?.orders_30d ?? null)}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-gray-500">Revenue (30d)</p>
        <p className="mt-1 text-lg font-bold tabular-nums">
          {formatPrice(latest?.revenue_30d ?? null, latest?.currency ?? null)}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-gray-500">Shopee Thailand</p>
        <p className="mt-1">
          {latestCheck ? (
            latestCheck.status === "found" ? (
              <Badge variant="warning">Found</Badge>
            ) : (
              <Badge variant="success">Not Found</Badge>
            )
          ) : (
            <Badge variant="outline">Unchecked</Badge>
          )}
        </p>
      </Card>
    </div>
  );
}

function PriceHistoryTab({ product }: { product: ProductDetail }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Reviews</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...product.snapshots].reverse().map((s) => (
          <TableRow key={s.snapshot_date}>
            <TableCell>{s.snapshot_date}</TableCell>
            <TableCell className="tabular-nums">{formatPrice(s.price, s.currency)}</TableCell>
            <TableCell className="tabular-nums">{s.rating ?? "—"}</TableCell>
            <TableCell className="tabular-nums">{formatNumber(s.review_count)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SalesHistoryTab({ product }: { product: ProductDetail }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Orders 1d</TableHead>
          <TableHead>Orders 7d</TableHead>
          <TableHead>Orders 30d</TableHead>
          <TableHead>Revenue 30d</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...product.snapshots].reverse().map((s) => (
          <TableRow key={s.snapshot_date}>
            <TableCell>{s.snapshot_date}</TableCell>
            <TableCell className="tabular-nums">{formatNumber(s.orders_1d)}</TableCell>
            <TableCell className="tabular-nums">{formatNumber(s.orders_7d)}</TableCell>
            <TableCell className="tabular-nums">{formatNumber(s.orders_30d)}</TableCell>
            <TableCell className="tabular-nums">
              {formatPrice(s.revenue_30d, s.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ThailandTab({ product }: { product: ProductDetail }) {
  if (product.thailand_checks.length === 0) {
    return (
      <Card className="py-12 text-center text-sm text-gray-500">
        ยังไม่เคยเช็คสินค้านี้ใน Shopee Thailand — ระบบเช็คอัตโนมัติจะมาใน Sprint 3
      </Card>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Sellers</TableHead>
          <TableHead>Price (THB)</TableHead>
          <TableHead>Link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...product.thailand_checks].reverse().map((c) => (
          <TableRow key={c.check_date}>
            <TableCell>{c.check_date}</TableCell>
            <TableCell>
              {c.status === "found" ? (
                <Badge variant="warning">Found</Badge>
              ) : (
                <Badge variant="success">Not Found</Badge>
              )}
            </TableCell>
            <TableCell className="tabular-nums">{formatNumber(c.seller_count)}</TableCell>
            <TableCell className="tabular-nums">
              {c.matched_price_thb !== null ? `฿${c.matched_price_thb.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell>
              {c.matched_url ? (
                <a
                  href={c.matched_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-600 underline hover:text-gray-900"
                >
                  Shopee
                </a>
              ) : (
                "—"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
