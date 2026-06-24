import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Footer from '@/components/Footer';

async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: {
        include: {
          recalls: {
            orderBy: { recallDate: 'desc' },
          },
        },
      },
      productIngredients: {
        orderBy: { position: 'asc' },
        include: {
          ingredient: {
            include: {
              category: true,
            },
          },
        },
      },
      prices: {
        orderBy: { price: 'asc' },
      },
      nutrients: true,
    },
  });

  return product;
}

function NutrientChart({
  protein,
  fat,
  fiber,
  carbs,
  ash,
}: {
  protein: number | null;
  fat: number | null;
  fiber: number | null;
  carbs: number | null;
  ash: number | null;
}) {
  const nutrients = [
    { label: 'Protein', value: protein, color: 'bg-green-500' },
    { label: 'Fat', value: fat, color: 'bg-yellow-500' },
    { label: 'Fiber', value: fiber, color: 'bg-orange-500' },
    { label: 'Carbs', value: carbs, color: 'bg-blue-500' },
    { label: 'Ash', value: ash, color: 'bg-gray-500' },
  ].filter((n) => n.value != null);

  return (
    <div className="space-y-3">
      {nutrients.map((nutrient) => (
        <div key={nutrient.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{nutrient.label}</span>
            <span className="font-medium">{nutrient.value!.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${nutrient.color}`}
              style={{ width: `${Math.min(nutrient.value!, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceComparison({
  prices,
}: {
  prices: Array<{
    retailer: string;
    price: unknown;
    url: string;
    inStock: boolean;
    autoshipPrice: unknown;
    subscribePrice: unknown;
  }>;
}) {
  if (prices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No price data available.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {prices.map((price, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            <p className="font-medium capitalize">{price.retailer}</p>
            {price.autoshipPrice != null && (
              <p className="text-xs text-muted-foreground">
                Autoship: ${Number(price.autoshipPrice).toFixed(2)}
              </p>
            )}
            {price.subscribePrice != null && (
              <p className="text-xs text-muted-foreground">
                Subscribe: ${Number(price.subscribePrice).toFixed(2)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold ${
                price.inStock
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-muted-foreground line-through'
              }`}
            >
              ${Number(price.price).toFixed(2)}
            </span>
            {!price.inStock && (
              <Badge variant="outline" className="text-xs">
                Out of stock
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecallBadge({
  recalls,
}: {
  recalls: Array<{
    id: number;
    recallDate: Date;
    reason: string;
    severity: string | null;
  }>;
}) {
  if (recalls.length === 0) {
    return (
      <Badge variant="outline" className="text-green-700 dark:text-green-400">
        No recalls on record
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      <Badge variant="destructive">
        {recalls.length} recall{recalls.length > 1 ? 's' : ''} on record
      </Badge>
      {recalls.map((recall) => (
        <div key={recall.id} className="rounded-lg border border-destructive/20 p-3">
          <p className="text-sm font-medium">
            {new Date(recall.recallDate).toLocaleDateString()}
            {recall.severity && ` - ${recall.severity}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{recall.reason}</p>
        </div>
      ))}
    </div>
  );
}

// Category color mapping for ingredients
const CATEGORY_COLORS: Record<string, string> = {
  protein: 'text-green-700 dark:text-green-400',
  fat: 'text-yellow-700 dark:text-yellow-400',
  carbohydrate: 'text-blue-700 dark:text-blue-400',
  fiber: 'text-orange-700 dark:text-orange-400',
  vitamin: 'text-purple-700 dark:text-purple-400',
  mineral: 'text-teal-700 dark:text-teal-400',
  supplement: 'text-indigo-700 dark:text-indigo-400',
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to results
          </Link>

          {/* Product Header */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {product.brand.name}
            </p>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{product.foodType}</Badge>
              {product.texture && (
                <Badge variant="secondary">{product.texture}</Badge>
              )}
              {product.lifeStage && (
                <Badge variant="secondary">{product.lifeStage}</Badge>
              )}
              {product.isDiscontinued && (
                <Badge variant="destructive">Discontinued</Badge>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Nutrition - DMB Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Nutrition (Dry Matter Basis)</CardTitle>
              </CardHeader>
              <CardContent>
                <NutrientChart
                  protein={product.dmbProteinPct ? Number(product.dmbProteinPct) : null}
                  fat={product.dmbFatPct ? Number(product.dmbFatPct) : null}
                  fiber={product.dmbFiberPct ? Number(product.dmbFiberPct) : null}
                  carbs={product.dmbCarbPct ? Number(product.dmbCarbPct) : null}
                  ash={product.dmbAshPct ? Number(product.dmbAshPct) : null}
                />

                {/* Guaranteed Analysis */}
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Guaranteed Analysis (as-fed)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {product.crudeProteinPct != null && (
                      <div className="flex justify-between">
                        <span>Crude Protein</span>
                        <span>{Number(product.crudeProteinPct).toFixed(1)}%</span>
                      </div>
                    )}
                    {product.crudeFatPct != null && (
                      <div className="flex justify-between">
                        <span>Crude Fat</span>
                        <span>{Number(product.crudeFatPct).toFixed(1)}%</span>
                      </div>
                    )}
                    {product.crudeFiberPct != null && (
                      <div className="flex justify-between">
                        <span>Crude Fiber</span>
                        <span>{Number(product.crudeFiberPct).toFixed(1)}%</span>
                      </div>
                    )}
                    {product.moisturePct != null && (
                      <div className="flex justify-between">
                        <span>Moisture</span>
                        <span>{Number(product.moisturePct).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Price Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceComparison prices={product.prices} />
              </CardContent>
            </Card>
          </div>

          {/* Recall Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Brand Recall History</CardTitle>
            </CardHeader>
            <CardContent>
              <RecallBadge recalls={product.brand.recalls} />
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {product.productIngredients.map((pi, index) => {
                  const isAllergenZone =
                    pi.ingredient.category?.isAllergenZone ?? false;
                  const categoryName =
                    pi.ingredient.category?.name.toLowerCase() ?? '';
                  const colorClass =
                    CATEGORY_COLORS[categoryName] ?? 'text-foreground';

                  return (
                    <span key={pi.id}>
                      <span
                        className={`text-sm ${colorClass} ${
                          isAllergenZone
                            ? 'rounded bg-red-100 px-1 font-medium dark:bg-red-950'
                            : ''
                        } ${pi.ingredient.commonAllergen ? 'underline decoration-red-400 decoration-wavy' : ''}`}
                      >
                        {pi.ingredient.name}
                      </span>
                      {index < product.productIngredients.length - 1 && (
                        <span className="text-muted-foreground">, </span>
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                  Allergen zone
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded bg-red-100 dark:bg-red-950" />
                  Common allergen
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Calorie Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Calorie Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {product.caloriesPerOz != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {Number(product.caloriesPerOz).toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">kcal / oz</p>
                  </div>
                )}
                {product.caloriesPerCan != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {Number(product.caloriesPerCan).toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">kcal / can</p>
                  </div>
                )}
                {product.caloriesPerCup != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {Number(product.caloriesPerCup).toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">kcal / cup</p>
                  </div>
                )}
              </div>

              {/* ME breakdown */}
              {product.meProteinPct != null && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Metabolizable Energy Distribution
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="font-medium">
                        {Number(product.meProteinPct).toFixed(1)}%
                      </p>
                      <p className="text-muted-foreground">from Protein</p>
                    </div>
                    {product.meFatPct != null && (
                      <div>
                        <p className="font-medium">
                          {Number(product.meFatPct).toFixed(1)}%
                        </p>
                        <p className="text-muted-foreground">from Fat</p>
                      </div>
                    )}
                    {product.meCarbPct != null && (
                      <div>
                        <p className="font-medium">
                          {Number(product.meCarbPct).toFixed(1)}%
                        </p>
                        <p className="text-muted-foreground">from Carbs</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AAFCO Statement */}
          {product.aafcoStatement && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>AAFCO Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {product.aafcoStatement}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
