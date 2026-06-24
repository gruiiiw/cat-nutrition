import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ProductPrice {
  retailer: string;
  price: number;
  url: string;
  inStock: boolean;
}

export interface ProductDMB {
  protein: number;
  fat: number;
  fiber: number;
  carbs: number;
  ash?: number;
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  flavor?: string;
  texture?: string;
  lifeStage?: string;
  foodType: 'wet' | 'dry';
  caloriesPerCan?: number;
  caloriesPerCup?: number;
  dmb: ProductDMB;
  prices: ProductPrice[];
  ingredients?: string[];
  hasRecalls?: boolean;
  recallCount?: number;
}

interface ProductCardProps {
  product: Product;
  showMatchScore?: boolean;
  matchScore?: number;
}

function getLowestPrice(prices: ProductPrice[]): number | null {
  const inStockPrices = prices.filter((p) => p.inStock).map((p) => p.price);
  if (inStockPrices.length === 0) return null;
  return Math.min(...inStockPrices);
}

function NutrientBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="w-10 text-right font-semibold tabular-nums">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

export default function ProductCard({
  product,
  showMatchScore,
  matchScore,
}: ProductCardProps) {
  const lowestPrice = getLowestPrice(product.prices);
  const calories =
    product.foodType === 'wet'
      ? product.caloriesPerCan
      : product.caloriesPerCup;
  const calorieUnit = product.foodType === 'wet' ? 'can' : 'cup';

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="card-hover relative rounded-2xl border bg-card p-5 shadow-sm">
        {/* Match score badge */}
        {showMatchScore && matchScore !== undefined && (
          <span
            className={cn(
              'absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm',
              matchScore > 80
                ? 'bg-emerald-500'
                : matchScore > 60
                  ? 'bg-amber-500'
                  : 'bg-red-500',
            )}
          >
            {matchScore}%
          </span>
        )}

        {/* Recall warning */}
        {product.hasRecalls && (
          <span
            className="absolute left-4 top-4 text-amber-500"
            title="This brand has recalls"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}

        {/* Brand & Name */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-primary">
          {product.name}
        </h3>

        {/* Flavor */}
        {product.flavor && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {product.flavor}
          </p>
        )}

        {/* Badges */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {product.texture && (
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {product.texture}
            </span>
          )}
          {product.lifeStage && (
            <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
              {product.lifeStage}
            </span>
          )}
        </div>

        {/* DMB Nutrients */}
        <div className="mt-4 space-y-1.5">
          <NutrientBar
            label="Protein"
            value={product.dmb.protein}
            color="bg-emerald-500"
          />
          <NutrientBar
            label="Fat"
            value={product.dmb.fat}
            color="bg-amber-400"
          />
          <NutrientBar
            label="Carbs"
            value={product.dmb.carbs}
            color="bg-rose-400"
          />
        </div>

        {/* Calories & Price */}
        <div className="mt-4 flex items-end justify-between border-t pt-3">
          {calories !== undefined ? (
            <span className="text-xs text-muted-foreground">
              {calories} kcal/{calorieUnit}
            </span>
          ) : (
            <span />
          )}
          {lowestPrice !== null ? (
            <span className="text-base font-bold tabular-nums">
              <span className="text-xs font-normal text-muted-foreground">
                from{' '}
              </span>
              ${lowestPrice.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Unavailable</span>
          )}
        </div>
      </div>
    </Link>
  );
}
