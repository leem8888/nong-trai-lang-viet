import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { openDatabase } from '../server/db.js';
import { register } from '../server/auth.js';
import { createFarm } from '../server/farms.js';
import { farmingState, performFarmAction, addItem, spendItem } from '../server/crops.js';
import { CROPS, CROP_IDS, FIELD, tileAt, cropProgress, tileCenter } from '../public/js/shared/crops.js';
import { createApp } from '../server/index.js';
import { io as socketClient } from 'socket.io-client';

const start=1_800_000_000_000;
function setup(db) {
  const user=register(db,'grower','strong-pass-123'), farm=createFarm(db,user.id,'Vườn thử');
  const move=(x,y)=>{const point=tileCenter(x,y);db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(point.x,point.y+45,user.id);};
  const act=(action,x,y,extra={},at=start)=>performFarmAction(db,user.id,{farmId:farm.id,action,x,y,...extra},at);
  return {user,farm,move,act};
}

test('soil rules, six crops, offline stages, watering and idempotent harvest',()=>{
  const db=openDatabase(':memory:');
  try {
    const {user,farm,move,act}=setup(db);
    assert.equal(farmingState(db,user.id,start).inventory.find(i=>i.id==='seed_rice').quantity,4);
    assert.equal(tileAt(FIELD.x,FIELD.y+10).x,0);
    assert.equal(tileAt(FIELD.x+FIELD.width,FIELD.y+10),null);
    assert.throws(()=>act('till',0,0),/xa/);
    move(0,0);
    assert.throws(()=>act('plant',0,0,{cropId:'rice'}),/đã cuốc/);
    assert.throws(()=>act('till',8,0),/không hợp lệ/);
    act('till',0,0);
    assert.throws(()=>act('till',0,0),/đã được chuẩn bị/);
    assert.throws(()=>act('plant',0,0,{cropId:'__proto__'}),/không hợp lệ/);
    act('plant',0,0,{cropId:'rice'});
    assert.throws(()=>act('plant',0,0,{cropId:'rice'}),/chưa có cây/);
    assert.equal(farmingState(db,user.id,start).tiles[0].crop.stage,'SEED');
    assert.throws(()=>act('harvest',0,0,{},start+1000),/chưa trưởng thành/);
    act('water',0,0,{},start+1000);
    assert.throws(()=>act('water',0,0,{},start+2000),/không cần tưới/);
    const crop=farmingState(db,user.id,start+1000).tiles[0].crop;
    assert.equal(crop.bonusMs,CROPS.rice.durationMs/10);
    assert.equal(cropProgress(crop,start+crop.durationMs*.3).stage,'SPROUT');
    assert.equal(cropProgress(crop,start+crop.durationMs*.7).stage,'GROWING');
    assert.equal(farmingState(db,user.id,start+2*3600000).tiles[0].crop.stage,'MATURE');
    assert.equal(farmingState(db,user.id,start+3*86400000).tiles[0].crop.stage,'MATURE');
    db.prepare('INSERT INTO inventory_items VALUES (?,?,999)').run(farm.id,'rice');
    assert.throws(()=>act('harvest',0,0,{},start+2*3600000),/đầy/);
    assert.equal(farmingState(db,user.id,start+2*3600000).tiles[0].state,'PLANTED');
    db.prepare('UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id=?').run(farm.id,'rice');
    const attempts=[()=>act('harvest',0,0,{},start+2*3600000),()=>act('harvest',0,0,{},start+2*3600000)];
    const outcomes=attempts.map(run=>{try{return {ok:true,result:run()};}catch(error){return {ok:false,error};}});
    assert.equal(outcomes.filter(outcome=>outcome.ok).length,1);
    assert.match(outcomes.find(outcome=>!outcome.ok).error.message,/chưa có cây/);
    assert.equal(farmingState(db,user.id,start+2*3600000).inventory.find(i=>i.id==='rice').quantity,3);
    assert.equal(farmingState(db,user.id,start+2*3600000).tiles[0].state,'TILLED');
    act('plant',0,0,{cropId:'mustard'},start+2*3600000+1);
    assert.equal(farmingState(db,user.id,start+2*3600000+1).tiles[0].crop.cropId,'mustard');
    for(let i=1;i<CROP_IDS.length;i++) {
      const x=i,y=0;if(i===5)performFarmAction(db,user.id,{farmId:farm.id,action:'unlock_plot',requestId:crypto.randomUUID()},start+2*3600000+1);move(x,y);act('till',x,y,{},start+2*3600000+1);act('plant',x,y,{cropId:CROP_IDS[i]},start+2*3600000+1);
      assert.equal(farmingState(db,user.id,start+2*3600000+1).tiles.find(t=>t.x===x&&t.y===y).crop.cropId,CROP_IDS[i]);
    }
    assert.equal(db.prepare('SELECT count(*) n FROM farm_crops WHERE farm_id=? AND harvested_at IS NOT NULL').get(farm.id).n,1);
  } finally {db.close();}
});

