"""
Database connection and query helpers.

Uses psycopg2 directly (not Prisma) because the scrapers are Python scripts
that run independently from the Next.js app.

Reads DATABASE_URL from the .env file in the project root.
"""

import os
from contextlib import contextmanager
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load .env from the project root (one level up from scrapers/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        f"DATABASE_URL not found. Make sure {_env_path} exists and contains it."
    )


@contextmanager
def get_connection():
    """Yield a psycopg2 connection, auto-closing on exit."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def get_cursor(conn):
    """Yield a dict cursor, auto-committing on clean exit."""
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


# ── Brand helpers ───────────────────────────────────────────────────────────


def upsert_brand(cur, name: str, manufacturer: str | None = None, website_url: str | None = None):
    """Insert or update a brand, returning its id."""
    cur.execute(
        """
        INSERT INTO brands (name, manufacturer, website_url, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (name) DO UPDATE SET
            manufacturer = COALESCE(EXCLUDED.manufacturer, brands.manufacturer),
            website_url  = COALESCE(EXCLUDED.website_url, brands.website_url),
            updated_at   = NOW()
        RETURNING id
        """,
        (name, manufacturer, website_url),
    )
    return cur.fetchone()["id"]


# ── Product helpers ─────────────────────────────────────────────────────────


def upsert_product(cur, data: dict) -> int:
    """
    Insert or update a product. `data` must include:
      brand_id, name, food_type
    and may include any other column from the products table.

    Returns the product id.
    """
    # Build column list dynamically from the data dict
    columns = list(data.keys())
    placeholders = [f"%({c})s" for c in columns]
    updates = [f"{c} = EXCLUDED.{c}" for c in columns if c not in ("brand_id", "name")]
    updates.append("updated_at = NOW()")

    sql = f"""
        INSERT INTO products ({", ".join(columns)}, updated_at)
        VALUES ({", ".join(placeholders)}, NOW())
        ON CONFLICT (brand_id, name) DO UPDATE SET
            {", ".join(updates)}
        RETURNING id
    """

    # We need a unique constraint on (brand_id, name) for this to work.
    # If it doesn't exist yet, fall back to select-then-insert.
    try:
        cur.execute(sql, data)
        return cur.fetchone()["id"]
    except psycopg2.errors.UndefinedTable:
        raise
    except Exception:
        # Fallback: try select then insert/update
        cur.connection.rollback()
        cur.execute(
            "SELECT id FROM products WHERE brand_id = %(brand_id)s AND name = %(name)s",
            data,
        )
        row = cur.fetchone()
        if row:
            product_id = row["id"]
            set_clauses = ", ".join(
                f"{c} = %({c})s" for c in columns if c not in ("brand_id", "name")
            )
            if set_clauses:
                cur.execute(
                    f"UPDATE products SET {set_clauses}, updated_at = NOW() WHERE id = %(id)s",
                    {**data, "id": product_id},
                )
            cur.connection.commit()
            return product_id
        else:
            col_str = ", ".join(columns + ["updated_at"])
            val_str = ", ".join(placeholders + ["NOW()"])
            cur.execute(
                f"INSERT INTO products ({col_str}) VALUES ({val_str}) RETURNING id",
                data,
            )
            product_id = cur.fetchone()["id"]
            cur.connection.commit()
            return product_id


# ── Ingredient helpers ──────────────────────────────────────────────────────


def get_or_create_ingredient(cur, name: str) -> int:
    """Look up an ingredient by name, or create it. Returns ingredient id."""
    cur.execute("SELECT id FROM ingredients WHERE LOWER(name) = LOWER(%s)", (name,))
    row = cur.fetchone()
    if row:
        return row["id"]

    cur.execute(
        "INSERT INTO ingredients (name) VALUES (%s) RETURNING id",
        (name,),
    )
    return cur.fetchone()["id"]


def set_product_ingredients(cur, product_id: int, ingredient_names: list[str]):
    """Replace all ingredients for a product with the given ordered list."""
    # Clear existing
    cur.execute("DELETE FROM product_ingredients WHERE product_id = %s", (product_id,))

    for position, name in enumerate(ingredient_names, start=1):
        ingredient_id = get_or_create_ingredient(cur, name.strip())
        cur.execute(
            """
            INSERT INTO product_ingredients (product_id, ingredient_id, position)
            VALUES (%s, %s, %s)
            ON CONFLICT (product_id, ingredient_id) DO UPDATE SET position = EXCLUDED.position
            """,
            (product_id, ingredient_id, position),
        )


# ── Price helpers ───────────────────────────────────────────────────────────


def insert_price(cur, data: dict):
    """
    Insert a price record. `data` must include:
      product_id, retailer, price, url
    and may include: price_per_oz, price_per_calorie, in_stock,
      autoship_price, subscribe_price
    """
    cur.execute(
        """
        INSERT INTO product_prices
            (product_id, retailer, price, price_per_oz, price_per_calorie,
             url, in_stock, autoship_price, subscribe_price, scraped_at)
        VALUES
            (%(product_id)s, %(retailer)s, %(price)s, %(price_per_oz)s,
             %(price_per_calorie)s, %(url)s, %(in_stock)s,
             %(autoship_price)s, %(subscribe_price)s, NOW())
        """,
        {
            "price_per_oz": None,
            "price_per_calorie": None,
            "in_stock": True,
            "autoship_price": None,
            "subscribe_price": None,
            **data,
        },
    )


# ── Recall helpers ──────────────────────────────────────────────────────────


def upsert_recall(cur, brand_id: int, data: dict):
    """Insert a recall if it doesn't already exist (matched by brand + date + reason)."""
    cur.execute(
        """
        INSERT INTO brand_recalls (brand_id, recall_date, reason, fda_link,
                                   products_affected, severity, source, created_at)
        VALUES (%(brand_id)s, %(recall_date)s, %(reason)s, %(fda_link)s,
                %(products_affected)s, %(severity)s, %(source)s, NOW())
        ON CONFLICT DO NOTHING
        """,
        {"brand_id": brand_id, "source": "FDA", **data},
    )


# ── Scrape log helpers ─────────────────────────────────────────────────────


def start_scrape_log(cur, source: str) -> int:
    """Create a scrape_log entry and return its id."""
    cur.execute(
        "INSERT INTO scrape_log (source, status, started_at) VALUES (%s, 'running', NOW()) RETURNING id",
        (source,),
    )
    return cur.fetchone()["id"]


def finish_scrape_log(cur, log_id: int, status: str, scraped: int, updated: int, errors=None):
    """Update a scrape_log entry with results."""
    cur.execute(
        """
        UPDATE scrape_log SET
            status = %s, products_scraped = %s, products_updated = %s,
            errors = %s, finished_at = NOW()
        WHERE id = %s
        """,
        (status, scraped, updated, psycopg2.extras.Json(errors) if errors else None, log_id),
    )
