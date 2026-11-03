import { CROPS, CROP_IDS } from '../public/js/shared/crops.js';

// Trial prices for playtesting; all money is integer Đồng Làng.
export const START_BALANCE = 200;
export const MAX_BALANCE = 9_000_000_000_000;
export const SEED_PRICES = Object.freeze({ rice:65, mustard:14, tomato:45, carrot:19, corn:35, soy:35 });
export const SELL_PRICES = Object.freeze({ rice:45, mustard:12, tomato:25, carrot:18, corn:35, soy:22 });
export const ORDERS = Object.freeze([
  { id:'greens', npc:'Cô Lan', title:'Rau cho bữa cơm làng', items:{mustard:4,carrot:2}, reward:105 },
  { id:'summer', npc:'Cô Lan', title:'Giỏ quả mùa hè', items:{tomato:3,soy:2}, reward:145 },
  { id:'harvest', npc:'Bác Tư', title:'Vụ mùa no ấm', items:{rice:2,corn:2}, reward:195 },
  { id:'beans', npc:'Bác Tư', title:'Rau củ cho hội làng', items:{carrot:3,soy:3}, reward:150 },
  { id:'family', npc:'Cô Lan', title:'Mâm cơm quê', items:{mustard:2,tomato:2,rice:1}, reward:150 },
  { id:'market', npc:'Cô Lan', title:'Hàng cho chợ phiên', items:{corn:3,tomato:2}, reward:190 }
]);
export function marketDay(at) {
  const day=Math.floor(at/86400000), start=day*86400000;
  return { id:new Date(start).toISOString().slice(0,10), featured:CROP_IDS[((day%CROP_IDS.length)+CROP_IDS.length)%CROP_IDS.length], startAt:start, endAt:start+86400000, status:'OPEN' };
}
export function marketCatalog(at) {
  const day=marketDay(at);
  return CROP_IDS.map(id=>({ cropId:id, name:CROPS[id].name, seedItem:CROPS[id].seed, produceItem:CROPS[id].produce,
    buyPrice:SEED_PRICES[id], sellPrice:id===day.featured?Math.floor(SELL_PRICES[id]*115/100):SELL_PRICES[id],
    baseSellPrice:SELL_PRICES[id], featured:id===day.featured, priceVersion:1 }));
}
