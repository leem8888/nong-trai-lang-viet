import { VAC_ITEMS } from './vac.js';
import { PHASE5_ITEMS } from './phase5.js';
// Phase 2 trial values. Existing plantings retain their duration snapshot.
export const CROPS = Object.freeze({
  rice: { name: 'Lúa', seed: 'seed_rice', produce: 'rice', durationMs: 90 * 60000, yield: 3, color: '#d3b94d', shape: 'stalk', description: 'Lúa nước của làng.' },
  mustard: { name: 'Rau cải', seed: 'seed_mustard', produce: 'mustard', durationMs: 15 * 60000, yield: 2, color: '#76b64a', shape: 'leaf', description: 'Rau xanh thu hoạch nhanh.' },
  tomato: { name: 'Cà chua', seed: 'seed_tomato', produce: 'tomato', durationMs: 45 * 60000, yield: 3, color: '#d85842', shape: 'fruit', description: 'Quả đỏ mọng.' },
  carrot: { name: 'Cà rốt', seed: 'seed_carrot', produce: 'carrot', durationMs: 25 * 60000, yield: 2, color: '#e9893c', shape: 'root', description: 'Củ ngọt dưới đất.' },
  corn: { name: 'Ngô', seed: 'seed_corn', produce: 'corn', durationMs: 60 * 60000, yield: 2, color: '#e5c651', shape: 'cob', description: 'Bắp vàng ven ruộng.' },
  soy: { name: 'Đậu nành', seed: 'seed_soy', produce: 'soy', durationMs: 35 * 60000, yield: 3, color: '#a9bd6a', shape: 'pod', description: 'Hạt đậu giàu dinh dưỡng.' }
});
export const CROP_IDS = Object.keys(CROPS);
export const ITEMS = Object.freeze({...Object.fromEntries(CROP_IDS.flatMap(id => {
  const crop = CROPS[id];
  return [
    [crop.seed, { name: `Hạt ${crop.name.toLowerCase()}`, category: 'seed', stackLimit: 999, description: `Gieo ${crop.name.toLowerCase()} trên đất đã cuốc.`, color: crop.color }],
    [crop.produce, { name: crop.name, category: 'produce', stackLimit: 999, description: crop.description, color: crop.color }]
  ];
})),...VAC_ITEMS,...PHASE5_ITEMS});
export const FIELD = Object.freeze({ x: 105, y: 730, columns: 5, rows: 3, stepX: 82, stepY: 55, width: 70, height: 42 });
export const tileRect = (x, y) => ({ x: FIELD.x + x * FIELD.stepX, y: FIELD.y + y * FIELD.stepY, w: FIELD.width, h: FIELD.height });
export const tileCenter = (x, y) => ({ x: FIELD.x + x * FIELD.stepX + FIELD.width / 2, y: FIELD.y + y * FIELD.stepY + FIELD.height / 2 });
export function tileAt(worldX, worldY) {
  const x = Math.floor((worldX - FIELD.x) / FIELD.stepX), y = Math.floor((worldY - FIELD.y) / FIELD.stepY);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= FIELD.columns || y < 0 || y >= FIELD.rows) return null;
  const r = tileRect(x, y);
  return worldX >= r.x && worldX < r.x + r.w && worldY >= r.y && worldY < r.y + r.h ? { x, y } : null;
}
export function cropProgress(crop, serverTime) {
  const duration = crop.durationMs - crop.bonusMs;
  if (!Number.isSafeInteger(crop.plantedAt) || !Number.isSafeInteger(duration) || duration <= 0 || serverTime < crop.plantedAt) throw new RangeError('Invalid crop timestamp or duration');
  const progress = Math.min(1, Math.max(0, (serverTime - crop.plantedAt) / duration));
  return { progress, stage: progress >= 1 ? 'MATURE' : progress >= .6 ? 'GROWING' : progress >= .25 ? 'SPROUT' : 'SEED', remainingMs: Math.max(0, duration - (serverTime - crop.plantedAt)) };
}
