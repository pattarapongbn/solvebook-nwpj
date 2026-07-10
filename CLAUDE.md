# Scout — Claude Code Guide

Internal research tool (single user) สำหรับหาสินค้าขายดีจาก USA/China มาขายไทย และเช็คว่ามีใน Shopee Thailand แล้วหรือยัง

## Layout

- `frontend/` — Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui-style components
- `backend/` — FastAPI, layered: `api/routes` → `services` → `repositories` → SQLAlchemy models

## Hard Rules

- TypeScript strict, **ห้ามใช้ `any`**
- Business logic ห้ามอยู่ใน UI — อยู่ใน backend services เท่านั้น
- API routes ห้าม query database โดยตรง — ต้องผ่าน repository
- ตาราง `product_snapshots` / `thailand_checks` เป็น append-only snapshot — ห้าม UPDATE ข้อมูลย้อนหลัง
- UI minimal: พื้นขาว เส้นขอบเทา primary ดำ radius 12px, ไม่มี animation ที่ไม่จำเป็น
- Feature ใหม่ต้องตอบได้ว่า "ช่วยให้หาสินค้าได้เร็วขึ้น" ถ้าไม่ใช่ อย่าสร้าง

## Commands

- Frontend: `cd frontend && npm run dev` / `npm run build` / `npm run lint`
- Backend: `cd backend && uvicorn app.main:app --reload` / tests: `pytest`
- Init DB + seed: `cd backend && python -m app.db.init_db --seed`
- Dev DB แบบไม่มี Postgres: `DATABASE_URL=sqlite:///./scout.db`
