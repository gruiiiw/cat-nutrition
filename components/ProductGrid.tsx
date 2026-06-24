'use client';

import { useState, useMemo } from 'react';
import ProductCard, { type Product } from '@/components/ProductCard';

interface ProductGridProps {
  products: Product[];
  showMatchScores?: boolean;
  matchScores?: Map<string, number>;
  loading?: boolean;
}

type SortOption = 'relevance' | 'protein_desc' | 'carbs_asc' | 'price_asc';

function getLowestPrice(product: Product): number {
  const inStock = product.prices.filter((p) => p.inStock).map((p) => p.price);
  if (inStock.length === 0) return Infinity;
  return Math.min(...inStock);
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-3 w-20 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-3 w-14 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  showMatchScores = false,
  matchScores,
  loading = false,
}: ProductGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  const sorted = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'protein_desc':
        list.sort((a, b) => b.dmb.protein - a.dmb.protein);
        break;
      case 'carbs_asc':
        list.sort((a, b) => a.dmb.carbs - b.dmb.carbs);
        break;
      case 'price_asc':
        list.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
        break;
      case 'relevance':
      default:
        if (matchScores) {
          list.sort(
            (a, b) => (matchScores.get(b.id) ?? 0) - (matchScores.get(a.id) ?? 0)
          );
        }
        break;
    }
    return list;
  }, [products, sortBy, matchScores]);

  if (loading) {
    return (
      <div>
        <div className="mb-4 h-9 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No products found</p>
        <p className="mt-1 text-gray-400 text-sm">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort dropdown */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="protein_desc">Protein: High to Low</option>
          <option value="carbs_asc">Carbs: Low to High</option>
          <option value="price_asc">Price: Low to High</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showMatchScore={showMatchScores}
            matchScore={matchScores?.get(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
