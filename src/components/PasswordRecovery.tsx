import { useState, type FormEvent } from 'react';
import { CheckCircle2, KeyRound, LoaderCircle, LockKeyhole } from 'lucide-react';
import { HeroArt } from './DrinkArt';

export default function PasswordRecovery({ onUpdate }: { onUpdate: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirmation) { setError('Konfirmasi password belum sama.'); return; }
    setBusy(true);
    try { await onUpdate(password); }
    catch { setError('Password belum bisa diperbarui. Link mungkin sudah kedaluwarsa; kirim link pemulihan baru.'); }
    finally { setBusy(false); }
  };
  return <main className="login-page recovery-page"><div className="login-art"><a className="brand" href="/"><span className="brand-mark">Cei<span>®</span></span><span>Buku racikan<br/><small>Kedai Kopi Cei</small></span></a><h1>Satu langkah<br/>lagi.</h1><HeroArt/><div className="checker"/></div><div className="login-form"><div className="login-icon"><KeyRound size={28}/></div><h2>Buat password baru.</h2><p>Gunakan password baru untuk kembali membuka buku racikanmu.</p><form onSubmit={submit}><label className="field">Password baru<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="Minimal 8 karakter"/></label><label className="field">Ulangi password<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Ketik ulang password"/></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <CheckCircle2 size={18}/>} {busy ? 'Menyimpan…' : 'Simpan password baru'}</button></form><p className="login-private"><LockKeyhole size={14}/> Password baru hanya tersimpan di akun Supabase-mu.</p></div></main>;
}
