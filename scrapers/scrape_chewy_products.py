"""
Chewy.com full product scraper.

Primary data source for all brands. Scrapes product detail pages on Chewy for:
  - Product name, brand, food type, texture, flavor, life stage
  - Guaranteed analysis (protein, fat, fiber, moisture, ash)
  - Full ingredient list
  - Calorie content
  - Price and autoship price
  - Product size
  - AAFCO statement

Uses Playwright because Chewy is a Next.js app that requires JS rendering.
Tries __NEXT_DATA__ JSON first (most reliable), with DOM parsing as fallback.
"""

import asyncio
import json
import re
from urllib.parse import urljoin

from playwright.async_api import async_playwright, TimeoutError as PwTimeout

from config import CHEWY_BRAND_CATALOGS, REQUEST_DELAY_SECONDS, PAGE_LOAD_TIMEOUT_MS
from db import (
    get_connection,
    get_cursor,
    upsert_brand,
    upsert_product,
    set_product_ingredients,
    insert_price,
    start_scrape_log,
    finish_scrape_log,
)
from helpers import (
    clean_text,
    parse_ingredient_list,
    calculate_all_dmb,
    polite_delay,
    console,
)


# ── Browser config ────────────────────────────────────────────────────────────

STEALTH_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)


# ── CSS Selectors for DOM fallback ────────────────────────────────────────────

SELECTORS = {
    # Product detail page
    "product_name": "h1",
    "price": '[class*="price" i], [data-testid*="price"]',
    "autoship_price": '[class*="autoship" i]',

    # Nutrition sections — Chewy typically has tabs or expandable sections
    "guaranteed_analysis": '[class*="guaranteed-analysis" i], [class*="nutritional-info" i]',
    "ingredients_section": '[class*="ingredients" i]',
    "calorie_section": '[class*="calorie" i], [class*="feeding" i]',
    "aafco_section": '[class*="aafco" i], [class*="nutritional-adequacy" i]',

    # Product listing page
    "product_card": 'article[class*="product" i], [class*="ProductCard" i], .product-holder',
    "product_link": 'a[href*="/dp/"]',
    "next_page": 'a[rel="next"], a[aria-label="Next"], [class*="pagination"] a:last-child',
}

# Texture keywords
TEXTURE_MAP = {
    "pate": "pate",
    "paté": "pate",
    "gravy": "gravy",
    "flaked": "flaked",
    "shreds": "shreds",
    "shredded": "shreds",
    "broth": "broth",
    "grilled": "grilled",
    "medley": "medley",
    "minced": "minced",
    "sliced": "sliced",
    "chunks": "chunks",
    "chunk": "chunks",
    "morsels": "morsels",
    "mousse": "mousse",
    "stew": "stew",
    "creamy": "creamy",
    "bisque": "bisque",
}


# ── Helpers ───────────────────────────────────────────────────────────────────


def infer_texture(name: str) -> str | None:
    """Infer texture from product name."""
    name_lower = name.lower()
    for keyword, texture in TEXTURE_MAP.items():
        if keyword in name_lower:
            return texture
    return None


def infer_food_type(name: str, default: str = "wet") -> str:
    """Infer food type from product name."""
    name_lower = name.lower()
    if "dry" in name_lower or "kibble" in name_lower:
        return "dry"
    if "wet" in name_lower or "can" in name_lower or "pouch" in name_lower:
        return "wet"
    return default


def infer_life_stage(text: str | None) -> str | None:
    """Infer life stage from AAFCO statement or product name."""
    if not text:
        return None
    text_lower = text.lower()
    if "kitten" in text_lower and "adult" in text_lower:
        return "all life stages"
    if "all life stages" in text_lower or "all stages" in text_lower:
        return "all life stages"
    if "kitten" in text_lower:
        return "kitten"
    if "senior" in text_lower:
        return "senior"
    if "adult" in text_lower or "maintenance" in text_lower:
        return "adult"
    return None


