"""
openFDA recall fetcher.

Queries the FDA food enforcement API for cat food recalls and matches them
to brands in the database. Uses httpx synchronously (no browser needed).
"""

import httpx

from config import RECALL_SEARCH_TERMS
from db import get_connection, get_cursor, upsert_recall, upsert_brand
from helpers import console

FDA_BASE_URL = "https://api.fda.gov/food/enforcement.json"
REQUEST_TIMEOUT = 30  # seconds


def _build_query(term: str) -> str:
    """Build the FDA API query URL for a search term."""
    search = f'product_description:"{term}"+AND+product_type:"Food For Animals"'
    return f"{FDA_BASE_URL}?search={search}&limit=100"


def _extract_recall_date(result: dict) -> str | None:
    """Extract the best available date from a recall result."""
    # Prefer recall_initiation_date, fall back to report_date
    date = result.get("recall_initiation_date") or result.get("report_date")
    if not date:
        return None
    # FDA dates come as "YYYYMMDD" — convert to "YYYY-MM-DD"
    if len(date) == 8 and date.isdigit():
        return f"{date[:4]}-{date[4:6]}-{date[6:8]}"
    return date


def _map_severity(classification: str | None) -> str | None:
    """Map FDA classification to a severity label."""
    if not classification:
        return None
    # FDA uses "Class I", "Class II", "Class III"
    classification = classification.strip()
    if "I" in classification and "II" not in classification and "III" not in classification:
        return "Class I"
    elif "III" in classification:
        return "Class III"
    elif "II" in classification:
        return "Class II"
    return classification


def _build_fda_link(recall_number: str | None) -> str | None:
    """Construct a link to the FDA recall page."""
    if not recall_number:
        return None
    return f"https://api.fda.gov/food/enforcement.json?search=recall_number:{recall_number}"


def scrape():
    """Fetch cat food recalls from the openFDA API and insert into the database."""
    console.rule("[bold cyan]FDA Recall Fetcher[/bold cyan]")

    total_found = 0
    total_inserted = 0
    errors = []

    # Load existing brands from DB for matching
    with get_connection() as conn, get_cursor(conn) as cur:
        cur.execute("SELECT id, name FROM brands")
        brands = {row["name"].lower(): row["id"] for row in cur.fetchall()}

    console.print(f"Loaded [green]{len(brands)}[/green] brands from DB")

    with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
        for term in RECALL_SEARCH_TERMS:
            console.print(f"\n[bold]Searching FDA for: [cyan]{term}[/cyan][/bold]")
            url = _build_query(term)

            try:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    console.print(f"  [dim]No results for '{term}'[/dim]")
                    continue
                errors.append(f"HTTP error for '{term}': {e}")
                console.print(f"  [red]HTTP error: {e}[/red]")
                continue
            except Exception as e:
                errors.append(f"Error fetching '{term}': {e}")
                console.print(f"  [red]Error: {e}[/red]")
                continue

            results = data.get("results", [])
            total_found += len(results)
            console.print(f"  Found [green]{len(results)}[/green] recall records")

            with get_connection() as conn, get_cursor(conn) as cur:
                for result in results:
                    recall_date = _extract_recall_date(result)
                    reason = result.get("reason_for_recall", "")
                    products_affected = result.get("product_description", "")
                    severity = _map_severity(result.get("classification"))
                    recall_number = result.get("recall_number")
                    fda_link = _build_fda_link(recall_number)

                    # Try to match to a brand
                    matched_brand_id = None
                    product_desc_lower = products_affected.lower()

                    for brand_name, brand_id in brands.items():
                        if brand_name in product_desc_lower:
                            matched_brand_id = brand_id
                            break

                    if matched_brand_id is None:
                        continue

                    try:
                        upsert_recall(cur, matched_brand_id, {
                            "recall_date": recall_date,
                            "reason": reason,
                            "products_affected": products_affected,
                            "severity": severity,
                            "fda_link": fda_link,
                        })
                        total_inserted += 1
                        console.print(
                            f"    [green]Inserted:[/green] {severity or 'Unknown'} — "
                            f"{reason[:80]}{'...' if len(reason) > 80 else ''}"
                        )
                    except Exception as e:
                        errors.append(f"DB error inserting recall: {e}")
                        console.print(f"    [red]DB error: {e}[/red]")

    # Summary
    console.print(f"\n[bold]FDA Recall Results:[/bold]")
    console.print(f"  Total records found: [green]{total_found}[/green]")
    console.print(f"  Inserted/matched: [green]{total_inserted}[/green]")

    if errors:
        console.print(f"  Errors: [red]{len(errors)}[/red]")
        for err in errors:
            console.print(f"    [red]{err}[/red]")

    return {
        "found": total_found,
        "inserted": total_inserted,
        "errors": errors,
    }


if __name__ == "__main__":
    scrape()
