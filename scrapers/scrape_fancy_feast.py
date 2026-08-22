"""
Fancy Feast product scraper for purina.com.

# ======================================================================
#   FANCY FEAST SCRAPER -- purina.com
#
#   Purina's site is JavaScript-rendered. This scraper uses Playwright
#   to render pages and extract product data.
#
#   WARNING: CSS SELECTORS MAY NEED UPDATING
#   Purina redesigns their site periodically. If the scraper stops
#   finding products, open a product page in Chrome DevTools and
#   update the selectors in the SELECTORS dict below.
# ======================================================================
"""

import asyncio
import json
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
# CSS SELECTORS
#
# All selectors used for scraping are defined here for easy maintenance.
# When Purina redesigns their site, update these selectors and the scraper
# should work again without changing the logic below.
# ---------------------------------------------------------------------------

SELECTORS = {
    # -- Catalog page --
    # Links to individual product pages; anchor tags whose href contains the brand path
    "product_links": 'a[href*="/fancy-feast/"]',
    # "Load More" or "Show All" button on the catalog page to reveal additional products
    "load_more_button": 'button:has-text("Load More"), button:has-text("Show All"), a:has-text("Load More"), a:has-text("Show All")',

    # -- Product page --
    # Product name (primary heading on the product detail page)
    "product_name": "h1",
    # Alternate product name selectors if h1 is missing
    "product_name_alt": '.product-title, [data-testid="product-name"], .product-hero__title',
    # JSON-LD structured data script tag (Purina often embeds Product schema)
    "json_ld": 'script[type="application/ld+json"]',

    # -- Guaranteed Analysis section --
    # Container for the guaranteed analysis table/section
    "guaranteed_analysis": '.guaranteed-analysis, [class*="guaranteed"], [class*="nutrition-info"], [class*="nutritional"]',
    # Individual rows inside the guaranteed analysis table
    "ga_rows": "tr, li, .nutrition-row, [class*='nutrient']",

    # -- Ingredients section --
    # Container for the ingredient list
    "ingredients": '.ingredients, [class*="ingredient"], .product-ingredients',
    # Heading that precedes the ingredient paragraph (fallback: search for heading text)
    "ingredients_heading": 'h2:has-text("Ingredients"), h3:has-text("Ingredients"), h4:has-text("Ingredients")',

    # -- Calorie content --
    # Section or paragraph containing calorie information (look for "kcal" text)
    "calorie_section": '[class*="calorie"], [class*="feeding"]',

    # -- AAFCO statement --
    # Section containing the AAFCO nutritional adequacy statement
    "aafco_section": '[class*="aafco"], [class*="nutritional-adequacy"], [class*="feeding-guide"]',
}

# Stealth-mode browser launch arguments to reduce detection
STEALTH_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--no-sandbox",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

