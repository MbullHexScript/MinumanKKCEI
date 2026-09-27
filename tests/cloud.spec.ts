import { expect, test } from '@playwright/test';
import { hasRecipe, mergeRecipes, seedRecipes, type Recipe } from '../src/lib/recipes';

// Contract test only: no request is sent to a real Supabase project.
test('login, kegagalan simpan, pemulihan, baca offline, dan cache privat per akun', async ({ page, context }) => {
  let records = seedRecipes().filter(hasRecipe);
  let rejectWrite = true;
  let accountId = 'a1000000-0000-4000-8000-000000000001';
  const firstAccountId = accountId;
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
  await page.route('https://cei-test.supabase.co/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    if (url.pathname === '/auth/v1/token') {
      const payload = Buffer.from(JSON.stringify({ sub: accountId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      await route.fulfill({ headers, json: {
        access_token: `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${payload}.test`,
        token_type: 'bearer', expires_in: 3600, refresh_token: 'test-refresh-token',
        user: { id: accountId, aud: 'authenticated', role: 'authenticated', email: 'barista@example.com', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() },
      } }); return;
    }
    if (url.pathname === '/auth/v1/logout') { await route.fulfill({ status: 204, headers }); return; }
    if (url.pathname === '/rest/v1/recipes') {
      expect(request.headers().authorization).toContain('Bearer ');
      if (request.method() === 'GET') {
        expect(url.searchParams.get('user_id')).toBe(`eq.${accountId}`);
        await route.fulfill({ headers, json: records.map(data => ({ data })) }); return;
      }
      if (request.method() === 'POST') {
        if (rejectWrite) { await route.fulfill({ status: 503, headers, json: { message: 'Server sementara tidak tersedia' } }); return; }
        const rows = request.postDataJSON() as { user_id: string; id: string; data: Recipe }[];
        expect(rows.every(row => row.user_id === accountId && row.id === row.data.id)).toBe(true);
        records = mergeRecipes(records, rows.map(row => row.data));
        await route.fulfill({ status: 201, headers, json: [] }); return;
      }
    }
    await route.fulfill({ status: 404, headers, json: { message: 'Unexpected request' } });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('barista@example.com');
  await page.getByLabel('Kata sandi', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Buka buku racikan' }).click();
  await expect(page.locator('.sync-status')).toHaveText('Tersinkron');
  await expect(page.locator('.recipe-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Lihat resep Cei Aren', exact: true }).click();
  await page.getByRole('button', { name: 'Edit resep', exact: true }).click();
  await page.getByLabel('Utama takaran 1').fill('18');
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Belum tersimpan');
  expect(records.find(recipe => recipe.name === 'Cei Aren')!.variants[0].ingredients[0].amount).toBe(15);
  await expect(page.getByLabel('Utama takaran 1')).toHaveValue('18');
  rejectWrite = false;
  await page.getByRole('button', { name: 'Simpan resep' }).click();
  await expect(page.getByRole('dialog')).toContainText('18 g');
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.reload();
  await expect(page.locator('.sync-status')).toHaveText('Tersinkron');
  await context.setOffline(true);
  await expect(page.locator('.sync-status')).toHaveText('Offline');
  await page.getByRole('button', { name: 'Lihat resep Cei Aren', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('18 g');
  await expect(page.getByRole('button', { name: 'Edit resep', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await context.setOffline(false);
  await expect(page.locator('.sync-status')).toHaveText('Tersinkron');
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Pengaturan' }).click();
  await page.getByRole('button', { name: 'Keluar akun' }).click();
  await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), `cei:account:${firstAccountId}`)).toBeNull();
  accountId = 'a1000000-0000-4000-8000-000000000002';
  records = [];
  await page.getByLabel('Email', { exact: true }).fill('second@example.com');
  await page.getByLabel('Kata sandi', { exact: true }).fill('second-test-password');
  await page.getByRole('button', { name: 'Buka buku racikan' }).click();
  await expect(page.locator('.sync-status')).toHaveText('Tersinkron');
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: /Semua racikan/ }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Isi 42 menu awal' })).toBeVisible();
});
