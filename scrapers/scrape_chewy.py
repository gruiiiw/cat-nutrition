"""
Chewy.com price scraper.

Scrapes current prices for products already in the database.
Uses Playwright because Chewy is JS-rendered and has anti-bot measures.

IMPORTANT: Chewy frequently changes their page structure. If this scraper
breaks, update the SELECTORS dict below with current CSS selectors. Use
browser DevTools on chewy.com to find the correct selectors.
"""

import asyncio
import re

from playwright.async_api import async_playwright, Page, TimeoutError as PwTimeout

from config import CHEWY_BRAND_SEARCHES, REQUEST_DELAY_SECONDS, PAGE_LOAD_TIMEOUT_MS
from db import get_connection, get_cursor, insert_price
from helpers import clean_text, polite_delay, console

# ── Chewy CSS selectors ───────────────────────────────────────────────────────
# These WILL break when Chewy redesigns. Check DevTools and update as needed.
SELECTORS = {
    # Product card container (try in order)
    "product_card": [
        '[class*="ProductCard"]',
        ".product-holder",
        'article[class*="product"]',
    ],
    # Product name / title link
    "product_name": [
        'a[class*="product-title"]',
        '[data-testid="product-title"]',
        ".product-title",
    ],
    # Regular price
    "price": [
        '[class*="price"]',
        ".price",
    ],
    # Autoship price — usually a sibling or child near the main price
    "autoship_price": [
        '[class*="autoship"]',
        '[class*="Autoship"]',
    ],
    # Product link (href on the card)
    "product_link": [
        'a[class*="product-title"]',
        "a[href*='/dp/']",
    ],
    # Out of stock indicator
    "out_of_stock": [
        '[class*="out-of-stock"]',
        '[class*="OutOfStock"]',
    ],
    # Pagination next button
    "next_page": [
        'a[aria-label="Next"]',
        'a[class*="next"]',
        'button[aria-label="Next"]',
    ],
}

# Stealth browser arguments to reduce bot detection
STEALTH_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-size=1920,1080",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _parse_price(text: str | None) -> float | None:
    """Extract a dollar amount from text like '$12.99' or 'was $15.00'."""
    if not text:
        return None
    match = re.search(r"\$(\d+\.?\d*)", text)
    if match:
        return float(match.group(1))
    return None


async def _try_selectors(page: Page, selectors: list[str], *, all_: bool = False):
    """Try multiple selectors in order, returning the first match(es)."""
    for sel in selectors:
        try:
            if all_:
                elements = await page.query_selector_all(sel)
                if elements:
                    return elements
            else:
                element = await page.query_selector(sel)
                if element:
                    return element
        except Exception:
            continue
    return [] if all_ else None


async def _scroll_to_load(page: Page, max_scrolls: int = 20):
    """Scroll down to trigger lazy-loaded content."""
    for _ in range(max_scrolls):
        prev_height = await page.evaluate("document.body.scrollHeight")
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1500)
        new_height = await page.evaluate("document.body.scrollHeight")
        if new_height == prev_height:
            break


def _normalize(name: str) -> str:
    """Lowercase and collapse whitespace for fuzzy matching."""
    return re.sub(r"\s+", " ", name.lower().strip())


def _fuzzy_match(chewy_name: str, db_product: dict) -> bool:
    """
    Check if a Chewy product name matches a database product.
    Matches if the DB product name appears within the Chewy name (or vice versa)
    AND the brand name matches.
    """
    cn = _normalize(chewy_name)
    dn = _normalize(db_product["name"])
    brand = _normalize(db_product["brand_name"])

    # Brand must appear in the Chewy name
    if brand not in cn:
        return False

    # Check name containment in either direction
    return dn in cn or cn in dn


# ── Main scraper ──────────────────────────────────────────────────────────────


