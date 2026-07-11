"""Daily crawl runner — ดึงข้อมูลจริงแล้วบันทึกเป็น daily snapshot

Usage:
    python -m app.crawlers.run --keywords "portable blender,pet hair remover"
    python -m app.crawlers.run --keywords-file ../crawl/keywords.txt --sources amazon,1688

keywords file: บรรทัดละ 1 รายการ รูปแบบ "keyword" หรือ "keyword | Category"
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

from app.crawlers.alibaba1688 import crawl_1688
from app.crawlers.amazon import crawl_amazon
from app.db.session import SessionLocal
from app.services.snapshot_service import SnapshotService

logger = logging.getLogger("crawl")


def load_keywords(args: argparse.Namespace) -> list[tuple[str, str | None]]:
    entries: list[str] = []
    if args.keywords:
        entries += [k.strip() for k in args.keywords.split(",")]
    if args.keywords_file:
        entries += Path(args.keywords_file).read_text(encoding="utf-8").splitlines()

    keywords: list[tuple[str, str | None]] = []
    for raw in entries:
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        if "|" in raw:
            keyword, category = raw.split("|", 1)
            keywords.append((keyword.strip(), category.strip() or None))
        else:
            keywords.append((raw, None))
    return keywords


async def crawl_all(
    keywords: list[tuple[str, str | None]], sources: list[str], limit: int
) -> int:
    new_snapshots = 0
    with SessionLocal() as db:
        service = SnapshotService(db)
        for keyword, category in keywords:
            items = []
            if "amazon" in sources:
                items += await crawl_amazon(keyword, category=category, limit=limit)
            if "1688" in sources:
                items += await crawl_1688(keyword, category=category, limit=limit)
            for item in items:
                if service.record(item):
                    new_snapshots += 1
            # เว้นจังหวะเล็กน้อย ลดโอกาสโดนบล็อก
            await asyncio.sleep(2)
    return new_snapshots


def main() -> None:
    parser = argparse.ArgumentParser(description="Scout daily crawler")
    parser.add_argument("--keywords", default="", help="comma-separated keywords")
    parser.add_argument("--keywords-file", default="", help="path to keywords file")
    parser.add_argument("--sources", default="amazon,1688")
    parser.add_argument("--limit", type=int, default=10, help="max products per keyword/source")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    keywords = load_keywords(args)
    if not keywords:
        print("no keywords given — use --keywords or --keywords-file", file=sys.stderr)
        sys.exit(1)

    sources = [s.strip() for s in args.sources.split(",") if s.strip()]
    logger.info("crawling %d keywords from %s", len(keywords), sources)
    new_snapshots = asyncio.run(crawl_all(keywords, sources, args.limit))
    logger.info("done — %d new snapshots", new_snapshots)


if __name__ == "__main__":
    main()
