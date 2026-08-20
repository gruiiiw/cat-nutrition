import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { matchScore, getNutritionProfile } from '@/lib/nutrition';
import type { CatProfile, ProductWithDetails } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedProfile {
  ageYears?: number;
  weightLbs?: number;
  lifeStage?: 'kitten' | 'adult' | 'senior';
  activityLevel?: 'low' | 'moderate' | 'high';
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
  bodyConditionScore?: number;
  conditions?: string[];
  excludeIngredients?: string[];
  preferredProteins?: string[];
  excludeProducts?: string[];
  maxBudgetPerDay?: number;
  foodType?: 'wet' | 'dry' | 'both';
  texture?: string;
}

interface AIResponse {
  message: string;
  action?: 'search' | 'ask_followup';
  profile?: ParsedProfile;
  readyToSearch?: boolean;
}

// ── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly, knowledgeable cat food advisor for a website called "Let's Feed Your Cat!" You help cat owners find the best food for their cats by understanding their needs through conversation.

Your job:
1. Listen to what the user tells you about their cat
2. Ask smart follow-up questions when important details are missing
3. When you have enough info, output a structured profile so the system can search for matching foods

IMPORTANT RULES:
- Be warm, concise, and helpful. Don't lecture — just ask what you need.
- You are NOT a veterinarian. For medical questions, suggest they consult their vet.
- Never recommend specific products yourself. You build the profile; the database finds the matches.
- When a user mentions a bad reaction to a food (vomiting, diarrhea, refusing to eat), ask a follow-up about timing and other details to determine if you should exclude the specific product, the protein source, or flag a sensitivity.
- Always be empathetic about health issues.

MINIMUM INFO NEEDED before searching:
- Age (approximate is fine)
- Weight (approximate is fine)
- At least one preference or constraint (budget, protein preference, allergy, health condition, etc.)

