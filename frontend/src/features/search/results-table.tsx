"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatNumber, formatPrice, formatTHB } from "@/lib/utils";

import { addFavorite, removeFavorite } from "./api";
import { MARKETPLACE_LABELS, type ProductListItem } from "./types";

const columnHelper = createColumnHelper<ProductListItem>();

function ThailandBadge({ status }: { status: ProductListItem["thailand_status"] }) {
  if (status === "found") return <Badge variant="warning">Found</Badge>;
  if (status === "not_found") return <Badge variant="success">Not Found</Badge>;
  return <Badge variant="outline">Unchecked</Badge>;
}

function FavoriteButton({ item }: { item: ProductListItem }) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: () =>
      item.is_favorite ? removeFavorite(item.id) : addFavorite(item.id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["search"] });
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      aria-label={item.is_favorite ? "Remove favorite" : "Add favorite"}
      className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-50"
    >
      <Heart
        size={16}
        className={cn(item.is_favorite ? "fill-red-500 text-red-500" : "text-gray-400")}
      />
    </button>
  );
}

function ProductCard({ item }: { item: ProductListItem }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 object-cover"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 bg-gray-50" />
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/products/detail?id=${item.id}`}
            className="line-clamp-2 text-sm font-medium leading-snug"
          >
            {item.name}
          </Link>
          <p className="mt-0.5 text-xs text-gray-500">
            {MARKETPLACE_LABELS[item.marketplace]} · {item.category ?? "—"}
          </p>
        </div>
        <FavoriteButton item={item} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="tabular-nums">
          <div className="text-sm font-semibold">
            {formatPrice(item.price, item.currency)}
          </div>
          {item.price_thb !== null && (
            <div className="text-xs text-gray-500">{formatTHB(item.price_thb)}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums">
            {formatNumber(item.orders)}
          </div>
          <div className="text-xs text-gray-500">sales</div>
        </div>
        <ThailandBadge status={item.thailand_status} />
      </div>
    </div>
  );
}

interface ResultsTableProps {
  items: ProductListItem[];
}

export function ResultsTable({ items }: ResultsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("image_url", {
        header: "",
        cell: (info) => {
          const url = info.getValue();
          return url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-50" />
          );
        },
      }),
      columnHelper.accessor("name", {
        header: "Product",
        cell: (info) => (
          <Link
            href={`/products/detail?id=${info.row.original.id}`}
            className="font-medium hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("marketplace", {
        header: "Source",
        cell: (info) => (
          <span className="text-gray-500">{MARKETPLACE_LABELS[info.getValue()]}</span>
        ),
      }),
      columnHelper.accessor("price", {
        header: "Price",
        cell: (info) => {
          const item = info.row.original;
          return (
            <div className="tabular-nums">
              <div>{formatPrice(item.price, item.currency)}</div>
              {item.price_thb !== null && (
                <div className="text-xs text-gray-500">{formatTHB(item.price_thb)}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("orders", {
        header: "Sales",
        cell: (info) => <span className="tabular-nums">{formatNumber(info.getValue())}</span>,
      }),
      columnHelper.accessor("thailand_status", {
        header: "Thailand",
        cell: (info) => <ThailandBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("last_updated", {
        header: "Updated",
        cell: (info) => <span className="text-gray-500">{info.getValue() ?? "—"}</span>,
      }),
      columnHelper.display({
        id: "favorite",
        header: "",
        cell: (info) => <FavoriteButton item={info.row.original} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Mobile: การ์ดสินค้า */}
      <div className="space-y-2 md:hidden">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>

      {/* Desktop: ตาราง */}
      <div className="hidden md:block">
        <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
