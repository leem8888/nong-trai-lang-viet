import { CROPS, CROP_IDS, ITEMS, FIELD, STARTER_PLOTS, MAX_PLOTS, plotIndex, plotUnlockPrice, tileCenter, cropProgress } from '../public/js/shared/crops.js';
import { now } from './time.js';
import { validPosition } from './world.js';
import { recordQuestEvent } from './quests.js';

const seedIds = CROP_IDS.map(id => CROPS[id].seed);

export function seedFarmInventory(db, farmId) {
  const insert = db.prepare('INSERT INTO inventory_items(farm_id,item_id,quantity) VALUES (?,?,4)');
  for (const itemId of seedIds) insert.run(farmId, itemId);
  db.prepare('INSERT OR IGNORE INTO farm_plot_expansions VALUES (?,?,0,?)').run(farmId,STARTER_PLOTS,now());
}
export function plotState(db,farmId){
  const row=db.prepare('SELECT unlocked_count,purchased_count FROM farm_plot_expansions WHERE farm_id=?').get(farmId);
  const unlocked=row?.unlocked_count??STARTER_PLOTS,purchased=row?.purchased_count??0;
  return {unlocked,max:MAX_PLOTS,purchased,nextPrice:unlocked<MAX_PLOTS?plotUnlockPrice(purchased):null};
}

