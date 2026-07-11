"""Amazon US search crawler

ใช้ Playwright เปิดหน้า search แล้ว parse การ์ดสินค้า
ยอดขาย 30 วันประมาณจากป้าย "N+ bought in past month" (Amazon ไม่เปิดตัวเลขจริง)
"""

import asyncio
import logging
import re
from urllib.parse import quote_plus

from playwright.async_api import async_playwright

from app.crawlers.base import CrawledProduct
from app.models.product import Country, Marketplace

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

_BOUGHT_RE = re.compile(r"([\d,.]+)\s*([KkMm]?)\+?\s*bought in past month")
_PRICE_RE = re.compile(r"\$([\d,]+\.?\d*)")


def parse_bought_count(text: str) -> int | None:
    """'500+ bought in past month' → 500, '2K+ bought...' → 2000"""
    m = _BOUGHT_RE.search(text)
    if not m:
        return None
    value = float(m.group(1).replace(",", ""))
    suffix = m.group(2).lower()
    if suffix == "k":
        value *= 1_000
    elif suffix == "m":
        value *= 1_000_000
    return int(value)


def parse_price(text: str) -> float | None:
    m = _PRICE_RE.search(text)
    return float(m.group(1).replace(",", "")) if m else None


def parse_search_cards(cards: list[dict[str, str]], category: str | None) -> list[CrawledProduct]:
    """แปลงข้อมูลดิบที่ดึงจาก DOM (asin/title/price_text/image/social_text/rating_text/reviews_text)"""
    items: list[CrawledProduct] = []
    for card in cards:
        asin = card.get("asin", "").strip()
        name = card.get("title", "").strip()
        price = parse_price(card.get("price_text", ""))
        if not asin or not name or price is None:
            continue
        rating = None
        rating_m = re.search(r"([\d.]+) out of 5", card.get("rating_text", ""))
        if rating_m:
            rating = float(rating_m.group(1))
        review_count = None
        reviews_raw = card.get("reviews_text", "").replace(",", "")
        if reviews_raw.isdigit():
            review_count = int(reviews_raw)
        items.append(
            CrawledProduct(
                external_id=asin,
                marketplace=Marketplace.AMAZON_US,
                country=Country.US,
                name=name,
                category=category,
                product_url=f"https://www.amazon.com/dp/{asin}",
                image_url=card.get("image") or None,
                price=price,
                currency="USD",
                orders_30d=parse_bought_count(card.get("social_text", "")),
                rating=rating,
                review_count=review_count,
            )
        )
    return items


_EXTRACT_CARDS_JS = """
() => Array.from(
  document.querySelectorAll('div[data-component-type="s-search-result"]')
).map((el) => ({
  asin: el.getAttribute('data-asin') || '',
  title: el.querySelector('h2 span')?.textContent || '',
  price_text: el.querySelector('.a-price .a-offscreen')?.textContent || '',
  image: el.querySelector('img.s-image')?.src || '',
  social_text: Array.from(el.querySelectorAll('span'))
    .map((s) => s.textContent || '')
    .find((t) => t.includes('bought in past month')) || '',
  rating_text: el.querySelector('span[aria-label*="out of 5"]')?.getAttribute('aria-label') || '',
  reviews_text: el.querySelector('span[aria-label*="out of 5"] ~ span a span, a[aria-label*="ratings"] span')?.textContent || '',
}))
"""


async def crawl_amazon(
    keyword: str, category: str | None = None, limit: int = 10, headless: bool = True
) -> list[CrawledProduct]:
    url = f"https://www.amazon.com/s?k={quote_plus(keyword)}"
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)
        page = await browser.new_page(user_agent=USER_AGENT, locale="en-US")
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=45_000)
            try:
                await page.wait_for_selector(
                    'div[data-component-type="s-search-result"]', timeout=15_000
                )
            except Exception:
                logger.warning("amazon: no results / bot-wall for keyword %r", keyword)
                return []
            cards = await page.evaluate(_EXTRACT_CARDS_JS)
        finally:
            await browser.close()

    items = parse_search_cards(cards, category)[:limit]
    logger.info("amazon: keyword %r -> %d products", keyword, len(items))
    return items


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = asyncio.run(crawl_amazon("portable blender", limit=5))
    for r in results:
        print(r)
