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
├── frontend/               # Next.js static export (Search UI, Admin orders/customers, /privacy)
│   └── public/shop/        # หน้าสั่งซื้อของลูกค้า (static)
├── backend/                # FastAPI (API → Service → Repository → Database)
├── render.yaml             # blueprint ของ backend บน Render
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

## ระบบขาย: ตรวจสลิป + ฐานข้อมูลลูกค้า

หน้าร้านอยู่ที่ `/shop/` (ไฟล์อยู่ใน `frontend/public/shop/`) หลังร้านอยู่ที่
`/admin/orders` และ `/admin/customers` — ทั้งหมดเป็นไฟล์นิ่งที่ deploy พร้อมกันบน
Cloudflare Pages ส่วน API อยู่คนละโดเมนบน Render (จึงต้องตั้ง `CORS_ORIGINS`)
ดูขั้นตอนขึ้น production ที่ **[DEPLOY.md](DEPLOY.md)** · คู่มือใช้งานประจำวันสำหรับคนดูแลร้านที่ **[OPERATIONS.md](OPERATIONS.md)**

**ตรวจสลิปแบบไม่เสียค่าบริการ ทำ 2 ชั้นซ้อนกัน**

1. **อ่าน QR บนสลิป** — ทำในเครื่องลูกค้าด้วย jsQR ไม่ส่งภาพออกไปไหน
   ส่งมาแค่เลขอ้างอิงธุรกรรมกับ SHA-256 ของไฟล์ เลขอ้างอิงเป็น unique index
   สลิปที่เคยใช้กับออเดอร์อื่นแล้วจะถูกปฏิเสธทันที
   อ่าน QR ไม่ออก = ผ่านได้แต่ flag ไว้ให้แอดมินตรวจ (ห้ามบล็อกลูกค้าจริง)
2. **ยอดโอนไม่ซ้ำ** — แต่ละออเดอร์ได้เศษสตางค์สุ่มที่ไม่ชนกับออเดอร์อื่นที่ยังรอจ่าย
   (890.00 → 890.37) แล้วฝังยอดนี้ใน QR พร้อมเพย์ พอธนาคารแจ้งเงินเข้ามาที่
   `POST /api/v1/payments/bank-notify` (ยิงผ่าน Zapier ที่ parse อีเมลแจ้งเตือน)
   ระบบจับคู่ออเดอร์ได้เลยโดยไม่ต้องเดา จับคู่ไม่ได้ก็เก็บใน `unmatched_payments`

จะอัปเกรดไปใช้ SlipOK / EasySlip เมื่อออเดอร์เยอะพอ ให้เพิ่มการเรียก API ใน
`SlipService.submit()` ที่เดียว ไม่ต้องแก้ที่อื่น

**ฐานข้อมูลลูกค้า** เก็บที่อยู่แยกฟิลด์ (ตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์ + ช่องรหัสราชการ)
พร้อม `shipping_snapshot` แช่แข็งที่อยู่ ณ เวลาสั่ง ลูกค้าย้ายบ้านแล้วออเดอร์เก่ายังถูก
export CSV ได้จาก `/admin/customers` และมี soft delete ตาม PDPA

**ขนส่ง** ผ่าน adapter layer ใน `backend/app/fulfillment/` เปลี่ยนเจ้าด้วย env
`FULFILLMENT_PROVIDER` (ตอนนี้ `manual` = แอดมินกรอกเลขพัสดุเอง)

รูปสลิปเก็บในฐานข้อมูล (ตาราง `payment_slip_images`) แอดมินกดดูได้จากหน้าออเดอร์ —
จำเป็นกับเคส `qr_unreadable` ที่ต้องตรวจด้วยตา ถ้าออเดอร์เยอะจนฐานข้อมูลโต
ค่อยย้ายไป object storage แล้วเก็บที่อยู่ไฟล์ลง `payment_slips.image_url` แทน

ตัวแปร env ที่เกี่ยวข้อง: `PROMPTPAY_TARGET`, `SHOP_NAME`, `PAYMENT_WINDOW_MINUTES`,
`BANK_WEBHOOK_SECRET`, `ADMIN_TOKEN`, `FULFILLMENT_PROVIDER`, `AUTO_CREATE_TABLES`,
`CORS_ORIGINS`

## Development Priority

- [x] Sprint 1 — Project setup, Database schema, Search UI
- [x] Sprint 2 — Amazon crawler, 1688 crawler + daily snapshot job
- [x] Sprint 3 — ระบบขาย: ตรวจสลิป, ยอดโอนไม่ซ้ำ, ฐานข้อมูลลูกค้า, adapter ขนส่ง
- [ ] Sprint 4 — Shopee Thailand checker
- [ ] Sprint 5 — Favorite, Snapshot, History
- [ ] Sprint 6 — Supplier finder
- [ ] Sprint 7 — AI analysis

## Final Principle

ทุก feature ต้องตอบคำถาม: **"ช่วยให้หาสินค้าได้เร็วขึ้นหรือไม่"** — ถ้าไม่ใช่ ไม่ต้องสร้าง