def parse_ga_from_text(text: str) -> dict:
    """Parse guaranteed analysis percentages from free-form text."""
    ga = {
        "crude_protein_pct": None,
        "crude_fat_pct": None,
        "crude_fiber_pct": None,
        "moisture_pct": None,
        "ash_pct": None,
    }
    patterns = {
        "crude_protein_pct": r"(?:crude\s+)?protein\s*(?:\(?\s*min\.?\s*\)?)?\s*[.:…]*\s*(\d+\.?\d*)\s*%",
        "crude_fat_pct": r"(?:crude\s+)?fat\s*(?:\(?\s*min\.?\s*\)?)?\s*[.:…]*\s*(\d+\.?\d*)\s*%",
        "crude_fiber_pct": r"(?:crude\s+)?fiber\s*(?:\(?\s*max\.?\s*\)?)?\s*[.:…]*\s*(\d+\.?\d*)\s*%",
        "moisture_pct": r"moisture\s*(?:\(?\s*max\.?\s*\)?)?\s*[.:…]*\s*(\d+\.?\d*)\s*%",
        "ash_pct": r"ash\s*(?:\(?\s*max\.?\s*\)?)?\s*[.:…]*\s*(\d+\.?\d*)\s*%",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            ga[key] = float(match.group(1))
    return ga


def parse_calories_from_text(text: str) -> dict:
    """Parse calorie info from text."""
    result = {"kcal_per_oz": None, "kcal_per_can": None, "kcal_per_cup": None, "kcal_per_kg": None}
    text = text.replace(",", "").lower()

    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*kg", text)
    if match:
        result["kcal_per_kg"] = float(match.group(1))

    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*(?:per\s+)?can", text)
    if match:
        result["kcal_per_can"] = float(match.group(1))

    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*(?:per\s+)?cup", text)
    if match:
        result["kcal_per_cup"] = float(match.group(1))

    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*(?:per\s+)?oz", text)
    if match:
        result["kcal_per_oz"] = float(match.group(1))

    return result


def parse_size(text: str) -> dict:
    """Parse product size from text like '3-oz can' or '5.5 lb bag'."""
    result = {"size_oz": None, "size_lbs": None}
    text_lower = text.lower()

    oz_match = re.search(r"(\d+\.?\d*)\s*-?\s*oz", text_lower)
    if oz_match:
        result["size_oz"] = float(oz_match.group(1))

    lb_match = re.search(r"(\d+\.?\d*)\s*-?\s*lb", text_lower)
    if lb_match:
        result["size_lbs"] = float(lb_match.group(1))

    return result


def parse_price(text: str | None) -> float | None:
    """Extract a dollar amount from text."""
    if not text:
        return None
    match = re.search(r"\$(\d+\.?\d*)", text)
    return float(match.group(1)) if match else None


# ── Page scraping ─────────────────────────────────────────────────────────────


async def extract_next_data(page) -> dict | None:
    """
    Extract the __NEXT_DATA__ JSON from a Next.js page.
    This contains all server-rendered props including product details.
    """
    try:
        data = await page.evaluate("""
            () => {
                const el = document.getElementById('__NEXT_DATA__');
                if (el) return JSON.parse(el.textContent);
                if (window.__NEXT_DATA__) return window.__NEXT_DATA__;
                return null;
            }
        """)
        return data
    except Exception as e:
        console.print(f"[yellow]  __NEXT_DATA__ extraction failed: {e}[/yellow]")
        return None


def extract_product_from_next_data(next_data: dict) -> dict | None:
    """
    Navigate the __NEXT_DATA__ structure to find product information.
    Chewy's structure may vary; this tries common paths.
    """
    if not next_data:
        return None

    props = next_data.get("props", {})
    page_props = props.get("pageProps", {})

    # Try common keys where Chewy might store product data
    for key in ["product", "pdpData", "initialData", "data", "productData"]:
        if key in page_props and isinstance(page_props[key], dict):
            return page_props[key]

    # Try nested in dehydratedState (React Query)
    dehydrated = page_props.get("dehydratedState", {})
    queries = dehydrated.get("queries", [])
    for query in queries:
        state = query.get("state", {})
        data = state.get("data", {})
        if isinstance(data, dict):
            # Look for product-like keys
            if any(k in data for k in ["name", "title", "brand", "ingredients"]):
                return data
            # Sometimes nested one more level
            for v in data.values():
                if isinstance(v, dict) and any(k in v for k in ["name", "title", "brand"]):
                    return v

    return page_props if page_props else None


async def scrape_product_page_dom(page) -> dict:
    """
    Fallback: scrape product details from the rendered DOM.
    Used when __NEXT_DATA__ doesn't contain structured product data.
    """
    product = {}

    # Product name
    try:
        name_el = await page.query_selector("h1")
        if name_el:
            product["name"] = clean_text(await name_el.inner_text())
    except Exception:
        pass

    # Price
    try:
        price_text = await page.evaluate("""
            () => {
                const els = document.querySelectorAll('[class*="price" i], [class*="Price"]');
                for (const el of els) {
                    const text = el.textContent;
                    if (text && text.includes('$') && !text.toLowerCase().includes('autoship')) {
                        return text;
                    }
                }
                return null;
            }
        """)
        if price_text:
            product["price"] = parse_price(price_text)
    except Exception:
        pass

    # Autoship price
    try:
        autoship_text = await page.evaluate("""
            () => {
                const els = document.querySelectorAll('[class*="autoship" i], [class*="Autoship"]');
                for (const el of els) {
                    const text = el.textContent;
                    if (text && text.includes('$')) return text;
                }
                return null;
            }
        """)
        if autoship_text:
            product["autoship_price"] = parse_price(autoship_text)
    except Exception:
        pass

    # Get the full page text for parsing nutrition info
    try:
        full_text = await page.inner_text("body")
    except Exception:
        full_text = ""

    # Guaranteed Analysis
    ga = parse_ga_from_text(full_text)
    product["ga"] = ga

    # Ingredients — look for the ingredients section
    try:
        ing_text = await page.evaluate("""
            () => {
                // Strategy 1: Look for a section with "Ingredients" heading
                const headings = document.querySelectorAll('h2, h3, h4, strong, b');
                for (const h of headings) {
                    if (h.textContent.trim().toLowerCase().includes('ingredients')) {
                        // Get the next sibling or parent's text
                        let el = h.nextElementSibling || h.parentElement;
                        if (el) {
                            const text = el.textContent;
                            if (text && text.length > 30 && text.includes(',')) {
                                return text;
                            }
                        }
                        // Try parent's next sibling
                        el = h.parentElement?.nextElementSibling;
                        if (el) {
                            const text = el.textContent;
                            if (text && text.length > 30 && text.includes(',')) {
                                return text;
                            }
                        }
                    }
                }
                // Strategy 2: Look for a long comma-separated block near "Ingredients"
                const body = document.body.textContent;
                const idx = body.toLowerCase().indexOf('ingredients');
                if (idx > -1) {
                    // Grab text after "Ingredients" up to the next section
                    const after = body.substring(idx + 11, idx + 3000);
                    const lines = after.split('\\n').filter(l => l.trim());
                    for (const line of lines) {
                        if (line.includes(',') && line.length > 50) {
                            return line.trim();
                        }
                    }
                }
                return null;
            }
        """)
        if ing_text:
            # Clean up: remove the "Ingredients" label if present
            ing_clean = re.sub(r"^ingredients?\s*:?\s*", "", ing_text.strip(), flags=re.IGNORECASE)
            product["ingredients"] = parse_ingredient_list(ing_clean)
    except Exception:
        product["ingredients"] = []

    # Calories
    product["calories"] = parse_calories_from_text(full_text)

    # AAFCO
    aafco_match = re.search(
        r"(.*aafco.*?(?:\.|\n))",
        full_text,
        re.IGNORECASE,
    )
    if aafco_match:
        product["aafco_statement"] = clean_text(aafco_match.group(1))

    return product


# ── Product URL discovery ─────────────────────────────────────────────────────


async def scroll_to_load_all(page, max_scrolls: int = 30):
    """Scroll the page to trigger lazy loading of product cards."""
    for _ in range(max_scrolls):
        prev_height = await page.evaluate("document.body.scrollHeight")
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1500)
        new_height = await page.evaluate("document.body.scrollHeight")
        if new_height == prev_height:
            break


