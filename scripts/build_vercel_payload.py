"""ประกอบไฟล์ทั้งหมดเป็น payload เดียวสำหรับ deploy ขึ้น Vercel (Next.js + FastAPI)

โครงสร้าง payload ที่ได้:
    /                  ← Next.js app (จาก frontend/)
    /api/index.py      ← entry ของ FastAPI (Python serverless function)
    /api/_vendor/app/  ← backend package (ขึ้นต้น _ เพื่อไม่ให้ Vercel มองเป็น function)
    /api/requirements.txt

DATABASE_URL อ่านจาก env ตอนรัน script — ไม่ถูก commit ลง git

Usage:
    DATABASE_URL=postgresql+psycopg2://... python scripts/build_vercel_payload.py > payload.json
"""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
BACKEND_APP = ROOT / "backend" / "app"

SKIP_DIRS = {"node_modules", ".next", "__pycache__"}
SKIP_FILES = {
    "tsconfig.tsbuildinfo",
    ".env",
    ".env.local",
    ".env.example",
    "scout.db",
    # ตัด lockfile ให้ payload เล็ก — Vercel resolve จาก package.json ได้
    "package-lock.json",
}

API_INDEX_TEMPLATE = '''import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "_vendor"))

os.environ.setdefault("DATABASE_URL", {database_url!r})

from app.main import app  # noqa: E402
'''

SERVERLESS_REQUIREMENTS = """fastapi>=0.115
sqlalchemy>=2.0
psycopg2-binary>=2.9
pydantic>=2.9
pydantic-settings>=2.6
"""


def collect(base: Path, prefix: str) -> list[dict[str, str]]:
    files = []
    for path in sorted(base.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(base)
        if any(part in SKIP_DIRS for part in rel.parts) or rel.name in SKIP_FILES:
            continue
        files.append(
            {"file": f"{prefix}{rel.as_posix()}", "data": path.read_text(encoding="utf-8")}
        )
    return files


def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL env is required", file=sys.stderr)
        sys.exit(1)

    files = collect(FRONTEND, "")
    files += collect(BACKEND_APP, "api/_vendor/app/")
    files.append({"file": "api/index.py", "data": API_INDEX_TEMPLATE.format(database_url=database_url)})
    files.append({"file": "api/requirements.txt", "data": SERVERLESS_REQUIREMENTS})
    # ให้ frontend เรียก API แบบ same-origin บน Vercel
    files.append({"file": ".env.production", "data": "NEXT_PUBLIC_API_URL=\n"})

    json.dump(files, sys.stdout)


if __name__ == "__main__":
    main()
