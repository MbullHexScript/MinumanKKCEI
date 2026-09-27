import { describe, expect, it } from 'vitest';
import { backupSchema, hasRecipe, matchesSearch, mergeRecipes, recipeSchema, seedRecipes } from './recipes';

describe('Katalog racikan asli', () => {
  const recipes = seedRecipes();
  it('memuat 39 minuman dan 3 additional tanpa mengarang resep yang belum diberikan', () => {
    expect(recipes).toHaveLength(42);
    expect(new Set(recipes.map(recipe => recipe.id)).size).toBe(42);
    expect(recipes.filter(recipe => recipe.category === 'Additional')).toHaveLength(3);
    expect(recipes.filter(hasRecipe).map(recipe => recipe.name)).toEqual(['Cei Latte', 'Cei Aren', 'Strawberry Matcha']);
    expect(backupSchema.safeParse({ version: 1, recipes }).success).toBe(true);
  });
  it('mencatat gram sesuai timbangan dan Hot/Iced Cei Latte yang sama', () => {
    const latte = recipes.find(recipe => recipe.name === 'Cei Latte')!;
    expect(latte.variants.map(variant => variant.name)).toEqual(['Iced', 'Hot']);
    expect(latte.variants.every(variant => variant.ingredients[0].amount === 125 && variant.ingredients[0].unit === 'g')).toBe(true);
    expect(recipes.find(recipe => recipe.name === 'Cei Aren')!.variants[0].ingredients).toEqual([
      { name: 'Aren', amount: 15, unit: 'g' }, { name: 'Latte', amount: 120, unit: 'g' },
    ]);
    expect(recipes.find(recipe => recipe.name === 'Teh Manis')!.variants).toHaveLength(1);
  });
  it('menemukan resep melalui urutan kata bebas atau bahan foam', () => {
    const matcha = recipes.find(recipe => recipe.name === 'Strawberry Matcha')!;
    expect(matchesSearch(matcha, 'matcha STRAWBERRY')).toBe(true);
    expect(matchesSearch(matcha, 'rich gold')).toBe(true);
    expect(matchesSearch(matcha, 'kopi')).toBe(false);
  });
});

describe('Cadangan dan integritas data', () => {
  it('menggabungkan berdasarkan ID tanpa menghapus menu lain', () => {
    const [one, two, three] = seedRecipes();
    const result = mergeRecipes([one, two], [{ ...one, name: 'Nama diperbarui' }, three]);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Nama diperbarui');
    expect(result[1]).toEqual(two);
    expect(result[2]).toEqual(three);
  });
  it('menolak ID ganda dan cadangan tanpa additional yang dirujuk', () => {
    const recipes = seedRecipes();
    const [recipe] = recipes;
    expect(backupSchema.safeParse({ version: 1, recipes: [recipe, recipe] }).success).toBe(false);
    const additional = recipes.find(item => item.category === 'Additional')!;
    const linked = { ...recipe, foam: { ...recipe.foam, enabled: true, additionalId: additional.id } };
    expect(backupSchema.safeParse({ version: 1, recipes: [linked] }).success).toBe(false);
    expect(backupSchema.safeParse({ version: 1, recipes: [linked, additional] }).success).toBe(true);
    expect(backupSchema.safeParse({ version: 1, recipes: [linked, { ...additional, category: 'Tea' }] }).success).toBe(false);
  });
  it('menolak gambar aktif/URL asing, takaran negatif, dan versi tak dikenal', () => {
    const recipe = seedRecipes()[0];
    expect(recipeSchema.safeParse({ ...recipe, photo: 'javascript:alert(1)' }).success).toBe(false);
    expect(recipeSchema.safeParse({ ...recipe, photo: 'data:image/svg+xml;base64,AAAA' }).success).toBe(false);
    expect(recipeSchema.safeParse({ ...recipe, variants: [{ name: 'Standar', ingredients: [{ name: 'Air', amount: -2, unit: 'g' }] }] }).success).toBe(false);
    expect(backupSchema.safeParse({ version: 2, recipes: [] }).success).toBe(false);
  });
});
