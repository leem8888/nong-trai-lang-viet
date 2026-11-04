import {DECORATIONS} from './shared/phase5.js';
const products=['tilapia','carp','chick','egg','fish_feed','chicken_feed','milled_rice','corn_flour','soy_milk','tomato_sauce','dried_fish','fried_rice','rice','mustard','tomato','carrot','corn','soy'];
const decorations=Object.keys(DECORATIONS);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function itemArtwork(id,name){
  const decor=id.startsWith('decor_'),seed=id.startsWith('seed_')||id.startsWith('fingerling_');
  const key=id.replace(/^seed_|^fingerling_/,'');
  const index=decor?decorations.indexOf(id.slice(6)):products.indexOf(key);
  const count=decor?decorations.length:products.length,source=decor?'decorations-v9.webp':'product-icons-v10.webp';
  return `<span class="product-picture"><svg viewBox="${Math.max(0,index)*128} 0 128 128" role="img" aria-label="${escape(name)}"><image href="/assets/${source}" width="${count*128}" height="128"/></svg>${seed?'<span class="seed-label">Giống</span>':''}</span>`;
}
