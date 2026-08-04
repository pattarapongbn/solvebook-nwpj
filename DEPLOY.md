# Deploy: Cloudflare Pages (หน้าเว็บ) + Render (API) + Neon (ฐานข้อมูล)

ย้ายออกจาก Vercel เพราะแผน Hobby ที่ใช้อยู่ **ห้ามใช้เชิงพาณิชย์** ร้านที่เก็บเงิน
ลูกค้าจริงเข้าข่ายละเมิดเงื่อนไข และมักโดนระงับตอนทราฟฟิกพุ่ง = ตอนที่ยิงแอดแล้วขายดีพอดี

```
ลูกค้ากดจากแอด Facebook
        ↓
[Cloudflare Pages]  หน้าร้าน + หลังร้าน (static export) — ฟรี ไม่จำกัดแบนด์วิดท์ ไม่มี cold start
        ↓ เรียก API ข้ามโดเมนเฉพาะตอนสั่งซื้อ
[Render free]       FastAPI — หลับเมื่อไม่มีคนใช้ 15 นาที
        ↓
[Neon]              Postgres (Singapore)
```

แยกหน้าร้านออกจาก backend เพราะหน้าร้านต้องเปิดเร็วที่สุด (คนกดมาจากแอด ช้าเกิน 3 วิ
คือปิดหนี) ส่วน backend หลับได้ เพราะกว่าจะถูกเรียกจริงคือตอนกรอกฟอร์มเสร็จ

| URL | คืออะไร |
|---|---|
| `/shop/` | หน้าสั่งซื้อของลูกค้า — **ลิงก์นี้เอาไปแปะในแอด** |
| `/admin/orders` | หลังร้าน: ออเดอร์ สลิป ยืนยันเงินเข้า เลขพัสดุ |
| `/admin/customers` | ฐานลูกค้า + export CSV |
| `/privacy` | นโยบายความเป็นส่วนตัว (Facebook ต้องการหน้านี้) |
| `<Render>/api/v1/*` | FastAPI — คนละโดเมนกับข้างบนแล้ว |

---

## 1. ฐานข้อมูล — Neon

สมัครที่ neon.tech โดยตรง (ไม่ต้องผ่าน Vercel) → สร้าง project region **Singapore**
ให้ตรงกับ Render ไม่งั้นทุก query วิ่งข้ามทวีป → คัดลอก connection string ไว้ใช้ขั้นถัดไป

ตารางถูกสร้างเองตอนแอปเริ่มทำงานครั้งแรก (`AUTO_CREATE_TABLES` เปิดอยู่) ไม่ต้องรัน
migration แยก · รูปแบบ `postgres://` หรือ `postgresql://` ระบบเติม driver ให้เอง

## 2. API — Render

รีโปมี `render.yaml` อยู่แล้ว: Render → New → Blueprint → เลือก repo นี้ มันจะอ่านค่า
region/plan/build/start ให้เอง เหลือแค่กรอก environment variables

ถ้าสร้างแบบ Web Service เอง ตั้งค่าให้ตรงนี้: Region **Singapore** · Root Directory
`backend` · Build `pip install -r requirements.txt` · Start
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`

| ชื่อ | ค่า | จำเป็น |
|---|---|---|
| `DATABASE_URL` | connection string จาก Neon | ✅ |
| `CORS_ORIGINS` | โดเมน Cloudflare Pages เช่น `https://scout-shop.pages.dev` (หลายอันคั่นด้วย `,`) | ✅ **ไม่ตั้ง = หน้าร้านยิง API ไม่ได้เลย** |
| `ADMIN_TOKEN` | สุ่มยาว ๆ จาก `openssl rand -hex 24` | ✅ **ไม่ตั้ง = ใครก็เปิดหลังร้านได้** |
| `PROMPTPAY_TARGET` | เบอร์พร้อมเพย์ของร้าน (10 หลัก) หรือเลขประจำตัว 13 หลัก | ✅ |
| `SHOP_NAME` | ชื่อบัญชีที่จะโชว์ใต้ QR | ✅ |
| `BANK_WEBHOOK_SECRET` | สุ่มยาว ๆ ใช้ตอนต่อ Zapier แจ้งเงินเข้า | แนะนำ |
| `PAYMENT_WINDOW_MINUTES` | ค่าเริ่มต้น 15 | – |

