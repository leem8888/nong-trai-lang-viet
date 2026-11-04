import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {addItem} from '../server/crops.js';
import {credit,balance,performMarketAction} from '../server/economy.js';
import {marketDay} from '../server/marketConfig.js';
import {NPCS} from '../public/js/shared/npcs.js';
import {npcState} from '../server/npcs.js';
import {worldContext} from '../server/livingWorld.js';
import {performNpcInteraction} from '../server/village.js';
import {validPosition} from '../server/world.js';
import {MARKET_WORLD,VILLAGE_PLACES} from '../public/js/shared/marketMap.js';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {findPath,clearSegment} from '../public/js/systems/Pathfinding.js';

test('market trades 999 atomically, preserves inventory cap and rejects 1000/fractions',()=>{
  const db=openDatabase(':memory:');try{
    const u=register(db,'bulk_trader','strong-pass-123'),f=createFarm(db,u.id,'Kho quê'),at=Date.now();credit(db,u.id,100000);
    const move=(x,y)=>db.prepare("UPDATE player_states SET scene='market',x=?,y=? WHERE user_id=?").run(x,y,u.id);
    const act=(action,id,quantity,key=randomUUID())=>performMarketAction(db,u.id,{action,itemId:id,quantity,requestId:key,farmId:f.id,marketId:marketDay(at).id},at);
    move(300,430);const before=balance(db,u.id),key=randomUUID();act('buy','fish_feed',999,key);assert.equal(balance(db,u.id),before-999*8);assert.equal(act('buy','fish_feed',999,key).replayed,true);
    assert.throws(()=>act('buy','fish_feed',1),/đầy/);assert.equal(balance(db,u.id),before-999*8);
    for(const n of [0,-1,1000,1.5,NaN])assert.throws(()=>act('buy','chicken_feed',n),/không hợp lệ/);
    addItem(db,f.id,'rice',999);move(600,430);const sold=act('sell','rice',999);assert.equal(sold.state.inventory.find(i=>i.id==='rice').quantity,0);assert.equal(sold.state.history[0].quantity,999);
  }finally{db.close();}
});
test('all village NPC schedules are walkable, remain out of farms and still accept quests',()=>{
  const db=openDatabase(':memory:');try{
    const u=register(db,'village_npc','strong-pass-123'),f=createFarm(db,u.id,'Nhà riêng');
    assert.ok(Object.values(NPCS).every(n=>n.scene==='market'));
    for(const timeOfDay of ['morning','noon','afternoon','night'])for(const n of npcState(db,f.id,{timeOfDay}))assert.ok(validPosition(n.x,n.y,n.scene),`${n.id} ${timeOfDay}`);
    const when=Date.now(),n=npcState(db,f.id,worldContext(when)).find(n=>n.id==='tu');
    db.prepare("UPDATE player_states SET x=?,y=?,scene='farm' WHERE user_id=?").run(n.x,n.y,u.id);
    assert.throws(()=>performNpcInteraction(db,u.id,{farmId:f.id,npcId:'tu',requestId:randomUUID()},when),/đến gần/);
    db.prepare("UPDATE player_states SET scene='market' WHERE user_id=?").run(u.id);
    assert.equal(performNpcInteraction(db,u.id,{farmId:f.id,npcId:'tu',requestId:randomUUID()},when).dialogue.name,'Bác Tư');
  }finally{db.close();}
});
test('click paths avoid stall corners and reach expanded village landmarks',()=>{
  const c=new CollisionSystem(MARKET_WORLD),start={x:300,y:450},goal={x:900,y:180};
  assert.equal(clearSegment(c,start,goal),false);const path=findPath(c,start,goal);assert.ok(path?.length>1);
  let previous=start;for(const p of path){assert.ok(clearSegment(c,previous,p));previous=p;}assert.deepEqual(previous,goal);
  for(const place of Object.values(VILLAGE_PLACES)){const route=findPath(c,{x:600,y:620},place);assert.ok(route,place.label);}
  assert.equal(findPath(c,start,{x:600,y:280}),null);
});
