import {RECIPES,PROCESSED_PRICES} from '../public/js/shared/phase5.js';
import {SELL_PRICES,VAC_PRICES} from '../server/marketConfig.js';
const raw={...SELL_PRICES,...Object.fromEntries(VAC_PRICES.filter(r=>r.produceItem).map(r=>[r.produceItem,r.sellPrice]))};
console.table(Object.entries(RECIPES).map(([id,r])=>{const ingredients=Object.entries(r.ingredients).map(([item,n])=>({item,n,price:raw[item]||PROCESSED_PRICES[item]}));const inputValue=ingredients.reduce((sum,i)=>sum+i.n*i.price,0),revenue=r.yield*PROCESSED_PRICES[r.output],margin=revenue-inputValue;return {recipe:id,input:ingredients.map(i=>`${i.item}×${i.n}`).join(' + '),inputValue,durationMinutes:r.durationMs/60000,revenue,margin,marginPerHour:Math.round(margin*3600000/r.durationMs)};}));
console.log('Giá thử nghiệm; margin so với bán nguyên liệu trực tiếp, chưa tính thời gian trồng/VAC và chi phí xây công trình.');
