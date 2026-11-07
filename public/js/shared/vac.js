// Trial VAC values. Each animal stores its own duration and reward snapshots.
export const FISH = Object.freeze({
  tilapia: {name:'Cá rô phi', fingerling:'fingerling_tilapia', produce:'tilapia', durationMs:90*60000, yield:2, color:'#d5b56f'},
  carp: {name:'Cá chép', fingerling:'fingerling_carp', produce:'carp', durationMs:150*60000, yield:2, color:'#ef9e62'}
});
export const CHICKEN = Object.freeze({name:'Gà con',item:'chick',growthMs:120*60000,eggMs:45*60000,maxEggs:3});
export const VAC_POINTS = Object.freeze({pond:{x:950,y:690,label:'Ao cá'},coop:{x:1033,y:224,label:'Chuồng gà'}});
export const VAC_RECIPES = Object.freeze({
  corn_feed:{name:'Ngô → thức ăn gà',input:'corn',output:'chicken_feed',yield:2},
  rice_feed:{name:'Lúa → thức ăn gà',input:'rice',output:'chicken_feed',yield:2},
  soy_feed:{name:'Đậu nành → thức ăn cá',input:'soy',output:'fish_feed',yield:2}
});
export const VAC_ITEMS = Object.freeze({
  fingerling_tilapia:{name:'Cá rô phi giống',category:'stock',stackLimit:999,icon:'🐟',color:'#d5b56f',description:'Thả vào ao để nuôi cá rô phi.'},
  fingerling_carp:{name:'Cá chép giống',category:'stock',stackLimit:999,icon:'🐟',color:'#ef9e62',description:'Thả vào ao để nuôi cá chép.'},
  tilapia:{name:'Cá rô phi',category:'produce',stackLimit:999,icon:'🐟',color:'#d5b56f',description:'Cá đã thu hoạch, bán tại chợ.'},
  carp:{name:'Cá chép',category:'produce',stackLimit:999,icon:'🐟',color:'#ef9e62',description:'Cá đã thu hoạch, bán tại chợ.'},
  chick:{name:'Gà con',category:'stock',stackLimit:999,icon:'🐣',color:'#f0d08c',description:'Thêm vào chuồng để nuôi gà.'},
  egg:{name:'Trứng gà',category:'produce',stackLimit:999,icon:'🥚',color:'#f4e4b2',description:'Nhặt từ chuồng, bán tại chợ.'},
  fish_feed:{name:'Thức ăn cá',category:'feed',stackLimit:999,icon:'🌿',color:'#a6ba85',description:'Cho một con cá ăn một lần.'},
  chicken_feed:{name:'Thức ăn gà',category:'feed',stackLimit:999,icon:'🌽',color:'#e8bd70',description:'Mở chu kỳ đẻ trứng cho một con gà.'}
});
