# Storefront — หน้าสั่งซื้อ Kirkland Glucosamine

หน้าเว็บสั่งซื้อหน้าเดียว (mobile-first) ที่ต่อกับ Scout backend
ใช้ไฟล์ static ล้วน ไม่ต้อง build อัปขึ้น hosting ไหนก็ได้

```
storefront/
  index.html            หน้าร้านทั้งหมด + ฐานข้อมูลตำบล 7,4xx แถว (inline)
  vendor/jsqr.min.js    อ่าน QR บนสลิปในเครื่องลูกค้า (jsQR 1.4.0, MIT)
```

## ชี้ไป backend

ตั้ง `window.SCOUT_API_BASE` ก่อนสคริปต์หลักใน `index.html`:

```html
<script>window.SCOUT_API_BASE = 'https://api.ร้านของคุณ';</script>
```

ถ้าไม่ตั้ง (หรือ backend ล่ม) หน้าเว็บจะเข้า **โหมดออฟไลน์**: ยังสั่งซื้อและสร้าง QR ได้
แต่ยอดโอนไม่ถูกจองสลอตในฐานข้อมูล และไม่มีการกันสลิปซ้ำ — ใช้พรีวิวเท่านั้น ห้ามใช้ขายจริง

ฝั่ง backend ต้องใส่โดเมนหน้าร้านใน `CORS_ORIGINS` ด้วย

## ขั้นตอนที่หน้าเว็บทำ

1. ลูกค้ากรอกที่อยู่ (ค้นจากฐานตำบล/อำเภอ/รหัสไปรษณีย์ในไฟล์)
2. `POST /api/v1/orders` → backend คืน `amount_due` (ยอด + เศษสตางค์ไม่ซ้ำ) กับ `promptpay_payload`
3. หน้าเว็บ render QR จาก payload ที่ backend ส่งมา ลูกค้าสแกนแล้วยอดเด้งมาเป๊ะ
4. ลูกค้าแนบสลิป → **อ่าน QR ในเครื่องลูกค้า** (ไม่ส่งภาพออกไปไหน) + คำนวณ SHA-256 ของไฟล์
5. `POST /api/v1/orders/{code}/slip` ส่งไปแค่ `qr_payload` กับ `image_hash`
   - `qr_ok` → ผ่าน
   - `duplicate` → บล็อกไม่ให้กดยืนยัน ต้องแนบใบใหม่
   - `qr_unreadable` → **ผ่านได้** แต่ flag ไว้ให้แอดมินตรวจเอง (สลิปจริงบางใบก็อ่านไม่ออก)

## ที่ยังไม่ได้ทำ

ฐานที่อยู่ในไฟล์นี้มีแค่ `[ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์]` **ยังไม่มีรหัสราชการ**
(tambon_code 6 หลัก / amphoe_code 4 หลัก / province_code 2 หลัก) ตามที่สเปกอยากได้

ฝั่ง backend รองรับแล้ว (คอลัมน์มีครบ เป็น nullable และ `AddressInput` รับค่าได้)
เหลือแค่เปลี่ยน `const DB` ให้เป็นชุดที่มีรหัส แล้วส่ง `tambon_code` / `amphoe_code` /
`province_code` เพิ่มใน `createOrder()` — จุดที่ต้องแก้อยู่ในฟังก์ชันเดียว

ตอนนี้ยังส่งของได้ปกติเพราะใช้ provider `manual` (แอดมินกรอกเลขพัสดุเอง)
แต่ก่อนต่อ Shippop/Flash ควรเติมรหัสให้ครบ เพราะชื่อไทยสะกดได้หลายแบบจนขนส่ง map ไม่เจอ

## ทดสอบ

```bash
cd storefront && python3 -m http.server 8080
# แล้วเปิด http://localhost:8080/index.html
```
