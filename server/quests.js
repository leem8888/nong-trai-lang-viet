import {createHash} from 'node:crypto';
import {QUESTS,QUEST_BY_ID} from '../public/js/shared/quests.js';
import {CROPS} from '../public/js/shared/crops.js';
import {spendItem} from './crops.js';
import {balance,credit} from './economy.js';
import {npcPosition} from './npcs.js';
import {worldContext} from './livingWorld.js';

const MAIN=QUESTS.filter(q=>q.kind==='main'),SIDE=QUESTS.filter(q=>q.kind==='side'),UUID=/^[a-f0-9-]{36}$/;
const dayKey=at=>new Date(at).toISOString().slice(0,10);
function farmOf(db,userId){return db.prepare('SELECT id FROM farms WHERE owner_id=?').get(userId)?.id;}
function row(db,userId,q,at){return db.prepare('SELECT status,progress,claimed_at AS claimedAt FROM player_quests WHERE user_id=? AND quest_id=? AND day_key=?').get(userId,q.id,q.kind==='main'?'story':dayKey(at));}
export function questState(db,userId,at=Date.now()){
  const farmId=farmOf(db,userId);if(!farmId)return null;
  let priorClaimed=true;
  const quests=QUESTS.map(q=>{const saved=row(db,userId,q,at);const status=q.kind==='main'&&!priorClaimed?'LOCKED':saved?.status||'ACTIVE';if(q.kind==='main')priorClaimed=status==='CLAIMED';return {...q,status,progress:saved?.progress||0,claimedAt:saved?.claimedAt||null};});
  return {farmId,serverTime:at,resetDay:dayKey(at),balance:balance(db,userId),quests};
}
export function recordQuestEvent(db,userId,event,at=Date.now()){
  const state=questState(db,userId,at);if(!state)return;
  for(const q of state.quests.filter(q=>(q.status==='ACTIVE'||q.id==='first_harvest'&&q.status==='LOCKED')&&q.event===event)){
    const next=Math.min(q.target,q.progress+1),status=next>=q.target?'COMPLETED':'ACTIVE',key=q.kind==='main'?'story':dayKey(at);
    db.prepare(`INSERT INTO player_quests(user_id,quest_id,day_key,status,progress,updated_at) VALUES (?,?,?,?,?,?)
      ON CONFLICT(user_id,quest_id,day_key) DO UPDATE SET status=excluded.status,progress=excluded.progress,updated_at=excluded.updated_at`).run(userId,q.id,key,status,next,at);
  }
}
function validate(p){const fields=p?.action==='claim'?['action','farmId','requestId','questId']:p?.action==='deliver'?['action','farmId','requestId','questId','itemId']:null;
  if(!fields||!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||fields.some(f=>!Object.hasOwn(p,f))||!UUID.test(p.requestId||''))throw Error('Yêu cầu nhiệm vụ không hợp lệ.');
  return createHash('sha256').update(JSON.stringify(fields.filter(f=>f!=='requestId').map(f=>p[f]))).digest('hex');}
export function performQuestAction(db,userId,p,at=Date.now(),config,worldAt=at){
  const hash=validate(p),farmId=farmOf(db,userId);if(!farmId||p.farmId!==farmId)throw Error('Không có quyền với nông trại này.');
  return db.transaction(()=>{
    const previous=db.prepare('SELECT * FROM quest_request_receipts WHERE user_id=? AND request_key=?').get(userId,p.requestId);
    if(previous){if(previous.action!==p.action||previous.payload_hash!==hash)throw Error('Mã yêu cầu đã dùng cho thao tác khác.');return {...JSON.parse(previous.response_json),replayed:true,state:questState(db,userId,at)};}
    const q=QUEST_BY_ID[p.questId];if(!q)throw Error('Nhiệm vụ không tồn tại.');const status=questState(db,userId,at).quests.find(v=>v.id===q.id).status;let message;
    if(p.action==='deliver'){
      if(q.id!=='help_lan'||status!=='ACTIVE'||!Object.values(CROPS).some(c=>c.produce===p.itemId))throw Error('Không thể giao vật phẩm này.');
      const player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farmId),pos=npcPosition(db,farmId,'lan',worldContext(worldAt,config));
      if(!player||player.scene!=='market'||Math.hypot(player.x-pos.x,player.y-pos.y)>96)throw Error('Hãy đến gần Cô Lan ở chợ.');
      spendItem(db,farmId,p.itemId,1);recordQuestEvent(db,userId,'deliver',at);message='Đã giao nông sản cho Cô Lan.';
    }else{
      if(status!=='COMPLETED')throw Error('Nhiệm vụ chưa sẵn sàng nhận thưởng.');
      const key=q.kind==='main'?'story':dayKey(at),changed=db.prepare("UPDATE player_quests SET status='CLAIMED',claimed_at=?,updated_at=? WHERE user_id=? AND quest_id=? AND day_key=? AND status='COMPLETED'").run(at,at,userId,q.id,key);
      if(!changed.changes)throw Error('Đã nhận thưởng.');
      credit(db,userId,q.reward,at);
      db.prepare('INSERT INTO quest_reward_events(user_id,farm_id,quest_id,day_key,amount,balance_after,request_key,created_at) VALUES (?,?,?,?,?,?,?,?)').run(userId,farmId,q.id,key,q.reward,balance(db,userId),p.requestId,at);
      message=`Đã nhận ${q.reward} Đồng Làng từ ${q.title}.`;
    }
    const receipt={message};db.prepare('INSERT INTO quest_request_receipts VALUES (?,?,?,?,?,?)').run(userId,p.requestId,p.action,hash,JSON.stringify(receipt),at);
    return {...receipt,replayed:false,state:questState(db,userId,at)};
  })();
}
