export const MANGO_CYCLE_MS=4*60*60*1000;
export const MANGO_SELL_PRICE=10;
export const MANGO_TREE=Object.freeze({x:400,y:220,label:'Cây xoài sân nhà'});
export const MANGO_STAGES=Object.freeze([
  {level:1,name:'Cây xoài nhỏ',harvests:0,yield:3,size:100},
  {level:2,name:'Cây xoài đang lớn',harvests:5,yield:5,size:120},
  {level:3,name:'Cây xoài trưởng thành',harvests:15,yield:8,size:145},
  {level:4,name:'Cây xoài cổ thụ',harvests:30,yield:12,size:170}
].map(Object.freeze));
export const MANGO_ITEM=Object.freeze({mango:{name:'Xoài',category:'produce',stackLimit:999,description:'Xoài sân nhà, thu hoạch mỗi 4 giờ và bán tại chợ.',icon:'🥭',color:'#e7b83d'}});
export function mangoStage(harvests){return [...MANGO_STAGES].reverse().find(s=>harvests>=s.harvests)||MANGO_STAGES[0];}
