import { CROPS } from '../public/js/shared/crops.js';
import { SEED_PRICES, SELL_PRICES } from '../server/marketConfig.js';

const rows=Object.entries(CROPS).map(([id,crop])=>{
  const minutes=crop.durationMs/60000,seedCost=SEED_PRICES[id],revenue=crop.yield*SELL_PRICES[id],profit=revenue-seedCost;
  return {crop:crop.name,minutes,yield:crop.yield,seedCost,revenue,profit,profitPerHour:Math.round(profit*60/minutes)};
});
console.table(rows);
console.log('Giá thử nghiệm, chưa tính thưởng chợ phiên hoặc đơn hàng NPC.');
