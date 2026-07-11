# Scout

Internal research tool สำหรับค้นหาสินค้าขายดีจากต่างประเทศ (USA / China) เพื่อนำเข้ามาขายในประเทศไทย พร้อมตรวจสอบว่ามีขายใน Shopee Thailand แล้วหรือยัง

Single user · Desktop first · Data first

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui style, TanStack Query/Table, React Hook Form, Zod |
| Backend  | FastAPI, Python, SQLAlchemy |
| Database | PostgreSQL (snapshot / time-series design) |
| Cache    | Redis |
| Crawler  | Playwright (Sprint 2) |

## Structure

```
scout/
├── frontend/   # Next.js app (Search UI, Favorites, History, Settings)
├── backend/    # FastAPI (API → Service → Repository → Database)
└── docker-compose.yml
```

## Quick Start

### 1. Infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.db.init_db --seed   # create tables + sample data
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

> สำหรับ dev แบบเร็ว ไม่ต้องมี Postgres: ตั้ง `DATABASE_URL=sqlite:///./scout.db` ใน `.env`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

เปิด http://localhost:3000

## Architecture Rules

- Frontend → API → Service → Repository → Database
- Business logic ห้ามอยู่ใน UI
- API ห้าม query database โดยตรง (ผ่าน repository เท่านั้น)
- ข้อมูลราคา/ยอดขายเป็น **daily snapshot** — append only, ไม่ update history

## Crawler (ข้อมูลจริง)

```bash
cd backend
playwright install chromium   # ครั้งแรกครั้งเดียว
python -m app.crawlers.run --keywords-file ../crawl/keywords.txt --sources amazon,1688
```

- Keyword ที่ติดตามอยู่ใน `crawl/keywords.txt` (บรรทัดละรายการ, `keyword | Category`)
- ยอดขาย Amazon ประมาณจากป้าย "N+ bought in past month"
- **อัปเดตอัตโนมัติทุกวัน 06:00 น.** ผ่าน GitHub Actions (`.github/workflows/daily-crawl.yml`)
  — ต้องตั้ง repo secret `DATABASE_URL` ชี้ไป Postgres/Supabase
- Snapshot เป็น append-only: วันละแถวต่อสินค้า รันซ้ำวันเดิมไม่เขียนทับ

## Development Priority

- [x] Sprint 1 — Project setup, Database schema, Search UI
- [x] Sprint 2 — Amazon crawler, 1688 crawler + daily snapshot job
- [ ] Sprint 3 — Shopee Thailand checker
- [ ] Sprint 4 — Favorite, Snapshot, History
- [ ] Sprint 5 — Supplier finder
- [ ] Sprint 6 — AI analysis

## Final Principle

ทุก feature ต้องตอบคำถาม: **"ช่วยให้หาสินค้าได้เร็วขึ้นหรือไม่"** — ถ้าไม่ใช่ ไม่ต้องสร้าง
