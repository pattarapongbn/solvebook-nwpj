# Deploy ขึ้น Vercel

หน้าร้าน + หลังร้าน + API อยู่ในโปรเจกต์ Vercel เดียวกัน จึงเป็นโดเมนเดียวกันหมด
ไม่ต้องตั้ง CORS และไม่ต้องซื้อโดเมน (ใช้ `*.vercel.app` ที่แจกฟรีได้เลย)

| URL | คืออะไร |
|---|---|
| `/shop/` | หน้าสั่งซื้อของลูกค้า — **ลิงก์นี้เอาไปแปะในแอด** |
| `/admin/orders` | หลังร้าน: ออเดอร์ สลิป ยืนยันเงินเข้า เลขพัสดุ |
| `/admin/customers` | ฐานลูกค้า + export CSV |
| `/privacy` | นโยบายความเป็นส่วนตัว (Facebook ต้องการหน้านี้) |
| `/api/v1/*` | FastAPI (Python serverless function) |

## 1. เชื่อม repo กับ Vercel

Vercel → Add New → Project → เลือก repo นี้ แล้วตั้ง **Root Directory = `frontend`**

ตอน build สคริปต์ `prebuild` จะคัดลอก `backend/app/` มาไว้ที่ `frontend/api/_vendor/app/`
ให้เอง (โค้ด backend ตัวจริงอยู่ที่ `backend/app/` ที่เดียว ไม่มีสองชุด)

## 2. สร้างฐานข้อมูล

ในโปรเจกต์ Vercel → แท็บ **Storage** → Create Database → เลือก Postgres (Neon) แบบฟรี
มันจะใส่ `DATABASE_URL` เป็น environment variable ให้อัตโนมัติ

ตารางถูกสร้างเองตอนแอปเริ่มทำงานครั้งแรก (`AUTO_CREATE_TABLES` ค่าเริ่มต้นเปิดอยู่)
ไม่ต้องรัน migration แยก

> ใช้ Postgres เจ้าไหนก็ได้ (Supabase / Neon / Railway) แค่ตั้ง `DATABASE_URL` เอง
> รูปแบบ `postgres://` กับ `postgresql://` ระบบเติม driver ให้เองแล้ว

## 3. ตั้ง environment variables

Settings → Environment Variables (production)

| ชื่อ | ค่า | จำเป็น |
|---|---|---|
| `DATABASE_URL` | Storage ใส่ให้อัตโนมัติ | ✅ |
| `ADMIN_TOKEN` | สุ่มยาวๆ เช่นจาก `openssl rand -hex 24` | ✅ **ไม่ตั้ง = ใครก็เปิดหลังร้านได้** |
| `PROMPTPAY_TARGET` | เบอร์พร้อมเพย์ของร้าน (เลข 10 หลัก) หรือเลขประจำตัว 13 หลัก | ✅ |
| `SHOP_NAME` | ชื่อบัญชีที่จะโชว์ใต้ QR | ✅ |
| `BANK_WEBHOOK_SECRET` | สุ่มยาวๆ ใช้ตอนต่อ Zapier แจ้งเงินเข้า | แนะนำ |
| `NEXT_PUBLIC_SHOP_CONTACT` | ช่องทางติดต่อในหน้า `/privacy` | แนะนำ |
| `PAYMENT_WINDOW_MINUTES` | ค่าเริ่มต้น 15 | – |

`PROMPTPAY_TARGET` กับ `SHOP_NAME` ยังมีค่า default ฝังไว้ในโค้ดจากหน้าเดิม
(`0987263206` / `ร้านป้าศรี`) **ต้องตั้ง env ให้ตรงบัญชีจริงก่อนเปิดขาย**
เพราะเงินทุกบาทจะวิ่งเข้าเบอร์นี้

เบอร์พร้อมเพย์ที่โชว์ใต้ QR ในหน้าร้านยัง hardcode อยู่ใน `public/shop/index.html`
ถ้าเปลี่ยนบัญชี ต้องแก้ที่นั่นด้วย

## 4. เช็คหลัง deploy

```
/api/v1/health          →  {"status":"ok"}
/shop/                  →  หน้าร้านโหลดขึ้น กดสั่งซื้อแล้วได้ QR พร้อมยอดมีเศษสตางค์
/admin/orders           →  ขอโทเคน ใส่ ADMIN_TOKEN แล้วเห็นออเดอร์ที่เพิ่งลองสั่ง
```

ลองสั่งจริง 1 ออเดอร์แล้วโอนเงินจริงจำนวนนั้นดูสักครั้ง ก่อนเอาลิงก์ไปยิงแอด

## 5. (ถ้าธนาคารรองรับ) ต่อแจ้งเงินเข้าอัตโนมัติ

เปิดแจ้งเตือนเงินเข้าทางอีเมลในแอปธนาคาร → Zapier อ่านอีเมล → ยิง POST มาที่

```
POST https://<โดเมน>/api/v1/payments/bank-notify
Header: X-Webhook-Secret: <BANK_WEBHOOK_SECRET>
Body:   {"amount": 890.37, "raw_message": "..."}
```

ยอดตรงกับออเดอร์ไหนที่ยังรอจ่าย ระบบจะ mark ว่าเงินเข้าให้เอง
ถ้าไม่ต่อ Zapier ก็ยังใช้ได้ปกติ แค่กดปุ่ม "ยืนยันเงินเข้า" ในหลังร้านเอง

## ยังไม่มี

**การแจ้งเตือนเวลามีออเดอร์เข้า** — ต้องเปิด `/admin/orders` ดูเอง
ถ้าอยากได้เด้งเข้า LINE/อีเมล ต่อ Zapier เพิ่มทีหลังได้
