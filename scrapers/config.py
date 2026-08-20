"""
Scraper configuration.

Each brand entry defines:
  - name: Display name (must match the `brands.name` column in the DB)
  - manufacturer: Parent company
  - website: Manufacturer website root
  - catalog_urls: Starting pages that list products
  - food_type: "wet" or "dry" (per catalog URL)
"""

BRANDS = {
    "fancy_feast": {
        "name": "Fancy Feast",
        "manufacturer": "Nestlé Purina PetCare",
        "website": "https://www.purina.com",
        "catalog_urls": [
            {
                "url": "https://www.purina.com/cats/cat-food/fancy-feast/wet-cat-food",
                "food_type": "wet",
            },
            {
                "url": "https://www.purina.com/cats/cat-food/fancy-feast/dry-cat-food",
                "food_type": "dry",
            },
        ],
    },
    "tiki_cat": {
        "name": "Tiki Cat",
        "manufacturer": "Petropics Inc.",
        "website": "https://www.tikipets.com",
        "catalog_urls": [
            {
                "url": "https://www.tikipets.com/cat/cat-food/wet-food",
                "food_type": "wet",
            },
            {
                "url": "https://www.tikipets.com/cat/cat-food/dry-food",
                "food_type": "dry",
            },
        ],
    },
}

# Chewy search URLs for each brand
CHEWY_BRAND_SEARCHES = {
    "Fancy Feast": "https://www.chewy.com/brands/fancy-feast-7347",
    "Tiki Cat": "https://www.chewy.com/b/tiki-cat-5480",
}

# openFDA search terms for recall matching
RECALL_SEARCH_TERMS = [
    "fancy feast",
    "purina",
    "tiki cat",
    "tiki pets",
    "petropics",
]

# Scraper behavior
REQUEST_DELAY_SECONDS = 2.0  # Delay between page loads (be polite)
PAGE_LOAD_TIMEOUT_MS = 30_000  # Max time to wait for a page to load
MAX_RETRIES = 3