async def scrape():
    """Scrape Chewy prices and match them to products in the database."""
    console.rule("[bold cyan]Chewy Price Scraper[/bold cyan]")

    # 1. Load all active products from the DB
    with get_connection() as conn, get_cursor(conn) as cur:
        cur.execute(
            """
            SELECT p.id, p.name, b.name AS brand_name, p.food_type,
                   p.size_oz, p.size_lbs
            FROM products p
            JOIN brands b ON p.brand_id = b.id
            WHERE NOT p.is_discontinued
            """
        )
        db_products = [dict(row) for row in cur.fetchall()]

    if not db_products:
        console.print("[yellow]No active products found in the database.[/yellow]")
        return {"matched": 0, "unmatched": 0, "errors": []}

    console.print(f"Loaded [green]{len(db_products)}[/green] active products from DB")

    matched_count = 0
    unmatched_products = []
    errors = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=STEALTH_ARGS,
        )
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1920, "height": 1080},
        )
        page = await context.new_page()

        # 2. Iterate over each brand's Chewy page
        for brand_name, brand_url in CHEWY_BRAND_SEARCHES.items():
            console.print(f"\n[bold]Scraping Chewy for: {brand_name}[/bold]")
            console.print(f"  URL: {brand_url}")

            try:
                await page.goto(brand_url, timeout=PAGE_LOAD_TIMEOUT_MS)
                await page.wait_for_timeout(3000)  # Let JS render

                all_chewy_products = []
                page_num = 1

                while True:
                    console.print(f"  Page {page_num}...")

                    # Scroll to load lazy content
                    await _scroll_to_load(page)

                    # Find product cards
                    cards = await _try_selectors(page, SELECTORS["product_card"], all_=True)
                    if not cards:
                        console.print("  [yellow]No product cards found on this page.[/yellow]")
                        break

                    console.print(f"  Found [green]{len(cards)}[/green] product cards")

                    # 3. Extract data from each card
                    for card in cards:
                        try:
                            # Product name
                            name_el = None
                            for sel in SELECTORS["product_name"]:
                                name_el = await card.query_selector(sel)
                                if name_el:
                                    break
                            product_name = clean_text(await name_el.inner_text()) if name_el else None

                            if not product_name:
                                continue

                            # Price
                            price_text = None
                            for sel in SELECTORS["price"]:
                                price_el = await card.query_selector(sel)
                                if price_el:
                                    price_text = await price_el.inner_text()
                                    break
                            price = _parse_price(price_text)

                            # Autoship price
                            autoship_price = None
                            for sel in SELECTORS["autoship_price"]:
                                autoship_el = await card.query_selector(sel)
                                if autoship_el:
                                    autoship_text = await autoship_el.inner_text()
                                    autoship_price = _parse_price(autoship_text)
                                    break

                            # Product URL
                            url = None
                            for sel in SELECTORS["product_link"]:
                                link_el = await card.query_selector(sel)
                                if link_el:
                                    href = await link_el.get_attribute("href")
                                    if href:
                                        url = href if href.startswith("http") else f"https://www.chewy.com{href}"
                                    break

                            # Stock status
                            in_stock = True
                            for sel in SELECTORS["out_of_stock"]:
                                oos_el = await card.query_selector(sel)
                                if oos_el:
                                    in_stock = False
                                    break

                            all_chewy_products.append({
                                "name": product_name,
                                "price": price,
                                "autoship_price": autoship_price,
                                "url": url,
                                "in_stock": in_stock,
                            })

                        except Exception as e:
                            errors.append(f"Error parsing card on {brand_name} page {page_num}: {e}")
                            continue

                    # Check for next page
                    next_btn = await _try_selectors(page, SELECTORS["next_page"])
                    if next_btn:
                        try:
                            await next_btn.click()
                            await page.wait_for_timeout(3000)
                            page_num += 1
                        except Exception:
                            break
                    else:
                        break

                # 4. Match Chewy products to DB products
                console.print(
                    f"  Total Chewy products found for {brand_name}: "
                    f"[green]{len(all_chewy_products)}[/green]"
                )

                brand_db_products = [
                    p for p in db_products if _normalize(p["brand_name"]) == _normalize(brand_name)
                ]

                with get_connection() as conn, get_cursor(conn) as cur:
                    for chewy_prod in all_chewy_products:
                        matched = False
                        for db_prod in brand_db_products:
                            if _fuzzy_match(chewy_prod["name"], db_prod):
                                # Insert price record
                                insert_price(cur, {
                                    "product_id": db_prod["id"],
                                    "retailer": "chewy",
                                    "price": chewy_prod["price"],
                                    "url": chewy_prod["url"],
                                    "in_stock": chewy_prod["in_stock"],
                                    "autoship_price": chewy_prod["autoship_price"],
                                })
                                matched_count += 1
                                matched = True
                                console.print(
                                    f"    [green]Matched:[/green] {chewy_prod['name']} "
                                    f"-> {db_prod['name']} (${chewy_prod['price']})"
                                )
                                break

                        if not matched:
                            unmatched_products.append(chewy_prod["name"])

                polite_delay(REQUEST_DELAY_SECONDS)

            except PwTimeout:
                errors.append(f"Timeout loading Chewy page for {brand_name}")
                console.print(f"  [red]Timeout loading page for {brand_name}[/red]")
            except Exception as e:
                errors.append(f"Error scraping {brand_name}: {e}")
                console.print(f"  [red]Error scraping {brand_name}: {e}[/red]")

        await browser.close()

    # 5. Summary
    console.print(f"\n[bold]Chewy Results:[/bold]")
    console.print(f"  Matched: [green]{matched_count}[/green]")
    console.print(f"  Unmatched: [yellow]{len(unmatched_products)}[/yellow]")

    if unmatched_products:
        console.print("  [dim]Unmatched Chewy products:[/dim]")
        for name in unmatched_products[:20]:
            console.print(f"    - {name}")
        if len(unmatched_products) > 20:
            console.print(f"    ... and {len(unmatched_products) - 20} more")

    if errors:
        console.print(f"  Errors: [red]{len(errors)}[/red]")
        for err in errors:
            console.print(f"    [red]{err}[/red]")

    return {
        "matched": matched_count,
        "unmatched": len(unmatched_products),
        "errors": errors,
    }


if __name__ == "__main__":
    asyncio.run(scrape())