async def collect_product_urls(page) -> list[str]:
    """
    Collect all product detail page URLs from a Chewy listing page.
    Returns deduplicated, sorted list of absolute URLs.
    """
    await scroll_to_load_all(page)

    urls = await page.evaluate("""
        () => {
            const links = document.querySelectorAll('a[href*="/dp/"]');
            const urls = new Set();
            for (const link of links) {
                let href = link.href || link.getAttribute('href');
                if (!href) continue;
                if (!href.startsWith('http')) href = 'https://www.chewy.com' + href;
                // Only keep product detail pages (have /dp/ followed by digits)
                if (/\\/dp\\/\\d+/.test(href)) {
                    // Strip query params and hash
                    urls.add(href.split('?')[0].split('#')[0]);
                }
            }
            return [...urls];
        }
    """)

    return sorted(set(urls))


async def collect_all_product_urls(page, catalog_url: str) -> list[str]:
    """
    Paginate through a catalog page and collect all product URLs.
    """
    all_urls = []

    console.print(f"[cyan]  Loading catalog: {catalog_url}[/cyan]")
    await page.goto(catalog_url, wait_until="domcontentloaded", timeout=PAGE_LOAD_TIMEOUT_MS)
    await page.wait_for_timeout(3000)

    page_num = 1
    while True:
        console.print(f"[dim]    Page {page_num}...[/dim]")

        urls = await collect_product_urls(page)
        if not urls:
            console.print(f"[yellow]    No product URLs found on page {page_num}[/yellow]")
            break

        new_urls = [u for u in urls if u not in all_urls]
        all_urls.extend(new_urls)
        console.print(f"[green]    Found {len(new_urls)} new products (total: {len(all_urls)})[/green]")

        # Check for next page
        has_next = await page.evaluate("""
            () => {
                // Look for "Next" pagination link
                const links = document.querySelectorAll('a[rel="next"], a[aria-label="Next"]');
                for (const link of links) {
                    if (link.href) {
                        link.click();
                        return true;
                    }
                }
                // Try generic pagination
                const pageLinks = document.querySelectorAll('[class*="pagination"] a, [class*="Pagination"] a');
                const current = document.querySelector('[class*="pagination"] [aria-current="page"], [class*="active"][class*="page"]');
                if (current) {
                    const next = current.nextElementSibling?.querySelector('a') || current.parentElement?.nextElementSibling?.querySelector('a');
                    if (next && next.href) {
                        next.click();
                        return true;
                    }
                }
                return false;
            }
        """)

        if not has_next:
            break

        await page.wait_for_timeout(3000)
        page_num += 1

        # Safety limit
        if page_num > 50:
            console.print("[yellow]    Hit 50-page limit, stopping pagination[/yellow]")
            break

    return all_urls