# Texture keywords mapped from product name patterns
TEXTURE_MAP = {
    "classic pate": "pate",
    "classic": "pate",
    "pate": "pate",
    "gravy lovers": "gravy",
    "gravy": "gravy",
    "flaked": "flaked",
    "broths": "broth",
    "broth": "broth",
    "grilled": "grilled",
    "medleys": "medley",
    "tender": "pate",
    "chunk": "chunks",
    "sliced": "sliced",
    "minced": "minced",
    "creamy": "creamy",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def infer_texture(product_name: str) -> str | None:
    """Infer the texture from the product name using the TEXTURE_MAP."""
    name_lower = product_name.lower()
    for keyword, texture in TEXTURE_MAP.items():
        if keyword in name_lower:
            return texture
    return None


def infer_flavor(product_name: str) -> str | None:
    """
    Extract the flavor portion from the product name.

    For example:
      "Classic Pate Tender Beef Feast" -> "Tender Beef Feast"
      "Gravy Lovers Chicken Feast in Grilled Chicken Flavor Gravy" -> "Chicken Feast in Grilled Chicken Flavor Gravy"
    """
    name_lower = product_name.lower()

    # Try to strip known texture prefixes from the beginning
    texture_prefixes = [
        "fancy feast ",
        "classic pate ",
        "gravy lovers ",
        "flaked ",
        "broths ",
        "grilled ",
        "medleys ",
        "creamy ",
        "petites ",
        "gems ",
    ]

    remaining = product_name
    for prefix in texture_prefixes:
        if name_lower.startswith(prefix):
            remaining = product_name[len(prefix):]
            name_lower = remaining.lower()
            # Keep stripping if multiple prefixes apply
            for prefix2 in texture_prefixes:
                if name_lower.startswith(prefix2):
                    remaining = remaining[len(prefix2):]
                    name_lower = remaining.lower()

    return remaining.strip() if remaining.strip() else None


def infer_life_stage(aafco_text: str | None) -> str | None:
    """Infer life stage from the AAFCO statement text."""
    if not aafco_text:
        return None
    text_lower = aafco_text.lower()
    if "kitten" in text_lower and "adult" in text_lower:
        return "all life stages"
    if "all life stages" in text_lower or "all stages" in text_lower:
        return "all life stages"
    if "kitten" in text_lower:
        return "kitten"
    if "adult" in text_lower:
        return "adult"
    if "maintenance" in text_lower:
        return "adult"
    return None


# ---------------------------------------------------------------------------
# Page parsing
# ---------------------------------------------------------------------------


async def extract_json_ld(page) -> dict | None:
    """
    Extract Product structured data from JSON-LD scripts on the page.
    Returns the first Product-type JSON-LD object found, or None.
    """
    try:
        scripts = await page.query_selector_all(SELECTORS["json_ld"])
        for script in scripts:
            text = await script.inner_text()
            try:
                data = json.loads(text)
                # Handle both single objects and arrays
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and item.get("@type") == "Product":
                            return item
                elif isinstance(data, dict):
                    if data.get("@type") == "Product":
                        return data
                    # Some pages nest it under @graph
                    if "@graph" in data:
                        for item in data["@graph"]:
                            if isinstance(item, dict) and item.get("@type") == "Product":
                                return item
            except json.JSONDecodeError:
                continue
    except Exception as e:
        console.print(f"[yellow]  Warning: JSON-LD extraction failed: {e}[/yellow]")
    return None


async def extract_guaranteed_analysis(page) -> dict:
    """
    Parse the guaranteed analysis section for protein, fat, fiber, moisture, ash.
    Returns a dict with keys like crude_protein_pct, crude_fat_pct, etc.
    """
    ga = {
        "crude_protein_pct": None,
        "crude_fat_pct": None,
        "crude_fiber_pct": None,
        "moisture_pct": None,
        "ash_pct": None,
    }

    try:
        # Strategy 1: Look for a dedicated guaranteed analysis section
        ga_section = await page.query_selector(SELECTORS["guaranteed_analysis"])
        if ga_section:
            ga_text = await ga_section.inner_text()
        else:
            # Strategy 2: Search the full page text for GA patterns
            ga_text = await page.inner_text("body")

        if not ga_text:
            return ga

        # Parse each nutrient using regex patterns
        # Handles formats like:
        #   "Crude Protein (Min) 11%"
        #   "Crude Protein  11.0% min"
        #   "Protein (min) ........ 11%"
        patterns = {
            "crude_protein_pct": r"(?:crude\s+)?protein\s*(?:\(?\s*min\.?\s*\)?)?\s*[.:]*\s*(\d+\.?\d*)\s*%",
            "crude_fat_pct": r"(?:crude\s+)?fat\s*(?:\(?\s*min\.?\s*\)?)?\s*[.:]*\s*(\d+\.?\d*)\s*%",
            "crude_fiber_pct": r"(?:crude\s+)?fiber\s*(?:\(?\s*max\.?\s*\)?)?\s*[.:]*\s*(\d+\.?\d*)\s*%",
            "moisture_pct": r"moisture\s*(?:\(?\s*max\.?\s*\)?)?\s*[.:]*\s*(\d+\.?\d*)\s*%",
            "ash_pct": r"ash\s*(?:\(?\s*max\.?\s*\)?)?\s*[.:]*\s*(\d+\.?\d*)\s*%",
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, ga_text, re.IGNORECASE)
            if match:
                ga[key] = float(match.group(1))

    except Exception as e:
        console.print(f"[yellow]  Warning: Guaranteed analysis parsing failed: {e}[/yellow]")

    return ga


async def extract_ingredients(page) -> list[str]:
    """Extract the ingredient list from the product page."""
    try:
        # Strategy 1: Look for a dedicated ingredients section
        ing_section = await page.query_selector(SELECTORS["ingredients"])
        if ing_section:
            ing_text = await ing_section.inner_text()
            return parse_ingredient_list(ing_text)

        # Strategy 2: Find the "Ingredients" heading and grab the next sibling
        heading = await page.query_selector(SELECTORS["ingredients_heading"])
        if heading:
            # Get the next sibling element which should contain the ingredient list
            sibling = await heading.evaluate_handle(
                "el => el.nextElementSibling || el.parentElement.nextElementSibling"
            )
            if sibling:
                ing_text = await sibling.inner_text()
                if ing_text and len(ing_text) > 20:
                    return parse_ingredient_list(ing_text)

        # Strategy 3: Search full page text for a block that looks like an ingredient list
        full_text = await page.inner_text("body")
        # Look for "Ingredients:" followed by a long comma-separated list
        match = re.search(
            r"ingredients?\s*:?\s*\n?\s*(.+?)(?:\n\n|\.\s*\n|$)",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if match:
            candidate = match.group(1).strip()
            # An ingredient list typically has many commas
            if candidate.count(",") >= 3:
                return parse_ingredient_list(candidate)

    except Exception as e:
        console.print(f"[yellow]  Warning: Ingredient extraction failed: {e}[/yellow]")

    return []


async def extract_calorie_content(page) -> dict:
    """Extract calorie content from the page."""
    try:
        # Strategy 1: Look for a dedicated calorie section
        cal_section = await page.query_selector(SELECTORS["calorie_section"])
        if cal_section:
            cal_text = await cal_section.inner_text()
            if "kcal" in cal_text.lower():
                return parse_calories(cal_text)

        # Strategy 2: Search the full page for kcal text
        full_text = await page.inner_text("body")
        # Find all lines containing "kcal"
        for line in full_text.split("\n"):
            if "kcal" in line.lower():
                result = parse_calories(line)
                if any(v is not None for v in result.values()):
                    return result

    except Exception as e:
        console.print(f"[yellow]  Warning: Calorie extraction failed: {e}[/yellow]")

    return parse_calories(None)


async def extract_aafco_statement(page) -> str | None:
    """Extract the AAFCO nutritional adequacy statement."""
    try:
        # Strategy 1: Look for a dedicated AAFCO section
        aafco_section = await page.query_selector(SELECTORS["aafco_section"])
        if aafco_section:
            text = await aafco_section.inner_text()
            if "aafco" in text.lower():
                return clean_text(text)

        # Strategy 2: Search the full page text
        full_text = await page.inner_text("body")
        for line in full_text.split("\n"):
            if "aafco" in line.lower():
                return clean_text(line)

    except Exception as e:
        console.print(f"[yellow]  Warning: AAFCO extraction failed: {e}[/yellow]")

    return None


async def extract_product_name(page, json_ld: dict | None) -> str | None:
    """Extract the product name, preferring JSON-LD, then DOM."""
    # Prefer JSON-LD data
    if json_ld and json_ld.get("name"):
        return clean_text(json_ld["name"])

    try:
        # Try the primary h1 selector
        el = await page.query_selector(SELECTORS["product_name"])
        if el:
            text = await el.inner_text()
            if text and text.strip():
                return clean_text(text)

        # Try alternate selectors
        for selector in SELECTORS["product_name_alt"].split(", "):
            el = await page.query_selector(selector.strip())
            if el:
                text = await el.inner_text()
                if text and text.strip():
                    return clean_text(text)

    except Exception as e:
        console.print(f"[yellow]  Warning: Product name extraction failed: {e}[/yellow]")

    return None


async def extract_product_size(page, product_name: str | None) -> dict:
    """Extract product size from the page title or product name."""
    # Try the product name first (often includes size like "3 oz Can")
    if product_name:
        result = parse_size(product_name)
        if result["size_oz"] or result["size_lbs"]:
            return result

    try:
        # Try looking for size text in common locations
        full_text = await page.inner_text("body")
        # Look for size patterns near common keywords
        size_match = re.search(
            r"(?:size|net\s*wt\.?|weight)\s*:?\s*(\d+\.?\d*\s*(?:oz|lb))",
            full_text,
            re.IGNORECASE,
        )
        if size_match:
            return parse_size(size_match.group(1))
    except Exception:
        pass

    return {"size_oz": None, "size_lbs": None}


# ---------------------------------------------------------------------------
# Catalog / product link discovery
# ---------------------------------------------------------------------------


async def scroll_to_load_all(page, max_scrolls: int = 20):
    """
    Scroll down the page to trigger lazy-loading of product cards.
    Also clicks "Load More" / "Show All" buttons if found.
    """
    for i in range(max_scrolls):
        # Check for a "Load More" or "Show All" button and click it
        try:
            btn = await page.query_selector(SELECTORS["load_more_button"])
            if btn and await btn.is_visible():
                console.print(f"[yellow]  Clicking 'Load More' button (scroll {i + 1})...[/yellow]")
                await btn.click()
                await page.wait_for_timeout(2000)
                continue
        except Exception:
            pass

        # Scroll down to trigger lazy loading
        previous_height = await page.evaluate("document.body.scrollHeight")
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1500)
        new_height = await page.evaluate("document.body.scrollHeight")

        # If the page didn't grow, we've loaded everything
        if new_height == previous_height:
            break

    # Scroll back to top
    await page.evaluate("window.scrollTo(0, 0)")


async def collect_product_urls(page, base_url: str) -> list[str]:
    """
    Collect all unique product page URLs from the current catalog page.
    Filters to only include links that look like individual product pages.
    """
    await scroll_to_load_all(page)

    links = await page.query_selector_all(SELECTORS["product_links"])
    urls = set()

    for link in links:
        href = await link.get_attribute("href")
        if not href:
            continue

        # Build absolute URL
        full_url = urljoin(base_url, href)

        # Filter: only keep links that look like individual product pages
        # Product pages typically have a longer path with a product slug
        # Skip category/filter pages and anchors
        path = full_url.split("?")[0].rstrip("/")
        segments = [s for s in path.split("/") if s]

        # A product page should have at least 4 path segments
        # e.g. /cats/cat-food/fancy-feast/classic-pate-tender-beef-feast
        if len(segments) >= 4 and "fancy-feast" in path.lower():
            # Skip catalog/category pages
            skip_keywords = [
                "wet-cat-food",
                "dry-cat-food",
                "cat-treats",
                "cat-complements",
                "cat-food",
            ]
            last_segment = segments[-1].lower()
            if last_segment not in skip_keywords:
                urls.add(full_url)

    return sorted(urls)


# ---------------------------------------------------------------------------
# Main scraper
# ---------------------------------------------------------------------------


async def scrape():
    """Main scrape function for Fancy Feast products on purina.com."""
    brand_config = BRANDS["fancy_feast"]
    brand_name = brand_config["name"]

    console.print(f"\n[bold green]{'=' * 60}[/bold green]")
    console.print(f"[bold green]  Scraping {brand_name} from purina.com[/bold green]")
    console.print(f"[bold green]{'=' * 60}[/bold green]\n")

    scraped_count = 0
    updated_count = 0
    error_list = []

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

        # Collect product URLs from all catalog pages
        all_product_urls: dict[str, str] = {}  # url -> food_type

        for catalog_entry in brand_config["catalog_urls"]:
            catalog_url = catalog_entry["url"]
            food_type = catalog_entry["food_type"]

            console.print(f"[cyan]Fetching catalog: {catalog_url}[/cyan]")
            try:
                await page.goto(catalog_url, wait_until="networkidle")
                await page.wait_for_timeout(2000)

                urls = await collect_product_urls(page, catalog_url)
                console.print(f"[green]  Found {len(urls)} product links ({food_type})[/green]")

                for url in urls:
                    all_product_urls[url] = food_type

            except PlaywrightTimeout:
                console.print(f"[red]  Timeout loading catalog: {catalog_url}[/red]")
                error_list.append({"url": catalog_url, "error": "Timeout loading catalog page"})
            except Exception as e:
                console.print(f"[red]  Error loading catalog: {e}[/red]")
                error_list.append({"url": catalog_url, "error": str(e)})

            polite_delay(REQUEST_DELAY_SECONDS)

        console.print(f"\n[bold]Total unique product URLs: {len(all_product_urls)}[/bold]\n")

        if not all_product_urls:
            console.print("[red]No product URLs found. Selectors may need updating.[/red]")
            await browser.close()
            return

        # Open a DB connection for the entire scrape run
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                brand_id = upsert_brand(
                    cur,
                    brand_config["name"],
                    brand_config["manufacturer"],
                    brand_config["website"],
                )
                log_id = start_scrape_log(cur, f"fancy_feast_purina")

            # Scrape each product page
            for product_url, food_type in all_product_urls.items():
                console.print(f"[cyan]Scraping: {product_url}[/cyan]")

                try:
                    await page.goto(product_url, wait_until="networkidle")
                    await page.wait_for_timeout(1500)

                    # -- Extract all data fields --

                    # JSON-LD (most reliable source for name, brand, description)
                    json_ld = await extract_json_ld(page)

                    # Product name
                    product_name = await extract_product_name(page, json_ld)
                    if not product_name:
                        console.print("[yellow]  Skipping: could not extract product name[/yellow]")
                        error_list.append({"url": product_url, "error": "No product name found"})
                        polite_delay(REQUEST_DELAY_SECONDS)
                        continue

                    console.print(f"[green]  Name: {product_name}[/green]")

                    # Description from JSON-LD
                    description = None
                    try:
                        if json_ld and json_ld.get("description"):
                            description = clean_text(json_ld["description"])
                    except Exception:
                        pass

                    # Guaranteed analysis
                    ga = await extract_guaranteed_analysis(page)
                    ga_found = any(v is not None for v in ga.values())
                    if ga_found:
                        console.print(f"[green]  GA: protein={ga['crude_protein_pct']}%, fat={ga['crude_fat_pct']}%, fiber={ga['crude_fiber_pct']}%, moisture={ga['moisture_pct']}%[/green]")
                    else:
                        console.print("[yellow]  Warning: No guaranteed analysis data found[/yellow]")

                    # Ingredients
                    ingredients = await extract_ingredients(page)
                    if ingredients:
                        console.print(f"[green]  Ingredients: {len(ingredients)} found[/green]")
                    else:
                        console.print("[yellow]  Warning: No ingredients found[/yellow]")

                    # Calorie content
                    calories = await extract_calorie_content(page)
                    cal_found = any(v is not None for v in calories.values())
                    if cal_found:
                        console.print(f"[green]  Calories: {calories}[/green]")

                    # AAFCO statement
                    aafco_statement = await extract_aafco_statement(page)
                    if aafco_statement:
                        console.print(f"[green]  AAFCO: found[/green]")

                    # Product size
                    size_info = await extract_product_size(page, product_name)

                    # Inferred fields
                    texture = infer_texture(product_name)
                    flavor = infer_flavor(product_name)
                    life_stage = infer_life_stage(aafco_statement)

                    # Calculate dry matter basis values
                    dmb_values = calculate_all_dmb(ga)

                    # -- Build product data dict --
                    product_data = {
                        "brand_id": brand_id,
                        "name": product_name,
                        "food_type": food_type,
                        "manufacturer_url": product_url,
                    }

                    # Optional fields -- only include if not None
                    optional_fields = {
                        "description": description,
                        "texture": texture,
                        "flavor": flavor,
                        "life_stage": life_stage,
                        "size_oz": size_info.get("size_oz"),
                        "size_lbs": size_info.get("size_lbs"),
                        "crude_protein_pct": ga.get("crude_protein_pct"),
                        "crude_fat_pct": ga.get("crude_fat_pct"),
                        "crude_fiber_pct": ga.get("crude_fiber_pct"),
                        "moisture_pct": ga.get("moisture_pct"),
                        "ash_pct": ga.get("ash_pct"),
                        "kcal_per_kg": calories.get("kcal_per_kg"),
                        "kcal_per_can": calories.get("kcal_per_can"),
                        "kcal_per_cup": calories.get("kcal_per_cup"),
                        "kcal_per_oz": calories.get("kcal_per_oz"),
                        "aafco_statement": aafco_statement,
                    }
                    # Merge DMB values
                    optional_fields.update(dmb_values)

                    for key, value in optional_fields.items():
                        if value is not None:
                            product_data[key] = value

                    # -- Save to database --
                    with get_cursor(conn) as cur:
                        product_id = upsert_product(cur, product_data)
                        if ingredients:
                            set_product_ingredients(cur, product_id, ingredients)

                    scraped_count += 1
                    updated_count += 1
                    console.print(f"[green]  Saved (id={product_id})[/green]")

                except PlaywrightTimeout:
                    console.print(f"[red]  Timeout loading product page[/red]")
                    error_list.append({"url": product_url, "error": "Timeout"})
                except Exception as e:
                    console.print(f"[red]  Error scraping product: {e}[/red]")
                    error_list.append({"url": product_url, "error": str(e)})

                polite_delay(REQUEST_DELAY_SECONDS)

            # -- Finish scrape log --
            status = "completed" if not error_list else "completed_with_errors"
            with get_cursor(conn) as cur:
                finish_scrape_log(
                    cur,
                    log_id,
                    status=status,
                    scraped=scraped_count,
                    updated=updated_count,
                    errors=error_list if error_list else None,
                )

        await browser.close()

    # -- Summary --
    console.print(f"\n[bold green]{'=' * 60}[/bold green]")
    console.print(f"[bold green]  Scrape Complete: {brand_name}[/bold green]")
    console.print(f"[bold green]{'=' * 60}[/bold green]")
    console.print(f"  Products scraped : {scraped_count}")
    console.print(f"  Products updated : {updated_count}")
    console.print(f"  Errors           : {len(error_list)}")
    if error_list:
        console.print("[yellow]  Error details:[/yellow]")
        for err in error_list:
            console.print(f"[yellow]    - {err['url']}: {err['error']}[/yellow]")
    console.print()


if __name__ == "__main__":
    asyncio.run(scrape())
