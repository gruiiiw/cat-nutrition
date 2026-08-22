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
                "url": "https://www.purina.com/cats/cat-food/wet?items_per_page=10&sort_by=relevance&f%5B0%5D=brand%3A1285",
                "food_type": "wet",
            },
            {
                "url": "https://www.purina.com/cats/cat-food/dry?items_per_page=10&sort_by=relevance&f%5B0%5D=brand%3A1285",
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

# Chewy search URLs for each brand (used for price-only scraper)
CHEWY_BRAND_SEARCHES = {
    "Fancy Feast": "https://www.chewy.com/brands/fancy-feast-7347",
    "Tiki Cat": "https://www.chewy.com/b/tiki-cat-5480",
}

# Chewy catalog pages for full product scraping (primary data source)
# Each entry: brand key -> list of catalog URLs with food type
CHEWY_BRAND_CATALOGS = {
    "fancy_feast": {
        "name": "Fancy Feast",
        "manufacturer": "Nestlé Purina PetCare",
        "catalog_urls": [
            {
                "url": "https://www.chewy.com/b/wet-food-702?Brand=Fancy%20Feast",
                "food_type": "wet",
            },
            {
                "url": "https://www.chewy.com/b/dry-food-388?Brand=Fancy%20Feast",
                "food_type": "dry",
            },
        ],
    },
    "tiki_cat": {
        "name": "Tiki Cat",
        "manufacturer": "Petropics Inc.",
        "catalog_urls": [
            {
                "url": "https://www.chewy.com/b/wet-food-702?Brand=Tiki%20Cat",
                "food_type": "wet",
            },
            {
                "url": "https://www.chewy.com/b/dry-food-388?Brand=Tiki%20Cat",
                "food_type": "dry",
            },
        ],
    },
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
REQUEST_DELAY_SECONDS = 2.0  # Delay between page loads 
PAGE_LOAD_TIMEOUT_MS = 30_000  # Max time to wait for a page to load
MAX_RETRIES = 3
