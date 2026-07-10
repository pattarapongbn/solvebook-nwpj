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
import { cn, formatNumber, formatPrice } from "@/lib/utils";

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
            href={`/products/${info.row.original.id}`}
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
        cell: (info) => (
          <span className="tabular-nums">
            {formatPrice(info.getValue(), info.row.original.currency)}
          </span>
        ),
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
  );
}