test('inventory transactions and bounded seed refill',()=>{
  const db=openDatabase(':memory:');
  try {
    const {user,farm,act}=setup(db);
    assert.throws(()=>spendItem(db,farm.id,'seed_rice',5),/Không đủ/);
    assert.equal(farmingState(db,user.id).inventory.find(i=>i.id==='seed_rice').quantity,4);
    spendItem(db,farm.id,'seed_rice',2);addItem(db,farm.id,'seed_rice',1);
    assert.equal(farmingState(db,user.id).inventory.find(i=>i.id==='seed_rice').quantity,3);
    assert.throws(()=>spendItem(db,farm.id,'seed_rice',-1));
    assert.throws(()=>addItem(db,farm.id,'seed_rice',1000),/đầy/);
    assert.throws(()=>act('claim_seeds'),/đã hết/);
    db.prepare("UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id LIKE 'seed_%'").run(farm.id);
    act('claim_seeds',undefined,undefined,{},start);
    assert.equal(farmingState(db,user.id).inventory.find(i=>i.id==='seed_rice').quantity,2);
    db.prepare("UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id LIKE 'seed_%'").run(farm.id);
    assert.throws(()=>act('claim_seeds',undefined,undefined,{},start),/đã nhận/);
    act('claim_seeds',undefined,undefined,{},start+86400000);
    assert.equal(farmingState(db,user.id).inventory.find(i=>i.id==='seed_rice').quantity,2);
  } finally {db.close();}
});

test('migration from v1 preserves farm and starter has no user data',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-v1-')), file=path.join(dir,'old.sqlite');
  let db;
  try {
    const old=new Database(file);
    old.exec(`CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,name TEXT,applied_at INTEGER);
      INSERT INTO schema_migrations VALUES(1,'phase 1',0);
      CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,password_hash TEXT,created_at INTEGER);
      CREATE TABLE farms(id TEXT PRIMARY KEY,owner_id TEXT,name TEXT,map_id TEXT,visibility TEXT,version INTEGER,created_at INTEGER,updated_at INTEGER);
      CREATE TABLE player_states(user_id TEXT PRIMARY KEY,farm_id TEXT,x REAL,y REAL,direction TEXT,updated_at INTEGER);
      INSERT INTO users VALUES('u','old','hash',0);
      INSERT INTO farms VALUES('f','u','Old farm','starter','private',1,0,0);
      INSERT INTO player_states VALUES('u','f',720,650,'down',0);`);
    old.close();
    db=openDatabase(file);
    assert.equal(db.prepare('SELECT name FROM farms WHERE id=?').get('f').name,'Old farm');
    assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n,11);
    assert.equal(db.prepare('SELECT count(*) n FROM inventory_items WHERE farm_id=?').get('f').n,6);
    db.close();db=null;
    db=openDatabase(file);
    assert.equal(db.prepare('SELECT count(*) n FROM inventory_items WHERE farm_id=?').get('f').n,6);
    const starter=openDatabase(path.resolve('data/starter.sqlite'));
    assert.equal(starter.prepare('SELECT count(*) n FROM users').get().n,0);
    assert.equal(starter.prepare('SELECT count(*) n FROM auth_sessions').get().n,0);
    starter.close();
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});