`PROMPTPAY_TARGET` กับ `SHOP_NAME` ยังมีค่า default ฝังไว้ในโค้ดจากหน้าเดิม
(`0987263206` / `ร้านป้าศรี`) **ต้องตั้ง env ให้ตรงบัญชีจริงก่อนเปิดขาย** เพราะเงิน
ทุกบาทจะวิ่งเข้าเบอร์นี้ · เบอร์ที่โชว์ใต้ QR ในหน้าร้านยัง hardcode อยู่ใน
`frontend/public/shop/index.html` ถ้าเปลี่ยนบัญชีต้องแก้ที่นั่นด้วย

เสร็จแล้วจดโดเมนที่ Render ให้มา (เช่น `https://scout-api-ncqo.onrender.com`) ไปใช้ขั้นถัดไป

## 3. หน้าเว็บ — Cloudflare

Workers & Pages → Create → Connect to Git → เลือก repo นี้

Cloudflare รวม Pages เข้ากับ Workers แล้ว หน้า setup จึงขึ้นว่า "Configure your Worker
project" และใช้ `npx wrangler deploy` — รีโปมี `wrangler.jsonc` ที่ root รองรับไว้แล้ว
มันชี้ไป `frontend/out/` ที่ `next build` สร้าง (`output: "export"` ใน `next.config.ts`)
ไม่ต้องใช้ `@cloudflare/next-on-pages`

| ช่อง | ค่า |
|---|---|
| Project name | `scout-shop` (ต้องตรงกับ `name` ใน `wrangler.jsonc`) |
| Branch | สาขาที่มีโค้ดร้าน |
| Build command | `cd frontend && npm install && npm run build` |
| Deploy command | `npx wrangler deploy` |

Environment variables ของฝั่งนี้ (Settings → Environment variables, production):

| ชื่อ | ค่า | จำเป็น |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | โดเมน Render เช่น `https://scout-api-ncqo.onrender.com` | ✅ ถ้าไม่ใช่ค่า default |
| `NEXT_PUBLIC_SHOP_NAME` | ชื่อร้านที่โชว์ในหน้า `/privacy` | แนะนำ |
| `NEXT_PUBLIC_SHOP_CONTACT` | อีเมล/เบอร์ที่ลูกค้าติดต่อเรื่องข้อมูลได้ (หน้า `/privacy`) | แนะนำ |

**ที่อยู่ของ API ตั้งอยู่จุดเดียวสองที่ ตามฝั่งที่ใช้:**

- ฝั่ง Next.js (หลังร้าน) — env `NEXT_PUBLIC_API_URL` ค่า default อยู่ใน
  `frontend/.env.production` ถ้าย้าย backend แก้ที่นั่น หรือ override ใน
  Cloudflare → Settings → Variables
- ฝั่งหน้าร้าน (`/shop/`) — `window.SCOUT_API_BASE` บนสุดของบล็อกสคริปต์ใน
  `frontend/public/shop/index.html` (หน้าร้านเป็น HTML ล้วน อ่าน env ตอน build ไม่ได้)

ค่า `NEXT_PUBLIC_*` ถูกฝังตอน build — เปลี่ยนแล้วต้อง redeploy ถึงจะมีผล

## 4. cold start ของ Render

แผนฟรีให้ service หลับหลังไม่มีคนใช้ 15 นาที ตื่นครั้งแรก ~30-50 วินาที ถ้าไปโดน
ตอนลูกค้ากดยืนยันออเดอร์ = ค้าง 40 วินาที = คิดว่าเว็บพัง ปิดหนี เสียออเดอร์

หน้าร้านจึงยิง `/api/v1/health` ทิ้งไว้ทันทีที่เปิดหน้า (ดูในบล็อกสคริปต์เดียวกับ
`SCOUT_API_BASE`) กว่าลูกค้าจะเลื่อนดูสไลด์ 14 หน้าและกรอกฟอร์มเสร็จ (อย่างน้อย 1-2
นาที) backend ก็ตื่นแล้ว วิธีนี้ฟรีและได้ผลดีที่สุดกับโฟลว์นี้

