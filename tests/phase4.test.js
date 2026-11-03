import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import {io as socketClient} from 'socket.io-client';
import {createApp} from '../server/index.js';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {addItem} from '../server/crops.js';
import {vacState,performVacAction} from '../server/vac.js';
import {performMarketAction,balance} from '../server/economy.js';
import {marketDay} from '../server/marketConfig.js';
import {FISH,CHICKEN} from '../public/js/shared/vac.js';

const at=2_000_000_000_000;
function setup(db){
  const user=register(db,'vac_farmer','strong-pass-123'),farm=createFarm(db,user.id,'Vườn Ao Chuồng');
  const move=(x,y,scene='farm')=>db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=?').run(x,y,scene,user.id);
  const act=(action,fields={},time=at,requestId=randomUUID())=>performVacAction(db,user.id,{action,farmId:farm.id,requestId,...fields},time);
  return {user,farm,move,act};
}

test('pond capacity, feeding, offline fish harvest, retry and rollback',()=>{
  const db=openDatabase(':memory:');try{
    const {user,farm,move,act}=setup(db);assert.equal(db.prepare('SELECT count(*) n FROM farm_ponds WHERE farm_id=?').get(farm.id).n,1);
    addItem(db,farm.id,'fingerling_tilapia',6);addItem(db,farm.id,'fish_feed',2);
    assert.throws(()=>act('stock_fish',{fishId:'tilapia',quantity:1}),/gần/);
    move(990,780);const key=randomUUID();const first=act('stock_fish',{fishId:'tilapia',quantity:6},at,key);
    assert.equal(first.state.pond.fish.length,6);assert.equal(act('stock_fish',{fishId:'tilapia',quantity:6},at,key).replayed,true);
    assert.throws(()=>act('stock_fish',{fishId:'tilapia',quantity:1}),/đầy/);
    const id=first.state.pond.fish[0].id;
    assert.throws(()=>act('harvest_fish',{entityId:id},at+5*60000),/chưa trưởng thành/);
    const fed=act('feed_fish',{entityId:id},at+5*60000);assert.ok(fed.state.pond.fish[0].readyAt<at+FISH.tilapia.durationMs);
    assert.throws(()=>act('feed_fish',{entityId:id},at+6*60000),/không cần/);
    db.prepare('INSERT INTO inventory_items VALUES (?,?,999)').run(farm.id,'tilapia');
    assert.throws(()=>act('harvest_fish',{entityId:id},at+2*3600000),/đầy/);
    assert.equal(vacState(db,user.id,at+2*3600000).pond.fish.length,6);
    db.prepare("UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id='tilapia'").run(farm.id);
    const harvest=act('harvest_fish',{entityId:id},at+2*3600000);
    assert.equal(harvest.state.pond.fish.length,5);assert.equal(harvest.state.inventory.find(i=>i.id==='tilapia').quantity,2);
    assert.throws(()=>act('harvest_fish',{entityId:id},at+2*3600000),/không tồn tại/);
    assert.equal(vacState(db,user.id,at+3*86400000).pond.fish.filter(row=>row.remainingMs===0).length,5);
    assert.equal(vacState(db,user.id,at+86400000).pond.fish.filter(row=>row.remainingMs===0).length,5);
    assert.throws(()=>act('feed_fish',{entityId:first.state.pond.fish[1].id},at-1),/Thời gian/);
  }finally{db.close();}
});

