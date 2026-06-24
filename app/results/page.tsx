'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/components/ProductCard';
import { estimateDailyCalories, getNutritionProfile, matchScore } from '@/lib/nutrition';
import type {
  CatProfile,
  NutritionProfile,
  ProductWithDetails,
  SearchResult,
} from '@/lib/types';

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

function ResultsContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<CatProfile | null>(null);
  const [nutritionProfile, setNutritionProfile] =
    useState<NutritionProfile | null>(null);
  const [dailyCalories, setDailyCalories] = useState<number>(0);
  const [rawProducts, setRawProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Decode profile from URL
  useEffect(() => {
    const encoded = searchParams.get('profile');
    if (!encoded) return;

    try {
      const decoded = JSON.parse(atob(encoded)) as CatProfile;
      setProfile(decoded);

      const cals = estimateDailyCalories(decoded);
      setDailyCalories(cals);

      const nutProfile = getNutritionProfile(decoded);
      setNutritionProfile(nutProfile);
    } catch {
      // Invalid profile data
    }
  }, [searchParams]);

  // Fetch matching products
  useEffect(() => {
    if (!profile || !nutritionProfile) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (profile.foodTypePreference !== 'both') {
          params.set('foodType', profile.foodTypePreference);
        }
        params.set('minProteinDmb', nutritionProfile.proteinMinDmb.toString());
        params.set('maxCarbDmb', nutritionProfile.carbMaxDmb.toString());
        if (profile.ingredientPreferences?.mustExclude?.length) {
          params.set(
            'excludeIngredients',
            profile.ingredientPreferences.mustExclude.join(','),
          );
        }
        params.set('pageSize', '20');

        const res = await fetch(`/api/products/search?${params.toString()}`);
        if (res.ok) {
          const data: SearchResult = await res.json();
          setRawProducts(data.products);
        }
      } catch {
        // API may not be available
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [profile, nutritionProfile]);

  // Score and map products
  const { products, matchScores } = useMemo(() => {
    if (!profile || !nutritionProfile || rawProducts.length === 0) {
      return { products: [] as Product[], matchScores: new Map<string, number>() };
    }

    const scores = new Map<string, number>();
    const mapped = rawProducts
      .map((p) => {
        const score = matchScore(p, profile, nutritionProfile);
        const card = mapProductToCard(p);
        scores.set(card.id, score);
        return card;
      })
      .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));

    return { products: mapped, matchScores: scores };
  }, [rawProducts, profile, nutritionProfile]);

  if (!profile) {
    return (
      <div className="flex min-h-full flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">No Profile Found</h1>
            <p className="mt-2 text-muted-foreground">
              Please take the quiz first to get personalized recommendations.
            </p>
            <Link href="/quiz">
              <Button className="mt-4">Take the Quiz</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to home
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Results{profile.name ? ` for ${profile.name}` : ''}
          </h1>

          {/* Summary Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {profile.name
                  ? `For ${profile.name}, we recommend`
                  : 'We recommend'}
              </CardTitle>
              <CardDescription>
                Based on your cat&apos;s profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-950">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {dailyCalories}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    calories / day
                  </p>
                </div>
                {nutritionProfile && (
                  <>
                    <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {nutritionProfile.proteinMinDmb}%+
                      </p>
                      <p className="text-sm text-muted-foreground">
                        min protein (DMB)
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {nutritionProfile.carbMaxDmb}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        max carbs (DMB)
                      </p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-950">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {nutritionProfile.fatMinDmb}%+
                      </p>
                      <p className="text-sm text-muted-foreground">
                        min fat (DMB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adjust button */}
          <div className="mt-4 flex justify-end">
            <Link href="/quiz">
              <Button variant="outline">Adjust Preferences</Button>
            </Link>
          </div>

          {/* Diet variety disclaimer */}
          <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">A note on variety:</strong>{' '}
            We recommend feeding your cat a rotation of different brands,
            flavors, proteins, and textures. This helps prevent diet
            fixation, ensures more complete nutrition, and makes transitions
            easier if a food is ever recalled or discontinued.{' '}
            <Link href="/references" className="text-primary underline">
              Learn more
            </Link>
          </div>

          {/* Product Results */}
          <h2 className="mt-6 text-xl font-semibold">Matching Foods</h2>
          <div className="mt-4">
            <ProductGrid
              products={products}
              loading={loading}
              showMatchScores
              matchScores={matchScores}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
