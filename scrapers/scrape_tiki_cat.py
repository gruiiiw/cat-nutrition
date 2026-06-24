# ======================================================================
# ||  TIKI CAT SCRAPER -- tikipets.com                                ||
# ||                                                                  ||
# ||  Tiki Pets site is JavaScript-rendered. Uses Playwright.         ||
# ||                                                                  ||
# ||  !!  CSS SELECTORS MAY NEED UPDATING                            ||
# ||  If the scraper stops finding products, inspect tikipets.com in  ||
# ||  Chrome DevTools and update the SELECTORS dict below.            ||
# ======================================================================

"""
Scrape Tiki Cat product data from tikipets.com.

The site is JavaScript-rendered, so we use Playwright (headless Chromium)
to load pages and extract product details including guaranteed analysis,
ingredients, calorie content, and AAFCO statements.
"""

import asyncio
import re
from urllib.parse import urljoin

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

from config import BRANDS, REQUEST_DELAY_SECONDS, PAGE_LOAD_TIMEOUT_MS
from db import (
    get_connection,
    get_cursor,
    upsert_brand,
    upsert_product,
    set_product_ingredients,
    start_scrape_log,
    finish_scrape_log,
)
from helpers import (
    clean_text,
    parse_percent,
    parse_calories,
    parse_size,
    parse_ingredient_list,
    calculate_all_dmb,
    polite_delay,
    console,
)


# ---------------------------------------------------------------------------
# CSS Selectors
# ---------------------------------------------------------------------------
# If tikipets.com redesigns, update these selectors first.

SELECTORS = {
    # Catalog / listing pages
    "product_card_link": 'a[href*="/cat/"]',
    "product_line_link": '.product-category a, .collection-card a, a[href*="/cat/cat-food/"]',
    "product_grid_item": ".product-card, .product-item, .product-tile, [class*='product']",

    # Product detail page
    "product_title": "h1",
    "breadcrumb": ".breadcrumb, [class*='breadcrumb'], nav[aria-label='breadcrumb']",

    # Guaranteed Analysis
    "ga_section": (
        ".nutrition-facts, [class*='guaranteed'], [class*='nutrition'], "
        ".product-nutrition, [class*='analysis'], "
        "[class*='guaranteed-analysis']"
    ),
    "ga_table": "table",
    "ga_rows": "tr",

    # Ingredients
    "ingredients_section": (
        ".ingredients, [class*='ingredient'], "
        "[class*='Ingredient']"
    ),

    # Calorie content
    "calorie_section": "[class*='calorie'], [class*='Calorie']",

    # AAFCO statement
    "aafco_section": "[class*='aafco'], [class*='AAFCO'], [class*='feeding']",
}


# ---------------------------------------------------------------------------
# Product line metadata
# ---------------------------------------------------------------------------

