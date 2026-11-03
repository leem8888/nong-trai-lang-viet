// Trial balance values. IDs and recipe versions remain stable for persisted jobs.
export const RECIPES = Object.freeze({
  rice_flour: {name:'Xay lúa thành gạo',building:'mill',ingredients:{rice:2},output:'milled_rice',yield:2,durationMs:120000,version:1,unlockLevel:0,icon:'🍚'},
  corn_flour: {name:'Xay bột ngô',building:'mill',ingredients:{corn:2},output:'corn_flour',yield:2,durationMs:120000,version:1,unlockLevel:0,icon:'🌽'},
  soy_milk: {name:'Nấu sữa đậu nành',building:'kitchen',ingredients:{soy:2},output:'soy_milk',yield:2,durationMs:150000,version:1,unlockLevel:0,icon:'🥛'},
  tomato_sauce: {name:'Nấu sốt cà chua',building:'kitchen',ingredients:{tomato:2},output:'tomato_sauce',yield:2,durationMs:150000,version:1,unlockLevel:0,icon:'🍅'},
  dried_fish: {name:'Phơi cá khô',building:'rack',ingredients:{tilapia:1},output:'dried_fish',yield:1,durationMs:180000,version:1,unlockLevel:0,icon:'🐟'},
  fried_rice: {name:'Cơm chiên trứng',building:'kitchen',ingredients:{milled_rice:1,egg:1},output:'fried_rice',yield:1,durationMs:180000,version:1,unlockLevel:0,icon:'🍳'}
});
export const BUILDINGS = Object.freeze({
  mill:{name:'Cối xay lúa',w:2,h:2,slots:1,cost:90,color:'#9b7442',icon:'⚙'},
  kitchen:{name:'Bếp quê',w:2,h:2,slots:2,cost:110,color:'#b66e4b',icon:'♨'},
  rack:{name:'Giàn phơi',w:2,h:1,slots:1,cost:70,color:'#ba9a5d',icon:'☀'}
});
export const DECORATIONS = Object.freeze({
  bamboo_fence:{name:'Hàng rào tre',cost:9,blocking:true,icon:'🎋'},bamboo_gate:{name:'Cổng tre',cost:18,blocking:false,icon:'⛩'},brick_path:{name:'Đường gạch đỏ',cost:5,blocking:false,icon:'▦'},stone_path:{name:'Đường đá',cost:5,blocking:false,icon:'▤'},water_jar:{name:'Lu nước',cost:15,blocking:true,icon:'🏺'},lotus_pot:{name:'Chậu sen',cost:18,blocking:true,icon:'🪷'},chrysanthemum:{name:'Hoa cúc',cost:8,blocking:false,icon:'🌼'},portulaca:{name:'Hoa mười giờ',cost:8,blocking:false,icon:'🌸'},bench:{name:'Ghế gỗ',cost:16,blocking:true,icon:'▰'},lantern:{name:'Đèn lồng',cost:14,blocking:true,icon:'🏮'},banana:{name:'Bụi chuối',cost:20,blocking:true,icon:'🌴'},areca:{name:'Cây cau',cost:20,blocking:true,icon:'🌳'},bougainvillea:{name:'Giàn hoa giấy',cost:22,blocking:true,icon:'🌺'},farm_sign:{name:'Biển tên farm',cost:12,blocking:true,icon:'▣'},haystack:{name:'Đống rơm',cost:12,blocking:true,icon:'🌾'}
});
export const EXPANSIONS = Object.freeze([{level:1,cost:180,name:'Khu đất phía tây'},{level:2,cost:280,name:'Khu đất phía đông'}]);
export const PHASE5_ITEMS = Object.freeze({
  milled_rice:{name:'Gạo',category:'processed',stackLimit:999,icon:'🍚'},corn_flour:{name:'Bột ngô',category:'processed',stackLimit:999,icon:'🌽'},soy_milk:{name:'Sữa đậu nành',category:'processed',stackLimit:999,icon:'🥛'},tomato_sauce:{name:'Sốt cà chua',category:'processed',stackLimit:999,icon:'🍅'},dried_fish:{name:'Cá khô',category:'processed',stackLimit:999,icon:'🐟'},fried_rice:{name:'Cơm chiên trứng',category:'processed',stackLimit:999,icon:'🍳'},
  ...Object.fromEntries(Object.entries(DECORATIONS).map(([id,d])=>[`decor_${id}`,{name:d.name,category:'decoration',stackLimit:999,icon:d.icon}])),
  ...Object.fromEntries(Object.entries(BUILDINGS).map(([id,d])=>[`building_${id}`,{name:d.name,category:'building',stackLimit:999,icon:d.icon}]))
});
export const PROCESSED_PRICES = Object.freeze({milled_rice:55,corn_flour:45,soy_milk:30,tomato_sauce:35,dried_fish:45,fried_rice:100});
export const TILE_SIZE=48;
export function footprint(definition,rotation){return rotation%2?{w:definition.h||1,h:definition.w||1}:{w:definition.w||1,h:definition.h||1};}
export function unlockedTile(x,y,level){return x>=2&&x<=27&&y>=2&&y<=18&&(x>=12&&x<=20||level>=1&&x<=11||level>=2&&x>=21);}
