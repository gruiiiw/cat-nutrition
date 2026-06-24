"""
Run all scrapers in sequence.

Usage:
    python run_all.py              # Run all scrapers
    python run_all.py --only fancy_feast   # Run one brand scraper only
    python run_all.py --only chewy         # Run Chewy price scraper only
    python run_all.py --only recalls       # Run recall fetcher only
    python run_all.py --brands fancy_feast,tiki_cat  # Run specific brand scrapers only
"""

import argparse
import asyncio
import time

from rich.console import Console
from rich.table import Table

import scrape_fancy_feast
import scrape_tiki_cat
import scrape_chewy
import scrape_recalls

console = Console()

# Registry of all available scrapers
# Each entry: (key, module, is_async, description)
BRAND_SCRAPERS = {
    "fancy_feast": {
        "module": scrape_fancy_feast,
        "is_async": True,
        "description": "Fancy Feast (purina.com)",
    },
    "tiki_cat": {
        "module": scrape_tiki_cat,
        "is_async": True,
        "description": "Tiki Cat (tikipets.com)",
    },
}

OTHER_SCRAPERS = {
    "chewy": {
        "module": scrape_chewy,
        "is_async": True,
        "description": "Chewy prices",
    },
    "recalls": {
        "module": scrape_recalls,
        "is_async": False,
        "description": "FDA recalls",
    },
}

ALL_SCRAPERS = {**BRAND_SCRAPERS, **OTHER_SCRAPERS}


def _run_scraper(key: str, info: dict) -> dict:
    """
    Run a single scraper and return a result dict with:
      status, duration, result (scraper return value), error
    """
    console.print()
    console.rule(f"[bold]{info['description']}[/bold]")
    start = time.time()

    try:
        if info["is_async"]:
            result = asyncio.run(info["module"].scrape())
        else:
            result = info["module"].scrape()

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
        # Format status with color
        if r["status"] == "success":
            status = "[green]OK[/green]"
        else:
            status = "[red]FAIL[/red]"

        # Format duration
        duration = f"{r['duration']:.1f}s"

        # Format details
        if r["error"]:
            details = f"[red]{r['error'][:60]}[/red]"
        elif r["result"]:
            # Summarize the result dict
            parts = []
            for k, v in r["result"].items():
                if k != "errors":
                    parts.append(f"{k}={v}")
            details = ", ".join(parts)
        else:
            details = ""

        table.add_row(r["description"], status, duration, details)

    console.print(table)

    # Overall timing
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
        help="Run only a specific scraper (e.g., fancy_feast, chewy, recalls)",
    )
    parser.add_argument(
        "--brands",
        type=str,
        help="Comma-separated list of brand scrapers to run (e.g., fancy_feast,tiki_cat)",
    )
    args = parser.parse_args()

    console.rule("[bold magenta]Cat Nutrition Scraper Suite[/bold magenta]")
    start_time = time.time()

    results = []

    if args.only:
        # Run a single scraper
        key = args.only.lower().strip()
        if key not in ALL_SCRAPERS:
            console.print(f"[red]Unknown scraper: '{key}'[/red]")
            console.print(f"Available: {', '.join(ALL_SCRAPERS.keys())}")
            return
        results.append(_run_scraper(key, ALL_SCRAPERS[key]))

    elif args.brands:
        # Run only specified brand scrapers
        brand_keys = [b.strip().lower() for b in args.brands.split(",")]
        for key in brand_keys:
            if key not in BRAND_SCRAPERS:
                console.print(f"[red]Unknown brand scraper: '{key}'[/red]")
                console.print(f"Available brands: {', '.join(BRAND_SCRAPERS.keys())}")
                continue
            results.append(_run_scraper(key, BRAND_SCRAPERS[key]))

    else:
        # Run all scrapers in order: brands -> chewy -> recalls
        console.print("[dim]Running all scrapers in order: brands -> chewy -> recalls[/dim]")

        # 1. Brand / manufacturer scrapers
        for key, info in BRAND_SCRAPERS.items():
            results.append(_run_scraper(key, info))

        # 2. Chewy price scraper (runs after brands so products are up-to-date)
        results.append(_run_scraper("chewy", OTHER_SCRAPERS["chewy"]))

        # 3. Recall fetcher
        results.append(_run_scraper("recalls", OTHER_SCRAPERS["recalls"]))

    _print_summary(results)


if __name__ == "__main__":
    main()
