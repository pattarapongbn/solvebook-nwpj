"use client";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { listFavorites } from "@/features/search/api";
import { ResultsTable } from "@/features/search/results-table";

export default function FavoritesPage() {
  const query = useQuery({ queryKey: ["favorites"], queryFn: listFavorites });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Favorites</h1>
        <p className="text-sm text-gray-500">
          สินค้าที่บันทึกไว้ — ระบบจะอัปเดตราคา/ยอดขายให้ทุกวัน
        </p>
      </div>

      {query.isLoading && (
        <Card className="py-12 text-center text-sm text-gray-500">กำลังโหลด...</Card>
      )}

      {query.data && query.data.length === 0 && (
        <Card className="py-12 text-center text-sm text-gray-500">
          ยังไม่มีสินค้าที่บันทึกไว้ — กดรูปหัวใจในหน้า Search เพื่อบันทึก
        </Card>
      )}

      {query.data && query.data.length > 0 && (
        <ResultsTable items={query.data.map((f) => f.product)} />
      )}
    </div>
  );
}
