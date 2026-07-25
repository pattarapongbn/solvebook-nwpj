"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminToken, setAdminToken } from "./api";

/**
 * หน้าหลังร้านถูกป้องกันด้วยโทเคนที่ตั้งไว้ใน env ของ backend (ADMIN_TOKEN)
 * เก็บไว้ใน localStorage ของเครื่องที่ใช้ ไม่ต้องมีระบบ login เต็มรูปแบบสำหรับร้านคนเดียว
 */
export function AdminTokenGate({ onSaved }: { onSaved: () => void }) {
  const [token, setToken] = useState("");

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="text-sm font-semibold">ต้องใส่โทเคนแอดมินก่อน</h2>
        <p className="mt-1 text-xs text-gray-500">
          ใช้ค่าเดียวกับ <code className="rounded bg-gray-100 px-1">ADMIN_TOKEN</code>{" "}
          ที่ตั้งไว้ใน environment variables ของ backend — เครื่องนี้จะจำไว้ให้
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="โทเคนแอดมิน"
          className="max-w-sm"
          onKeyDown={(event) => {
            if (event.key === "Enter" && token.trim()) {
              setAdminToken(token.trim());
              onSaved();
            }
          }}
        />
        <Button
          disabled={!token.trim()}
          onClick={() => {
            setAdminToken(token.trim());
            onSaved();
          }}
        >
          บันทึก
        </Button>
      </div>
      {getAdminToken() && (
        <p className="text-xs text-gray-500">
          มีโทเคนเก็บไว้อยู่แล้วแต่ใช้ไม่ผ่าน — ใส่ค่าใหม่เพื่อทับของเดิม
        </p>
      )}
    </Card>
  );
}
