"""
Shared parsing and nutrition calculation helpers for all scrapers.
"""

import re
import time
from decimal import Decimal, InvalidOperation

from rich.console import Console

console = Console()


# ── Text Parsing ────────────────────────────────────────────────────────────


def clean_text(text: str | None) -> str:
    """Strip whitespace and normalize internal spaces."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip())


def parse_percent(text: str | None) -> float | None:
    """
    Extract a percentage number from text like "12.5% min" or "Crude Protein (min) 12%".
    Returns the float value or None.
    """
    if not text:
        return None
    match = re.search(r"(\d+\.?\d*)\s*%", text)
    if match:
        return float(match.group(1))
    return None


def parse_calories(text: str | None) -> dict:
    """
    Parse calorie text into structured data.
    Handles formats like:
      "1,341 kcal/kg, 187 kcal/can"
      "About 28 kcal per oz"
      "3,890 kcal/kg (calculated), 403 kcal per cup"

    Returns dict with keys: kcal_per_oz, kcal_per_can, kcal_per_cup, kcal_per_kg
    """
    result = {
        "kcal_per_oz": None,
        "kcal_per_can": None,
        "kcal_per_cup": None,
        "kcal_per_kg": None,
    }
    if not text:
        return result

    text = text.replace(",", "").lower()

    # kcal/kg
    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*kg", text)
    if match:
        result["kcal_per_kg"] = float(match.group(1))

    # kcal/can
    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*(?:per\s+)?can", text)
    if match:
        result["kcal_per_can"] = float(match.group(1))

    # kcal/cup
    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*(?:per\s+)?cup", text)
    if match:
        result["kcal_per_cup"] = float(match.group(1))

    # kcal/oz
    match = re.search(r"(\d+\.?\d*)\s*kcal\s*/?\s*(?:per\s+)?oz", text)
    if match:
        result["kcal_per_oz"] = float(match.group(1))

    return result


def parse_size(text: str | None) -> dict:
    """
    Parse product size from text like "3 oz Can", "5.5 oz", "3 lb Bag", "16 lbs".
    Returns dict with size_oz and size_lbs.
    """
    result = {"size_oz": None, "size_lbs": None}
    if not text:
        return result

    text = text.lower().strip()

    oz_match = re.search(r"(\d+\.?\d*)\s*oz", text)
    if oz_match:
        result["size_oz"] = float(oz_match.group(1))

    lb_match = re.search(r"(\d+\.?\d*)\s*lb", text)
    if lb_match:
        result["size_lbs"] = float(lb_match.group(1))

    return result


def parse_ingredient_list(text: str | None) -> list[str]:
    """
    Split a comma-separated ingredient string into a clean list.
    Handles parenthetical sub-ingredients like "Chicken By-Products (Liver, Heart)".
    """
    if not text:
        return []

    # Remove trailing period
    text = text.strip().rstrip(".")

    # Split on commas that are NOT inside parentheses
    ingredients = []
    depth = 0
    current = ""
    for char in text:
        if char == "(":
            depth += 1
            current += char
        elif char == ")":
            depth -= 1
            current += char
        elif char == "," and depth == 0:
            cleaned = clean_text(current)
            if cleaned:
                ingredients.append(cleaned)
            current = ""
        else:
            current += char

    # Don't forget the last ingredient
    cleaned = clean_text(current)
    if cleaned:
        ingredients.append(cleaned)

    return ingredients


# ── Nutrition Calculations ──────────────────────────────────────────────────


def calculate_dmb(as_fed_pct: float, moisture_pct: float) -> float | None:
    """Convert as-fed percentage to dry matter basis."""
    if moisture_pct >= 100:
        return None
    return round((as_fed_pct / (100 - moisture_pct)) * 100, 2)


def calculate_all_dmb(ga: dict) -> dict:
    """
    Given a guaranteed analysis dict with keys:
      crude_protein_pct, crude_fat_pct, crude_fiber_pct, moisture_pct, ash_pct
    Return a dict with all DMB and ME values.
    """
    moisture = ga.get("moisture_pct")
    if moisture is None:
        return {}

    protein = ga.get("crude_protein_pct")
    fat = ga.get("crude_fat_pct")
    fiber = ga.get("crude_fiber_pct")
    ash = ga.get("ash_pct")

    result = {}

    if protein is not None:
        result["dmb_protein_pct"] = calculate_dmb(protein, moisture)
    if fat is not None:
        result["dmb_fat_pct"] = calculate_dmb(fat, moisture)
    if fiber is not None:
        result["dmb_fiber_pct"] = calculate_dmb(fiber, moisture)
    if ash is not None:
        result["dmb_ash_pct"] = calculate_dmb(ash, moisture)

    # Estimate carbs: 100 - protein - fat - fiber - ash (all DMB)
    dmb_vals = [
        result.get("dmb_protein_pct", 0) or 0,
        result.get("dmb_fat_pct", 0) or 0,
        result.get("dmb_fiber_pct", 0) or 0,
        result.get("dmb_ash_pct", 0) or 0,
    ]
    if all(v is not None for v in [protein, fat, fiber]):
        carb_dmb = max(0, 100 - sum(dmb_vals))
        result["dmb_carb_pct"] = round(carb_dmb, 2)

    # Calculate ME percentages
    dmb_p = result.get("dmb_protein_pct", 0) or 0
    dmb_f = result.get("dmb_fat_pct", 0) or 0
    dmb_c = result.get("dmb_carb_pct", 0) or 0

    me_protein = dmb_p * 3.5
    me_fat = dmb_f * 8.5
    me_carb = dmb_c * 3.5
    me_total = me_protein + me_fat + me_carb

    if me_total > 0:
        result["me_protein_pct"] = round((me_protein / me_total) * 100, 2)
        result["me_fat_pct"] = round((me_fat / me_total) * 100, 2)
        result["me_carb_pct"] = round((me_carb / me_total) * 100, 2)

    return result


# ── Delay helper ────────────────────────────────────────────────────────────


def polite_delay(seconds: float = 2.0):
    """Sleep to be respectful to the server."""
    time.sleep(seconds)


def safe_decimal(value) -> Decimal | None:
    """Convert a value to Decimal, returning None on failure."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
