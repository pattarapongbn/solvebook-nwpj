"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { searchProducts } from "@/features/search/api";
import { ResultsTable } from "@/features/search/results-table";
import { SearchFilters } from "@/features/search/search-filters";
import {
  DEFAULT_SEARCH_VALUES,
  type SearchFormValues,
} from "@/features/search/types";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFormValues>(DEFAULT_SEARCH_VALUES);
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["search", filters, page],
    queryFn: () => searchProducts(filters, page),
    placeholderData: keepPreviousData,
  });

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Search</h1>
        <p className="text-sm text-gray-500">
          ค้นหาสินค้าขายดีจาก USA / China และเช็คสถานะใน Shopee Thailand
        </p>
      </div>

      <SearchFilters
        onSearch={(values) => {
          setFilters(values);
          setPage(1);
        }}
      />

      {query.isLoading && (
        <Card className="py-12 text-center text-sm text-gray-500">กำลังค้นหา...</Card>
      )}

      {query.isError && (
        <Card className="py-12 text-center text-sm text-red-600">
          เชื่อมต่อ API ไม่ได้ — ตรวจสอบว่า backend รันอยู่ที่ {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
        </Card>
      )}

      {query.data && query.data.items.length === 0 && (
        <Card className="py-12 text-center text-sm text-gray-500">
          ไม่พบสินค้า — ลองเปลี่ยน keyword หรือ filter
        </Card>
      )}

      {query.data && query.data.items.length > 0 && (
        <>
          <ResultsTable items={query.data.items} />
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {query.data.total} products · page {query.data.page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
