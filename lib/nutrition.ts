import type { CatProfile, NutritionProfile, ProductWithDetails } from './types';

/**
 * Convert an as-fed percentage to dry matter basis.
 * Formula: asFedPct / (100 - moisturePct) * 100
 */
export function calculateDMB(asFedPct: number, moisturePct: number): number {
  if (moisturePct >= 100) return 0;
  return (asFedPct / (100 - moisturePct)) * 100;
}

/**
 * Calculate metabolizable energy distribution.
 * Atwater-like factors: protein 3.5, fat 8.5, carb 3.5 kcal/g.
 * Returns each macronutrient's share of total ME as a percentage.
 */
export function calculateME(
  dmbProtein: number,
  dmbFat: number,
  dmbCarb: number,
): { proteinPct: number; fatPct: number; carbPct: number } {
  const proteinCal = dmbProtein * 3.5;
  const fatCal = dmbFat * 8.5;
  const carbCal = dmbCarb * 3.5;
  const total = proteinCal + fatCal + carbCal;

  if (total === 0) {
    return { proteinPct: 0, fatPct: 0, carbPct: 0 };
  }

  return {
    proteinPct: (proteinCal / total) * 100,
    fatPct: (fatCal / total) * 100,
    carbPct: (carbCal / total) * 100,
  };
}

/**
 * Estimate daily calorie needs based on the cat's profile.
 *
 * Base rates by body condition score:
 *   BCS 7-9 (overweight) -> 20 kcal/lb (weight loss)
 *   BCS 4-6 (ideal)      -> 25 kcal/lb (maintenance)
 *   BCS 1-3 (underweight)-> 30 kcal/lb (weight gain)
 *
 * Multipliers:
 *   Outdoor         -> 1.2x
 *   Low activity    -> 0.9x
 *   High activity   -> 1.1x
 *   Kitten (<1 yr)  -> 1.5x
 *   Senior (>10 yr) -> 0.9x
 */
export function estimateDailyCalories(profile: CatProfile): number {
  const { weight, bodyConditionScore, activityLevel, indoorOutdoor, age } =
    profile;

  // Base kcal/lb by BCS
  let kcalPerLb: number;
  if (bodyConditionScore >= 7) {
    kcalPerLb = 20; // weight loss
  } else if (bodyConditionScore >= 4) {
    kcalPerLb = 25; // maintenance
  } else {
    kcalPerLb = 30; // weight gain
  }

  let calories = weight * kcalPerLb;

  // Indoor/outdoor multiplier
  if (indoorOutdoor === 'outdoor') {
    calories *= 1.2;
  }

  // Activity multiplier
  if (activityLevel === 'low') {
    calories *= 0.9;
  } else if (activityLevel === 'high') {
    calories *= 1.1;
  }

  // Life-stage multiplier
  if (age < 1) {
    calories *= 1.5;
  } else if (age > 10) {
    calories *= 0.9;
  }

  return Math.round(calories);
}

/**
 * How many servings per day the cat needs.
 */
export function calculateDailyServings(
  dailyCals: number,
  calsPerUnit: number,
): number {
  if (calsPerUnit <= 0) return 0;
  return dailyCals / calsPerUnit;
}

/**
 * Cost per day given daily servings and price per serving unit.
 */
export function calculatePricePerDay(
  dailyServings: number,
  pricePerUnit: number,
): number {
  return dailyServings * pricePerUnit;
}

/**
 * Build a recommended nutrition profile for the cat.
 * Values are dry-matter-basis percentages.
 *
 * Protein minimums are based on Laflamme & Hannah (2013) research
 * suggesting adult cats need at least 5.2 g protein/kg body weight
 * (~32% DMB), which is higher than the AAFCO minimum of 26% DMB.
 * We use these updated values as our baseline to favor higher-protein
 * foods that better match a cat's needs as an obligate carnivore.
 */
