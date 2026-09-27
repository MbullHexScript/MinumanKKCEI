import { useEffect, useRef, useState } from 'react';
import { ArrowDownAZ, ArrowRight, BookOpen, Check, ChevronRight, CircleAlert, Cloud, Coffee, CupSoda, Flower2, Heart, LayoutGrid, Leaf, List, LoaderCircle, Milk, Moon, Plus, Search, Settings as SettingsIcon, Sparkles, Sun, WifiOff, Wine, X } from 'lucide-react';
import { CATEGORIES, emptyRecipe, hasRecipe, matchesSearch, newRecipeId, seedRecipes, type Recipe } from './lib/recipes';
import { supabase } from './lib/supabase';
import { useRecipes } from './hooks/useRecipes';
import { DrinkArt, HeroArt } from './components/DrinkArt';
import RecipeDetail from './components/RecipeDetail';
import RecipeEditor from './components/RecipeEditor';
import Login from './components/Login';
import Settings from './components/Settings';

const categoryIcons: Record<string, typeof Coffee> = {
  'Black Coffee': Coffee, 'Milk Based': Milk, 'Matcha Series': Leaf, 'Cei-gnature': Sparkles,
  'Non Coffee': CupSoda, Mocktail: Wine, Tea: Flower2, Instan: CupSoda, Additional: Sparkles,
};
const getSelectedId = () => window.location.hash.startsWith('#recipe/') ? window.location.hash.slice(8) : null;
function savedTheme() { try { return localStorage.getItem('cei:theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } }

export default function App() {
  const store = useRecipes();
  const [theme, setTheme] = useState(savedTheme);
  const [page, setPage] = useState<'recipes' | 'favorites' | 'settings'>('recipes');
  const [category, setCategory] = useState('Semua');
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('ready');
  const [foamOnly, setFoamOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(getSelectedId);
  const [editor, setEditor] = useState<{ recipe: Recipe; isNew: boolean } | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const canEdit = !store.loading && !store.saving && (store.demo || (store.cloud && store.online && store.cloudFresh));
  const selected = store.recipes.find(recipe => recipe.id === selectedId);
  const favorites = store.recipes.filter(recipe => recipe.favorite).length;
  const complete = store.recipes.filter(hasRecipe).length;
  const categories = [...new Set([...CATEGORIES, ...store.recipes.map(recipe => recipe.category)])];
  const filtered = store.recipes.filter(recipe => (page !== 'favorites' || recipe.favorite) && (category === 'Semua' || recipe.category === category) && (!foamOnly || recipe.foam.enabled) && matchesSearch(recipe, query)).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'id') : Number(hasRecipe(b)) - Number(hasRecipe(a)));

  useEffect(() => { document.documentElement.dataset.theme = theme; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#191a18' : '#f6f4ee'); try { localStorage.setItem('cei:theme', theme); } catch { /* Preferensi tetap berlaku untuk sesi ini. */ } }, [theme]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), toast.error ? 8000 : 4000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const pop = () => setSelectedId(getSelectedId()); window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop); }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === 'k') { event.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut);
  }, []);

  const notify = (text: string, error = false) => setToast({ text, error });
  const run = async (action: () => Promise<unknown>, message?: string) => {
    try { await action(); if (message) notify(message); }
    catch (err) { notify(err instanceof Error ? err.message : 'Proses belum berhasil. Coba lagi.', true); }
  };
  const openRecipe = (recipe: Recipe) => { window.history.pushState({ ceiDetail: true }, '', `#recipe/${recipe.id}`); setSelectedId(recipe.id); };
  const closeRecipe = () => {
    if (window.history.state?.ceiDetail) window.history.back();
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setSelectedId(null);
  };
  const navigate = (next: typeof page) => { setPage(next); setCategory('Semua'); setQuery(''); setFoamOnly(false); window.scrollTo({ top: 0 }); };
  const favorite = (recipe: Recipe) => { void run(() => store.persist([{ ...recipe, favorite: !recipe.favorite }]), recipe.favorite ? 'Dihapus dari favorit.' : 'Ditambahkan ke favorit.'); };
  const addRecipe = () => setEditor({ recipe: emptyRecipe(), isNew: true });
  const deleteRecipe = (recipe: Recipe) => {
    const users = store.recipes.filter(item => item.foam.enabled && item.foam.additionalId === recipe.id);
    if (users.length) { notify(`Masih dipakai oleh ${users.map(item => item.name).join(', ')}. Ubah sumber foam di menu tersebut terlebih dahulu.`, true); return; }
    if (window.confirm(`Hapus resep ${recipe.name}? Resep yang dihapus hanya bisa dipulihkan dari cadangan.`)) void run(async () => { await store.persist([], recipe.id); closeRecipe(); }, 'Resep dihapus.');
  };

  if (!store.authReady) return <div className="loading-screen"><span className="brand-mark">Cei</span><LoaderCircle className="spin"/><p>Membuka buku racikan…</p></div>;
  if (supabase && !store.session && !store.demo) return <Login onDemo={() => store.setDemo(true)}/>;

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" onClick={event => { event.preventDefault(); navigate('recipes'); }}><span className="brand-mark">Cei<span>®</span></span><span>Buku racikan<br/><small>Kedai Kopi Cei</small></span></a>
      <div className="sidebar-label">Di balik setiap gelas.</div>
      <nav className="side-nav" aria-label="Navigasi utama"><button className={page === 'recipes' ? 'active' : ''} onClick={() => navigate('recipes')}><BookOpen size={19}/><span>Semua racikan</span><span className="nav-count">{store.recipes.length}</span></button><button className={page === 'favorites' ? 'active' : ''} onClick={() => navigate('favorites')}><Heart size={19}/><span>Favorit saya</span>{favorites > 0 && <span className="nav-count">{favorites}</span>}</button><div className="nav-divider"/><button className={page === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><SettingsIcon size={19}/><span>Pengaturan</span></button></nav>
      <div className="sidebar-note"><Coffee size={26} strokeWidth={1.4}/><p>Sedikit hafalan.<br/><strong>Lebih banyak racikan.</strong></p><span>Teman kecil di balik counter.</span></div>
      <div className="sidebar-bottom"><div className="checker"/><div className="profile"><span className="profile-avatar">C</span><div><strong>Barista Cei</strong><span>{store.cloud ? 'Buku racikan pribadi' : 'Mode lokal'}</span></div><span className={`status-dot ${store.cloud && store.online ? 'online' : ''}`}/></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="desktop-breadcrumb"><BookOpen size={16}/><span>Buku racikan</span><ChevronRight size={14}/><strong>{page === 'settings' ? 'Pengaturan' : page === 'favorites' ? 'Favorit saya' : 'Semua menu'}</strong></div><a href="/" className="mobile-brand" onClick={event => { event.preventDefault(); navigate('recipes'); }}>Cei<span>Buku racikan</span></a><div className="topbar-actions"><span className="sync-status">{!store.online ? <WifiOff size={14}/> : store.cloud ? <Cloud size={15}/> : <span className="status-dot"/>}{store.saving ? 'Menyimpan…' : !store.online ? 'Offline' : store.cloud ? store.cloudFresh ? 'Tersinkron' : 'Menghubungkan' : 'Mode lokal'}</span><span className="toolbar-divider"/><button className="icon-button theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}>{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button><span className="top-avatar">C</span></div></header>
      <main className="main-content">
        {!store.online && <div className="status-banner"><WifiOff size={17}/><span>Mode offline. {store.cloud ? 'Resep tersimpan bisa dibaca; sambungkan internet untuk mengedit.' : 'Kamu sedang memakai data lokal perangkat ini.'}</span></div>}
        {store.error && <div className="error-banner" role="alert"><CircleAlert size={18}/><span>{store.error}</span><button onClick={() => void store.reload()} className="text-button">Coba lagi</button></div>}
        {store.cacheWarning && <div className="status-banner"><CircleAlert size={18}/><span>{store.cacheWarning}</span></div>}
        {page === 'settings' ? <Settings recipes={store.recipes} cloud={store.cloud} email={store.session?.user.email} online={store.online} canEdit={canEdit} saving={store.saving} theme={theme} setTheme={setTheme} onImport={items => store.persist(items)} onLogout={() => void run(store.logout)} onLogin={() => store.setDemo(false)} onReload={() => void store.reload()}/> : <>
          {page === 'recipes' ? <section className="hero"><div className="hero-copy"><div className="hero-eyebrow"><span/> Buku kecil, racikan andalan</div><h1>Racikan pas.<br/>Setiap gelas.</h1><p>Nggak perlu hafal semuanya.<br/>Cari menunya, lihat takarannya, mulai meracik.</p><div className="hero-meta"><span><BookOpen size={15}/><strong>{store.recipes.length}</strong> menu minuman</span><i/><span><Check size={15}/><strong>{complete}</strong> resep terisi</span></div></div><HeroArt/><div className="hero-checker checker"/></section> : <section className="favorites-heading"><div className="favorite-heading-icon"><Heart size={29}/></div><div><span className="section-kicker">Selalu jadi andalan</span><h1>Favorit saya.</h1><p>Racikan yang ingin kamu temukan lebih cepat.</p></div></section>}
          <section className="menu-section" aria-label="Daftar resep">
            <div className="menu-heading"><div><h2>{page === 'favorites' ? 'Racikan pilihanmu' : 'Mau meracik apa?'}</h2><p>{page === 'favorites' ? `${favorites} menu disimpan sebagai favorit` : 'Semua resep, dalam satu genggaman.'}</p></div><button className="button primary desktop-add" disabled={!canEdit} onClick={addRecipe}><Plus size={18}/> Tambah resep</button></div>
            <div className="search-toolbar"><label className="search-field"><Search size={21}/><input ref={searchRef} type="search" placeholder="Cari nama minuman atau bahan…" aria-label="Cari minuman" value={query} onChange={event => setQuery(event.target.value)}/>{query ? <button className="icon-button" aria-label="Hapus pencarian" onClick={() => setQuery('')}><X size={17}/></button> : <kbd>Ctrl K</kbd>}</label><div className="view-switch" aria-label="Tampilan menu"><button className={layout === 'grid' ? 'active' : ''} aria-label="Tampilan grid" aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}><LayoutGrid size={19}/></button><button className={layout === 'list' ? 'active' : ''} aria-label="Tampilan daftar" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}><List size={20}/></button></div></div>
            <div className="category-scroll"><div className="category-tabs" aria-label="Filter kategori"><button className={category === 'Semua' ? 'active' : ''} aria-pressed={category === 'Semua'} onClick={() => setCategory('Semua')}><LayoutGrid size={15}/>Semua<span>{store.recipes.length}</span></button>{categories.map(item => { const Icon = categoryIcons[item] ?? Coffee; return <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}><Icon size={16}/>{item}</button>; })}</div></div>
            <div className="results-toolbar"><span><strong>{filtered.length}</strong> {query ? 'hasil pencarian' : 'menu'}{category !== 'Semua' && <span className="result-category"> / {category}</span>}</span><div><button className={`foam-filter ${foamOnly ? 'active' : ''}`} aria-pressed={foamOnly} onClick={() => setFoamOnly(!foamOnly)}><Sparkles size={14}/><span>Pakai foam</span></button><label className="sort-select"><ArrowDownAZ size={16}/><select aria-label="Urutkan menu" value={sort} onChange={event => setSort(event.target.value)}><option value="ready">Resep terisi dulu</option><option value="name">Nama A–Z</option></select></label></div></div>
            {store.loading && !store.recipes.length ? <div className="empty-state"><LoaderCircle className="spin"/><h3>Menyiapkan buku racikan…</h3></div> : filtered.length ? <div className={`recipe-grid ${layout === 'list' ? 'list-view' : ''}`}>{filtered.map(recipe => <article className="recipe-card" key={recipe.id}>
              <button className="recipe-card-main" onClick={() => openRecipe(recipe)} aria-label={`Lihat resep ${recipe.name}`}><div className={`card-image tone-${recipe.category.replace(/\W/g, '').toLowerCase()}`}>{recipe.photo ? <img loading="lazy" src={recipe.photo} alt={recipe.name}/> : <DrinkArt name={recipe.name} category={recipe.category} foam={recipe.foam.enabled}/ >}{recipe.foam.enabled && <span className="foam-badge"><Sparkles size={11}/> Pakai foam</span>}{!recipe.photo && <span className="illustration-label">Ilustrasi</span>}</div><div className="card-info"><span className="category-label">{recipe.category}</span><h3>{recipe.name}</h3><div className="card-bottom"><span className={hasRecipe(recipe) ? '' : 'not-filled'}>{hasRecipe(recipe) ? `${recipe.variants[0].ingredients.length} bahan` : 'Belum diisi'}{recipe.variants.length > 1 && <span className="variant-hint"> · Hot / Iced</span>}</span><span className="card-arrow"><ArrowRight size={16}/></span></div></div></button>
              <button className={`card-favorite ${recipe.favorite ? 'is-favorite' : ''}`} disabled={!canEdit} onClick={() => favorite(recipe)} aria-label={`${recipe.favorite ? 'Hapus' : 'Favoritkan'} ${recipe.name}${recipe.favorite ? ' dari favorit' : ''}`} aria-pressed={recipe.favorite}><Heart size={16} fill={recipe.favorite ? 'currentColor' : 'none'}/></button>
            </article>)}</div> : <div className="empty-state">{page === 'favorites' ? <Heart size={36}/> : <Search size={36}/>}<h3>{!store.recipes.length ? 'Buku baru, cerita baru.' : page === 'favorites' && !favorites ? 'Belum ada racikan favorit.' : 'Menunya belum ketemu.'}</h3><p>{!store.recipes.length ? 'Mulai dengan 42 menu Kedai Kopi Cei atau tambahkan racikan sendiri.' : page === 'favorites' && !favorites ? 'Ketuk hati pada menu andalanmu. Nanti semuanya ada di sini.' : 'Coba nama lain, bahan, atau ubah filter kategorinya.'}</p>{!store.recipes.length && <button className="button primary" disabled={!canEdit} onClick={() => void run(() => store.persist(seedRecipes()), '42 menu awal ditambahkan.')}><Plus size={17}/> Isi 42 menu awal</button>}{(query || category !== 'Semua' || foamOnly) && <button className="button secondary" onClick={() => { setQuery(''); setCategory('Semua'); setFoamOnly(false); }}>Reset pencarian</button>}</div>}
          </section>
          <footer className="page-footer"><span className="footer-brand">Cei.</span><p>Takaran diingat. Rasa dijaga.</p><span>Kedai Kopi Cei</span></footer>
          {store.demo && <div className="local-note"><CircleAlert size={14}/><span>Mode lokal — belum tersimpan di database.</span><button className="text-button" onClick={() => navigate('settings')}>Atur penyimpanan <ArrowRight size={13}/></button></div>}
        </>}
      </main>
    </div>
    <nav className="bottom-nav" aria-label="Navigasi mobile"><button className={page === 'recipes' ? 'active' : ''} onClick={() => navigate('recipes')}><BookOpen size={20}/><span>Racikan</span></button><button className={page === 'favorites' ? 'active' : ''} onClick={() => navigate('favorites')}><Heart size={20}/><span>Favorit</span></button><button className="mobile-add" disabled={!canEdit} onClick={addRecipe}><span><Plus size={23}/></span><span>Tambah</span></button><button className={page === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><SettingsIcon size={20}/><span>Pengaturan</span></button></nav>
    {selected && !editor && <RecipeDetail recipe={selected} recipes={store.recipes} onClose={closeRecipe} onEdit={() => setEditor({ recipe: selected, isNew: false })} onFavorite={() => favorite(selected)} onDuplicate={() => setEditor({ recipe: { ...structuredClone(selected), id: newRecipeId(), name: `${selected.name} (salinan)`, favorite: false }, isNew: true })} onDelete={() => deleteRecipe(selected)} disabled={!canEdit} feedback={toast}/>}
    {editor && <RecipeEditor initial={editor.recipe} recipes={store.recipes} isNew={editor.isNew} saving={store.saving} onClose={() => setEditor(null)} onSave={async recipe => { await store.persist([recipe]); setEditor(null); notify(store.cloud ? 'Resep tersimpan di database.' : 'Resep tersimpan di perangkat ini.'); }}/ >}
    {toast && !selected && !editor && <div className={`toast ${toast.error ? 'toast-error' : ''}`} role={toast.error ? 'alert' : 'status'}>{toast.error ? <CircleAlert size={18}/> : <Check size={18}/>}<span>{toast.text}</span><button className="icon-button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X size={15}/></button></div>}
  </div>;
}
