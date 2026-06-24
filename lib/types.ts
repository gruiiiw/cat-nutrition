// ─── Cat Profile ───────────────────────────────────────────────────────────

export interface CatProfile {
  name?: string;
  age: number; // years
  weight: number; // lbs
  gender: 'male' | 'female' | 'unknown';
  isNeutered: boolean;
  bodyConditionScore: number; // 1-9
  activityLevel: 'low' | 'moderate' | 'high';
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  healthConditions?: string[];
  allergies?: string[];
  ingredientPreferences?: {
    mustInclude: string[];
    mustExclude: string[];
  };
  budgetRange: 'budget' | 'moderate' | 'premium' | 'any';
  foodTypePreference: 'wet' | 'dry' | 'both';
}

// ─── Nutrition Profile ─────────────────────────────────────────────────────

export interface NutritionProfile {
  dailyCalories: number;
  proteinMinDmb: number;
  fatMinDmb: number;
  fiberMaxDmb: number;
  carbMaxDmb: number;
}

// ─── Product & Related Types ───────────────────────────────────────────────

export interface BrandInfo {
  name: string;
  manufacturer: string | null;
}

export interface BrandRecallInfo {
  id: number;
  recallDate: Date;
  reason: string;
  fdaLink: string | null;
  productsAffected: string | null;
  severity: string | null;
  source: string;
}

export interface ProductPriceInfo {
  retailer: string;
  price: number;
  pricePerOz: number | null;
  pricePerCalorie: number | null;
  url: string;
  inStock: boolean;
  autoshipPrice: number | null;
  subscribePrice: number | null;
}

export interface ProductIngredientInfo {
  name: string;
  position: number;
  category: {
    name: string;
    isAllergenZone: boolean;
  } | null;
}

export interface ProductWithDetails {
  id: number;
  brandId: number;
  name: string;
  foodType: string;
  productLine: string | null;
  texture: string | null;
  flavor: string | null;
  lifeStage: string | null;

  // Size & Serving
  sizeOz: number | null;
  sizeLbs: number | null;
  servingSizeOz: number | null;

  // Guaranteed Analysis (as-fed)
  crudeProteinPct: number | null;
  crudeFatPct: number | null;
  crudeFiberPct: number | null;
  moisturePct: number | null;
  ashPct: number | null;

  // Calories
  caloriesPerOz: number | null;
  caloriesPerCan: number | null;
  caloriesPerCup: number | null;

  // Dry Matter Basis (calculated)
  dmbProteinPct: number | null;
  dmbFatPct: number | null;
  dmbFiberPct: number | null;
  dmbCarbPct: number | null;
  dmbAshPct: number | null;

  // Metabolizable Energy Basis (calculated)
  meProteinPct: number | null;
  meFatPct: number | null;
  meCarbPct: number | null;

  // Sourcing
  aafcoStatement: string | null;
  manufacturerUrl: string | null;
  chewyUrl: string | null;
  amazonUrl: string | null;
  petsmartUrl: string | null;
  petcoUrl: string | null;

  isDiscontinued: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  brand: BrandInfo & { recalls: BrandRecallInfo[] };
  prices: ProductPriceInfo[];
  ingredients: ProductIngredientInfo[];
}

// ─── Search ────────────────────────────────────────────────────────────────

export interface ProductSearchParams {
  foodType?: 'wet' | 'dry';
  brandIds?: number[];
  minProteinDmb?: number;
  maxCarbDmb?: number;
  maxPrice?: number;
  excludeIngredients?: string[];
  includeIngredients?: string[];
  lifeStage?: string;
  texture?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Price ──────────────────────────────────────────────────────────────────

export interface PriceInfo {
  retailer: string;
  price: number;
  pricePerCalorie: number | null;
  url: string;
  inStock: boolean;
  autoshipPrice: number | null;
  subscribePrice: number | null;
  affiliateUrl: string;
}

// ─── Search Result ─────────────────────────────────────────────────────────

export interface SearchResult {
  products: ProductWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}
