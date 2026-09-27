import { useRef, useState } from 'react';
import { Cloud, CloudOff, Database, Download, FileJson, LogOut, MonitorSmartphone, Moon, RefreshCw, ShieldCheck, Sun, Upload } from 'lucide-react';
import { backupSchema, seedRecipes, type Recipe } from '../lib/recipes';
import { exportBackup } from '../lib/storage';
import { supabase } from '../lib/supabase';

export default function Settings({ recipes, cloud, email, online, canEdit, saving, theme, setTheme, onImport, onLogout, onLogin, onReload }: {
  recipes: Recipe[]; cloud: boolean; email?: string; online: boolean; canEdit: boolean; saving: boolean;
  theme: string; setTheme: (theme: string) => void; onImport: (recipes: Recipe[]) => Promise<void>;
  onLogout: () => void; onLogin: () => void; onReload: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Recipe[] | null>(null);
  const [message, setMessage] = useState('');
  const importFile = async (file: File) => {
    setError(''); setPending(null); setMessage('');
    if (file.size > 50 * 1024 * 1024) { setError('Ukuran cadangan maksimal 50 MB.'); return; }
    try {
      const result = backupSchema.safeParse(JSON.parse(await file.text()));
      if (!result.success) throw new Error('File bukan cadangan Cei yang valid. Pastikan versi, resep, dan foto sesuai.');
      setPending(result.data.recipes);
    } catch (err) { setError(err instanceof Error && !(err instanceof SyntaxError) ? err.message : 'File JSON tidak dapat dibaca. Pilih file hasil Ekspor cadangan.'); }
  };
  return <div className="settings-page"><div className="page-heading"><div><span className="section-kicker">Ruang pribadi</span><h1>Atur senyamanmu.</h1><p>Resep tetap aman. Meracik tetap nyaman.</p></div></div>
    <section className="settings-panel"><div className="settings-heading"><span className="settings-icon"><Database size={21}/></span><div><h2>Penyimpanan resep</h2><p>{cloud ? 'Terhubung ke database pribadimu.' : 'Saat ini tersimpan di browser perangkat ini.'}</p></div><span className={`connection-tag ${cloud ? 'connected' : ''}`}>{cloud ? 'Cloud' : 'Lokal'}</span></div>
      <div className="connection-info">{cloud ? <Cloud size={25}/> : <CloudOff size={25}/>}<div><strong>{cloud ? email : 'Database belum digunakan'}</strong><p>{cloud ? `${recipes.length} resep di akun ini. ${online ? 'Perubahan disimpan ke Supabase.' : 'Sedang offline. Resep yang tersimpan dapat dibaca.'}` : 'Data lokal bisa hilang jika browser dibersihkan. Unduh cadangan sebelum pindah perangkat.'}</p></div></div>
      {!cloud && <div className="setup-note"><strong>Hubungkan Supabase</strong><p>{supabase ? 'Masuk dengan akun pribadi, lalu impor cadangan lokalmu ke database.' : 'Isi konfigurasi Supabase pada file .env dan jalankan SQL di folder supabase. Panduan lengkap ada di README.md.'}</p></div>}
      <div className="settings-actions">{cloud ? <><button className="button secondary" disabled={!online || saving} onClick={onReload}><RefreshCw size={16}/> Muat ulang</button><button className="text-button danger" disabled={saving} onClick={onLogout}><LogOut size={16}/> Keluar akun</button></> : supabase && <button className="button primary" onClick={onLogin}><ShieldCheck size={17}/> Masuk ke akun</button>}</div>
    </section>
    <section className="settings-panel"><div className="settings-heading"><span className="settings-icon"><FileJson size={21}/></span><div><h2>Cadangan milikmu</h2><p>Seluruh resep dan foto dalam satu file.</p></div></div><div className="backup-options"><div><h3>Ekspor cadangan</h3><p>Simpan salinan di HP atau Google Drive secara berkala.</p><button className="button secondary" onClick={() => { exportBackup(recipes); setMessage('Cadangan diunduh. Simpan salinannya di tempat yang aman.'); }}><Download size={16}/> Unduh cadangan</button></div><div><h3>Impor cadangan</h3><p>Gabungkan resep. ID yang sama diperbarui, menu lain tetap ada.</p><button className="button secondary" disabled={!canEdit || saving} onClick={() => fileRef.current?.click()}><Upload size={16}/> Pilih file JSON</button><input hidden type="file" accept=".json,application/json" ref={fileRef} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void importFile(file); }}/></div></div>
      {pending && <div className="import-confirm"><strong>{pending.length} resep siap digabungkan</strong><p>Resep dengan ID yang sama akan mengikuti isi cadangan, termasuk foto dan favorit.</p><div className="settings-actions"><button className="button primary" disabled={saving || !canEdit} onClick={async () => { try { await onImport(pending); setMessage(`${pending.length} resep berhasil diimpor.`); setPending(null); } catch (err) { setError(err instanceof Error ? err.message : 'Impor gagal. Coba lagi.'); } }}>{saving ? 'Mengimpor…' : 'Gabungkan cadangan'}</button><button className="button secondary" disabled={saving} onClick={() => setPending(null)}>Batal</button></div></div>}
      {error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
    </section>
    <section className="settings-panel"><div className="settings-heading"><span className="settings-icon"><Sun size={21}/></span><div><h2>Tampilan</h2><p>Pilih yang paling nyaman di countermu.</p></div></div><div className="theme-options"><button className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={21}/><span>Gelap</span></button><button className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun size={21}/><span>Terang</span></button></div></section>
    <section className="settings-panel"><div className="settings-heading"><span className="settings-icon"><MonitorSmartphone size={21}/></span><div><h2>Selalu dekat, di layar utama.</h2><p>Pasang buku racikan seperti aplikasi.</p></div></div><p className="install-copy"><strong>Android:</strong> buka menu Chrome → Tambahkan ke layar utama / Instal aplikasi.<br/><strong>iPhone:</strong> buka lewat Safari → Bagikan → Tambah ke Layar Utama.</p><p className="field-hint">Buka aplikasi saat online sekali agar tampilan dan resep dapat disimpan untuk akses offline. Penyimpanan offline bergantung pada ruang dan kebijakan browser.</p></section>
    <section className="settings-panel seed-panel"><div><h3>Daftar menu awal</h3><p>Tambahkan menu bawaan yang belum ada. Resep yang sudah ada tidak ditimpa.</p></div><button className="button secondary" disabled={!canEdit || saving} onClick={async () => {
      const missing = seedRecipes().filter(recipe => !recipes.some(current => current.id === recipe.id));
      if (!missing.length) { setMessage('Semua menu awal sudah tersedia.'); return; }
      try { await onImport(missing); setMessage(`${missing.length} menu awal ditambahkan.`); } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menambahkan menu.'); }
    }}>Tambahkan menu awal</button></section>
    <div className="settings-footnote"><span className="mini-mark">C.</span><span>Buku racikan Kedai Kopi Cei<br/><small>Dibuat untuk hari-hari di balik counter.</small></span></div>
  </div>;
}
