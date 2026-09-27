import { z } from 'zod';

export const CATEGORIES = ['Black Coffee', 'Milk Based', 'Matcha Series', 'Cei-gnature', 'Non Coffee', 'Mocktail', 'Tea', 'Instan', 'Additional'];
export const UNITS = ['g', 'ml', 'shot', 'pump', 'pcs', 'sdt', 'sdm'] as const;
const ingredientSchema = z.object({
  name: z.string().trim().min(1, 'Nama bahan harus diisi').max(100),
  amount: z.number().positive('Takaran harus lebih dari 0').max(100000),
  unit: z.enum(UNITS),
});
export const recipeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Nama menu harus diisi').max(100),
  category: z.string().trim().min(1).max(50),
  variants: z.array(z.object({
    name: z.string().trim().min(1).max(30),
    ingredients: z.array(ingredientSchema).max(50),
  })).min(1).max(10),
  foam: z.object({
    enabled: z.boolean(),
    additionalId: z.string().uuid().nullable(),
    ingredients: z.array(ingredientSchema).max(50),
    steps: z.string().max(5000),
  }),
  steps: z.string().max(5000),
  notes: z.string().max(3000),
  photo: z.string().max(700000).refine(value => !value || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value), 'Format foto tidak valid'),
  favorite: z.boolean(),
});
export type Recipe = z.infer<typeof recipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export function newRecipeId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // getRandomValues juga tersedia saat preview HP lewat IP lokal (HTTP).
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export const backupSchema = z.object({
  version: z.literal(1),
  recipes: z.array(recipeSchema).max(500),
}).superRefine(({ recipes }, ctx) => {
  const ids = new Set(recipes.map(recipe => recipe.id));
  if (ids.size !== recipes.length) ctx.addIssue({ code: 'custom', message: 'Ada ID resep ganda dalam cadangan.' });
  for (const recipe of recipes) {
    if (recipe.foam.enabled && recipe.foam.additionalId && !recipes.some(item => item.id === recipe.foam.additionalId && item.category === 'Additional' && item.id !== recipe.id)) {
      ctx.addIssue({ code: 'custom', message: `Additional untuk ${recipe.name} tidak ditemukan.` });
    }
  }
});

export function emptyRecipe(): Recipe {
  return {
    id: newRecipeId(), name: '', category: 'Milk Based',
    variants: [{ name: 'Standar', ingredients: [] }],
    foam: { enabled: false, additionalId: null, ingredients: [], steps: '' },
    steps: '', notes: '', photo: '', favorite: false,
  };
}

const catalog: [string, string[]][] = [
  ['Black Coffee', ['Americano', 'Ice Applericano', 'Midnight Frost']],
  ['Milk Based', ['Cei Latte', 'Cei Aren', 'Kira-missu', 'Butter Bunny', 'Hazelnutyy', 'Sakura Bliss']],
  ['Matcha Series', ['Matcha Latte', 'Matcha Cloud', 'Strawberry Matcha']],
  ['Cei-gnature', ['Caramello', 'Cei Boom', 'Cei’salt']],
  ['Non Coffee', ['Choco Chill', 'Thai Tea', 'Red Velvet', 'Korean Strawberry']],
  ['Mocktail', ['Midnight Splash', 'Blushing Berries']],
  ['Tea', ['Lemon Tea', 'Leci Tea', 'Teh Manis', 'Teh Tawar', 'Teh Tarik']],
  ['Instan', ['Nutrisari All Variant', 'Susu Putih/Coklat', 'Susu Jahe', 'Dancow Putih/Coklat', 'Energen', 'Beng Beng Drink', 'Milo Biasa', 'Milo Dino', 'Champion', 'Fanta Susu', 'Zoda Gembira', 'Mineral 300 ml', 'Mineral 600 ml']],
  ['Additional', ['Sea Salt', 'Matchiato', 'Cheese Cream']],
];
const ingredient = (name: string, amount: number): Ingredient => ({ name, amount, unit: 'g' });
export function seedRecipes(): Recipe[] {
  let index = 0;
  return catalog.flatMap(([category, names]) => names.map(name => {
    const recipe = { ...emptyRecipe(), id: `ce100000-0000-4000-8000-${String(++index).padStart(12, '0')}`, name, category };
    if (name === 'Americano' || name === 'Cei Latte') recipe.variants = ['Iced', 'Hot'].map(variant => ({
      name: variant, ingredients: name === 'Cei Latte' ? [ingredient('Latte', 125)] : [],
    }));
    if (name === 'Cei Aren') recipe.variants[0].ingredients = [ingredient('Aren', 15), ingredient('Latte', 120)];
    if (name === 'Strawberry Matcha') {
      recipe.variants[0].ingredients = [ingredient('Pure strawberry', 20), ingredient('Matcha powder', 20), ingredient('Air', 20), ingredient('Fresh milk', 90)];
      recipe.foam = { enabled: true, additionalId: null, ingredients: [ingredient('Creamer larut', 20), ingredient('Rich Gold', 10)], steps: '' };
    }
    return recipe;
  }));
}

export function matchesSearch(recipe: Recipe, query: string) {
  const normalize = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const haystack = normalize([recipe.name, recipe.category, ...recipe.variants.flatMap(v => v.ingredients.map(i => i.name)), ...recipe.foam.ingredients.map(i => i.name)].join(' '));
  return normalize(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

export function hasRecipe(recipe: Recipe) { return recipe.variants.every(variant => variant.ingredients.length > 0); }
export function mergeRecipes(existing: Recipe[], incoming: Recipe[]) {
  const merged = new Map(existing.map(recipe => [recipe.id, recipe]));
  incoming.forEach(recipe => merged.set(recipe.id, recipe));
  return [...merged.values()];
}
export function formatAmount(amount: number) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(amount); }
