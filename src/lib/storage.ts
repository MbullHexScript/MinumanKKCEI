import { backupSchema, type Recipe } from './recipes';

export function readCache(key: string): Recipe[] | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try { return backupSchema.parse(JSON.parse(raw)).recipes; }
  catch { throw new Error('Data lokal tidak dapat dibaca. Jangan hapus data browser; pulihkan dari cadangan atau hubungkan kembali ke database.'); }
}
export function writeCache(key: string, recipes: Recipe[]) {
  try { localStorage.setItem(key, JSON.stringify({ version: 1, recipes })); }
  catch { throw new Error('Penyimpanan HP penuh. Unduh cadangan dan kurangi foto, atau gunakan database online.'); }
}
export function exportBackup(recipes: Recipe[]) {
  const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), recipes }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `racikan-cei-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Pilih foto JPG, PNG, atau WebP.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Ukuran foto maksimal 15 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Foto tidak bisa diproses di browser ini.');
  ctx.fillStyle = '#eee9dd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let result = canvas.toDataURL('image/jpeg', .78);
  if (result.length > 350000) result = canvas.toDataURL('image/jpeg', .5);
  if (result.length > 700000) throw new Error('Foto terlalu besar setelah dikompres. Pilih foto yang lebih kecil.');
  return result;
}