NICE TO HAVE (ask if it feels natural, but don't interrogate):
- Indoor/outdoor
- Body condition (overweight, lean, ideal)
- Known health conditions
- Food type preference (wet vs dry)
- Budget range

WHEN RESPONDING, always output valid JSON at the very end of your message, wrapped in <json></json> tags. The JSON should have this structure:

{
  "message": "Your conversational response to the user",
  "action": "search" or "ask_followup",
  "readyToSearch": true/false,
  "profile": {
    "ageYears": number or null,
    "weightLbs": number or null,
    "lifeStage": "kitten" | "adult" | "senior" or null,
    "activityLevel": "low" | "moderate" | "high" or null,
    "indoorOutdoor": "indoor" | "outdoor" | "both" or null,
    "bodyConditionScore": number 1-9 or null (5 = ideal, 7+ = overweight, 3- = underweight),
    "conditions": ["sensitive_stomach", "diabetes", "kidney disease", "obesity", "ibd", etc.] or [],
    "excludeIngredients": ["turkey", "grain", etc.] or [],
    "preferredProteins": ["chicken", "fish", etc.] or [],
    "excludeProducts": ["exact product name to exclude"] or [],
    "maxBudgetPerDay": number or null,
    "foodType": "wet" | "dry" | "both" or null,
    "texture": "pate" | "shredded" | "chunks" | "minced" or null
  }
}

The profile should ACCUMULATE across the conversation — include everything the user has told you so far, not just the latest message. Set readyToSearch to true only when you have enough info (age + weight + at least one constraint). Set action to "search" when readyToSearch is true and you want to show results.

Example conversation:
User: "I have a chubby 5 year old cat who throws up from turkey foods"
Your JSON should include: ageYears: 5, bodyConditionScore: 7, conditions: ["obesity"], excludeIngredients: ["turkey"], readyToSearch: false (you should ask about weight and budget)

User: "She's about 14 lbs, indoor only. Trying to keep it under $2 a day"
Now readyToSearch: true, action: "search" with the full accumulated profile.`;

// ── API handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Call Claude API
    const anthropicResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      return Response.json(
        { error: 'Failed to get AI response' },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const rawContent =
      anthropicData.content?.[0]?.text ?? 'Sorry, I had trouble responding.';

    // Parse the JSON from the response
    const parsed = parseAIResponse(rawContent);

    // If ready to search, query the database
    let products: ProductWithDetails[] = [];
    if (parsed.readyToSearch && parsed.action === 'search' && parsed.profile) {
      products = await searchProducts(parsed.profile);
    }

    return Response.json({
      message: parsed.message,
      action: parsed.action ?? 'ask_followup',
      profile: parsed.profile ?? null,
      products: products.map((p) => formatProduct(p)),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── Parse AI response ─────────────────────────────────────────────────────

function parseAIResponse(raw: string): AIResponse {
  // Try to extract JSON from <json> tags
  const jsonMatch = raw.match(/<json>([\s\S]*?)<\/json>/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      return {
        message: data.message ?? raw.replace(/<json>[\s\S]*?<\/json>/, '').trim(),
        action: data.action,
        profile: data.profile,
        readyToSearch: data.readyToSearch,
      };
    } catch {
      // JSON parse failed, fall through
    }
  }

  // Fallback: try to find any JSON block in the response
  const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const data = JSON.parse(jsonBlockMatch[1]);
      return {
        message:
          data.message ?? raw.replace(/```json[\s\S]*?```/, '').trim(),
        action: data.action,
        profile: data.profile,
        readyToSearch: data.readyToSearch,
      };
    } catch {
      // Fall through
    }
  }

  // No JSON found — treat as a plain conversational response
  return {
    message: raw,
    action: 'ask_followup',
    readyToSearch: false,
  };
}

// ── Search products using parsed profile ──────────────────────────────────

async function searchProducts(
  profile: ParsedProfile
): Promise<ProductWithDetails[]> {
  // Build Prisma where clause from the AI-parsed profile
  const where: Record<string, unknown> = {
    isDiscontinued: false,
  };

  if (profile.foodType && profile.foodType !== 'both') {
    where.foodType = profile.foodType;
  }

  if (profile.texture) {
    where.texture = profile.texture;
  }

  // Exclude ingredients
  if (profile.excludeIngredients && profile.excludeIngredients.length > 0) {
    where.NOT = {
      productIngredients: {
        some: {
          ingredient: {
            name: {
              in: profile.excludeIngredients.map(
                (i) => i.charAt(0).toUpperCase() + i.slice(1).toLowerCase()
              ),
            },
          },
        },
      },
    };
  }

  // Life stage filter
  if (profile.lifeStage) {
    where.OR = [
      { lifeStage: profile.lifeStage },
      { lifeStage: 'all stages' },
      { lifeStage: null },
    ];
  }

  // Exclude specific products by name
  if (profile.excludeProducts && profile.excludeProducts.length > 0) {
    where.name = {
      notIn: profile.excludeProducts,
    };
  }

  const products = await prisma.product.findMany({
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
    take: 50, // Get a decent pool to score from
  });

  // Build a CatProfile for the scoring function
  const catProfile: CatProfile = {
    age: profile.ageYears ?? 5,
    weight: profile.weightLbs ?? 10,
    gender: 'unknown',
    isNeutered: true,
    bodyConditionScore: profile.bodyConditionScore ?? 5,
    activityLevel: profile.activityLevel ?? 'moderate',
    indoorOutdoor: profile.indoorOutdoor ?? 'indoor',
    healthConditions: profile.conditions ?? [],
    allergies: profile.excludeIngredients ?? [],
    ingredientPreferences: {
      mustInclude: profile.preferredProteins ?? [],
      mustExclude: profile.excludeIngredients ?? [],
    },
    budgetRange: profile.maxBudgetPerDay
      ? profile.maxBudgetPerDay <= 1.5
        ? 'budget'
        : profile.maxBudgetPerDay <= 3
          ? 'moderate'
          : 'premium'
      : 'any',
    foodTypePreference: profile.foodType ?? 'both',
  };

  const nutritionProfile = getNutritionProfile(catProfile);

  // Map Prisma results to ProductWithDetails shape for the scoring function
  // Prisma returns productIngredients, but matchScore expects ingredients
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = products.map((product: any) => ({
    ...product,
    ingredients: (product.productIngredients ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pi: any) => ({
        name: pi.ingredient?.name ?? '',
        position: pi.position,
        category: pi.ingredient?.category ?? null,
      })
    ),
  }));

  // Score and sort products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scored = mapped.map((product: any) => ({
    ...product,
    _score: matchScore(
      product as unknown as ProductWithDetails,
      catProfile,
      nutritionProfile
    ),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scored.sort((a: any, b: any) => b._score - a._score);

  // Return top results
  return scored.slice(0, 8) as unknown as ProductWithDetails[];
}

// ── Format product for the frontend ───────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatProduct(product: any) {
  const p = product as ProductWithDetails & { _score?: number };
  const prices = (p.prices ?? []).map((price) => ({
    retailer: price.retailer,
    price: Number(price.price),
    pricePerOz: price.pricePerOz ? Number(price.pricePerOz) : null,
    url: price.url,
    inStock: price.inStock,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ingredients = (p.ingredients ?? (p as any).productIngredients ?? []) as Array<{
    name?: string;
    position?: number;
    ingredient?: { name: string; category?: { name: string; isAllergenZone: boolean } | null };
  }>;

  return {
    id: p.id,
    name: p.name,
    brandName: p.brand?.name ?? 'Unknown',
    foodType: p.foodType,
    texture: p.texture,
    flavor: p.flavor,
    lifeStage: p.lifeStage,
    dmbProteinPct: p.dmbProteinPct ? Number(p.dmbProteinPct) : null,
    dmbFatPct: p.dmbFatPct ? Number(p.dmbFatPct) : null,
    dmbCarbPct: p.dmbCarbPct ? Number(p.dmbCarbPct) : null,
    dmbFiberPct: p.dmbFiberPct ? Number(p.dmbFiberPct) : null,
    caloriesPerOz: p.caloriesPerOz ? Number(p.caloriesPerOz) : null,
    score: (p as unknown as { _score: number })._score ?? 0,
    prices,
    topIngredients: ingredients.slice(0, 5).map((i) => {
      if ('ingredient' in i && i.ingredient) {
        return i.ingredient.name;
      }
      return (i as { name: string }).name;
    }),
    recallCount: p.brand?.recalls?.length ?? 0,
  };
}
