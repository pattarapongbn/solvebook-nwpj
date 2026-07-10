import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">ตั้งค่าระบบ</p>
      </div>
      <Card className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-500">API URL</span>
          <span className="font-mono">
            {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Version</span>
          <span>0.1.0 (Sprint 1)</span>
        </div>
      </Card>
    </div>
  );
}
