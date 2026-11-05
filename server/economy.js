import { onboardingEvent } from './onboarding.js';
import { createHash } from 'node:crypto';
import { inventory, addItem, spendItem } from './crops.js';
import { inRange } from './world.js';
import { START_BALANCE, MAX_BALANCE, ORDERS, marketDay, marketCatalog } from './marketConfig.js';
import { now } from './time.js';

export function createWallet(db,userId,at=now()) {
  const inserted=db.prepare('INSERT OR IGNORE INTO wallets(user_id,balance,updated_at) VALUES (?,?,?)').run(userId,START_BALANCE,at);
  if(inserted.changes) db.prepare(`INSERT INTO economy_transactions(user_id,kind,delta,balance_after,created_at)
    VALUES (?,'starter',?,?,?)`).run(userId,START_BALANCE,START_BALANCE,at);
  return inserted.changes===1;
}
export function balance(db,userId) {
  const row=db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(userId);
  if(!row)throw new Error('Chưa có ví Đồng Làng.');
  return row.balance;
}
export function debit(db,userId,amount,at=now()) {
  if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('Số tiền không hợp lệ.');
  const updated=db.prepare('UPDATE wallets SET balance=balance-?,updated_at=? WHERE user_id=? AND balance>=?').run(amount,at,userId,amount);
  if(!updated.changes)throw new Error('Không đủ Đồng Làng.');
  return balance(db,userId);
}
export function credit(db,userId,amount,at=now()) {
  if(!Number.isSafeInteger(amount)||amount<=0||amount>MAX_BALANCE)throw new Error('Số tiền không hợp lệ.');
  const updated=db.prepare('UPDATE wallets SET balance=balance+?,updated_at=? WHERE user_id=? AND balance<=?').run(amount,at,userId,MAX_BALANCE-amount);
  if(!updated.changes)throw new Error('Ví đã đạt giới hạn.');
  return balance(db,userId);
}
function farmOf(db,userId) { return db.prepare('SELECT id FROM farms WHERE owner_id=?').get(userId)?.id; }
function transaction(db,{userId,farmId,kind,itemId=null,quantity=null,unitPrice=null,delta,requestId,at}) {
  const after=balance(db,userId);
  return db.prepare(`INSERT INTO economy_transactions(user_id,farm_id,kind,item_id,quantity,unit_price,delta,balance_after,request_key,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(userId,farmId,kind,itemId,quantity,unitPrice,delta,after,requestId,at).lastInsertRowid;
}
export function marketState(db,userId,at=now()) {
  const farmId=farmOf(db,userId);
  if(!farmId)return null;
  const items=inventory(db,farmId), counts=Object.fromEntries(items.map(item=>[item.id,item.quantity]));
  const progress=db.prepare('SELECT template_id,status,accepted_at,completed_at FROM player_orders WHERE farm_id=?').all(farmId);
  const byId=new Map(progress.map(row=>[row.template_id,row]));
  return { farmId, balance:balance(db,userId), currency:'Đồng Làng', market:marketDay(at), catalog:marketCatalog(at), inventory:items,
    orders:ORDERS.map(order=>({ ...order, status:byId.get(order.id)?.status||'AVAILABLE', acceptedAt:byId.get(order.id)?.accepted_at||null,
      completedAt:byId.get(order.id)?.completed_at||null, owned:Object.fromEntries(Object.keys(order.items).map(id=>[id,counts[id]||0])) })),
    history:db.prepare(`SELECT id,kind,item_id AS itemId,quantity,unit_price AS unitPrice,delta,balance_after AS balanceAfter,created_at AS createdAt
      FROM economy_transactions WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 30`).all(userId) };
}
const fields={
  buy:['action','farmId','requestId','itemId','quantity','marketId'],
  sell:['action','farmId','requestId','itemId','quantity','marketId'],
  accept_order:['action','farmId','requestId','orderId'],
  complete_order:['action','farmId','requestId','orderId']
};
function validatedIntent(payload) {
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||!Object.hasOwn(fields,payload.action))throw new Error('Giao dịch không hợp lệ.');
  const allowed=fields[payload.action];
  if(Object.keys(payload).some(key=>!allowed.includes(key))||allowed.some(key=>!Object.hasOwn(payload,key)))throw new Error('Giao dịch không hợp lệ.');
  if(typeof payload.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(payload.requestId))throw new Error('Mã giao dịch không hợp lệ.');
  const intent=Object.fromEntries(allowed.filter(key=>key!=='requestId').map(key=>[key,payload[key]]));
  return createHash('sha256').update(JSON.stringify(intent)).digest('hex');
}
export function performMarketAction(db,userId,payload,at=now()) {
  const hash=validatedIntent(payload),farmId=farmOf(db,userId);
  if(!farmId||payload.farmId!==farmId)throw new Error('Không có quyền với nông trại này.');
  return db.transaction(()=>{
    const previous=db.prepare('SELECT action,payload_hash,response_json FROM economy_request_receipts WHERE user_id=? AND request_key=?').get(userId,payload.requestId);
    if(previous) {
      if(previous.action!==payload.action||previous.payload_hash!==hash)throw new Error('Mã giao dịch đã dùng cho yêu cầu khác.');
      return {...JSON.parse(previous.response_json),replayed:true,state:marketState(db,userId,at)};
    }
    const player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farmId);
    const point=payload.action==='buy'?'seedShop':payload.action==='sell'?'buyer':'orderBoard';
    if(!player||player.scene!=='market'||!inRange(player,point))throw new Error('Hãy đến gần người bán hoặc bảng đơn ở chợ.');
    let message,transactionId=null;
    if(payload.action==='buy'||payload.action==='sell') {
      if(!Number.isSafeInteger(payload.quantity)||payload.quantity<1||payload.quantity>999||typeof payload.itemId!=='string')throw new Error('Số lượng hoặc vật phẩm không hợp lệ (1–999).');
      const day=marketDay(at);
      if(payload.marketId!==day.id)throw new Error('Giá chợ đã đổi. Hãy xem lại bảng giá.');
      const offer=marketCatalog(at).find(row=>row[payload.action==='buy'?'seedItem':'produceItem']===payload.itemId);
      if(!offer)throw new Error('Chợ không giao dịch vật phẩm này.');
      const unitPrice=payload.action==='buy'?offer.buyPrice:offer.sellPrice;
      const amount=unitPrice*payload.quantity;
      if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('Giá không hợp lệ.');
      if(payload.action==='buy') {
        debit(db,userId,amount,at); addItem(db,farmId,payload.itemId,payload.quantity);
        message=`Đã mua ${payload.quantity} ${offer.name.toLowerCase()}${offer.cropId?' giống':''}.`;
      } else {
        spendItem(db,farmId,payload.itemId,payload.quantity); credit(db,userId,amount,at);
        message=`Đã bán ${payload.quantity} ${offer.name.toLowerCase()}.`;
      }
      transactionId=transaction(db,{userId,farmId,kind:payload.action,itemId:payload.itemId,quantity:payload.quantity,unitPrice,
        delta:payload.action==='buy'?-amount:amount,requestId:payload.requestId,at});
    } else {
      if(typeof payload.orderId!=='string')throw new Error('Đơn hàng không hợp lệ.');
      const order=ORDERS.find(row=>row.id===payload.orderId);
      if(!order)throw new Error('Đơn hàng không tồn tại.');
      if(payload.action==='accept_order') {
        const created=db.prepare(`INSERT OR IGNORE INTO player_orders(farm_id,template_id,status,accepted_at) VALUES (?,?,'ACCEPTED',?)`).run(farmId,order.id,at);
        if(!created.changes)throw new Error('Đơn hàng đã được nhận.');
        message=`Đã nhận đơn: ${order.title}.`;
      } else {
        const current=db.prepare('SELECT status FROM player_orders WHERE farm_id=? AND template_id=?').get(farmId,order.id);
        if(current?.status!=='ACCEPTED')throw new Error('Đơn hàng chưa nhận hoặc đã hoàn thành.');
        for(const [itemId,quantity] of Object.entries(order.items))spendItem(db,farmId,itemId,quantity);
        credit(db,userId,order.reward,at);
        db.prepare(`UPDATE player_orders SET status='COMPLETED',completed_at=? WHERE farm_id=? AND template_id=? AND status='ACCEPTED'`).run(at,farmId,order.id);
        transactionId=transaction(db,{userId,farmId,kind:'order',itemId:order.id,quantity:null,unitPrice:null,delta:order.reward,requestId:payload.requestId,at});
        message=`Đã giao đơn ${order.title}.`;
      }
    }
    if(payload.action==='sell' && payload.itemId==='mustard')onboardingEvent(db,farmId,'sell',at);
    if(payload.action==='buy' && payload.itemId.startsWith('seed_'))onboardingEvent(db,farmId,'buy',at);
    const receipt={message,transactionId};
    db.prepare('INSERT INTO economy_request_receipts VALUES (?,?,?,?,?,?)').run(userId,payload.requestId,payload.action,hash,JSON.stringify(receipt),at);
    return {...receipt,replayed:false,state:marketState(db,userId,at)};
  })();
}
