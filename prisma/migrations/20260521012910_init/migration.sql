-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "website_url" TEXT,
    "country_of_origin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_recalls" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "recall_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "fda_link" TEXT,
    "products_affected" TEXT,
    "severity" TEXT,
    "source" TEXT NOT NULL DEFAULT 'FDA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_recalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_allergen_zone" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ingredient_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" INTEGER,
    "common_allergen" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "food_type" TEXT NOT NULL,
    "product_line" TEXT,
    "texture" TEXT,
    "flavor" TEXT,
    "life_stage" TEXT,
    "size_oz" DECIMAL(6,2),
    "size_lbs" DECIMAL(6,2),
    "serving_size_oz" DECIMAL(6,2),
    "crude_protein_pct" DECIMAL(5,2),
    "crude_fat_pct" DECIMAL(5,2),
    "crude_fiber_pct" DECIMAL(5,2),
    "moisture_pct" DECIMAL(5,2),
    "ash_pct" DECIMAL(5,2),
    "calories_per_oz" DECIMAL(6,2),
    "calories_per_can" DECIMAL(7,2),
    "calories_per_cup" DECIMAL(7,2),
    "dmb_protein_pct" DECIMAL(5,2),
    "dmb_fat_pct" DECIMAL(5,2),
    "dmb_fiber_pct" DECIMAL(5,2),
    "dmb_carb_pct" DECIMAL(5,2),
    "dmb_ash_pct" DECIMAL(5,2),
    "me_protein_pct" DECIMAL(5,2),
    "me_fat_pct" DECIMAL(5,2),
    "me_carb_pct" DECIMAL(5,2),
    "aafco_statement" TEXT,
    "manufacturer_url" TEXT,
    "chewy_url" TEXT,
    "amazon_url" TEXT,
    "petsmart_url" TEXT,
    "petco_url" TEXT,
    "is_discontinued" BOOLEAN NOT NULL DEFAULT false,
    "last_scraped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "retailer" TEXT NOT NULL,
    "price" DECIMAL(8,2) NOT NULL,
    "price_per_oz" DECIMAL(8,4),
    "price_per_calorie" DECIMAL(10,6),
    "url" TEXT NOT NULL,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "autoship_price" DECIMAL(8,2),
    "subscribe_price" DECIMAL(8,2),
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_nutrients" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "nutrient_name" TEXT NOT NULL,
    "value" DECIMAL(8,4),
    "unit" TEXT NOT NULL DEFAULT '%',

    CONSTRAINT "product_nutrients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_log" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "products_scraped" INTEGER NOT NULL DEFAULT 0,
    "products_updated" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "scrape_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "brand_recalls_brand_id_idx" ON "brand_recalls"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_categories_name_key" ON "ingredient_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "ingredients_name_idx" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_food_type_idx" ON "products"("food_type");

-- CreateIndex
CREATE INDEX "products_dmb_protein_pct_idx" ON "products"("dmb_protein_pct");

-- CreateIndex
CREATE INDEX "products_dmb_carb_pct_idx" ON "products"("dmb_carb_pct");

-- CreateIndex
CREATE INDEX "product_ingredients_product_id_idx" ON "product_ingredients"("product_id");

-- CreateIndex
CREATE INDEX "product_ingredients_ingredient_id_idx" ON "product_ingredients"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_ingredients_product_id_ingredient_id_key" ON "product_ingredients"("product_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "product_prices_product_id_idx" ON "product_prices"("product_id");

-- CreateIndex
CREATE INDEX "product_prices_retailer_idx" ON "product_prices"("retailer");

-- CreateIndex
CREATE INDEX "product_prices_scraped_at_idx" ON "product_prices"("scraped_at" DESC);

-- CreateIndex
CREATE INDEX "product_nutrients_product_id_idx" ON "product_nutrients"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_nutrients_product_id_nutrient_name_key" ON "product_nutrients"("product_id", "nutrient_name");

-- AddForeignKey
ALTER TABLE "brand_recalls" ADD CONSTRAINT "brand_recalls_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ingredient_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_nutrients" ADD CONSTRAINT "product_nutrients_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
