export const NPCS=Object.freeze({
  tu:{name:'Bác Tư',role:'Nông dân',scene:'farm',color:'#6b844d',icon:'🌾',waypoints:{morning:[350,660],noon:[430,650],afternoon:[370,690],night:[750,700]},fallback:[720,650]},
  lan:{name:'Cô Lan',role:'Thu mua',scene:'market',color:'#b96f5b',icon:'🧺',waypoints:{morning:[700,430],noon:[730,500],afternoon:[700,470],night:[700,430]},fallback:[700,430]},
  ba:{name:'Ông Ba',role:'Người kể chuyện',scene:'farm',color:'#7b6d94',icon:'📖',waypoints:{morning:[870,535],noon:[920,640],afternoon:[830,640],night:[810,650]},fallback:[780,650]},
  na:{name:'Bé Na',role:'Hàng xóm',scene:'farm',color:'#d0904d',icon:'🌼',waypoints:{morning:[600,680],noon:[780,650],afternoon:[590,660],night:[570,680]},fallback:[700,650]}
});
export const NPC_IDS=Object.keys(NPCS);
