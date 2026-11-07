import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {bananaState,harvestBanana} from '../server/banana.js';
import {BANANA_TREE,BANANA_HOUR_MS,BANANA_CYCLE_MS,BANANA_YIELD,BANANA_SELL_PRICE} from '../public/js/shared/banana.js';
import {performMarketAction,balance} from '../server/economy.js';
import {marketDay,marketCatalog} from '../server/marketConfig.js';
import {visitorSnapshot} from '../server/social.js';
import {createApp} from '../server/index.js';
function fixture(db,name='banana_farmer'){
  const user=register(db,name,'password123'),farm=createFarm(db,user.id,'Vườn chuối');
  db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(BANANA_TREE.x+45,BANANA_TREE.y+30,user.id);
  return {user,farm,payload:()=>({action:'harvest',farmId:farm.id,requestId:randomUUID()})};
}
test('banana has hourly phases, no levels, four-hour harvest and a fixed repeating yield',()=>{
  const db=openDatabase(':memory:');try{
    const {user,farm,payload}=fixture(db),initial=bananaState(db,user.id);
    for(let phase=0;phase<=4;phase++){
      const at=initial.startedAt+phase*BANANA_HOUR_MS;
      assert.equal(bananaState(db,user.id,at).phase,phase);
      if(phase>0)assert.equal(bananaState(db,user.id,at-1).phase,phase-1);
    }
    assert.equal('level' in initial,false);
    assert.throws(()=>harvestBanana(db,user.id,payload(),initial.readyAt-1),/chưa chín/);
    const at=initial.readyAt+10*BANANA_CYCLE_MS,p=payload(),first=harvestBanana(db,user.id,p,at);
    assert.equal(first.quantity,BANANA_YIELD);assert.equal(first.state.phase,0);
    assert.equal(first.state.readyAt,at+BANANA_CYCLE_MS);
    assert.equal(harvestBanana(db,user.id,p,at).replayed,true);
    assert.throws(()=>harvestBanana(db,user.id,payload(),at),/chưa chín/);
    assert.equal(harvestBanana(db,user.id,payload(),first.state.readyAt).quantity,BANANA_YIELD);
    assert.equal(db.prepare("SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id='banana'").get(farm.id).quantity,2*BANANA_YIELD);
    assert.ok(visitorSnapshot(db,farm.id).banana);
  }finally{db.close();}
});
test('banana inventory overflow rolls back, ownership and proximity are enforced, and bananas sell',()=>{
  const db=openDatabase(':memory:');try{
    const {user,farm,payload}=fixture(db),other=fixture(db,'banana_other'),at=bananaState(db,user.id).readyAt;
    assert.throws(()=>harvestBanana(db,other.user.id,payload(),at),/quyền/);
    assert.throws(()=>harvestBanana(db,user.id,{...payload(),at},at),/hợp lệ/);
    db.prepare("UPDATE player_states SET scene='market' WHERE user_id=?").run(user.id);
    assert.throws(()=>harvestBanana(db,user.id,payload(),at),/gần/);
    db.prepare("UPDATE player_states SET scene='farm',x=720,y=650 WHERE user_id=?").run(user.id);
    assert.throws(()=>harvestBanana(db,user.id,payload(),at),/gần/);
    db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(BANANA_TREE.x+45,BANANA_TREE.y+30,user.id);
    db.prepare('INSERT INTO inventory_items VALUES (?,?,999)').run(farm.id,'banana');
    const key=payload();assert.throws(()=>harvestBanana(db,user.id,key,at),/đầy/);
    assert.equal(bananaState(db,user.id,at).ready,true);
    assert.equal(db.prepare('SELECT count(*) n FROM banana_receipts').get().n,0);
    db.prepare("UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id='banana'").run(farm.id);
    harvestBanana(db,user.id,key,at);
    db.prepare("UPDATE player_states SET scene='market',x=600,y=380 WHERE user_id=?").run(user.id);
    const before=balance(db,user.id),sale={action:'sell',farmId:farm.id,itemId:'banana',quantity:2,requestId:randomUUID(),marketId:marketDay(at).id};
    performMarketAction(db,user.id,sale,at);assert.equal(balance(db,user.id),before+2*BANANA_SELL_PRICE);
    assert.equal(performMarketAction(db,user.id,sale,at).replayed,true);
    assert.equal(marketCatalog(at).find(r=>r.produceItem==='banana').sellPrice,BANANA_SELL_PRICE);
    assert.equal(marketCatalog(at).some(r=>r.seedItem==='banana'),false);
  }finally{db.close();}
});
test('banana migration adds one clump to existing farms and preserves time across reopen',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'banana-')),file=path.join(dir,'farm.sqlite');let db;
  try{
    db=openDatabase(file);const {user,farm}=fixture(db);
    db.exec('DROP TABLE banana_receipts;DROP TABLE farm_banana_clumps;DELETE FROM schema_migrations WHERE version=12;');db.close();
    db=openDatabase(file);const initial=bananaState(db,user.id);assert.ok(initial);
    const before=bananaState(db,user.id,initial.startedAt+2*BANANA_HOUR_MS);db.close();db=openDatabase(file);
    assert.deepEqual(bananaState(db,user.id,initial.startedAt+2*BANANA_HOUR_MS),before);
    createFarm(db,user.id,'same');assert.equal(db.prepare('SELECT count(*) n FROM farm_banana_clumps WHERE farm_id=?').get(farm.id).n,1);
    assert.equal(db.pragma('integrity_check')[0].integrity_check,'ok');assert.equal(db.pragma('foreign_key_check').length,0);
  }finally{db?.close();rmSync(dir,{recursive:true,force:true});}
});
test('banana HTTP rejects unauthenticated and CSRF requests and deduplicates simultaneous harvests',async()=>{
  const db=openDatabase(':memory:'),{server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await fetch(base+'/api/banana')).status,401);
    const reg=await fetch(base+'/api/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'http_banana',password:'password123'})}),auth=await reg.json(),cookie=reg.headers.get('set-cookie').split(';')[0];
    const farm=createFarm(db,auth.user.id,'HTTP banana');
    db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(BANANA_TREE.x+45,BANANA_TREE.y+30,auth.user.id);
    db.prepare('UPDATE farm_banana_clumps SET started_at=0 WHERE farm_id=?').run(farm.id);
    const payload={action:'harvest',farmId:farm.id,requestId:randomUUID()};
    const send=csrf=>fetch(base+'/api/banana/action',{method:'POST',headers:{cookie,'content-type':'application/json','x-csrf-token':csrf},body:JSON.stringify(payload)});
    assert.equal((await send('bad')).status,403);
    const results=await Promise.all([send(auth.csrf),send(auth.csrf)]);assert.ok(results.every(r=>r.status===200));
    const bodies=await Promise.all(results.map(r=>r.json()));assert.equal(bodies.filter(r=>r.replayed).length,1);
    assert.equal(db.prepare("SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id='banana'").get(farm.id).quantity,BANANA_YIELD);
  }finally{await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();}
});
