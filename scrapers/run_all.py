"""
Run all scrapers in sequence.

Usage:
    python run_all.py                          # Run all (Chewy products + recalls)
    python run_all.py --only chewy_products    # Scrape all brands from Chewy
    python run_all.py --only recalls           # Run recall fetcher only
    python run_all.py --brand fancy_feast      # Scrape one brand from Chewy
    python run_all.py --brand tiki_cat         # Scrape one brand from Chewy

Legacy (manufacturer-site scrapers, may not work if sites have changed):
    python run_all.py --only fancy_feast_legacy
    python run_all.py --only tiki_cat_legacy
    python run_all.py --only chewy_prices
"""

import argparse
import asyncio
import time

from rich.console import Console
from rich.table import Table

import scrape_chewy_products
import scrape_recalls

# Legacy scrapers (kept for fallback)
try:
    import scrape_fancy_feast
    import scrape_tiki_cat
    import scrape_chewy
    _legacy_available = True
except ImportError:
    _legacy_available = False

console = Console()

# Primary scrapers
PRIMARY_SCRAPERS = {
    "chewy_products": {
        "module": scrape_chewy_products,
        "is_async": True,
        "description": "All brands (Chewy)",
    },
    "recalls": {
        "module": scrape_recalls,
        "is_async": False,
        "description": "FDA recalls",
    },
}

# Legacy scrapers (manufacturer sites)
LEGACY_SCRAPERS = {}
if _legacy_available:
    LEGACY_SCRAPERS = {
        "fancy_feast_legacy": {
            "module": scrape_fancy_feast,
            "is_async": True,
            "description": "Fancy Feast (purina.com) [legacy]",
        },
        "tiki_cat_legacy": {
            "module": scrape_tiki_cat,
            "is_async": True,
            "description": "Tiki Cat (tikipets.com) [legacy]",
        },
        "chewy_prices": {
            "module": scrape_chewy,
            "is_async": True,
            "description": "Chewy prices only [legacy]",
        },
    }

ALL_SCRAPERS = {**PRIMARY_SCRAPERS, **LEGACY_SCRAPERS}


def _run_scraper(key: str, info: dict, **kwargs) -> dict:
    """
    Run a single scraper and return a result dict with:
      status, duration, result (scraper return value), error
    """
    console.print()
    console.rule(f"[bold]{info['description']}[/bold]")
    start = time.time()

    try:
        if info["is_async"]:
            result = asyncio.run(info["module"].scrape(**kwargs))
        else:
            result = info["module"].scrape(**kwargs)

        duration = time.time() - start
        return {
            "key": key,
            "description": info["description"],
            "status": "success",
            "duration": duration,
            "result": result,
            "error": None,
        }
    except Exception as e:
        duration = time.time() - start
        console.print(f"[red bold]FAILED: {info['description']}[/red bold]")
        console.print(f"[red]  {type(e).__name__}: {e}[/red]")
        return {
            "key": key,
            "description": info["description"],
            "status": "failed",
            "duration": duration,
            "result": None,
            "error": str(e),
        }


def _print_summary(results: list[dict]):
    """Print a summary table of all scraper results."""
    console.print()
    console.rule("[bold green]Summary[/bold green]")

    table = Table(title="Scraper Results", show_lines=True)
    table.add_column("Scraper", style="bold")
    table.add_column("Status", justify="center")
    table.add_column("Duration", justify="right")
    table.add_column("Details")

    for r in results:
        if r["status"] == "success":
            status = "[green]OK[/green]"
        else:
            status = "[red]FAIL[/red]"

        duration = f"{r['duration']:.1f}s"

        if r["error"]:
            details = f"[red]{r['error'][:60]}[/red]"
        elif r["result"]:
            parts = []
            for k, v in r["result"].items():
                if k != "errors":
                    parts.append(f"{k}={v}")
            details = ", ".join(parts)
        else:
            details = ""

        table.add_row(r["description"], status, duration, details)

    console.print(table)

    total_time = sum(r["duration"] for r in results)
    successes = sum(1 for r in results if r["status"] == "success")
    failures = sum(1 for r in results if r["status"] == "failed")

    console.print(f"\nTotal time: [bold]{total_time:.1f}s[/bold]")
    console.print(f"Succeeded: [green]{successes}[/green]  Failed: [red]{failures}[/red]")


def main():
    parser = argparse.ArgumentParser(description="Run cat nutrition scrapers.")
    parser.add_argument(
        "--only",
        type=str,
        help="Run only a specific scraper (e.g., chewy_products, recalls)",
    )
    parser.add_argument(
        "--brand",
        type=str,
        help="Scrape a specific brand from Chewy (e.g., fancy_feast, tiki_cat)",
    )
    args = parser.parse_args()

    console.rule("[bold magenta]Cat Nutrition Scraper Suite[/bold magenta]")

    results = []

    if args.brand:
        # Scrape a single brand from Chewy
        console.print(f"[dim]Scraping brand '{args.brand}' from Chewy[/dim]")
        results.append(_run_scraper(
            "chewy_products",
            PRIMARY_SCRAPERS["chewy_products"],
            brand_key=args.brand,
        ))

    elif args.only:
        key = args.only.lower().strip()
        if key not in ALL_SCRAPERS:
            console.print(f"[red]Unknown scraper: '{key}'[/red]")
            console.print(f"Available: {', '.join(ALL_SCRAPERS.keys())}")
            return
        results.append(_run_scraper(key, ALL_SCRAPERS[key]))

    else:
        # Run all: Chewy products -> FDA recalls
        console.print("[dim]Running all scrapers: Chewy products -> FDA recalls[/dim]")

        # 1. Chewy product scraper (primary data source)
        results.append(_run_scraper("chewy_products", PRIMARY_SCRAPERS["chewy_products"]))

        # 2. Recall fetcher
        results.append(_run_scraper("recalls", PRIMARY_SCRAPERS["recalls"]))

    _print_summary(results)


if __name__ == "__main__":
    main()
