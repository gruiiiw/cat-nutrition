import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (category) {
      where.category = { name: { contains: category, mode: 'insensitive' } };
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      include: { category: true },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
}