export function getNutritionProfile(profile: CatProfile): NutritionProfile {
  const dailyCalories = estimateDailyCalories(profile);
  const conditions = profile.healthConditions ?? [];

  // Defaults based on Laflamme 2013 (~32% DMB protein minimum for adults)
  // This is higher than the AAFCO minimum of 26% but aligns with
  // updated research on obligate carnivore protein requirements.
  let proteinMinDmb = 40;
  let fatMinDmb = 9;
  let fiberMaxDmb = 6;
  let carbMaxDmb = 20;

  // Kittens need even more protein and fat for growth
  if (profile.age < 1) {
    proteinMinDmb = 45;
    fatMinDmb = 12;
    carbMaxDmb = 18;
  }

  // Seniors benefit from higher protein to preserve lean muscle mass
  if (profile.age > 10) {
    proteinMinDmb = 45;
  }

  // Diabetic cats: restrict carbs aggressively, high protein
  if (conditions.includes('diabetes')) {
    carbMaxDmb = 10;
    proteinMinDmb = Math.max(proteinMinDmb, 50);
  }

  // Kidney disease: moderate protein (exception to our high-protein bias)
  // Veterinary guidance should override general recommendations here
  if (conditions.includes('kidney disease')) {
    proteinMinDmb = 28;
    carbMaxDmb = 30;
  }

  // Obesity: higher protein, lower fat, lower carbs
  if (conditions.includes('obesity') || profile.bodyConditionScore >= 7) {
    proteinMinDmb = Math.max(proteinMinDmb, 50);
    fatMinDmb = 8;
    carbMaxDmb = Math.min(carbMaxDmb, 15);
  }

  // IBD / GI issues: lower fiber ceiling, moderate fat
  if (conditions.includes('ibd') || conditions.includes('gi issues')) {
    fiberMaxDmb = 3;
  }

  return {
    dailyCalories,
    proteinMinDmb,
    fatMinDmb,
    fiberMaxDmb,
    carbMaxDmb,
  };
}

/**
 * Score a product against a cat's profile (0-100).
 *
 * Protein-forward scoring: protein accounts for 40% of the total score,
 * reflecting updated research (Laflamme & Hannah, 2013) showing cats
 * need more protein than AAFCO minimums. Foods with higher protein
 * content are actively rewarded, not just checked against a floor.
 *
 * Breakdown:
 *   Protein meets minimum     25 pts  (floor)
 *   Protein bonus (above min) 15 pts  (rewards higher protein)
 *   Carbs below maximum       15 pts
 *   No excluded ingredients   15 pts
 *   Has included ingredients   5 pts
 *   Within budget             10 pts
 *   Matching life stage        5 pts
 *   Low carb bonus             5 pts  (rewards very low carb)
 *   No concerning ingredients  5 pts  (rewards clean labels)
 *   Deduction for recalls     -10 per recall
 */
