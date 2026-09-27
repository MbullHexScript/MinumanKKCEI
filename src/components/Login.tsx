import { useState, type FormEvent } from 'react';
import { ArrowRight, Coffee, LoaderCircle, LockKeyhole } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HeroArt } from './DrinkArt';

export default function Login({ onDemo }: { onDemo: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { error: authError } = await supabase!.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch { setError('Belum bisa masuk. Periksa email, kata sandi, dan koneksi internet.'); }
    finally { setBusy(false); }
  };
  return <main className="login-page"><div className="login-art"><a className="brand" href="/"><span className="brand-mark">Cei<span>®</span></span><span>Buku racikan<br/><small>Kedai Kopi Cei</small></span></a><h1>Racikan pas.<br/>Setiap gelas.</h1><HeroArt/><div className="checker"/></div><div className="login-form"><div className="login-icon"><Coffee size={28}/></div><h2>Selamat datang kembali.</h2><p>Masuk ke buku racikan pribadimu.<br/>Semua takaran, dalam satu genggaman.</p><form onSubmit={submit}><label className="field">Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} placeholder="Email akun pribadi"/></label><label className="field">Kata sandi<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <ArrowRight size={18}/>} {busy ? 'Masuk…' : 'Buka buku racikan'}</button></form><p className="login-private"><LockKeyhole size={14}/> Akun pribadi. Resep hanya bisa diakses olehmu.</p><button className="text-button" onClick={onDemo}>Lihat pratinjau lokal dulu</button></div></main>;
}