test('carp and chickens grow offline, eggs cap, collection and feed cycle',()=>{
  const db=openDatabase(':memory:');try{
    const {user,farm,move,act}=setup(db);addItem(db,farm.id,'fingerling_carp',1);addItem(db,farm.id,'chick',4);addItem(db,farm.id,'chicken_feed',3);
    move(990,780);const carp=act('stock_fish',{fishId:'carp',quantity:1}).state.pond.fish[0];
    assert.equal(carp.fishId,'carp');assert.ok(vacState(db,user.id,at+2*3600000).pond.fish[0].remainingMs>0);
    assert.equal(act('harvest_fish',{entityId:carp.id},at+3*3600000).state.inventory.find(i=>i.id==='carp').quantity,2);
    move(1010,425);const chickens=act('add_chicken',{quantity:4}).state.coop.chickens;
    assert.equal(chickens.length,4);assert.throws(()=>act('add_chicken',{quantity:1}),/đầy/);
    assert.throws(()=>act('feed_chicken',{entityId:chickens[0].id},at+5*60000),/chưa trưởng thành/);
    const fed=act('feed_chicken',{entityId:chickens[0].id},at+2*3600000);
    assert.equal(fed.state.coop.chickens[0].status,'PRODUCING');
    assert.equal(vacState(db,user.id,at+2*3600000+45*60000).coop.chickens[0].eggsReady,1);
    assert.equal(vacState(db,user.id,at+8*86400000).coop.chickens[0].eggsReady,CHICKEN.maxEggs);
    assert.equal(vacState(db,user.id,at+86400000).coop.chickens[0].eggsReady,CHICKEN.maxEggs);
    assert.throws(()=>act('feed_chicken',{entityId:chickens[0].id},at+8*86400000),/trứng chưa nhặt/);
    db.prepare('INSERT INTO inventory_items VALUES (?,?,999)').run(farm.id,'egg');
    assert.throws(()=>act('collect_eggs',{},at+8*86400000),/đầy/);
    assert.equal(vacState(db,user.id,at+8*86400000).coop.chickens[0].eggsReady,3);
    db.prepare("UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id='egg'").run(farm.id);
    const collected=act('collect_eggs',{},at+8*86400000);
    assert.equal(collected.state.inventory.find(i=>i.id==='egg').quantity,3);
    assert.throws(()=>act('collect_eggs',{},at+8*86400000),/Chưa có/);
    assert.equal(act('feed_chicken',{entityId:chickens[0].id},at+8*86400000).state.coop.chickens[0].eggsReady,0);
    assert.throws(()=>act('feed_chicken',{entityId:chickens[0].id},at-1),/Thời gian/);
  }finally{db.close();}
});

test('resource conversion is bounded, authorized and transactional',()=>{
  const db=openDatabase(':memory:');try{
    const {user,farm,move,act}=setup(db);const other=register(db,'other_vac','strong-pass-456');createFarm(db,other.id,'Khác');
    addItem(db,farm.id,'soy',2);addItem(db,farm.id,'corn',1);
    move(990,780);assert.throws(()=>act('convert',{recipeId:'corn_feed',quantity:1}),/gần/);
    const key=randomUUID(),converted=act('convert',{recipeId:'soy_feed',quantity:2},at,key);
    assert.equal(converted.state.inventory.find(i=>i.id==='fish_feed').quantity,4);
    assert.equal(act('convert',{recipeId:'soy_feed',quantity:2},at,key).replayed,true);
    assert.throws(()=>act('convert',{recipeId:'soy_feed',quantity:1},at,key),/đã dùng/);
    assert.throws(()=>act('convert',{recipeId:'soy_feed',quantity:1}),/Không đủ/);
    move(1010,425);db.prepare('INSERT INTO inventory_items VALUES (?,?,999)').run(farm.id,'chicken_feed');
    assert.throws(()=>act('convert',{recipeId:'corn_feed',quantity:1}),/đầy/);
    assert.equal(vacState(db,user.id).inventory.find(i=>i.id==='corn').quantity,1);
    assert.throws(()=>performVacAction(db,other.id,{action:'convert',farmId:farm.id,requestId:randomUUID(),recipeId:'corn_feed',quantity:1},at),/Không có quyền/);
    move(1010,425,'market');assert.throws(()=>act('convert',{recipeId:'corn_feed',quantity:1}),/gần/);
    assert.throws(()=>act('convert',{recipeId:'corn_feed',quantity:-1}),/gần/);
    move(1010,425);assert.throws(()=>act('convert',{recipeId:'corn_feed',quantity:-1}),/không hợp lệ/);
    assert.throws(()=>performVacAction(db,user.id,{action:'convert',farmId:farm.id,requestId:randomUUID(),recipeId:'corn_feed',quantity:1,clientTime:0},at),/không hợp lệ/);
    db.prepare("UPDATE inventory_items SET quantity=0 WHERE farm_id=? AND item_id='chicken_feed'").run(farm.id);
    addItem(db,farm.id,'rice',1);assert.equal(act('convert',{recipeId:'rice_feed',quantity:1}).state.inventory.find(i=>i.id==='chicken_feed').quantity,2);
  }finally{db.close();}
});

