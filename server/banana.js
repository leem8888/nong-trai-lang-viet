import {BANANA_TREE,BANANA_CYCLE_MS,BANANA_YIELD,BANANA_SELL_PRICE,BANANA_PHASES,bananaPhase} from '../public/js/shared/banana.js';
import {addItem} from './crops.js';
const farmFor=(db,userId)=>db.prepare('SELECT id FROM farms WHERE owner_id=?').get(userId)?.id;
export function bananaStateForFarm(db,farmId,at=Date.now()){
  const row=db.prepare('SELECT started_at FROM farm_banana_clumps WHERE farm_id=?').get(farmId);
  if(!row)return null;
  const phase=bananaPhase(row.started_at,at),readyAt=row.started_at+BANANA_CYCLE_MS;
  return {farmId,serverTime:at,startedAt:row.started_at,readyAt,remainingMs:Math.max(0,readyAt-at),ready:at>=readyAt,phase,name:BANANA_PHASES[phase],yield:BANANA_YIELD,sellPrice:BANANA_SELL_PRICE,cycleMs:BANANA_CYCLE_MS};
}
export function bananaState(db,userId,at=Date.now()){const id=farmFor(db,userId);return id?bananaStateForFarm(db,id,at):null;}
export function harvestBanana(db,userId,payload,at=Date.now()){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).length!==3||payload.action!=='harvest'||typeof payload.farmId!=='string'||typeof payload.requestId!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(payload.requestId)||!Number.isSafeInteger(at)||at<0||!Number.isSafeInteger(at+BANANA_CYCLE_MS))throw Error('Yêu cầu thu hoạch chuối không hợp lệ.');
  const farmId=farmFor(db,userId);
  if(!farmId||farmId!==payload.farmId)throw Error('Không có quyền với khóm chuối này.');
  return db.transaction(()=>{
    const receipt=db.prepare('SELECT quantity FROM banana_receipts WHERE user_id=? AND request_key=? AND farm_id=?').get(userId,payload.requestId,farmId);
    if(receipt)return {replayed:true,quantity:receipt.quantity,message:`Đã thu hoạch ${receipt.quantity} nải chuối.`,state:bananaStateForFarm(db,farmId,at)};
    const player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farmId);
    if(!player||player.scene!=='farm'||Math.hypot(player.x-BANANA_TREE.x,player.y-BANANA_TREE.y)>110)throw Error('Hãy đến gần khóm chuối trong vườn.');
    const state=bananaStateForFarm(db,farmId,at);
    if(!state?.ready)throw Error('Chuối chưa chín. Chuối chín sau 4 giờ.');
    addItem(db,farmId,'banana',BANANA_YIELD);
    db.prepare('UPDATE farm_banana_clumps SET started_at=?,updated_at=? WHERE farm_id=?').run(at,at,farmId);
    db.prepare('INSERT INTO banana_receipts(user_id,request_key,farm_id,quantity,created_at) VALUES (?,?,?,?,?)').run(userId,payload.requestId,farmId,BANANA_YIELD,at);
    return {replayed:false,quantity:BANANA_YIELD,message:`Thu hoạch ${BANANA_YIELD} nải chuối. Khóm chuối bắt đầu vụ mới.`,state:bananaStateForFarm(db,farmId,at)};
  })();
}