# ── Main scraper ──────────────────────────────────────────────────────────────


async def scrape_single_brand(page, brand_key: str, brand_config: dict, conn) -> dict:
    """Scrape all products for a single brand from Chewy."""
    brand_name = brand_config["name"]
    manufacturer = brand_config.get("manufacturer")

    console.print(f"\n[bold green]{'=' * 60}[/bold green]")
    console.print(f"[bold green]  Scraping {brand_name} from Chewy[/bold green]")
    console.print(f"[bold green]{'=' * 60}[/bold green]\n")

    scraped_count = 0
    updated_count = 0
    error_list = []

    # Upsert the brand
    with get_cursor(conn) as cur:
        brand_id = upsert_brand(cur, brand_name, manufacturer)
        log_id = start_scrape_log(cur, f"chewy_{brand_key}")

    # Collect all product URLs from catalog pages
    all_product_urls: dict[str, str] = {}  # url -> food_type

    for catalog_entry in brand_config["catalog_urls"]:
        catalog_url = catalog_entry["url"]
        food_type = catalog_entry["food_type"]

        try:
            urls = await collect_all_product_urls(page, catalog_url)
            console.print(f"[green]  Total {food_type} products found: {len(urls)}[/green]")
            for url in urls:
                all_product_urls[url] = food_type
        except PwTimeout:
            console.print(f"[red]  Timeout loading catalog: {catalog_url}[/red]")
            error_list.append({"url": catalog_url, "error": "Timeout loading catalog"})
        except Exception as e:
            console.print(f"[red]  Error loading catalog: {e}[/red]")
            error_list.append({"url": catalog_url, "error": str(e)})

        polite_delay(REQUEST_DELAY_SECONDS)

    console.print(f"\n[bold]Total unique product URLs for {brand_name}: {len(all_product_urls)}[/bold]\n")

    if not all_product_urls:
        console.print("[red]No product URLs found. Chewy may have changed their site structure.[/red]")
        with get_cursor(conn) as cur:
            finish_scrape_log(cur, log_id, "no_products", 0, 0, error_list or None)
        return {"scraped": 0, "updated": 0, "errors": error_list}

    # Scrape each product detail page
    for product_url, default_food_type in all_product_urls.items():
        console.print(f"[cyan]Scraping: {product_url}[/cyan]")

        try:
            await page.goto(product_url, wait_until="domcontentloaded", timeout=PAGE_LOAD_TIMEOUT_MS)
            await page.wait_for_timeout(2000)

            # Check we're still on a product page (not redirected)
            current_url = page.url
            if "/dp/" not in current_url:
                console.print(f"[yellow]  Redirected away from product page, skipping[/yellow]")
                error_list.append({"url": product_url, "error": "Redirected"})
                polite_delay(REQUEST_DELAY_SECONDS)
                continue

            # --- Try __NEXT_DATA__ first ---
            next_data = await extract_next_data(page)
            product_data = extract_product_from_next_data(next_data) if next_data else None

            # --- Always supplement with DOM scraping ---
            dom_data = await scrape_product_page_dom(page)

            # --- Merge data (prefer __NEXT_DATA__, fall back to DOM) ---
            product_name = None
            if product_data:
                product_name = product_data.get("name") or product_data.get("title")
            if not product_name:
                product_name = dom_data.get("name")
            if not product_name:
                console.print("[yellow]  Skipping: could not extract product name[/yellow]")
                error_list.append({"url": product_url, "error": "No product name"})
                polite_delay(REQUEST_DELAY_SECONDS)
                continue

            # Clean up name — remove brand prefix if present
            product_name = clean_text(product_name)
            console.print(f"[green]  Name: {product_name}[/green]")

            # Guaranteed Analysis
            ga = dom_data.get("ga", {})
            ga_found = any(v is not None for v in ga.values())
            if ga_found:
                console.print(
                    f"[green]  GA: protein={ga.get('crude_protein_pct')}%, "
                    f"fat={ga.get('crude_fat_pct')}%, "
                    f"fiber={ga.get('crude_fiber_pct')}%, "
                    f"moisture={ga.get('moisture_pct')}%[/green]"
                )
            else:
                console.print("[yellow]  Warning: No guaranteed analysis found[/yellow]")

            # Ingredients
            ingredients = dom_data.get("ingredients", [])
            if ingredients:
                console.print(f"[green]  Ingredients: {len(ingredients)} found[/green]")
            else:
                console.print("[yellow]  Warning: No ingredients found[/yellow]")

            # Calories
            calories = dom_data.get("calories", {})
            cal_found = any(v is not None for v in calories.values())
            if cal_found:
                console.print(f"[green]  Calories: {calories}[/green]")

            # AAFCO
            aafco_statement = dom_data.get("aafco_statement")
            if aafco_statement:
                console.print("[green]  AAFCO: found[/green]")

            # Price
            price = dom_data.get("price")
            autoship_price = dom_data.get("autoship_price")
            if price:
                console.print(f"[green]  Price: ${price}, Autoship: ${autoship_price}[/green]")

            # Inferred fields
            food_type = infer_food_type(product_name, default_food_type)
            texture = infer_texture(product_name)
            life_stage = infer_life_stage(aafco_statement) or infer_life_stage(product_name)

            # Size
            size_info = parse_size(product_name)

            # DMB calculations
            dmb_values = calculate_all_dmb(ga)

            # Calorie conversions
            kcal_per_oz = calories.get("kcal_per_oz")
            kcal_per_can = calories.get("kcal_per_can")
            kcal_per_cup = calories.get("kcal_per_cup")
            # If we have kcal/kg but not kcal/oz, convert
            if not kcal_per_oz and calories.get("kcal_per_kg"):
                kcal_per_oz = round(calories["kcal_per_kg"] / 35.274, 2)

            # --- Save to database ---
            db_data = {
                "brand_id": brand_id,
                "name": product_name,
                "food_type": food_type,
            }

            optional = {
                "texture": texture,
                "flavor": None,  # Hard to reliably extract from Chewy
                "life_stage": life_stage,
                "size_oz": size_info.get("size_oz"),
                "size_lbs": size_info.get("size_lbs"),
                "crude_protein_pct": ga.get("crude_protein_pct"),
                "crude_fat_pct": ga.get("crude_fat_pct"),
                "crude_fiber_pct": ga.get("crude_fiber_pct"),
                "moisture_pct": ga.get("moisture_pct"),
                "ash_pct": ga.get("ash_pct"),
                "calories_per_oz": kcal_per_oz,
                "calories_per_can": kcal_per_can,
                "calories_per_cup": kcal_per_cup,
                "aafco_statement": aafco_statement,
                "chewy_url": product_url,
                "manufacturer_url": None,
            }
            optional.update(dmb_values)

            for key, value in optional.items():
                if value is not None:
                    db_data[key] = value

            with get_cursor(conn) as cur:
                product_id = upsert_product(cur, db_data)
                if ingredients:
                    set_product_ingredients(cur, product_id, ingredients)

                # Insert price if available
                if price is not None:
                    insert_price(cur, {
                        "product_id": product_id,
                        "retailer": "chewy",
                        "price": price,
                        "url": product_url,
                        "in_stock": True,
                        "autoship_price": autoship_price,
                    })

            scraped_count += 1
            updated_count += 1
            console.print(f"[green]  Saved (id={product_id})[/green]")

        except PwTimeout:
            console.print("[red]  Timeout loading product page[/red]")
            error_list.append({"url": product_url, "error": "Timeout"})
        except Exception as e:
            console.print(f"[red]  Error: {e}[/red]")
            error_list.append({"url": product_url, "error": str(e)})

        polite_delay(REQUEST_DELAY_SECONDS)

    # Finish scrape log
    status = "completed" if not error_list else "completed_with_errors"
    with get_cursor(conn) as cur:
        finish_scrape_log(cur, log_id, status, scraped_count, updated_count, error_list or None)

    console.print(f"\n[bold green]  {brand_name}: scraped={scraped_count}, updated={updated_count}, errors={len(error_list)}[/bold green]")

    return {"scraped": scraped_count, "updated": updated_count, "errors": error_list}


