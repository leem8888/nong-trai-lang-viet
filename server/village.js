import {createHash} from 'node:crypto';
import {farmFor} from './farms.js';
import {worldContext,worldConfig} from './livingWorld.js';
import {NPCS} from '../public/js/shared/npcs.js';
import {npcState,npcPosition,npcDialogue} from './npcs.js';
import {questState,recordQuestEvent} from './quests.js';

export function villageState(db,userId,worldAt=Date.now(),questAt=Date.now(),config=worldConfig()){
  const farm=farmFor(db,userId);if(!farm)return null;const context=worldContext(worldAt,config);
  return {farmId:farm.id,context,npcs:npcState(db,farm.id,context),quests:questState(db,userId,questAt)};
}
export function performNpcInteraction(db,userId,p,worldAt=Date.now(),questAt=Date.now(),config=worldConfig()){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==3||!['farmId','npcId','requestId'].every(k=>Object.hasOwn(p,k))||!(/^[a-f0-9-]{36}$/).test(p.requestId||''))throw Error('Tương tác không hợp lệ.');
  const farm=farmFor(db,userId);if(!farm||p.farmId!==farm.id)throw Error('Không có quyền với nông trại này.');
  const npc=NPCS[p.npcId];if(!npc)throw Error('Người làng không tồn tại.');
  const hash=createHash('sha256').update(JSON.stringify([p.farmId,p.npcId])).digest('hex');
  return db.transaction(()=>{
    const old=db.prepare('SELECT * FROM quest_request_receipts WHERE user_id=? AND request_key=?').get(userId,p.requestId);
    if(old){if(old.action!=='interact'||old.payload_hash!==hash)throw Error('Mã yêu cầu đã dùng cho thao tác khác.');return {...JSON.parse(old.response_json),replayed:true,state:villageState(db,userId,worldAt,questAt,config)};}
    const context=worldContext(worldAt,config),pos=npcPosition(db,farm.id,p.npcId,context),player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farm.id);
    if(!player||player.scene!==npc.scene||Math.hypot(player.x-pos.x,player.y-pos.y)>96)throw Error('Hãy đến gần người làng để trò chuyện.');
    const before=questState(db,userId,questAt).quests;let branch='intro';
    const related=before.find(q=>q.event===`npc:${p.npcId}`&&q.kind==='main')||before.find(q=>q.event===`npc:${p.npcId}`&&q.kind==='side');
    if(related?.status==='ACTIVE'||related?.status==='COMPLETED')branch='active';else if(related?.status==='CLAIMED')branch='done';
    recordQuestEvent(db,userId,`npc:${p.npcId}`,questAt);
    const dialogue=npcDialogue(p.npcId,branch,context.season),receipt={dialogue,message:`Đã trò chuyện với ${npc.name}.`};
    db.prepare('INSERT INTO quest_request_receipts VALUES (?,?,?,?,?,?)').run(userId,p.requestId,'interact',hash,JSON.stringify(receipt),questAt);
    return {...receipt,replayed:false,state:villageState(db,userId,worldAt,questAt,config)};
  })();
}
