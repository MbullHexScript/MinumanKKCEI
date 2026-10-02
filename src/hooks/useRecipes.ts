import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { backupSchema, mergeRecipes, recipeSchema, seedRecipes, type Recipe } from '../lib/recipes';
import { readCache, writeCache } from '../lib/storage';

export function useRecipes() {
  const [session, setSession] = useState<Session | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return hash.get('type') === 'recovery';
  });
  const [authReady, setAuthReady] = useState(!supabase);
  const [demo, setDemo] = useState(!supabase);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cacheWarning, setCacheWarning] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [cloudFresh, setCloudFresh] = useState(false);
  const generation = useRef(0);
  const busy = useRef(false);
  const cloud = !!supabase && !!session && !demo;
  const key = cloud ? `cei:account:${session!.user.id}` : 'cei:local:v1';

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setAuthReady(true);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    supabase.auth.getSession().then(({ data: sessionData, error: authError }) => {
      if (active) { setSession(sessionData.session); setAuthReady(true); if (authError) setError(authError.message); }
    }).catch(() => { if (active) { setAuthReady(true); setError('Sesi tidak bisa dimuat. Periksa koneksi.'); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const reload = useCallback(async () => {
    if (!authReady) return;
    const current = ++generation.current;
    setError(''); setCacheWarning(''); setCloudFresh(false);
    if (!demo && !session) { setRecipes([]); setLoading(false); return; }
    setLoading(true);
    try {
      let cached: Recipe[] | null = null;
      try { cached = readCache(key); }
      catch (err) { if (!cloud || !navigator.onLine) throw err; }
      setRecipes(cached ?? (demo ? seedRecipes() : []));
      if (cloud && navigator.onLine) {
        const { data, error: fetchError } = await supabase!.from('recipes').select('data').eq('user_id', session!.user.id).order('created_at');
        if (fetchError) throw fetchError;
        const values = (data ?? []).map(row => recipeSchema.parse(row.data));
        if (current !== generation.current) return;
        setRecipes(values); setCloudFresh(true);
        try { writeCache(key, values); } catch { setCacheWarning('Resep tersimpan di cloud, tetapi cache offline penuh.'); }
      } else if (demo && cached === null) writeCache(key, seedRecipes());
      else if (cloud && cached === null) setError('Belum ada resep offline di HP ini. Hubungkan internet untuk memuat database.');
    } catch (err) {
      if (current === generation.current) setError(err instanceof Error ? err.message : 'Database belum dapat dihubungi. Periksa koneksi dan konfigurasi Supabase.');
    } finally { if (current === generation.current) setLoading(false); }
  }, [authReady, cloud, demo, key, session?.user.id]);
  useEffect(() => { void reload(); }, [reload, online]);

  const persist = async (incoming: Recipe[], removeId?: string) => {
    if (busy.current) throw new Error('Tunggu penyimpanan sebelumnya selesai.');
    if (cloud && (!online || !cloudFresh)) throw new Error('Hubungkan dan muat ulang database sebelum mengubah resep.');
    incoming.forEach(recipe => recipeSchema.parse(recipe));
    const next = removeId ? recipes.filter(recipe => recipe.id !== removeId) : mergeRecipes(recipes, incoming);
    const validated = backupSchema.safeParse({ version: 1, recipes: next });
    if (!validated.success) throw new Error(validated.error.issues[0].message);
    busy.current = true; setSaving(true);
    try {
      if (cloud) {
        const result = removeId
          ? await supabase!.from('recipes').delete().eq('user_id', session!.user.id).eq('id', removeId)
          : await supabase!.from('recipes').upsert(incoming.map(recipe => ({ id: recipe.id, user_id: session!.user.id, data: recipe })), { onConflict: 'user_id,id' });
        if (result.error) throw new Error(`Belum tersimpan: ${result.error.message}`);
        try { writeCache(key, next); setCacheWarning(''); }
        catch { setCacheWarning('Tersimpan di database. Cache offline penuh; unduh cadangan jika diperlukan.'); }
      } else writeCache(key, next);
      setRecipes(next);
    } finally { busy.current = false; setSaving(false); }
  };

  const logout = async () => {
    if (session) {
      const result = await supabase!.auth.signOut({ scope: 'local' });
      if (result.error) throw result.error;
      localStorage.removeItem(`cei:account:${session.user.id}`);
    }
    setDemo(false); setRecipes([]);
  };

  const updatePassword = async (password: string) => {
    if (!supabase) throw new Error('Pemulihan password membutuhkan koneksi Supabase.');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw updateError;
    setPasswordRecovery(false);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  return { recipes, session, passwordRecovery, authReady, demo, setDemo, cloud, loading, saving, error, cacheWarning, online, cloudFresh, reload, persist, logout, updatePassword };
}
