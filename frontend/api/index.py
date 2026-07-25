"""Entry ของ FastAPI บน Vercel (Python serverless function)

โค้ด backend ตัวจริงอยู่ที่ backend/app/ ของ repo — สคริปต์ prepare-vercel.mjs
จะคัดลอกมาไว้ที่ api/_vendor/app/ ตอน build (ขึ้นต้นด้วย _ เพื่อไม่ให้ Vercel
มองเป็น function แยก) ไฟล์นี้แค่ชี้ path ให้ import เจอ
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "_vendor"))

from app.main import app  # noqa: E402,F401
