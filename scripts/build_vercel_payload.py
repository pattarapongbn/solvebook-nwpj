"""ประกอบไฟล์เป็นโฟลเดอร์เดียวสำหรับ deploy ขึ้น Vercel (Next.js + FastAPI)

โครงสร้างที่ได้:
    <out_dir>/                  ← Next.js app (จาก frontend/)
    <out_dir>/api/index.py      ← entry ของ FastAPI (Python serverless function)
    <out_dir>/api/_vendor/app/  ← backend package (ขึ้นต้น _ เพื่อไม่ให้ Vercel มองเป็น function)
    <out_dir>/api/requirements.txt

DATABASE_URL ไม่ถูกฝังในไฟล์ — ตั้งเป็น env var ของ Vercel project แทน
(vercel env add DATABASE_URL production)

Usage:
    python scripts/build_vercel_payload.py <out_dir>
    จากนั้น: cd <out_dir> && vercel deploy --prod
"""

import shutil
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
    # ไม่ต้องใช้ตอน runtime บน serverless
    "init_db.py",
}

API_INDEX = '''import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "_vendor"))

from app.main import app  # noqa: E402
'''

SERVERLESS_REQUIREMENTS = """fastapi>=0.115
sqlalchemy>=2.0
psycopg2-binary>=2.9
pydantic>=2.9
pydantic-settings>=2.6
"""


def copy_tree(base: Path, dest: Path) -> None:
    for path in sorted(base.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(base)
        if any(part in SKIP_DIRS for part in rel.parts) or rel.name in SKIP_FILES:
            continue
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)


def main() -> None:
    if len(sys.argv) != 2:
        print("usage: build_vercel_payload.py <out_dir>", file=sys.stderr)
        sys.exit(1)
    out = Path(sys.argv[1]).resolve()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    copy_tree(FRONTEND, out)
    copy_tree(BACKEND_APP, out / "api" / "_vendor" / "app")
    (out / "api" / "index.py").write_text(API_INDEX, encoding="utf-8")
    (out / "api" / "requirements.txt").write_text(SERVERLESS_REQUIREMENTS, encoding="utf-8")
    # ให้ frontend เรียก API แบบ same-origin บน Vercel
    (out / ".env.production").write_text("NEXT_PUBLIC_API_URL=\n", encoding="utf-8")
    # กันไม่ให้ vercel CLI อัปโหลด/ติดตาม dev artifacts
    (out / ".vercelignore").write_text("node_modules\n.next\n__pycache__\n", encoding="utf-8")

    print(f"payload ready at {out}")


if __name__ == "__main__":
    main()