test('VAC goods use existing wallet, shop, sale ledger and retry',()=>{
  const db=openDatabase(':memory:');try{
    const {user,farm,move}=setup(db),day=marketDay(at).id;
    const trade=(action,itemId,quantity,requestId=randomUUID())=>performMarketAction(db,user.id,{action,farmId:farm.id,requestId,itemId,quantity,marketId:day},at);
    move(300,445,'market');const key=randomUUID();
    assert.equal(trade('buy','fingerling_tilapia',1,key).state.balance,170);
    assert.equal(trade('buy','fingerling_tilapia',1,key).replayed,true);
    assert.equal(trade('buy','chick',1).state.balance,100);
    assert.equal(trade('buy','fish_feed',1).state.balance,92);
    assert.equal(trade('buy','chicken_feed',1).state.balance,84);
    assert.throws(()=>trade('buy','fingerling_carp',2),/Không đủ/);
    move(600,445,'market');addItem(db,farm.id,'tilapia',2);addItem(db,farm.id,'egg',3);
    assert.equal(trade('sell','tilapia',2).state.balance,148);
    assert.equal(trade('sell','egg',3).state.balance,217);
    assert.equal(db.prepare("SELECT count(*) n FROM economy_transactions WHERE user_id=? AND kind IN ('buy','sell')").get(user.id).n,6);
    assert.equal(balance(db,user.id),217);
  }finally{db.close();}
});

test('migration v3 to v4 preserves account, crop, inventory, wallet and order',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-vac-migrate-')),file=path.join(dir,'old.sqlite');let db;
  try{
    const old=new Database(file);
    old.exec(`CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,name TEXT,applied_at INTEGER);
      INSERT INTO schema_migrations VALUES(1,'phase 1',0),(2,'phase 2',0),(3,'phase 3',0);
      CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,password_hash TEXT,created_at INTEGER);
      CREATE TABLE farms(id TEXT PRIMARY KEY,owner_id TEXT,name TEXT,map_id TEXT,visibility TEXT,version INTEGER,created_at INTEGER,updated_at INTEGER);
      CREATE TABLE player_states(user_id TEXT PRIMARY KEY,farm_id TEXT,x REAL,y REAL,direction TEXT,updated_at INTEGER,scene TEXT);
      CREATE TABLE inventory_items(farm_id TEXT,item_id TEXT,quantity INTEGER,PRIMARY KEY(farm_id,item_id));
      CREATE TABLE wallets(user_id TEXT PRIMARY KEY,balance INTEGER,updated_at INTEGER);
      CREATE TABLE player_orders(farm_id TEXT,template_id TEXT,status TEXT,accepted_at INTEGER,completed_at INTEGER);
      CREATE TABLE farm_crops(id INTEGER PRIMARY KEY,farm_id TEXT,tile_x INTEGER,tile_y INTEGER,crop_id TEXT,planted_at INTEGER,duration_ms INTEGER,bonus_ms INTEGER,watered_at INTEGER,harvested_at INTEGER,yield_quantity INTEGER);
      INSERT INTO users VALUES('u','old','hash',0);
      INSERT INTO farms VALUES('f','u','Farm cũ','starter','private',1,0,0);
      INSERT INTO player_states VALUES('u','f',1100,780,'down',0,'farm');
      INSERT INTO inventory_items VALUES('f','corn',3);
      INSERT INTO wallets VALUES('u',456,0);
      INSERT INTO player_orders VALUES('f','greens','ACCEPTED',0,NULL);
      INSERT INTO farm_crops VALUES(1,'f',0,0,'rice',0,5400000,0,NULL,NULL,3);`);
    old.close();db=openDatabase(file);
    assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n,4);
    assert.equal(db.prepare('SELECT count(*) n FROM farm_ponds').get().n,1);
    assert.equal(db.prepare('SELECT count(*) n FROM farm_coops').get().n,1);
    assert.deepEqual(db.prepare("SELECT x,y FROM player_states WHERE user_id='u'").get(),{x:990,y:780});
    assert.equal(db.prepare("SELECT quantity FROM inventory_items WHERE farm_id='f' AND item_id='corn'").get().quantity,3);
    assert.equal(db.prepare("SELECT balance FROM wallets WHERE user_id='u'").get().balance,456);
    db.close();db=null;db=openDatabase(file);
    assert.equal(db.prepare('SELECT count(*) n FROM farm_ponds').get().n,1);
    assert.equal(db.prepare('SELECT count(*) n FROM farm_crops').get().n,1);
    assert.equal(db.prepare('SELECT count(*) n FROM player_orders').get().n,1);
  }finally{db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});

