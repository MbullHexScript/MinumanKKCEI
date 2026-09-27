import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function openSettings(page: Page) {
  await page.getByRole('navigation', { name: await page.locator('.bottom-nav').isVisible() ? 'Navigasi mobile' : 'Navigasi utama' }).getByRole('button', { name: 'Pengaturan' }).click();
}
async function addRecipe(page: Page) {
  if (await page.locator('.bottom-nav').isVisible()) await page.locator('.bottom-nav').getByRole('button', { name: 'Tambah', exact: true }).click();
  else await page.getByRole('button', { name: 'Tambah resep', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  // Memastikan preview HTTP di HP tetap bekerja tanpa randomUUID (secure-context only).
  await page.addInitScript(() => { Object.defineProperty(window.crypto, 'randomUUID', { value: undefined }); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mau meracik apa?' })).toBeVisible();
});

test('katalog, pencarian bahan, kategori, takaran foam, dan varian', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await expect(page.locator('.recipe-card')).toHaveCount(42);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.evaluate(() => window.innerWidth));
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: false });
  await page.getByRole('button', { name: 'Lihat resep Cei Aren', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('15 g');
  await expect(page.getByRole('dialog')).toContainText('120 g');
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.getByRole('button', { name: 'Lihat resep Cei Latte', exact: true }).click();
  await page.getByRole('button', { name: 'Hot', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('125 g');
  await page.getByRole('button', { name: 'Iced', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('125 g');
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Cari minuman' }).fill('rich gold');
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Lihat resep Strawberry Matcha' }).click();
  await expect(page.locator('.foam-section')).toContainText('Creamer larut');
  await expect(page.locator('.foam-section')).toContainText('20 g');
  await expect(page.locator('.foam-section')).toContainText('10 g');
  await page.screenshot({ path: testInfo.outputPath('foam-detail.png') });
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Cari minuman' })).toHaveValue('rich gold');
  await page.getByRole('button', { name: 'Hapus pencarian' }).click();
  await page.getByRole('button', { name: 'Additional', exact: true }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('tambah, edit, favorit, duplikat, hapus, dan persistensi', async ({ page }) => {
  await addRecipe(page);
  await page.getByLabel('Nama minuman').fill('Kopi pengujian');
  await page.getByRole('button', { name: 'Tambah bahan', exact: true }).click();
  await page.getByLabel('Utama bahan 1', { exact: true }).fill('Espresso');
  await page.getByLabel('Utama takaran 1').fill('32.5');
  await page.getByLabel('Tambahkan langkah pembuatan', { exact: true }).check();
  await page.getByLabel('Langkah pembuatan', { exact: true }).fill('Tuang espresso.\nSajikan.');
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('searchbox', { name: 'Cari minuman' }).fill('Kopi pengujian');
  await page.getByRole('button', { name: 'Lihat resep Kopi pengujian', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('32,5 g');
  await expect(page.getByRole('dialog')).toContainText('Tuang espresso.');
  await page.getByRole('button', { name: 'Tambahkan ke favorit' }).click();
  await expect(page.getByRole('button', { name: 'Hapus dari favorit' })).toBeEnabled();
  await page.getByRole('button', { name: 'Edit resep', exact: true }).click();
  await page.getByLabel('Utama takaran 1').fill('35');
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page.getByRole('dialog')).toContainText('35 g');
  await page.getByRole('button', { name: 'Duplikat resep' }).click();
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Lihat resep Kopi pengujian (salinan)', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Hapus resep', exact: true }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.reload();
  const nav = page.getByRole('navigation', { name: await page.locator('.bottom-nav').isVisible() ? 'Navigasi mobile' : 'Navigasi utama' });
  await nav.getByRole('button', { name: /Favorit/ }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await expect(page.locator('.recipe-card')).toContainText('Kopi pengujian');
});

test('foto, cadangan JSON lengkap, validasi impor, dan tema persisten', async ({ page }) => {
  await page.getByRole('button', { name: 'Lihat resep Cei Aren', exact: true }).click();
  await page.getByRole('button', { name: 'Edit resep', exact: true }).click();
  await page.locator('.photo-field input[type=file]').setInputFiles('public/icon-192.png');
  await expect(page.locator('.photo-upload img')).toBeVisible();
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page.locator('.detail-image img')).toBeVisible();
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await openSettings(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Unduh cadangan' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile((await download.path())!, 'utf-8'));
  expect(backup.recipes).toHaveLength(42);
  const aren = backup.recipes.find((recipe: { name: string }) => recipe.name === 'Cei Aren');
  expect(aren.photo).toMatch(/^data:image\/jpeg;base64,/);
  aren.name = 'Cei Aren hasil impor';
  await page.locator('.backup-options input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Gabungkan cadangan' }).click();
  await expect(page.getByText('42 resep berhasil diimpor.')).toBeVisible();
  await page.locator('.backup-options input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99,"recipes":[]}') });
  await expect(page.getByRole('alert')).toContainText('bukan cadangan Cei yang valid');
  await page.getByRole('button', { name: 'Terang', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Lihat resep Cei Aren hasil impor', exact: true })).toBeVisible();
});

test('additional terhubung dan perlindungan hapus referensi', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Cari minuman' }).fill('Sea Salt');
  await page.getByRole('button', { name: 'Lihat resep Sea Salt', exact: true }).click();
  await page.getByRole('button', { name: 'Edit resep', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah bahan', exact: true }).click();
  await page.getByLabel('Utama bahan 1', { exact: true }).fill('Bahan additional uji');
  await page.getByLabel('Utama takaran 1').fill('12');
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Cari minuman' }).fill('Cei Aren');
  await page.getByRole('button', { name: 'Lihat resep Cei Aren', exact: true }).click();
  await page.getByRole('button', { name: 'Edit resep', exact: true }).click();
  await page.getByLabel('Pakai foam', { exact: false }).check();
  await page.getByLabel('Sumber racikan foam').selectOption({ label: 'Sea Salt' });
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page.locator('.foam-section')).toContainText('Bahan additional uji');
  await expect(page.locator('.foam-section')).toContainText('12 g');
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Cari minuman' }).fill('Sea Salt');
  await page.getByRole('button', { name: 'Lihat resep Sea Salt', exact: true }).click();
  await page.getByRole('button', { name: 'Hapus resep', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Masih dipakai oleh Cei Aren');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('aplikasi dan resep yang tersimpan tetap bisa dibuka offline', async ({ page, context }) => {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.locator('.recipe-card')).toHaveCount(42);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Lihat resep Strawberry Matcha' }).click();
  await expect(page.locator('.foam-section')).toContainText('Rich Gold');
  await expect(page.getByRole('dialog')).toContainText('Fresh milk');
  await context.setOffline(false);
});
