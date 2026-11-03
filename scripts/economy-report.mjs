import { CROPS } from '../public/js/shared/crops.js';
import { SEED_PRICES, SELL_PRICES, VAC_PRICES } from '../server/marketConfig.js';
import { FISH, CHICKEN } from '../public/js/shared/vac.js';

const rows=Object.entries(CROPS).map(([id,crop])=>{
  const minutes=crop.durationMs/60000,seedCost=SEED_PRICES[id],revenue=crop.yield*SELL_PRICES[id],profit=revenue-seedCost;
  return {crop:crop.name,minutes,yield:crop.yield,seedCost,revenue,profit,profitPerHour:Math.round(profit*60/minutes)};
});
console.table(rows);
const buy=id=>VAC_PRICES.find(row=>row.seedItem===id).buyPrice;
const sell=id=>VAC_PRICES.find(row=>row.produceItem===id).sellPrice;
const fish=Object.values(FISH).map(row=>{
  const cost=buy(row.fingerling)+buy('fish_feed'),minutes=Math.ceil(row.durationMs*.9/60000),revenue=row.yield*sell(row.produce);
  return {cycle:row.name,minutes,initialCost:cost,revenue,profit:revenue-cost,profitPerHour:Math.round((revenue-cost)*60/minutes)};
});
const eggCycle=CHICKEN.eggMs*CHICKEN.maxEggs/60000,eggRevenue=CHICKEN.maxEggs*sell('egg');
fish.push({cycle:'Gà · chu kỳ trứng sau trưởng thành',minutes:eggCycle,initialCost:buy('chicken_feed'),revenue:eggRevenue,
  profit:eggRevenue-buy('chicken_feed'),profitPerHour:Math.round((eggRevenue-buy('chicken_feed'))*60/eggCycle)});
console.table(fish);
console.log(`Gà con tốn ${buy('chick')} Đồng và lớn sau ${CHICKEN.growthMs/60000} phút; hai chu kỳ trứng mới hoàn vốn. Giá thử nghiệm, chưa tính thưởng chợ phiên/đơn hàng.`);