async def scrape(brand_key: str | None = None):
    """
    Main entry point. Scrapes all brands (or a specific one) from Chewy.

    Args:
        brand_key: If provided, only scrape this brand (e.g. "fancy_feast").
                   If None, scrape all brands in CHEWY_BRAND_CATALOGS.
    """
    if brand_key:
        if brand_key not in CHEWY_BRAND_CATALOGS:
            console.print(f"[red]Unknown brand: '{brand_key}'[/red]")
            console.print(f"Available: {', '.join(CHEWY_BRAND_CATALOGS.keys())}")
            return {"scraped": 0, "updated": 0}
        brands_to_scrape = {brand_key: CHEWY_BRAND_CATALOGS[brand_key]}
    else:
        brands_to_scrape = CHEWY_BRAND_CATALOGS

    total_scraped = 0
    total_updated = 0
    all_errors = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=STEALTH_ARGS,
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=USER_AGENT,
        )
        page = await context.new_page()
        page.set_default_timeout(PAGE_LOAD_TIMEOUT_MS)

        with get_connection() as conn:
            for bkey, bconfig in brands_to_scrape.items():
                result = await scrape_single_brand(page, bkey, bconfig, conn)
                total_scraped += result["scraped"]
                total_updated += result["updated"]
                all_errors.extend(result.get("errors", []))

        await browser.close()

    return {
        "scraped": total_scraped,
        "updated": total_updated,
        "errors": len(all_errors),
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scrape products from Chewy.com")
    parser.add_argument("--brand", type=str, help="Scrape only this brand (e.g. fancy_feast)")
    args = parser.parse_args()

    asyncio.run(scrape(brand_key=args.brand))
