/**
 * คัดลอก backend/app ของ repo เข้ามาที่ frontend/api/_vendor/app ก่อน build
 *
 * ทำแบบนี้เพราะ Vercel build จาก frontend/ เป็น root แต่โค้ด backend อยู่นอกโฟลเดอร์นั้น
 * ตัวจริงอยู่ที่ backend/app/ ที่เดียว ตัวที่คัดลอกมาถูก gitignore ไว้ จะได้ไม่มีโค้ดสองชุด
 *
 * รันเองได้ด้วย: npm run prepare:vercel
 */
import { cp, rm, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frontend = dirname(here);
const backendApp = join(frontend, "..", "backend", "app");
const vendorApp = join(frontend, "api", "_vendor", "app");

const SKIP = new Set(["__pycache__", "scout.db", "init_db.py"]);

try {
  await access(backendApp);
} catch {
  // deploy บางแบบอัปโหลดเฉพาะ frontend/ — ถ้ามี _vendor ติดมาแล้วก็ใช้ของเดิมต่อได้
  console.warn("[prepare-vercel] ไม่พบ ../backend/app — ข้ามการคัดลอก");
  process.exit(0);
}

await rm(vendorApp, { recursive: true, force: true });
await mkdir(dirname(vendorApp), { recursive: true });
await cp(backendApp, vendorApp, {
  recursive: true,
  filter: (src) => !SKIP.has(src.split("/").pop() ?? ""),
});

console.log("[prepare-vercel] คัดลอก backend/app -> api/_vendor/app แล้ว");
