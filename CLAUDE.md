# Scout — Claude Code Guide

Internal research tool (single user) สำหรับหาสินค้าขายดีจาก USA/China มาขายไทย และเช็คว่ามีใน Shopee Thailand แล้วหรือยัง

## Layout

- `frontend/` — Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui-style components
  หน้าเว็บเหลือเฉพาะฝั่งร้าน: `/admin/orders`, `/admin/customers`, `/settings`, `/privacy` + `/shop/`
  (หน้า Search/Favorites/History ถูกถอดออกแล้ว — API ฝั่งวิจัยสินค้ายังอยู่ใน backend)
- `backend/` — FastAPI, layered: `api/routes` → `services` → `repositories` → SQLAlchemy models
- `frontend/public/shop/` — หน้าสั่งซื้อของลูกค้า (static + jsQR) เสิร์ฟที่ `/shop/` ต่อ backend ผ่าน `window.SCOUT_API_BASE`
- หน้าเว็บ deploy เป็น static export (`output: "export"` → `frontend/out/`) บน Cloudflare Pages · backend อยู่คนละโดเมนบน Render

## Hard Rules

- TypeScript strict, **ห้ามใช้ `any`**
- Business logic ห้ามอยู่ใน UI — อยู่ใน backend services เท่านั้น
- API routes ห้าม query database โดยตรง — ต้องผ่าน repository
- ตาราง `product_snapshots` / `thailand_checks` เป็น append-only snapshot — ห้าม UPDATE ข้อมูลย้อนหลัง
- `payment_slips` append-only ต่อการแนบแต่ละครั้ง · `orders.shipping_snapshot` แช่แข็งที่อยู่ ณ เวลาสั่ง ห้ามแก้ตามที่อยู่ปัจจุบัน
- ที่อยู่เก็บแยกฟิลด์เสมอ (ตำบล/อำเภอ/จังหวัด/ไปรษณีย์ + รหัสราชการ) ห้ามเก็บเป็นก้อนข้อความเดียว
- ยอด `amount_due` ของออเดอร์ที่ยังรอจ่ายห้ามซ้ำกัน — เศษสตางค์คือกุญแจจับคู่เงินเข้า
- ต่อขนส่งเจ้าใหม่ = เพิ่มไฟล์ใน `backend/app/fulfillment/` ที่ implement `FulfillmentProvider` ห้ามยิง API ขนส่งตรงจากที่อื่น
- UI minimal: พื้นขาว เส้นขอบเทา primary ดำ radius 12px, ไม่มี animation ที่ไม่จำเป็น
- Feature ใหม่ต้องตอบได้ว่า "ช่วยให้หาสินค้าได้เร็วขึ้น" ถ้าไม่ใช่ อย่าสร้าง

## Commands

- Frontend: `cd frontend && npm run dev` / `npm run build` / `npm run lint`
- Backend: `cd backend && uvicorn app.main:app --reload` / tests: `pytest`
- Init DB + seed: `cd backend && python -m app.db.init_db --seed`
- Crawler: `cd backend && python -m app.crawlers.run --keywords-file ../crawl/keywords.txt`
- Daily job: GitHub Actions `.github/workflows/daily-crawl.yml` (secret `DATABASE_URL`)
- Dev DB แบบไม่มี Postgres: `DATABASE_URL=sqlite:///./scout.db`
- Storefront: `cd frontend/public/shop && python3 -m http.server 8080`
- Deploy: ดู `DEPLOY.md` — Cloudflare Pages (root `frontend`, output `out`) + Render (`render.yaml`) + Neon
- คนละโดเมนแล้ว: ทุก route ใหม่ต้องเรียก API ผ่าน `NEXT_PUBLIC_API_URL` / `window.SCOUT_API_BASE` เท่านั้น ห้ามใช้ path แบบ relative
- ห้ามใช้ dynamic route segment (`[id]`) — static export สร้างไฟล์ได้เฉพาะ path ที่รู้ตอน build ให้รับค่าทาง query string แทน