test('VAC HTTP enforces CSRF, ownership and scene; two tabs retry once and receive broadcast',async()=>{
  const db=openDatabase(':memory:'),{server}=createApp(db);await new Promise(resolve=>server.listen(0,resolve));
  const base=`http://127.0.0.1:${server.address().port}`,sockets=[];
  const request=async(path,body,cookie='',csrf='')=>{const response=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',cookie,'x-csrf-token':csrf},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};};
  try{
    const a=await request('/register',{username:'vac_http_a',password:'strong-pass-123'}),b=await request('/register',{username:'vac_http_b',password:'strong-pass-456'});
    const farmA=(await request('/farms',{name:'Farm A'},a.cookie,a.data.csrf)).data.farm;
    const farmB=(await request('/farms',{name:'Farm B'},b.cookie,b.data.csrf)).data.farm;
    addItem(db,farmA.id,'fingerling_tilapia',2);
    const intent={action:'stock_fish',farmId:farmA.id,requestId:randomUUID(),fishId:'tilapia',quantity:1};
    assert.equal((await request('/vac')).status,401);
    assert.equal((await request('/vac/action',intent,a.cookie)).status,403);
    assert.equal((await request('/vac/action',intent,a.cookie,a.data.csrf)).status,400);
    db.prepare('UPDATE player_states SET x=990,y=780 WHERE user_id=?').run(a.data.user.id);
    assert.equal((await request('/vac/action',{...intent,farmId:farmB.id},a.cookie,a.data.csrf)).status,400);
    for(let i=0;i<2;i++){
      const socket=socketClient(base,{extraHeaders:{cookie:a.cookie},transports:['websocket'],reconnection:false});sockets.push(socket);
      await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
      assert.equal((await new Promise(resolve=>socket.emit('farm:join',{farmId:farmA.id},resolve))).ok,true);
    }
    const updates=sockets.map(socket=>new Promise(resolve=>socket.once('farm:vac',resolve)));
    await new Promise(resolve=>setTimeout(resolve,130));
    const [one,two]=await Promise.all([request('/vac/action',intent,a.cookie,a.data.csrf),request('/vac/action',intent,a.cookie,a.data.csrf)]);
    assert.equal(one.status,200);assert.equal(two.status,200);
    assert.equal([one.data.replayed,two.data.replayed].filter(Boolean).length,1);
    assert.deepEqual((await Promise.all(updates)).map(state=>state.pond.fish.length),[1,1]);
    assert.equal((await request('/vac',undefined,b.cookie)).data.pond.fish.length,0);
    assert.equal(db.prepare("SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id='fingerling_tilapia'").get(farmA.id).quantity,1);
    db.prepare("UPDATE player_states SET scene='market' WHERE user_id=?").run(a.data.user.id);
    await new Promise(resolve=>setTimeout(resolve,130));
    assert.equal((await request('/vac/action',{...intent,requestId:randomUUID()},a.cookie,a.data.csrf)).status,400);
    assert.equal((await request('/vac/action',intent,a.cookie,a.data.csrf)).data.replayed,true);
  }finally{for(const socket of sockets)socket.disconnect();await new Promise(resolve=>server.close(resolve));db.close();}
});

test('pond and coop production survive database reopen',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-vac-restart-')),file=path.join(dir,'farm.sqlite');let db;
  try{
    db=openDatabase(file);const {user,farm,move,act}=setup(db);
    addItem(db,farm.id,'fingerling_tilapia',1);addItem(db,farm.id,'chick',1);addItem(db,farm.id,'chicken_feed',1);
    move(990,780);act('stock_fish',{fishId:'tilapia',quantity:1});
    move(1010,425);const chicken=act('add_chicken',{quantity:1}).state.coop.chickens[0];
    act('feed_chicken',{entityId:chicken.id},at+CHICKEN.growthMs);
    db.close();db=null;db=openDatabase(file);
    const state=vacState(db,user.id,at+3*86400000);
    assert.equal(state.pond.fish[0].remainingMs,0);
    assert.equal(state.coop.chickens[0].eggsReady,3);
    assert.equal(db.prepare('SELECT count(*) n FROM farm_ponds WHERE farm_id=?').get(farm.id).n,1);
    assert.equal(db.prepare('SELECT count(*) n FROM farm_coops WHERE farm_id=?').get(farm.id).n,1);
  }finally{db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
