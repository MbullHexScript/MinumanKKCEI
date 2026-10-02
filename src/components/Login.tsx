import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Coffee, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HeroArt } from './DrinkArt';

export default function Login({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { error: authError } = await supabase!.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch { setError('Belum bisa masuk. Periksa email, kata sandi, dan koneksi internet.'); }
    finally { setBusy(false); }
  };
  const sendRecovery = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setSent(false);
    try {
      const { error: authError } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (authError) throw authError;
      setSent(true);
    } catch { setError('Email pemulihan belum bisa dikirim. Periksa alamat email dan koneksi internet.'); }
    finally { setBusy(false); }
  };
  return <main className="login-page"><div className="login-art"><a className="brand" href="/"><span className="brand-mark">Cei<span>®</span></span><span>Buku racikan<br/><small>Kedai Kopi Cei</small></span></a><h1>Racikan pas.<br/>Setiap gelas.</h1><HeroArt/><div className="checker"/></div><div className="login-form"><div className="login-icon">{mode === 'login' ? <Coffee size={28}/> : <Mail size={28}/>}</div>{mode === 'login' ? <><h2>Selamat datang kembali.</h2><p>Masuk ke buku racikan pribadimu.<br/>Semua takaran, dalam satu genggaman.</p><form onSubmit={submit}><label className="field">Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} placeholder="Email akun pribadi"/></label><label className="field">Kata sandi<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <ArrowRight size={18}/>} {busy ? 'Masuk…' : 'Buka buku racikan'}</button></form><button className="text-button recovery-link" onClick={() => { setMode('forgot'); setError(''); }}>Lupa password?</button><p className="login-private"><LockKeyhole size={14}/> Akun pribadi. Resep hanya bisa diakses olehmu.</p><button className="text-button" onClick={onDemo}>Lihat pratinjau lokal dulu</button></> : <><h2>Atur ulang password.</h2>{sent ? <div className="recovery-sent" role="status"><CheckCircle2 size={25}/><p>Link pemulihan sudah dikirim ke <strong>{email}</strong>. Buka email tersebut untuk membuat password baru.</p></div> : <><p>Masukkan email akunmu. Kami akan mengirim link pemulihan.</p><form onSubmit={sendRecovery}><label className="field">Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="Email akun pribadi"/></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <Mail size={18}/>} {busy ? 'Mengirim…' : 'Kirim link pemulihan'}</button></form></>}<button className="text-button" onClick={() => { setMode('login'); setSent(false); setError(''); }}><ArrowLeft size={16}/> Kembali ke login</button></>}</div></main>;
}
