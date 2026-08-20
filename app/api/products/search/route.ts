import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ProductSearchParams, SearchResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ProductSearchParams = await request.json();
    const {
      foodType,
      brandIds: brandId,
      minProteinDmb,
      maxCarbDmb,
      lifeStage,
      texture,
      excludeIngredients,
      includeIngredients,
      maxPrice,
      page = 1,
      pageSize = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = body;

    // Build dynamic where clause
    const where: Record<string, unknown> = {
      isDiscontinued: false,
    };

    if (foodType) {
      where.foodType = foodType;
    }

    if (brandId && brandId.length > 0) {
      where.brandId = { in: brandId };
    }

    if (minProteinDmb !== undefined) {
      where.dmbProteinPct = { gte: minProteinDmb };
    }

    if (maxCarbDmb !== undefined) {
      where.dmbCarbPct = { lte: maxCarbDmb };
    }

    if (lifeStage) {
      where.lifeStage = lifeStage;
    }

    if (texture) {
      where.texture = texture;
    }

    if (excludeIngredients && excludeIngredients.length > 0) {
      where.NOT = {
        productIngredients: {
          some: {
            ingredient: {
              name: { in: excludeIngredients },
            },
          },
        },
      };
    }

    if (includeIngredients && includeIngredients.length > 0) {
      where.AND = includeIngredients.map((ingredientName) => ({
        productIngredients: {
          some: {
            ingredient: {
              name: ingredientName,
            },
          },
        },
      }));
    }

    if (maxPrice !== undefined) {
      where.prices = {
        some: {
          price: { lte: maxPrice },
        },
      };
    }

    // Build orderBy
    let orderBy: Record<string, string> | Record<string, string>[];
    switch (sortBy) {
      case 'dmbProteinPct':
        orderBy = { dmbProteinPct: sortOrder };
        break;
      case 'dmbCarbPct':
        orderBy = { dmbCarbPct: sortOrder };
        break;
      case 'pricePerCalorie':
        // Cannot directly sort by relation field; sort in application after fetch
        // Fall back to name for the DB query, then re-sort below
        orderBy = { name: sortOrder };
        break;
      default:
        orderBy = { name: sortOrder };
    }

    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: {
            include: { recalls: true },
          },
          productIngredients: {
            include: {
              ingredient: {
                include: { category: true },
              },
            },
            orderBy: { position: 'asc' },
          },
          prices: {
            orderBy: { scrapedAt: 'desc' },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    // If sorting by pricePerCalorie, re-sort in memory
    let sortedProducts = products;
    if (sortBy === 'pricePerCalorie') {
      sortedProducts = [...products].sort((a, b) => {
        const aPrice = a.prices[0]?.pricePerCalorie;
        const bPrice = b.prices[0]?.pricePerCalorie;
        if (aPrice == null && bPrice == null) return 0;
        if (aPrice == null) return 1;
        if (bPrice == null) return -1;
        const diff = Number(aPrice) - Number(bPrice);
        return sortOrder === 'desc' ? -diff : diff;
      });
    }

    const result: SearchResult = {
      products: sortedProducts as unknown as SearchResult['products'],
      total,
      page,
      pageSize,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
