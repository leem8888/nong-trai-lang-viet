import {MANGO_TREE,MANGO_CYCLE_MS,mangoStage,MANGO_STAGES,MANGO_SELL_PRICE} from '../public/js/shared/mango.js';
import {addItem} from './crops.js';
const farmFor=(db,userId)=>db.prepare('SELECT id FROM farms WHERE owner_id=?').get(userId)?.id;
export function mangoStateForFarm(db,farmId,at=Date.now()){
  const row=db.prepare('SELECT harvest_count,ready_at FROM farm_mango_trees WHERE farm_id=?').get(farmId);if(!row)return null;
  const stage=mangoStage(row.harvest_count),next=MANGO_STAGES.find(s=>s.level===stage.level+1);
  return {farmId,serverTime:at,harvests:row.harvest_count,readyAt:row.ready_at,remainingMs:Math.max(0,row.ready_at-at),ready:at>=row.ready_at,stage:stage.level,name:stage.name,yield:stage.yield,size:stage.size,nextHarvests:next?.harvests??null,nextYield:next?.yield??null,cycleMs:MANGO_CYCLE_MS,sellPrice:MANGO_SELL_PRICE};
}
export function mangoState(db,userId,at=Date.now()){const id=farmFor(db,userId);return id?mangoStateForFarm(db,id,at):null;}
export function harvestMango(db,userId,payload,at=Date.now()){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).length!==3||payload.action!=='harvest'||typeof payload.farmId!=='string'||typeof payload.requestId!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(payload.requestId)||!Number.isSafeInteger(at)||at<0||!Number.isSafeInteger(at+MANGO_CYCLE_MS))throw Error('Yêu cầu thu hoạch xoài không hợp lệ.');
  const farmId=farmFor(db,userId);if(!farmId||farmId!==payload.farmId)throw Error('Không có quyền với cây xoài này.');
  return db.transaction(()=>{
    const receipt=db.prepare('SELECT quantity FROM mango_receipts WHERE user_id=? AND request_key=? AND farm_id=?').get(userId,payload.requestId,farmId);
    if(receipt)return {replayed:true,message:`Đã thu hoạch ${receipt.quantity} quả xoài.`,quantity:receipt.quantity,state:mangoStateForFarm(db,farmId,at)};
    const player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farmId);
    if(!player||player.scene!=='farm'||Math.hypot(player.x-MANGO_TREE.x,player.y-MANGO_TREE.y)>110)throw Error('Hãy đến gần cây xoài trong sân.');
    const state=mangoStateForFarm(db,farmId,at);if(!state)throw Error('Chưa có cây xoài.');
    if(!state.ready)throw Error('Xoài chưa chín. Cây ra quả sau mỗi 4 giờ.');
    if(!Number.isSafeInteger(state.harvests+1))throw Error('Cây đã đạt giới hạn thu hoạch.');
    addItem(db,farmId,'mango',state.yield);
    db.prepare('UPDATE farm_mango_trees SET harvest_count=harvest_count+1,ready_at=?,updated_at=? WHERE farm_id=?').run(at+MANGO_CYCLE_MS,at,farmId);
    db.prepare('INSERT INTO mango_receipts(user_id,request_key,farm_id,quantity,created_at) VALUES (?,?,?,?,?)').run(userId,payload.requestId,farmId,state.yield,at);
    const next=mangoStateForFarm(db,farmId,at),grew=next.stage>state.stage;
    return {replayed:false,quantity:state.yield,message:`Thu hoạch ${state.yield} quả xoài.${grew?` Cây lớn lên cấp ${next.stage}! Vụ sau được ${next.yield} quả.`:''}`,state:next};
  })();
}