export function matchScore(
  product: ProductWithDetails,
  profile: CatProfile,
  nutritionProfile: NutritionProfile,
): number {
  let score = 0;

  // ── Protein floor (25 pts) ──────────────────────────────────────────
  // Full points if the product meets the protein minimum for this cat.
  // Partial credit scaled proportionally if below.
  if (
    product.dmbProteinPct != null &&
    product.dmbProteinPct >= nutritionProfile.proteinMinDmb
  ) {
    score += 25;
  } else if (product.dmbProteinPct != null) {
    score += Math.max(
      0,
      25 * (product.dmbProteinPct / nutritionProfile.proteinMinDmb),
    );
  }

  // ── Protein bonus (15 pts) ──────────────────────────────────────────
  // Actively reward foods that exceed the minimum. A wild cat diet is
  // ~50% protein DMB, so foods closer to that get more bonus points.
  // Scales linearly from the minimum up to 60% DMB protein (the cap).
  if (product.dmbProteinPct != null) {
    const proteinCeiling = 60; // approximate upper range for high-protein foods
    const excess = Math.max(0, product.dmbProteinPct - nutritionProfile.proteinMinDmb);
    const maxExcess = proteinCeiling - nutritionProfile.proteinMinDmb;
    if (maxExcess > 0) {
      score += Math.min(15, 15 * (excess / maxExcess));
    }
  }

  // ── Carbs (15 pts) ──────────────────────────────────────────────────
  if (
    product.dmbCarbPct != null &&
    product.dmbCarbPct <= nutritionProfile.carbMaxDmb
  ) {
    score += 15;
  } else if (product.dmbCarbPct != null) {
    const overshoot = product.dmbCarbPct - nutritionProfile.carbMaxDmb;
    score += Math.max(0, 15 - overshoot * 2);
  }

  // ── Low carb bonus (5 pts) ──────────────────────────────────────────
  // Cats are obligate carnivores with limited carb metabolism.
  // Reward foods with very low carbs (< 10% DMB).
  if (product.dmbCarbPct != null && product.dmbCarbPct <= 10) {
    score += 5;
  } else if (product.dmbCarbPct != null && product.dmbCarbPct <= 15) {
    score += 3;
  }

  // ── Excluded ingredients (15 pts) ───────────────────────────────────
  const excludeList = [
    ...(profile.ingredientPreferences?.mustExclude ?? []),
    ...(profile.allergies ?? []),
  ].map((i) => i.toLowerCase());

  const ingredientNames = product.ingredients.map((i) =>
    i.name.toLowerCase(),
  );

  if (excludeList.length === 0) {
    score += 15;
  } else {
    const hasExcluded = excludeList.some((ex) =>
      ingredientNames.some((name) => name.includes(ex)),
    );
    if (!hasExcluded) {
      score += 15;
    }
  }

  // ── Concerning ingredients (5 pts) ──────────────────────────────────
  // Deduct if the product contains ingredients flagged in our research:
  // carrageenan, BHA, BHT, ethoxyquin, menadione, artificial colors,
  // or generic "meat by-products" / "animal by-product meal".
  const concerningIngredients = [
    'carrageenan', 'bha', 'bht', 'ethoxyquin', 'menadione',
    'red 40', 'yellow 5', 'yellow 6', 'blue 2',
    'animal by-product', 'meat by-products',
  ];
  const hasConcerning = concerningIngredients.some((ci) =>
    ingredientNames.some((name) => name.includes(ci)),
  );
  if (!hasConcerning) {
    score += 5;
  }

  // ── Included ingredients (5 pts) ────────────────────────────────────
  const includeList = (profile.ingredientPreferences?.mustInclude ?? []).map(
    (i) => i.toLowerCase(),
  );

  if (includeList.length === 0) {
    score += 5;
  } else {
    const matchedCount = includeList.filter((inc) =>
      ingredientNames.some((name) => name.includes(inc)),
    ).length;
    score += Math.round((matchedCount / includeList.length) * 5);
  }

  // ── Budget (10 pts) ─────────────────────────────────────────────────
  if (profile.budgetRange === 'any') {
    score += 10;
  } else if (product.prices.length > 0) {
    const lowestPrice = Math.min(...product.prices.map((p) => p.price));
    const budgetThresholds: Record<string, number> = {
      budget: 1.5,
      moderate: 3.0,
      premium: Infinity,
    };
    const threshold = budgetThresholds[profile.budgetRange] ?? Infinity;
    if (lowestPrice <= threshold) {
      score += 10;
    } else {
      score += Math.max(0, 10 - (lowestPrice - threshold) * 2);
    }
  }

  // ── Life stage (5 pts) ──────────────────────────────────────────────
  if (product.lifeStage) {
    const stage = product.lifeStage.toLowerCase();
    if (stage === 'all stages') {
      score += 5;
    } else if (profile.age < 1 && stage === 'kitten') {
      score += 5;
    } else if (profile.age > 10 && stage === 'senior') {
      score += 5;
    } else if (
      profile.age >= 1 &&
      profile.age <= 10 &&
      stage === 'adult'
    ) {
      score += 5;
    }
  }

  // ── Recall deduction ────────────────────────────────────────────────
  const recallCount = product.brand.recalls?.length ?? 0;
  score -= recallCount * 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}