test('planted crop survives database reopen and grows while offline',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-crop-restart-')), file=path.join(dir,'farm.sqlite');
  let db;
  try {
    db=openDatabase(file);
    const {user,move,act}=setup(db);
    db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run(); // normal 15-minute crop, not the first-use tutorial
    move(0,0);act('till',0,0);act('plant',0,0,{cropId:'mustard'});
    assert.equal(farmingState(db,user.id,start+5*60000).tiles[0].crop.stage,'SPROUT');
    db.close();db=null;
    db=openDatabase(file);
    assert.equal(farmingState(db,user.id,start+2*3600000).tiles[0].crop.stage,'MATURE');
    assert.equal(farmingState(db,user.id,start+3*86400000).tiles[0].crop.stage,'MATURE');
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});

test('HTTP ownership, CSRF and client clock are rejected',async()=>{
  const db=openDatabase(':memory:'),{server}=createApp(db);
  await new Promise(resolve=>server.listen(0,resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const request=async(path,body,cookie='',csrf='')=>{
    const r=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',cookie,'x-csrf-token':csrf},body:body?JSON.stringify(body):undefined});
    return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie};
  };
  try {
    const a=await request('/register',{username:'grower_a',password:'strong-pass-123'});
    const b=await request('/register',{username:'grower_b',password:'strong-pass-456'});
    const farmA=(await request('/farms',{name:'Farm A'},a.cookie,a.data.csrf)).data.farm;
    const farmB=(await request('/farms',{name:'Farm B'},b.cookie,b.data.csrf)).data.farm;
    assert.equal((await request('/farming',undefined,a.cookie)).data.tiles.length,32);
    const action={farmId:farmA.id,action:'till',x:0,y:0,now:Date.now()+100*86400000};
    assert.equal((await request('/farming/action',action,a.cookie)).status,403);
    assert.equal((await request('/farming/action',{...action,farmId:farmB.id},a.cookie,a.data.csrf)).status,400);
    await new Promise(resolve=>setTimeout(resolve,130));
    assert.equal((await request('/farming/action',action,a.cookie,a.data.csrf)).status,400);
    const point=tileCenter(0,0);
    db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(point.x,point.y+45,a.data.user.id);
    await new Promise(resolve=>setTimeout(resolve,130));
    const before=Date.now(), done=await request('/farming/action',action,a.cookie,a.data.csrf);
    assert.equal(done.status,200);
    assert.equal(done.data.state.tiles[0].state,'TILLED');
    assert.ok(db.prepare('SELECT updated_at FROM farm_soil_tiles WHERE farm_id=? AND tile_x=0 AND tile_y=0').get(farmA.id).updated_at>=before);
    const sockets=[];
    try {
      for(let i=0;i<2;i++) {
        const socket=socketClient(base,{extraHeaders:{cookie:a.cookie},transports:['websocket'],reconnection:false});sockets.push(socket);
        await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
        assert.equal((await new Promise(resolve=>socket.emit('farm:join',{farmId:farmA.id},resolve))).ok,true);
      }
      const updates=sockets.map(socket=>new Promise(resolve=>socket.once('farm:farming',resolve)));
      await new Promise(resolve=>setTimeout(resolve,130));
      assert.equal((await request('/farming/action',{farmId:farmA.id,action:'water',x:0,y:0},a.cookie,a.data.csrf)).status,200);
      const [first,second]=await Promise.all(updates);
      assert.equal(first.tiles[0].state,'WATERED');
      assert.equal(second.tiles[0].state,'WATERED');
    } finally {for(const socket of sockets)socket.disconnect();}
  } finally {await new Promise(resolve=>server.close(resolve));db.close();}
});
