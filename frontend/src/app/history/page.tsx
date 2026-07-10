import { Card } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">History</h1>
        <p className="text-sm text-gray-500">ประวัติการค้นหาและ snapshot ย้อนหลัง</p>
      </div>
      <Card className="py-12 text-center text-sm text-gray-500">
        จะเปิดใช้งานใน Sprint 4 (Favorite / Snapshot / History)
      </Card>
    </div>
  );
}