ไม่ต้องตั้ง cron ปลุกจากข้างนอกเพิ่ม — มันทำให้ service ตื่นตลอดเวลาและกินโควตา 750
ชม./เดือนจนหมดก่อนสิ้นเดือน ถ้าขายดีจนรับไม่ไหวค่อยอัปเป็นแผน $7/เดือน

## 5. โดเมน

Cloudflare Pages แจก `xxx.pages.dev` ฟรี ใช้ยิงแอดได้เลย ถ้าจะซื้อโดเมนจริง แนะนำ
Cloudflare Registrar (ขายราคาทุน) แล้วต่อเข้า Pages ในคลิกเดียว
**ต่อโดเมนแล้วต้องเพิ่มลง `CORS_ORIGINS` ใน Render ด้วย** ไม่งั้น CORS บล็อก

## 6. เช็คหลัง deploy (ห้ามข้าม)

- [ ] เปิด `xxx.pages.dev/shop/` บนมือถือ — สไลด์โหลดครบ 14 หน้า
- [ ] DevTools → Console ไม่มี error CORS
- [ ] กรอกฟอร์ม → QR พร้อมเพย์ขึ้น ยอดมีเศษสตางค์ไม่ซ้ำ
- [ ] กดยืนยัน → ออเดอร์เข้า Neon จริง
- [ ] `/admin/orders` → ใส่ `ADMIN_TOKEN` แล้วเห็นออเดอร์ที่เพิ่งสร้าง
- [ ] `/admin/customers` โดยไม่ใส่โทเคน → ต้องเข้าไม่ได้
- [ ] ทิ้งไว้ 20 นาทีให้ backend หลับ แล้วเปิดหน้าร้านใหม่ → ดูว่าหน่วงนานแค่ไหน
- [ ] ยิง webhook `/api/v1/payments/bank-notify` → จับคู่ออเดอร์ถูกต้อง
- [ ] **สแกน QR ด้วยแอปธนาคารจริง** ดูว่าชื่อบัญชีขึ้นตรงกับบัญชีร้าน

ลองสั่งจริง 1 ออเดอร์แล้วโอนเงินจริงจำนวนนั้นสักครั้ง ก่อนเอาลิงก์ไปยิงแอด

## 7. ปิด Vercel

ทดสอบผ่านหมดแล้วให้ลบหรือหยุด project เดิมใน Vercel ไม่งั้นจะมีสองเวอร์ชันทำงาน
พร้อมกันและสับสนว่าออเดอร์เข้าที่ไหน (ข้อมูลลูกค้าอยู่ใน Neon ซึ่งเป็นของเราเอง
ย้ายโฮสต์ไม่กระทบข้อมูล — และควรเปิด backup อัตโนมัติของ Neon ไว้ด้วย)

## ต่อแจ้งเงินเข้าอัตโนมัติ (ถ้าธนาคารรองรับ)

เปิดแจ้งเตือนเงินเข้าทางอีเมลในแอปธนาคาร → Zapier อ่านอีเมล → ยิง POST มาที่

```
POST https://scout-api-ncqo.onrender.com/api/v1/payments/bank-notify
Header: X-Webhook-Secret: <BANK_WEBHOOK_SECRET>
Body:   {"amount": 890.37, "raw_message": "..."}
```

ยอดตรงกับออเดอร์ไหนที่ยังรอจ่าย ระบบจะ mark ว่าเงินเข้าให้เอง ถ้าไม่ต่อ Zapier ก็ยัง
ใช้ได้ปกติ แค่กดปุ่ม "ยืนยันเงินเข้า" ในหลังร้านเอง

## ยังไม่มี

**การแจ้งเตือนเวลามีออเดอร์เข้า** — ต้องเปิด `/admin/orders` ดูเอง ถ้าอยากได้เด้งเข้า
LINE/อีเมล ต่อ Zapier เพิ่มทีหลังได้
