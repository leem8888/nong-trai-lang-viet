const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function itemArtwork(id,name){
  const seed=id.startsWith('seed_')||id.startsWith('fingerling_');
  const key=id.replace(/^seed_|^fingerling_/,'');
  return `<span class="product-picture"><img src="/assets/items-v11/${encodeURIComponent(key)}.${id==='mango'?'svg':'webp'}" width="128" height="128" alt="${escape(name)}" loading="lazy" decoding="async">${seed?'<span class="seed-label">Giống</span>':''}</span>`;
}
