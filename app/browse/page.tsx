'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import FilterSidebar, { type Filters } from '@/components/FilterSidebar';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/components/ProductCard';
import type { ProductWithDetails } from '@/lib/types';

function mapProductToCard(p: ProductWithDetails): Product {
  return {
    id: String(p.id),
    brand: p.brand.name,
    name: p.name,
    flavor: p.flavor ?? undefined,
    texture: p.texture ?? undefined,
    lifeStage: p.lifeStage ?? undefined,
    foodType: p.foodType as 'wet' | 'dry',
    caloriesPerCan: p.caloriesPerCan != null ? Number(p.caloriesPerCan) : undefined,
    caloriesPerCup: p.caloriesPerCup != null ? Number(p.caloriesPerCup) : undefined,
    dmb: {
      protein: Number(p.dmbProteinPct ?? 0),
      fat: Number(p.dmbFatPct ?? 0),
      fiber: Number(p.dmbFiberPct ?? 0),
      carbs: Number(p.dmbCarbPct ?? 0),
      ash: p.dmbAshPct != null ? Number(p.dmbAshPct) : undefined,
    },
    prices: p.prices.map((pr) => ({
      retailer: pr.retailer,
      price: Number(pr.price),
      url: pr.url,
      inStock: pr.inStock,
    })),
    ingredients: p.ingredients.map((i) => i.name),
    hasRecalls: p.brand.recalls.length > 0,
    recallCount: p.brand.recalls.length,
  };
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>({
    foodType: (searchParams.get('foodType') as Filters['foodType']) || 'both',
    minProtein: parseInt(searchParams.get('minProteinDmb') || '0'),
    maxCarbs: parseInt(searchParams.get('maxCarbDmb') || '100'),
    lifeStages: [],
    textures: [],
    minBudget: 0,
    maxBudget: 20,
    brands: [],
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.foodType !== 'both') params.set('foodType', filters.foodType);
      if (filters.minProtein > 0)
        params.set('minProteinDmb', filters.minProtein.toString());
      if (filters.maxCarbs < 100)
        params.set('maxCarbDmb', filters.maxCarbs.toString());
      params.set('page', page.toString());
      params.set('pageSize', '12');

      const res = await fetch(`/api/products/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.products as ProductWithDetails[]).map(
          mapProductToCard,
        );
        setProducts(mapped);
        setTotal(data.total);
      }
    } catch {
      // API might not be available
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.foodType !== 'both') params.set('foodType', filters.foodType);
    if (filters.minProtein > 0)
      params.set('minProteinDmb', filters.minProtein.toString());
    if (filters.maxCarbs < 100)
      params.set('maxCarbDmb', filters.maxCarbs.toString());
    if (page > 1) params.set('page', page.toString());

    const qs = params.toString();
    router.replace(`/browse${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [filters, page, router]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <PageHeader
              title="Browse Cat Foods"
              subtitle={`${total} product${total !== 1 ? 's' : ''} found. Use the filters to narrow down by nutrition, food type, and more.`}
            />

            {/* Mobile filter toggle */}
            <div className="shrink-0 md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Filters</Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 overflow-y-auto px-1">
                    <FilterSidebar
                      onFilterChange={handleFilterChange}
                      initialFilters={filters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 shrink-0 md:block">
              <div className="sticky top-8">
                <FilterSidebar
                  onFilterChange={handleFilterChange}
                  initialFilters={filters}
                />
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <ProductGrid products={products} loading={loading} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
