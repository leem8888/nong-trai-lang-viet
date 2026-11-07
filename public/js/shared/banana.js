export const BANANA_HOUR_MS=60*60*1000;
export const BANANA_CYCLE_MS=4*BANANA_HOUR_MS;
export const BANANA_YIELD=6;
export const BANANA_SELL_PRICE=8;
export const BANANA_TREE=Object.freeze({x:210,y:-80,label:'Khóm chuối góc vườn'});
export const BANANA_PHASES=Object.freeze(['Khóm chuối','Đang ra hoa','Quả còn nhỏ','Quả đã lớn','Chuối chín vàng']);
export const BANANA_ITEM=Object.freeze({banana:{name:'Chuối',category:'produce',stackLimit:999,description:'Chuối vườn chín sau 4 giờ, bán theo nải tại chợ.',icon:'🍌',color:'#e5c24e'}});
export function bananaPhase(startedAt,at){return Math.min(4,Math.max(0,Math.floor((at-startedAt)/BANANA_HOUR_MS)));}