PRODUCT_LINE_INFO = {
    "luau": {"line_name": "Luau", "texture": "shredded"},
    "after-dark": {"line_name": "After Dark", "texture": "pate"},
    "grill": {"line_name": "Grill", "texture": "grilled flaked"},
    "velvet-mousse": {"line_name": "Velvet Mousse", "texture": "mousse"},
    "stix": {"line_name": "Stix", "texture": "treat"},
    "born-carnivore": {"line_name": "Born Carnivore", "texture": None},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _detect_product_line(url: str, title: str = "") -> dict:
    """Infer product line name and texture from the URL or title."""
    combined = (url + " " + title).lower()
    for key, info in PRODUCT_LINE_INFO.items():
        if key in combined:
            return info
    return {"line_name": None, "texture": None}


def _extract_flavor(product_name: str, line_name: str | None) -> str | None:
    """
    Extract the flavor portion from a product name by removing the brand
    and product line prefix.

    E.g. "Tiki Cat Luau Ahi Tuna & Chicken" -> "Ahi Tuna & Chicken"
    """
    if not product_name:
        return None

    name = product_name.strip()

    # Remove "Tiki Cat" prefix
    name = re.sub(r"^Tiki\s+Cat\s*", "", name, flags=re.IGNORECASE).strip()

    # Remove product line prefix if known
    if line_name:
        name = re.sub(
            rf"^{re.escape(line_name)}\s*", "", name, flags=re.IGNORECASE
        ).strip()

    # Remove leading dashes or hyphens
    name = re.sub(r"^[-–—]+\s*", "", name).strip()

    return name if name else None


async def _safe_text(page, selector: str) -> str:
    """Return inner text of the first matching element, or empty string."""
    try:
        el = page.locator(selector).first
        if await el.count() > 0:
            return clean_text(await el.inner_text())
    except Exception:
        pass
    return ""


async def _safe_all_text(page, selector: str) -> str:
    """Return concatenated inner text from all matching elements."""
    try:
        elements = page.locator(selector)
        count = await elements.count()
        texts = []
        for i in range(count):
            texts.append(await elements.nth(i).inner_text())
        return clean_text(" ".join(texts))
    except Exception:
        return ""


async def _get_page_full_text(page) -> str:
    """Get the full visible text content of the page body."""
    try:
        return clean_text(await page.locator("body").inner_text())
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Extraction logic
# ---------------------------------------------------------------------------


async def _extract_guaranteed_analysis(page) -> dict:
    """
    Extract guaranteed analysis values from the product page.

    Returns dict with keys: crude_protein_pct, crude_fat_pct,
    crude_fiber_pct, moisture_pct, ash_pct (all float or None).
    """
    ga = {
        "crude_protein_pct": None,
        "crude_fat_pct": None,
        "crude_fiber_pct": None,
        "moisture_pct": None,
        "ash_pct": None,
    }

    # Strategy 1: Look for a GA section via selectors
    ga_text = await _safe_all_text(page, SELECTORS["ga_section"])

    # Strategy 2: Look for tables within a GA section
    if not ga_text or "protein" not in ga_text.lower():
        # Try to find GA table rows
        try:
            tables = page.locator(SELECTORS["ga_table"])
            table_count = await tables.count()
            for t in range(table_count):
                table_text = await tables.nth(t).inner_text()
                if "protein" in table_text.lower() or "moisture" in table_text.lower():
                    ga_text = clean_text(table_text)
                    break
        except Exception:
            pass

    # Strategy 3: Search the full page text for GA patterns
    if not ga_text or "protein" not in ga_text.lower():
        full_text = await _get_page_full_text(page)
        # Find the region around "Guaranteed Analysis"
        match = re.search(
            r"guaranteed\s+analysis(.*?)(?:calorie|ingredient|feeding|aafco|\Z)",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if match:
            ga_text = match.group(1)

    if not ga_text:
        return ga

    # Parse individual values from the GA text
    patterns = {
        "crude_protein_pct": r"(?:crude\s+)?protein.*?(\d+\.?\d*)\s*%",
        "crude_fat_pct": r"(?:crude\s+)?fat.*?(\d+\.?\d*)\s*%",
        "crude_fiber_pct": r"(?:crude\s+)?fiber.*?(\d+\.?\d*)\s*%",
        "moisture_pct": r"moisture.*?(\d+\.?\d*)\s*%",
        "ash_pct": r"ash.*?(\d+\.?\d*)\s*%",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, ga_text, re.IGNORECASE)
        if match:
            try:
                ga[key] = float(match.group(1))
            except ValueError:
                pass

    return ga


async def _extract_ingredients(page) -> list[str]:
    """Extract ingredient list from the product page."""
    # Strategy 1: Look for an ingredients section
    ing_text = await _safe_all_text(page, SELECTORS["ingredients_section"])

    # Strategy 2: Search the full page for "Ingredients:" text
    if not ing_text:
        full_text = await _get_page_full_text(page)
        match = re.search(
            r"ingredients?\s*:?\s*(.*?)(?:guaranteed\s+analysis|calorie|feeding|aafco|\Z)",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if match:
            ing_text = match.group(1)

    if not ing_text:
        return []

    # Clean up: remove "Ingredients:" prefix
    ing_text = re.sub(r"^ingredients?\s*:?\s*", "", ing_text, flags=re.IGNORECASE)

    return parse_ingredient_list(clean_text(ing_text))


async def _extract_calorie_content(page) -> dict:
    """Extract calorie information from the product page."""
    # Strategy 1: Look for a calorie section
    cal_text = await _safe_all_text(page, SELECTORS["calorie_section"])

    # Strategy 2: Search full page text for kcal
    if not cal_text or "kcal" not in cal_text.lower():
        full_text = await _get_page_full_text(page)
        match = re.search(
            r"(calorie[^.]*?kcal[^.]*\.)",
            full_text,
            re.IGNORECASE,
        )
        if match:
            cal_text = match.group(1)
        else:
            # Try broader kcal match
            match = re.search(
                r"([^.]*\d+\s*kcal[^.]*\.?)",
                full_text,
                re.IGNORECASE,
            )
            if match:
                cal_text = match.group(1)

    return parse_calories(cal_text)


async def _extract_aafco(page) -> dict:
    """
    Extract AAFCO statement and infer life stage.
    Returns dict with aafco_statement and life_stage.
    """
    result = {"aafco_statement": None, "life_stage": None}

    # Strategy 1: Look for AAFCO section
    aafco_text = await _safe_all_text(page, SELECTORS["aafco_section"])

    # Strategy 2: Search full page text
    if not aafco_text or "aafco" not in aafco_text.lower():
        full_text = await _get_page_full_text(page)
        match = re.search(
            r"([^.]*aafco[^.]*\.)",
            full_text,
            re.IGNORECASE,
        )
        if match:
            aafco_text = match.group(1)

    if not aafco_text:
        return result

    result["aafco_statement"] = clean_text(aafco_text)

    # Infer life stage
    lower = aafco_text.lower()
    if "all life stages" in lower or "all stages" in lower:
        result["life_stage"] = "all life stages"
    elif "kitten" in lower and "adult" in lower:
        result["life_stage"] = "all life stages"
    elif "kitten" in lower:
        result["life_stage"] = "kitten"
    elif "adult" in lower and "maintenance" in lower:
        result["life_stage"] = "adult maintenance"
    elif "adult" in lower:
        result["life_stage"] = "adult"

    return result


# ---------------------------------------------------------------------------
# Page navigation and product collection
# ---------------------------------------------------------------------------


async def _collect_product_urls(page, catalog_url: str) -> list[str]:
    """
    Navigate to a catalog URL and collect all individual product page links.

    Handles two-level navigation: catalog -> product line pages -> product pages.
    """
    product_urls = set()
    base_url = "https://www.tikipets.com"

    console.log(f"[bold blue]Loading catalog:[/] {catalog_url}")
    try:
        await page.goto(catalog_url, timeout=PAGE_LOAD_TIMEOUT_MS)
        await page.wait_for_load_state("networkidle", timeout=PAGE_LOAD_TIMEOUT_MS)
    except PlaywrightTimeout:
        console.log("[yellow]Timeout loading catalog page, continuing...[/]")
    except Exception as e:
        console.log(f"[red]Error loading catalog: {e}[/]")
        return []

    await asyncio.sleep(REQUEST_DELAY_SECONDS)

    # Collect all links that look like product or product-line pages
    try:
        links = await page.locator(SELECTORS["product_card_link"]).all()
        hrefs = []
        for link in links:
            href = await link.get_attribute("href")
            if href:
                full_url = urljoin(base_url, href)
                hrefs.append(full_url)
    except Exception as e:
        console.log(f"[yellow]Error collecting links: {e}[/]")
        hrefs = []

    console.log(f"  Found {len(hrefs)} links on catalog page")

    # Determine which links are product-line pages vs individual products
    # Product-line pages typically have paths like /cat/cat-food/wet-food/luau
    # Individual products typically have longer/more specific paths
    line_pages = []
    for href in hrefs:
        # Heuristic: if the path has 4-5 segments and matches a known line,
        # it's likely a line listing page
        path = href.replace(base_url, "").strip("/")
        segments = path.split("/")
        is_line_page = False
        for line_key in PRODUCT_LINE_INFO:
            if line_key in path.lower() and len(segments) <= 5:
                is_line_page = True
                break
        if is_line_page:
            line_pages.append(href)
        else:
            product_urls.add(href)

    # Visit each product-line page to collect individual product links
    for line_url in line_pages:
        console.log(f"  [blue]Visiting product line:[/] {line_url}")
        try:
            await page.goto(line_url, timeout=PAGE_LOAD_TIMEOUT_MS)
            await page.wait_for_load_state("networkidle", timeout=PAGE_LOAD_TIMEOUT_MS)
        except PlaywrightTimeout:
            console.log("[yellow]Timeout loading line page, continuing...[/]")
            continue
        except Exception as e:
            console.log(f"[yellow]Error loading line page: {e}[/]")
            continue

        await asyncio.sleep(REQUEST_DELAY_SECONDS)

        try:
            sub_links = await page.locator(SELECTORS["product_card_link"]).all()
            for link in sub_links:
                href = await link.get_attribute("href")
                if href:
                    full_url = urljoin(base_url, href)
                    product_urls.add(full_url)
        except Exception as e:
            console.log(f"[yellow]Error collecting sub-links: {e}[/]")

    # Deduplicate and filter out non-product URLs
    filtered = set()
    for url in product_urls:
        # Skip obvious non-product pages
        if any(
            skip in url.lower()
            for skip in ["#", "javascript:", "/cart", "/account", "/search"]
        ):
            continue
        filtered.add(url)

    console.log(f"  Collected {len(filtered)} unique product URLs")
    return sorted(filtered)


async def _scrape_product(page, url: str, food_type: str) -> dict | None:
    """
    Navigate to a product page and extract all data.
    Returns a product dict or None on failure.
    """
    console.log(f"  [cyan]Scraping:[/] {url}")

    try:
        await page.goto(url, timeout=PAGE_LOAD_TIMEOUT_MS)
        await page.wait_for_load_state("networkidle", timeout=PAGE_LOAD_TIMEOUT_MS)
    except PlaywrightTimeout:
        console.log(f"  [yellow]Timeout loading product page[/]")
        return None
    except Exception as e:
        console.log(f"  [red]Error loading product page: {e}[/]")
        return None

    await asyncio.sleep(REQUEST_DELAY_SECONDS)

    product = {
        "source_url": url,
        "food_type": food_type,
    }

    # -- Product name --
    try:
        product["name"] = clean_text(
            await page.locator(SELECTORS["product_title"]).first.inner_text()
        )
    except Exception:
        product["name"] = None

    if not product["name"]:
        console.log("  [yellow]No product name found, skipping[/]")
        return None

    # -- Product line and texture --
    try:
        line_info = _detect_product_line(url, product["name"])
        product["product_line"] = line_info["line_name"]
        product["texture"] = line_info["texture"]
    except Exception:
        product["product_line"] = None
        product["texture"] = None

    # -- Flavor --
    try:
        product["flavor"] = _extract_flavor(product["name"], product["product_line"])
    except Exception:
        product["flavor"] = None

    # -- Guaranteed Analysis --
    try:
        ga = await _extract_guaranteed_analysis(page)
        product.update(ga)
    except Exception as e:
        console.log(f"  [yellow]GA extraction error: {e}[/]")
        ga = {}

    # -- DMB calculations --
    try:
        dmb = calculate_all_dmb(ga)
        product.update(dmb)
    except Exception:
        pass

    # -- Ingredients --
    try:
        product["_ingredients"] = await _extract_ingredients(page)
    except Exception:
        product["_ingredients"] = []

    # -- Calorie content --
    try:
        cals = await _extract_calorie_content(page)
        product["kcal_per_kg"] = cals.get("kcal_per_kg")
        product["kcal_per_can"] = cals.get("kcal_per_can")
        product["kcal_per_oz"] = cals.get("kcal_per_oz")
        product["kcal_per_cup"] = cals.get("kcal_per_cup")
    except Exception:
        pass

    # -- AAFCO statement --
    try:
        aafco = await _extract_aafco(page)
        product["aafco_statement"] = aafco.get("aafco_statement")
        product["life_stage"] = aafco.get("life_stage")
    except Exception:
        pass

    # -- Size / weight --
    try:
        title_text = product.get("name", "")
        size_info = parse_size(title_text)
        # Also check page for size information
        if not size_info["size_oz"] and not size_info["size_lbs"]:
            full_text = await _get_page_full_text(page)
            # Look for net weight text
            size_match = re.search(
                r"(?:net\s+)?(?:wt\.?|weight)\s*:?\s*(\d+\.?\d*\s*(?:oz|lb)s?)",
                full_text,
                re.IGNORECASE,
            )
            if size_match:
                size_info = parse_size(size_match.group(1))
        product["size_oz"] = size_info.get("size_oz")
        product["size_lbs"] = size_info.get("size_lbs")
    except Exception:
        pass

    console.log(f"  [green]OK:[/] {product['name']}")
    return product


# ---------------------------------------------------------------------------
# Main scrape function
# ---------------------------------------------------------------------------


async def scrape():
    """Scrape all Tiki Cat products from tikipets.com."""
    brand_config = BRANDS["tiki_cat"]
    brand_name = brand_config["name"]

    console.rule(f"[bold magenta]Tiki Cat Scraper[/]")
    console.log(f"Brand: {brand_name}")
    console.log(f"Manufacturer: {brand_config['manufacturer']}")
    console.log(f"Catalog URLs: {len(brand_config['catalog_urls'])}")

    scraped_count = 0
    updated_count = 0
    errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        )

        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )

        page = await context.new_page()

        with get_connection() as conn:
            with get_cursor(conn) as cur:
                # Upsert brand
                brand_id = upsert_brand(
                    cur,
                    brand_name,
                    manufacturer=brand_config["manufacturer"],
                    website_url=brand_config["website"],
                )

                # Start scrape log
                log_id = start_scrape_log(cur, f"tikipets.com ({brand_name})")

                try:
                    # Process each catalog URL (wet food, dry food)
                    for catalog_entry in brand_config["catalog_urls"]:
                        catalog_url = catalog_entry["url"]
                        food_type = catalog_entry["food_type"]

                        console.rule(f"[bold]{food_type.upper()} FOOD[/]")

                        product_urls = await _collect_product_urls(page, catalog_url)
                        console.log(
                            f"Found [bold]{len(product_urls)}[/] {food_type} product URLs"
                        )

                        for url in product_urls:
                            try:
                                product_data = await _scrape_product(
                                    page, url, food_type
                                )
                                if not product_data:
                                    continue

                                # Separate ingredients from the product dict
                                ingredient_list = product_data.pop("_ingredients", [])

                                # Build the DB record
                                db_data = {
                                    "brand_id": brand_id,
                                    "name": product_data["name"],
                                    "food_type": product_data.get("food_type"),
                                    "product_line": product_data.get("product_line"),
                                    "flavor": product_data.get("flavor"),
                                    "texture": product_data.get("texture"),
                                    "source_url": product_data.get("source_url"),
                                    "life_stage": product_data.get("life_stage"),
                                    "aafco_statement": product_data.get(
                                        "aafco_statement"
                                    ),
                                    "crude_protein_pct": product_data.get(
                                        "crude_protein_pct"
                                    ),
                                    "crude_fat_pct": product_data.get("crude_fat_pct"),
                                    "crude_fiber_pct": product_data.get(
                                        "crude_fiber_pct"
                                    ),
                                    "moisture_pct": product_data.get("moisture_pct"),
                                    "ash_pct": product_data.get("ash_pct"),
                                    "kcal_per_kg": product_data.get("kcal_per_kg"),
                                    "kcal_per_can": product_data.get("kcal_per_can"),
                                    "kcal_per_oz": product_data.get("kcal_per_oz"),
                                    "kcal_per_cup": product_data.get("kcal_per_cup"),
                                    "size_oz": product_data.get("size_oz"),
                                    "size_lbs": product_data.get("size_lbs"),
                                }

                                # Add DMB and ME fields
                                for dmb_key in [
                                    "dmb_protein_pct",
                                    "dmb_fat_pct",
                                    "dmb_fiber_pct",
                                    "dmb_ash_pct",
                                    "dmb_carb_pct",
                                    "me_protein_pct",
                                    "me_fat_pct",
                                    "me_carb_pct",
                                ]:
                                    if dmb_key in product_data:
                                        db_data[dmb_key] = product_data[dmb_key]

                                # Remove None values to let DB defaults work
                                db_data = {
                                    k: v for k, v in db_data.items() if v is not None
                                }

                                product_id = upsert_product(cur, db_data)

                                # Save ingredients
                                if ingredient_list:
                                    set_product_ingredients(
                                        cur, product_id, ingredient_list
                                    )

                                scraped_count += 1
                                updated_count += 1

                            except Exception as e:
                                error_msg = f"Error scraping {url}: {e}"
                                console.log(f"  [red]{error_msg}[/]")
                                errors.append(error_msg)

                            polite_delay(REQUEST_DELAY_SECONDS)

                    # Finish scrape log
                    finish_scrape_log(
                        cur,
                        log_id,
                        status="completed",
                        scraped=scraped_count,
                        updated=updated_count,
                        errors=errors if errors else None,
                    )

                except Exception as e:
                    console.log(f"[bold red]Fatal error: {e}[/]")
                    errors.append(f"Fatal: {e}")
                    finish_scrape_log(
                        cur,
                        log_id,
                        status="failed",
                        scraped=scraped_count,
                        updated=updated_count,
                        errors=errors,
                    )
                    raise

        await browser.close()

    console.rule("[bold magenta]Scrape Complete[/]")
    console.log(f"Products scraped: [bold green]{scraped_count}[/]")
    console.log(f"Products updated: [bold green]{updated_count}[/]")
    if errors:
        console.log(f"Errors: [bold red]{len(errors)}[/]")
        for err in errors[:10]:
            console.log(f"  [red]{err}[/]")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    asyncio.run(scrape())
