import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed ingredient categories
  const categories = [
    { name: 'Poultry / Fowl', displayOrder: 1, isAllergenZone: true },
    { name: 'Meat', displayOrder: 2, isAllergenZone: true },
    { name: 'Seafood', displayOrder: 3, isAllergenZone: true },
    { name: 'Eggs / Dairy', displayOrder: 4, isAllergenZone: true },
    { name: 'Grains & Seeds', displayOrder: 5, isAllergenZone: true },
    { name: 'Gums / Thickeners', displayOrder: 6, isAllergenZone: true },
    { name: 'Vegetables', displayOrder: 7, isAllergenZone: false },
    { name: 'Fruits', displayOrder: 8, isAllergenZone: false },
    { name: 'Plant-Based Oils', displayOrder: 9, isAllergenZone: false },
    { name: 'Herbs / Spices / Roots', displayOrder: 10, isAllergenZone: false },
    { name: 'Flavor Enhancers', displayOrder: 11, isAllergenZone: false },
    { name: 'Other Additives', displayOrder: 12, isAllergenZone: false },
  ];

  for (const cat of categories) {
    await prisma.ingredientCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
  }

  console.log('Seeded ingredient categories');

  // Seed some common ingredients (expand this list over time)
  const ingredientsByCategory: Record<string, string[]> = {
    'Poultry / Fowl': ['chicken', 'chicken meal', 'chicken liver', 'chicken by-product meal', 'chicken broth', 'duck', 'duck meal', 'duck liver', 'turkey', 'turkey meal', 'turkey liver', 'quail', 'poultry'],
    'Meat': ['beef', 'beef liver', 'beef meal', 'lamb', 'lamb meal', 'lamb liver', 'pork', 'pork liver', 'pork meal', 'rabbit', 'venison', 'meat by-products'],
    'Seafood': ['salmon', 'salmon meal', 'salmon oil', 'tuna', 'whitefish', 'whitefish meal', 'shrimp', 'crab', 'fish meal', 'fish broth', 'ocean fish', 'mackerel', 'sardines', 'cod', 'trout', 'herring', 'anchovy', 'pollock', 'menhaden fish meal'],
    'Eggs / Dairy': ['egg', 'dried egg', 'egg product', 'milk', 'cheese', 'whey', 'casein', 'dried whey'],
    'Grains & Seeds': ['barley', 'corn', 'corn gluten meal', 'corn starch', 'ground corn', 'flaxseed', 'ground flaxseed', 'oats', 'oat fiber', 'quinoa', 'rice', 'brown rice', 'white rice', 'brewers rice', 'rice flour', 'wheat', 'wheat gluten', 'wheat flour', 'ground wheat'],
    'Gums / Thickeners': ['agar-agar', 'carrageenan', 'cassia gum', 'guar gum', 'locust bean gum', 'xanthan gum', 'tapioca', 'tapioca starch', 'modified food starch', 'potato starch'],
    'Vegetables': ['peas', 'pea protein', 'pea fiber', 'green peas', 'chickpeas', 'lentils', 'potatoes', 'sweet potatoes', 'carrots', 'spinach', 'kale', 'broccoli', 'pumpkin', 'squash', 'zucchini', 'tomatoes', 'beets', 'kelp', 'soy', 'soybean meal', 'soy protein'],
    'Fruits': ['apples', 'blueberries', 'cranberries', 'coconut', 'bananas', 'papayas', 'pineapples', 'pomegranates', 'raspberries'],
    'Plant-Based Oils': ['canola oil', 'coconut oil', 'corn oil', 'flaxseed oil', 'olive oil', 'safflower oil', 'soybean oil', 'sunflower oil', 'vegetable oil', 'palm oil'],
    'Herbs / Spices / Roots': ['alfalfa', 'chamomile', 'chicory root', 'cinnamon', 'dandelion', 'fennel', 'fenugreek', 'ginger', 'marigold', 'oregano', 'parsley', 'peppermint', 'rosemary', 'rosemary extract', 'sage', 'turmeric'],
    'Flavor Enhancers': ['natural flavor', 'natural flavors', 'chicken broth', 'beef broth', 'fish broth', 'animal digest', 'liver flavor'],
    'Other Additives': ['taurine', 'choline chloride', 'zinc sulfate', 'iron sulfate', 'vitamin e supplement', 'vitamin a supplement', 'vitamin d3 supplement', 'vitamin b12 supplement', 'thiamine mononitrate', 'riboflavin', 'niacin', 'folic acid', 'biotin', 'calcium carbonate', 'dicalcium phosphate', 'potassium chloride', 'salt', 'mixed tocopherols'],
  };

  for (const [categoryName, ingredients] of Object.entries(ingredientsByCategory)) {
    const category = await prisma.ingredientCategory.findUnique({
      where: { name: categoryName },
    });

    if (!category) continue;

    for (const ingredientName of ingredients) {
      await prisma.ingredient.upsert({
        where: { name: ingredientName },
        update: { categoryId: category.id, commonAllergen: category.isAllergenZone },
        create: {
          name: ingredientName,
          categoryId: category.id,
          commonAllergen: category.isAllergenZone,
        },
      });
    }
  }

  console.log('Seeded ingredients');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());