export const NPCS=Object.freeze({
  tu:{name:'Bác Tư',role:'Nông dân',scene:'market',color:'#6b844d',icon:'🌾',waypoints:{morning:[1100,650],noon:[1280,560],afternoon:[1120,1010],night:[1470,1130]},fallback:[1100,650]},
  lan:{name:'Cô Lan',role:'Thu mua',scene:'market',color:'#b96f5b',icon:'🧺',waypoints:{morning:[700,430],noon:[730,500],afternoon:[700,470],night:[700,430]},fallback:[700,430]},
  ba:{name:'Ông Ba',role:'Người kể chuyện',scene:'market',color:'#7b6d94',icon:'📖',waypoints:{morning:[1470,540],noon:[1500,600],afternoon:[1370,530],night:[1560,1130]},fallback:[1470,540]},
  na:{name:'Bé Na',role:'Hàng xóm',scene:'market',color:'#d0904d',icon:'🌼',waypoints:{morning:[1060,1030],noon:[1260,1010],afternoon:[1420,630],night:[980,1110]},fallback:[1060,1030]}
});
export const NPC_IDS=Object.keys(NPCS);
export const npcsForScene=(npcs,scene)=>scene==='farm'?[]:(npcs||[]).filter(n=>n.scene==='market');
