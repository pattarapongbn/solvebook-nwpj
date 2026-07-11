"""1688.com search crawler (best effort)

1688 มี anti-bot/login-wall แรง — ถ้าโดนบล็อกจะคืนลิสต์ว่างพร้อม log
ไม่ทำให้ job ทั้งชุดล้ม เพื่อให้ Amazon ยังเก็บข้อมูลได้ตามปกติ
"""

import asyncio
import logging
import re
from urllib.parse import quote

from playwright.async_api import async_playwright

from app.crawlers.base import CrawledProduct
from app.models.product import Country, Marketplace

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

_OFFER_ID_RE = re.compile(r"offer/(\d+)\.html")
_SOLD_RE = re.compile(r"([\d.]+)\s*(万)?")


def parse_sold_count(text: str) -> int | None:
    """'已售1.2万+' → 12000, '已售500+' → 500"""
    text = text.replace("已售", "").replace("+", "").strip()
    m = _SOLD_RE.match(text)
    if not m or not m.group(1):
        return None
    value = float(m.group(1))
    if m.group(2) == "万":
        value *= 10_000
    return int(value)


_EXTRACT_OFFERS_JS = """
() => Array.from(document.querySelectorAll('a[href*="offer/"]'))
  .filter((a) => a.querySelector('img'))
  .slice(0, 40)
  .map((a) => {
    const root = a.closest('div');
    const text = (root?.textContent || '').trim();
    const priceM = text.match(/¥\\s*([\\d.,]+)/);
    const soldM = text.match(/已售\\s*[\\d.万+]+/);
    return {
      href: a.href,
      title: a.querySelector('img')?.alt || a.getAttribute('title') || '',
      image: a.querySelector('img')?.src || '',
      price_text: priceM ? priceM[1] : '',
      sold_text: soldM ? soldM[0] : '',
    };
  })
"""


async def crawl_1688(
    keyword: str, category: str | None = None, limit: int = 10, headless: bool = True
) -> list[CrawledProduct]:
    url = f"https://s.1688.com/selloffer/offer_search.htm?keywords={quote(keyword.encode('gbk'), safe='')}"
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)
        page = await browser.new_page(user_agent=USER_AGENT, locale="zh-CN")
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=45_000)
            await page.wait_for_timeout(3_000)
            if "login" in page.url or "captcha" in page.url.lower():
                logger.warning("1688: blocked by login/captcha wall for %r", keyword)
                return []
            offers = await page.evaluate(_EXTRACT_OFFERS_JS)
        except Exception as exc:  # noqa: BLE001
            logger.warning("1688: crawl failed for %r: %s", keyword, exc)
            return []
        finally:
            await browser.close()

    items: list[CrawledProduct] = []
    seen: set[str] = set()
    for offer in offers:
        id_match = _OFFER_ID_RE.search(offer.get("href", ""))
        name = offer.get("title", "").strip()
        price_raw = offer.get("price_text", "").replace(",", "")
        if not id_match or not name or not price_raw:
            continue
        offer_id = id_match.group(1)
        if offer_id in seen:
            continue
        seen.add(offer_id)
        try:
            price = float(price_raw)
        except ValueError:
            continue
        items.append(
            CrawledProduct(
                external_id=offer_id,
                marketplace=Marketplace.ALIBABA_1688,
                country=Country.CN,
                name=name,
                category=category,
                product_url=f"https://detail.1688.com/offer/{offer_id}.html",
                image_url=offer.get("image") or None,
                price=price,
                currency="CNY",
                orders_30d=parse_sold_count(offer.get("sold_text", "")),
            )
        )
        if len(items) >= limit:
            break

    logger.info("1688: keyword %r -> %d products", keyword, len(items))
    return items


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    for r in asyncio.run(crawl_1688("颈枕", limit=5)):
        print(r)
