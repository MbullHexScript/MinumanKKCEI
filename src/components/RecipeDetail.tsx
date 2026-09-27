import { useState } from 'react';
import { ArrowUpRight, CircleHelp, Copy, Heart, Pencil, Snowflake, Sparkles, ThermometerSun, Trash2 } from 'lucide-react';
import type { Ingredient, Recipe } from '../lib/recipes';
import { formatAmount } from '../lib/recipes';
import { DrinkArt } from './DrinkArt';
import Modal from './Modal';

function Ingredients({ ingredients }: { ingredients: Ingredient[] }) {
  return ingredients.length ? <ul className="ingredient-list">{ingredients.map((item, index) => <li key={index}><span>{item.name}</span><strong>{formatAmount(item.amount)} <small>{item.unit}</small></strong></li>)}</ul>
    : <div className="empty-ingredients"><CircleHelp size={19}/><span>Takaran belum diisi. Tambahkan resep aslinya lewat Edit resep.</span></div>;
}
function Steps({ text }: { text: string }) {
  return <ol className="steps">{text.split('\n').filter(line => line.trim()).map((line, index) => <li key={index}>{line}</li>)}</ol>;
}
export default function RecipeDetail({ recipe, recipes, onClose, onEdit, onFavorite, onDuplicate, onDelete, disabled, feedback }: {
  recipe: Recipe; recipes: Recipe[]; onClose: () => void; onEdit: () => void; onFavorite: () => void; onDuplicate: () => void; onDelete: () => void; disabled: boolean;
  feedback: { text: string; error?: boolean } | null;
}) {
  const [variantIndex, setVariantIndex] = useState(0);
  const variant = recipe.variants[variantIndex] ?? recipe.variants[0];
  const additional = recipes.find(item => item.id === recipe.foam.additionalId);
  return <Modal title="Detail racikan" onClose={onClose} className="detail-modal">
    <div className="detail-heading">
      <div className={`detail-image tone-${recipe.category.replace(/\W/g, '').toLowerCase()}`}>{recipe.photo ? <img src={recipe.photo} alt={recipe.name}/> : <DrinkArt name={recipe.name} category={recipe.category} foam={recipe.foam.enabled}/>}</div>
      <div><span className="category-label">{recipe.category}</span><h2>{recipe.name}</h2><span className="subtle">Takaran untuk 1 gelas</span>{recipe.foam.enabled && <span className="foam-badge"><Sparkles size={12}/> Pakai foam</span>}</div>
      <button className={`icon-button detail-favorite ${recipe.favorite ? 'is-favorite' : ''}`} onClick={onFavorite} disabled={disabled} aria-label={recipe.favorite ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}><Heart size={21} fill={recipe.favorite ? 'currentColor' : 'none'}/></button>
    </div>
    <div className="detail-content">
      {recipe.variants.length > 1 && <div className="variant-switch" aria-label="Varian minuman">{recipe.variants.map((item, index) => <button key={index} className={variantIndex === index ? 'active' : ''} aria-pressed={variantIndex === index} onClick={() => setVariantIndex(index)}>{item.name === 'Hot' ? <ThermometerSun size={17}/> : <Snowflake size={17}/>} {item.name}</button>)}</div>}
      <section className="recipe-section"><div className="section-heading"><h3>Racikan utama</h3><span>{variant.ingredients.length} bahan</span></div><Ingredients ingredients={variant.ingredients}/></section>
      {recipe.foam.enabled && <section className="foam-section"><div className="section-heading"><h3><Sparkles size={18}/> Racikan foam</h3><span>Per gelas</span></div>{additional && <p className="linked-additional">Menggunakan {additional.name} <ArrowUpRight size={14}/></p>}<Ingredients ingredients={additional ? additional.variants[0].ingredients : recipe.foam.ingredients}/>{(additional?.steps || recipe.foam.steps) && <><h4>Cara membuat foam</h4><Steps text={additional?.steps || recipe.foam.steps}/></>}</section>}
      {recipe.steps && <section className="recipe-section"><h3>Cara membuat</h3><Steps text={recipe.steps}/></section>}
      {recipe.notes && <section className="recipe-notes"><h4>Catatan barista</h4><p>{recipe.notes}</p></section>}
    </div>
    {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`detail-feedback ${feedback.error ? 'error-message' : 'success-message'}`}>{feedback.text}</p>}
    <footer className="detail-actions"><button className="button primary" onClick={onEdit} disabled={disabled}><Pencil size={17}/> Edit resep</button><button className="icon-button outlined" onClick={onDuplicate} disabled={disabled} aria-label="Duplikat resep" title="Duplikat resep"><Copy size={18}/></button><button className="icon-button outlined danger" onClick={onDelete} disabled={disabled} aria-label="Hapus resep" title="Hapus resep"><Trash2 size={18}/></button></footer>
  </Modal>;
}