function farmOf(db, userId) {
  return db.prepare('SELECT id FROM farms WHERE owner_id=?').get(userId)?.id;
}
export function inventory(db, farmId) {
  const quantities = Object.fromEntries(db.prepare('SELECT item_id,quantity FROM inventory_items WHERE farm_id=?').all(farmId).map(row => [row.item_id,row.quantity]));
  return Object.entries(ITEMS).map(([id,definition]) => ({ id, ...definition, quantity: quantities[id] || 0 }));
}
export function addItem(db, farmId, itemId, quantity) {
  if (!ITEMS[itemId] || !Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Vật phẩm không hợp lệ.');
  if (quantity > ITEMS[itemId].stackLimit) throw new Error('Kho đã đầy.');
  const changed = db.prepare(`INSERT INTO inventory_items(farm_id,item_id,quantity) VALUES (?,?,?)
    ON CONFLICT(farm_id,item_id) DO UPDATE SET quantity=inventory_items.quantity+excluded.quantity
    WHERE inventory_items.quantity+excluded.quantity<=999`).run(farmId,itemId,quantity);
  if (!changed.changes) throw new Error('Kho đã đầy.');
}
export function spendItem(db, farmId, itemId, quantity) {
  if (!ITEMS[itemId] || !Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Vật phẩm không hợp lệ.');
  const changed=db.prepare('UPDATE inventory_items SET quantity=quantity-? WHERE farm_id=? AND item_id=? AND quantity>=?').run(quantity,farmId,itemId,quantity);
  if (!changed.changes) throw new Error('Không đủ hạt giống.');
}
function activeCrop(db, farmId, x, y) {
  return db.prepare('SELECT * FROM farm_crops WHERE farm_id=? AND tile_x=? AND tile_y=? AND harvested_at IS NULL').get(farmId,x,y);
}
function tileState(db, farmId, x, y) {
  return db.prepare('SELECT state FROM farm_soil_tiles WHERE farm_id=? AND tile_x=? AND tile_y=?').get(farmId,x,y)?.state || 'EMPTY';
}
export function farmingState(db, userId, at = now()) {
  const farmId=farmOf(db,userId);
  if (!farmId) return null;
  const soil=new Map(db.prepare('SELECT tile_x,tile_y,state FROM farm_soil_tiles WHERE farm_id=?').all(farmId).map(row=>[`${row.tile_x}:${row.tile_y}`,row.state]));
  const crops=new Map(db.prepare('SELECT * FROM farm_crops WHERE farm_id=? AND harvested_at IS NULL').all(farmId).map(row=>[`${row.tile_x}:${row.tile_y}`,row]));
  const plots=plotState(db,farmId),tiles=[];
  for(let y=0;y<FIELD.rows;y++) for(let x=0;x<FIELD.columns;x++) {
    const key=`${x}:${y}`, crop=crops.get(key);
    tiles.push({x,y,locked:plotIndex(x,y)>=plots.unlocked,state:soil.get(key)||'EMPTY',crop:crop ? {
      id:crop.id,cropId:crop.crop_id,plantedAt:crop.planted_at,durationMs:crop.duration_ms,bonusMs:crop.bonus_ms,wateredAt:crop.watered_at,
      ...cropProgress({plantedAt:crop.planted_at,durationMs:crop.duration_ms,bonusMs:crop.bonus_ms},at)
    } : null});
  }
  return {farmId,serverTime:at,plots,tiles,inventory:inventory(db,farmId)};
}

export function performFarmAction(db, userId, payload, at = now()) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !Number.isSafeInteger(at)) throw new Error('Dữ liệu không hợp lệ.');
  const farmId=farmOf(db,userId);
  if (!farmId || payload.farmId !== farmId) throw new Error('Không có quyền với nông trại này.');
  const action=payload.action;
    if (!['till','plant','water','harvest','claim_seeds','unlock_plot'].includes(action)) throw new Error('Công cụ không hợp lệ.');
  return db.transaction(() => {
    if(action==='unlock_plot'){
      if(![3,4].includes(Object.keys(payload).length)||Object.keys(payload).some(k=>!['action','farmId','requestId','expectedCount'].includes(k))||!(/^[a-f0-9-]{36}$/i).test(payload.requestId||''))throw Error('Yêu cầu mở ô không hợp lệ.');
      const player=db.prepare('SELECT scene FROM player_states WHERE user_id=?').get(userId);
      if(player?.scene!=='farm')throw Error('Hãy về nông trại để mở ô.');
      const receipt=db.prepare('SELECT plot_count FROM farm_plot_receipts WHERE farm_id=? AND request_key=?').get(farmId,payload.requestId);
      if(receipt){if(payload.expectedCount!==undefined&&payload.expectedCount!==receipt.plot_count)throw Error('Mã yêu cầu đã dùng cho ô khác.');return {message:`Đã mở ô đất thứ ${receipt.plot_count}.`,replayed:true,state:farmingState(db,userId,at)};}
      const plots=plotState(db,farmId);if(plots.nextPrice===null)throw Error('Đã mở toàn bộ ô ruộng.');
      if(payload.expectedCount!==undefined&&payload.expectedCount!==plots.unlocked+1)throw Error('Số ô và giá mở ô đã thay đổi. Hãy xem lại rồi xác nhận.');
      const paid=db.prepare('UPDATE wallets SET balance=balance-?,updated_at=? WHERE user_id=? AND balance>=?').run(plots.nextPrice,at,userId,plots.nextPrice);
      if(!paid.changes)throw Error('Không đủ Đồng Làng để mở ô ruộng.');
      db.prepare('INSERT OR IGNORE INTO farm_plot_expansions VALUES (?,?,0,?)').run(farmId,STARTER_PLOTS,at);
      db.prepare('UPDATE farm_plot_expansions SET unlocked_count=unlocked_count+1,purchased_count=purchased_count+1,updated_at=? WHERE farm_id=?').run(at,farmId);
      const balance=db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(userId).balance;
      const transaction=db.prepare("INSERT INTO economy_transactions(user_id,farm_id,kind,item_id,quantity,unit_price,delta,balance_after,request_key,created_at) VALUES (?,?,'buy','farm_plot',1,?,?,?,?,?)")
        .run(userId,farmId,plots.nextPrice,-plots.nextPrice,balance,'plot:'+payload.requestId,at);
      db.prepare('INSERT INTO farm_plot_receipts VALUES (?,?,?,?,?,?)').run(farmId,payload.requestId,plots.unlocked+1,plots.nextPrice,transaction.lastInsertRowid,at);
      return {message:`Đã mở ô đất thứ ${plots.unlocked+1} với ${plots.nextPrice.toLocaleString('vi-VN')} Đồng Làng.`,state:farmingState(db,userId,at)};
    }
    if (action === 'claim_seeds') {
      const total=db.prepare(`SELECT COALESCE(SUM(quantity),0) AS n FROM inventory_items WHERE farm_id=? AND item_id LIKE 'seed_%'`).get(farmId).n;
      if (total > 0) throw new Error('Chỉ nhận thêm khi đã hết hạt giống.');
      const day=new Date(at).toISOString().slice(0,10);
      const claimed=db.prepare('INSERT OR IGNORE INTO farm_seed_claims VALUES (?,?)').run(farmId,day);
      if (!claimed.changes) throw new Error('Hôm nay bạn đã nhận hạt giống.');
      for(const itemId of seedIds) addItem(db,farmId,itemId,2);
      return { message:'Đã nhận gói hạt giống trong ngày.', state:farmingState(db,userId,at) };
    }
    const x=payload.x,y=payload.y;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x<0 || x>=FIELD.columns || y<0 || y>=FIELD.rows) throw new Error('Ô đất không hợp lệ.');
    if(plotIndex(x,y)>=plotState(db,farmId).unlocked)throw Error('Ô đất chưa mở. Hãy mở rộng ruộng trước.');
    const player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farmId);
    const center=tileCenter(x,y);
    if (!validPosition(center.x,center.y)) throw new Error('Ô đất bị vật cản chiếm chỗ.');
    if (!player || player.scene!=='farm' || Math.hypot(player.x-center.x,player.y-center.y)>110) throw new Error('Tương tác quá xa.');
    const state=tileState(db,farmId,x,y), crop=activeCrop(db,farmId,x,y);
    let message='';
    if (action==='till') {
      if (state!=='EMPTY') throw new Error('Ô đất đã được chuẩn bị.');
      db.prepare('INSERT INTO farm_soil_tiles VALUES (?,?,?,?,?)').run(farmId,x,y,'TILLED',at);
      message='Đã cuốc đất.';
    } else if (action==='plant') {
      if (!['TILLED','WATERED'].includes(state) || crop) throw new Error('Cần một ô đất đã cuốc và chưa có cây.');
      if (typeof payload.cropId!=='string' || !Object.hasOwn(CROPS,payload.cropId)) throw new Error('Loại hạt không hợp lệ.');
      const definition=CROPS[payload.cropId];
      spendItem(db,farmId,definition.seed,1);
      const watered=state==='WATERED' ? at : null;
      db.prepare(`INSERT INTO farm_crops(farm_id,tile_x,tile_y,crop_id,planted_at,duration_ms,bonus_ms,watered_at,yield_quantity)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(farmId,x,y,payload.cropId,at,definition.durationMs,watered?Math.floor(definition.durationMs*.1):0,watered,definition.yield);
      db.prepare('UPDATE farm_soil_tiles SET state=?,updated_at=? WHERE farm_id=? AND tile_x=? AND tile_y=?').run('PLANTED',at,farmId,x,y);
      message=`Đã gieo ${definition.name.toLowerCase()}.`;
    } else if (action==='water') {
      if (state==='TILLED') {
        db.prepare('UPDATE farm_soil_tiles SET state=?,updated_at=? WHERE farm_id=? AND tile_x=? AND tile_y=?').run('WATERED',at,farmId,x,y);
      } else if (state==='PLANTED' && crop && crop.watered_at===null) {
        db.prepare('UPDATE farm_crops SET watered_at=?,bonus_ms=? WHERE id=? AND watered_at IS NULL').run(at,Math.floor(crop.duration_ms*.1),crop.id);
      } else throw new Error('Ô này không cần tưới thêm.');
      message='Đã tưới cây. Thời gian trưởng thành giảm 10% một lần.';
    } else if (action==='harvest') {
      if (!crop || state!=='PLANTED') throw new Error('Ô này chưa có cây để thu hoạch.');
      const growth=cropProgress({plantedAt:crop.planted_at,durationMs:crop.duration_ms,bonusMs:crop.bonus_ms},at);
      if (growth.stage!=='MATURE') throw new Error('Cây chưa trưởng thành.');
      const changed=db.prepare('UPDATE farm_crops SET harvested_at=? WHERE id=? AND harvested_at IS NULL').run(at,crop.id);
      if (!changed.changes) throw new Error('Cây đã được thu hoạch.');
      addItem(db,farmId,CROPS[crop.crop_id].produce,crop.yield_quantity);
      recordQuestEvent(db,userId,'harvest',at);
      db.prepare('UPDATE farm_soil_tiles SET state=?,updated_at=? WHERE farm_id=? AND tile_x=? AND tile_y=?').run('TILLED',at,farmId,x,y);
      message=`Thu hoạch ${crop.yield_quantity} ${CROPS[crop.crop_id].name.toLowerCase()}.`;
    }
    return {message,state:farmingState(db,userId,at)};
  })();
}
