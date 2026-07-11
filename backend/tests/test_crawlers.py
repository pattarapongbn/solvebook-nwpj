from app.crawlers.alibaba1688 import parse_sold_count
from app.crawlers.amazon import parse_bought_count, parse_price, parse_search_cards


def test_parse_bought_count():
    assert parse_bought_count("500+ bought in past month") == 500
    assert parse_bought_count("2K+ bought in past month") == 2000
    assert parse_bought_count("1.5K+ bought in past month") == 1500
    assert parse_bought_count("no social proof") is None


def test_parse_price():
    assert parse_price("$19.99") == 19.99
    assert parse_price("$1,299.00") == 1299.0
    assert parse_price("") is None


def test_parse_sold_count_1688():
    assert parse_sold_count("已售1.2万+") == 12000
    assert parse_sold_count("已售500+") == 500
    assert parse_sold_count("") is None


def test_parse_search_cards():
    cards = [
        {
            "asin": "B0TEST123",
            "title": "Portable Blender 380ml",
            "price_text": "$19.99",
            "image": "https://m.media-amazon.com/x.jpg",
            "social_text": "1K+ bought in past month",
            "rating_text": "4.5 out of 5 stars",
            "reviews_text": "2,341",
        },
        # ไม่มีราคา → ต้องถูกข้าม
        {"asin": "B0NOPRICE", "title": "No price item", "price_text": ""},
    ]
    items = parse_search_cards(cards, category="Kitchen")
    assert len(items) == 1
    item = items[0]
    assert item.external_id == "B0TEST123"
    assert item.price == 19.99
    assert item.orders_30d == 1000
    assert item.orders_7d == 233
    assert item.revenue_30d == 19990.0
    assert item.rating == 4.5
    assert item.review_count == 2341
    assert item.category == "Kitchen"
    assert item.product_url.endswith("/dp/B0TEST123")
