import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
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
        nutrients: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Deduplicate prices to keep only the latest per retailer
    const latestPricesByRetailer = new Map<string, typeof product.prices>();
    for (const price of product.prices) {
      const existing = latestPricesByRetailer.get(price.retailer);
      if (!existing || existing.length < 4) {
        const current = latestPricesByRetailer.get(price.retailer) || [];
        current.push(price);
        latestPricesByRetailer.set(price.retailer, current);
      }
    }

    const pricesToReturn = Array.from(latestPricesByRetailer.values()).flat();

    const result = {
      ...product,
      prices: pricesToReturn,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
