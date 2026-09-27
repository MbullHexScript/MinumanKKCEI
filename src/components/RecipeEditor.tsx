import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, ImagePlus, LoaderCircle, Plus, Save, Sparkles, X } from 'lucide-react';
import { CATEGORIES, recipeSchema, UNITS, type Ingredient, type Recipe } from '../lib/recipes';
import { readPhoto } from '../lib/storage';
import Modal from './Modal';

function IngredientEditor({ value, onChange, label }: { value: Ingredient[]; onChange: (value: Ingredient[]) => void; label: string }) {
  const update = (index: number, patch: Partial<Ingredient>) => onChange(value.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <div className="ingredient-editor">
    {value.length > 0 && <div className="ingredient-labels"><span>Bahan</span><span>Takaran</span><span>Satuan</span><span/></div>}
    {value.map((item, index) => <div className="ingredient-row" key={index}>
      <input aria-label={`${label} bahan ${index + 1}`} placeholder="Nama bahan" required maxLength={100} value={item.name} onChange={event => update(index, { name: event.target.value })}/>
      <input aria-label={`${label} takaran ${index + 1}`} type="number" inputMode="decimal" placeholder="0" min="0.001" max="100000" step="any" required value={item.amount || ''} onChange={event => update(index, { amount: Number(event.target.value) })}/>
      <select aria-label={`${label} satuan ${index + 1}`} value={item.unit} onChange={event => update(index, { unit: event.target.value as Ingredient['unit'] })}>{UNITS.map(unit => <option key={unit}>{unit}</option>)}</select>
      <button className="icon-button" type="button" aria-label={`Hapus ${label.toLowerCase()} bahan ${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))}><X size={16}/></button>
    </div>)}
    <button className="text-button add-ingredient" type="button" onClick={() => onChange([...value, { name: '', amount: 0, unit: 'g' }])}><Plus size={16}/> Tambah bahan {label === 'Foam' ? 'foam' : ''}</button>
  </div>;
}

export default function RecipeEditor({ initial, recipes, isNew, onClose, onSave, saving }: {
  initial: Recipe; recipes: Recipe[]; isNew: boolean; onClose: () => void; onSave: (recipe: Recipe) => Promise<void>; saving: boolean;
}) {
  const [recipe, setRecipe] = useState<Recipe>(structuredClone(initial));
  const [variantIndex, setVariantIndex] = useState(0);
  const [showSteps, setShowSteps] = useState(!!initial.steps);
  const [showFoamSteps, setShowFoamSteps] = useState(!!initial.foam.steps);
  const [error, setError] = useState('');
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const variant = recipe.variants[variantIndex] ?? recipe.variants[0];
  const dirty = JSON.stringify(recipe) !== JSON.stringify(initial) || showSteps !== !!initial.steps || showFoamSteps !== !!initial.foam.steps;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const patch = (value: Partial<Recipe>) => setRecipe(previous => ({ ...previous, ...value }));
  const patchFoam = (value: Partial<Recipe['foam']>) => setRecipe(previous => ({ ...previous, foam: { ...previous.foam, ...value } }));
  const close = () => { if (!saving && !processingPhoto && (!dirty || window.confirm('Perubahan belum disimpan. Keluar dari formulir?'))) onClose(); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    const result = recipeSchema.safeParse({ ...recipe, steps: showSteps ? recipe.steps.trim() : '', foam: { ...recipe.foam, steps: showFoamSteps ? recipe.foam.steps.trim() : '' } });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    try { await onSave(result.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Resep belum tersimpan. Coba lagi.'); }
  };
  return <Modal title={isNew ? 'Tambah resep baru' : 'Edit resep'} onClose={close} className="editor-modal">
    <form onSubmit={submit} className="recipe-form">
      <fieldset disabled={saving || processingPhoto}>
        <div className="editor-intro"><span className="mini-mark">C.</span><div><h2>{isNew ? 'Racikan baru, cerita baru.' : 'Sedikit sentuhan, pas rasanya.'}</h2><p>Catat takarannya. Biar kami yang mengingat.</p></div></div>
        <div className="photo-field"><button type="button" className="photo-upload" onClick={() => photoRef.current?.click()}>{recipe.photo ? <img src={recipe.photo} alt="Foto menu"/> : <ImagePlus size={25}/>}</button><div><button type="button" className="text-button" onClick={() => photoRef.current?.click()}>{processingPhoto ? 'Memproses foto…' : recipe.photo ? 'Ganti foto' : 'Tambahkan foto'}</button><p>Opsional · JPG, PNG, WebP · maks. 15 MB</p>{recipe.photo && <button className="text-button danger" type="button" onClick={() => patch({ photo: '' })}>Hapus foto</button>}</div><input hidden ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
          setProcessingPhoto(true); setError('');
          try { patch({ photo: await readPhoto(file) }); } catch (err) { setError(err instanceof Error ? err.message : 'Foto tidak dapat diproses.'); }
          finally { setProcessingPhoto(false); }
        }}/></div>
        <label className="field">Nama minuman<input autoComplete="off" placeholder="Contoh: Cei Aren" required maxLength={100} value={recipe.name} onChange={event => patch({ name: event.target.value })}/></label>
        <label className="field">Kategori<input list="recipe-categories" required maxLength={50} value={recipe.category} onChange={event => patch({ category: event.target.value })}/><datalist id="recipe-categories">{[...new Set([...CATEGORIES, ...recipes.map(r => r.category)])].map(category => <option key={category} value={category}/>)}</datalist></label>
        <label className="toggle-row"><span><strong>Varian Hot & Iced</strong><small>Atur takaran masing-masing varian.</small></span><input type="checkbox" checked={recipe.variants.length > 1} onChange={event => { setVariantIndex(0); patch({ variants: event.target.checked ? ['Iced', 'Hot'].map(name => ({ name, ingredients: structuredClone(recipe.variants[0].ingredients) })) : [{ name: 'Standar', ingredients: recipe.variants[0].ingredients }] }); }}/><span className="switch"/></label>
        <section className="form-section"><h3>Racikan utama <span>Per gelas</span></h3>
          {recipe.variants.length > 1 && <div className="variant-switch">{recipe.variants.map((item, index) => <button type="button" key={index} className={index === variantIndex ? 'active' : ''} onClick={() => setVariantIndex(index)}>{item.name}{item.ingredients.length > 0 && <Check size={13}/>}</button>)}</div>}
          <IngredientEditor label="Utama" value={variant.ingredients} onChange={ingredients => patch({ variants: recipe.variants.map((item, index) => index === variantIndex ? { ...item, ingredients } : item) })}/>
          {!variant.ingredients.length && <p className="field-hint">Boleh disimpan kosong dulu. Menu akan ditandai “Belum diisi”.</p>}
        </section>
        <label className="toggle-row"><span><strong><Sparkles size={16}/> Pakai foam</strong><small>Tampilkan racikan foam bersama minuman.</small></span><input type="checkbox" checked={recipe.foam.enabled} onChange={event => patchFoam({ enabled: event.target.checked })}/><span className="switch"/></label>
        {recipe.foam.enabled && <section className="foam-form"><label className="field">Sumber racikan foam<select value={recipe.foam.additionalId ?? ''} onChange={event => patchFoam({ additionalId: event.target.value || null })}><option value="">Racikan khusus minuman ini</option>{recipes.filter(item => item.category === 'Additional' && item.id !== recipe.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          {recipe.foam.additionalId ? <p className="field-hint">Bahan dan cara membuat mengikuti resep Additional yang dipilih, untuk satu gelas.</p> : <><IngredientEditor label="Foam" value={recipe.foam.ingredients} onChange={ingredients => patchFoam({ ingredients })}/><label className="checkbox-row"><input type="checkbox" checked={showFoamSteps} onChange={event => setShowFoamSteps(event.target.checked)}/> Tambahkan cara membuat foam</label>{showFoamSteps && <label className="field">Cara membuat foam<textarea maxLength={5000} placeholder="Satu langkah per baris" value={recipe.foam.steps} onChange={event => patchFoam({ steps: event.target.value })}/></label>}</>}
        </section>}
        <label className="checkbox-row"><input type="checkbox" checked={showSteps} onChange={event => setShowSteps(event.target.checked)}/> Tambahkan langkah pembuatan</label>
        {showSteps && <label className="field">Langkah pembuatan<textarea maxLength={5000} placeholder="Satu langkah per baris" value={recipe.steps} onChange={event => patch({ steps: event.target.value })}/></label>}
        <label className="field">Catatan <span className="subtle">(opsional)</span><textarea maxLength={3000} rows={2} placeholder="Pengingat kecil untuk racikan ini…" value={recipe.notes} onChange={event => patch({ notes: event.target.value })}/></label>
      </fieldset>
      {error && <p className="error-message" role="alert">{error}</p>}
      <footer className="editor-actions"><button type="button" className="button secondary" onClick={close} disabled={saving || processingPhoto}>Batal</button><button type="submit" className="button primary" disabled={saving || processingPhoto}>{saving ? <LoaderCircle size={17} className="spin"/> : <Save size={17}/>} {saving ? 'Menyimpan…' : 'Simpan resep'}</button></footer>
    </form>
  </Modal>;
}
