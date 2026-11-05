import {io as socketClient} from 'socket.io-client';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {mangoState,harvestMango} from '../server/mango.js';
import {performMarketAction,balance} from '../server/economy.js';
import {marketDay,marketCatalog} from '../server/marketConfig.js';
import {MANGO_TREE,MANGO_CYCLE_MS,MANGO_STAGES} from '../public/js/shared/mango.js';
import {createApp} from '../server/index.js';
import {visitorSnapshot} from '../server/social.js';
function fixture(db,name='mango_farmer'){
 const u=register(db,name,'password123'),f=createFarm(db,u.id,'Vườn xoài');
 const move=(x=MANGO_TREE.x-65,y=MANGO_TREE.y+35,scene='farm')=>db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=?').run(x,y,scene,u.id);move();
 const payload=(requestId=randomUUID())=>({action:'harvest',farmId:f.id,requestId});return {u,f,move,payload};
}
test('mango waits four hours, harvests once after long offline, retries and full inventory roll back',()=>{
 const db=openDatabase(':memory:');try{const {u,f,move,payload}=fixture(db),s=mangoState(db,u.id),ready=s.readyAt;
 assert.ok(ready-s.serverTime<=MANGO_CYCLE_MS&&ready-s.serverTime>MANGO_CYCLE_MS-1000);
 assert.throws(()=>harvestMango(db,u.id,payload(),ready-1),/chưa chín/);
 const p=payload(),r=harvestMango(db,u.id,p,ready+10*MANGO_CYCLE_MS);assert.equal(r.quantity,3);assert.equal(r.state.harvests,1);assert.equal(r.state.readyAt,ready+11*MANGO_CYCLE_MS);
 assert.equal(harvestMango(db,u.id,p,ready+10*MANGO_CYCLE_MS).replayed,true);
 assert.equal(db.prepare("SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id='mango'").get(f.id).quantity,3);
 assert.throws(()=>harvestMango(db,u.id,payload(),ready+10*MANGO_CYCLE_MS),/chưa chín/);
 db.prepare("UPDATE inventory_items SET quantity=999 WHERE farm_id=? AND item_id='mango'").run(f.id);const key=payload();assert.throws(()=>harvestMango(db,u.id,key,r.state.readyAt),/đầy/);assert.equal(mangoState(db,u.id).harvests,1);assert.equal(db.prepare('SELECT count(*) n FROM mango_receipts').get().n,1);
 db.prepare("UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id='mango'").run(f.id);assert.equal(harvestMango(db,u.id,key,r.state.readyAt).quantity,3);
 }finally{db.close();}
});
test('all four mango stages, actual yield, inventory and sale prices are authoritative',()=>{
 const db=openDatabase(':memory:');try{const {u,f,move,payload}=fixture(db);let at=mangoState(db,u.id).readyAt;
 for(let n=0;n<35;n++){const stage=[...MANGO_STAGES].reverse().find(s=>n>=s.harvests);const r=harvestMango(db,u.id,payload(),at);assert.equal(r.quantity,stage.yield);assert.equal(r.state.harvests,n+1);at=r.state.readyAt;}
 assert.equal(mangoState(db,u.id).stage,4);assert.equal(mangoState(db,u.id).nextHarvests,null);
 assert.equal(visitorSnapshot(db,f.id).mango.stage,4);
 move(600,380,'market');const before=balance(db,u.id),sell={action:'sell',farmId:f.id,requestId:randomUUID(),itemId:'mango',quantity:2,marketId:marketDay(at).id};performMarketAction(db,u.id,sell,at);assert.equal(balance(db,u.id),before+20);assert.equal(performMarketAction(db,u.id,sell,at).replayed,true);assert.equal(balance(db,u.id),before+20);
 assert.equal(marketCatalog(at).find(r=>r.produceItem==='mango').sellPrice,10);assert.equal(marketCatalog(at).some(r=>r.seedItem==='mango'),false);
 assert.equal(db.pragma('foreign_key_check').length,0);
 }finally{db.close();}
});
test('mango rejects forged farm, remote position, wrong scene and client timestamp',()=>{
 const db=openDatabase(':memory:');try{const a=fixture(db),b=fixture(db,'mango_other'),at=mangoState(db,a.u.id).readyAt;
 assert.throws(()=>harvestMango(db,b.u.id,a.payload(),at),/quyền/);a.move(100,800);assert.throws(()=>harvestMango(db,a.u.id,a.payload(),at),/đến gần/);a.move(MANGO_TREE.x,MANGO_TREE.y,'market');assert.throws(()=>harvestMango(db,a.u.id,a.payload(),at),/đến gần/);
 assert.throws(()=>harvestMango(db,a.u.id,{...a.payload(),clientTime:at},at),/không hợp lệ/);assert.throws(()=>harvestMango(db,a.u.id,{...a.payload(),requestId:'bad'},at),/không hợp lệ/);
 assert.equal(mangoState(db,a.u.id).harvests,0);
 }finally{db.close();}
});
test('mango survives reopen, migration is idempotent and each farm has exactly one tree',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mango-reopen-')),file=path.join(dir,'farm.sqlite');let db;
 try{db=openDatabase(file);const {u,f,payload}=fixture(db),at=mangoState(db,u.id).readyAt;harvestMango(db,u.id,payload(),at);const before=mangoState(db,u.id,at);db.close();db=openDatabase(file);assert.deepEqual(mangoState(db,u.id,at),before);createFarm(db,u.id,'Same farm');assert.equal(db.prepare('SELECT count(*) n FROM farm_mango_trees WHERE farm_id=?').get(f.id).n,1);assert.equal(db.pragma('integrity_check')[0].integrity_check,'ok');}finally{db?.close();rmSync(dir,{recursive:true,force:true});}
});
test('mango HTTP enforces auth, CSRF and concurrent duplicate requests credit only once',async()=>{
 const db=openDatabase(':memory:'),{server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{assert.equal((await fetch(base+'/api/mango')).status,401);const reg=await fetch(base+'/api/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'http_mango',password:'password123'})}),data=await reg.json(),cookie=reg.headers.get('set-cookie').split(';')[0],f=createFarm(db,data.user.id,'HTTP mango');db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run();db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(MANGO_TREE.x-65,MANGO_TREE.y+35,data.user.id);db.prepare('UPDATE farm_mango_trees SET ready_at=0 WHERE farm_id=?').run(f.id);
 const p={action:'harvest',farmId:f.id,requestId:randomUUID()},send=csrf=>fetch(base+'/api/mango/action',{method:'POST',headers:{cookie,'content-type':'application/json','x-csrf-token':csrf},body:JSON.stringify(p)});
 assert.equal((await send('bad')).status,403);const replies=await Promise.all([send(data.csrf),send(data.csrf)]);assert.ok(replies.every(r=>r.status===200));const results=await Promise.all(replies.map(r=>r.json()));assert.equal(results.filter(r=>r.replayed).length,1);assert.equal(db.prepare("SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id='mango'").get(f.id).quantity,3);
 const other=register(db,'mango_host','password123'),hostFarm=createFarm(db,other.id,'Host farm');db.prepare("UPDATE farms SET visibility='public' WHERE id=?").run(hostFarm.id);
 const socket=socketClient(base,{extraHeaders:{cookie},transports:['websocket'],reconnection:false});
 try{await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
 assert.equal((await new Promise(r=>socket.emit('farm:join',{farmId:f.id},r))).ok,true);
 assert.equal((await new Promise(r=>socket.emit('social:join',{farmId:hostFarm.id},r))).ok,true);
 assert.equal((await send(data.csrf)).status,403,'visiting prevents mutations of own or other trees');
 }finally{socket.disconnect();}
 }finally{await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
});
