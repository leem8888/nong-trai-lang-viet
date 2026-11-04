import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { io as socketClient } from 'socket.io-client';
import { openDatabase } from '../server/db.js';
import { register } from '../server/auth.js';
import { createFarm } from '../server/farms.js';
import { addItem } from '../server/crops.js';
import { createWallet, balance, credit, debit, marketState, performMarketAction } from '../server/economy.js';
import { MAX_BALANCE } from '../server/marketConfig.js';
import { marketDay, marketCatalog, SEED_PRICES, SELL_PRICES, ORDERS } from '../server/marketConfig.js';
import { CROPS } from '../public/js/shared/crops.js';
import { createApp } from '../server/index.js';

const at=1_800_000_000_000;
function setup(db) {
  const user=register(db,'merchant','strong-pass-123'),farm=createFarm(db,user.id,'Ruộng làng');
  const move=(x,y,scene='market')=>db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=?').run(x,y,scene,user.id);
  const act=(action,fields={},requestId=randomUUID(),time=at)=>performMarketAction(db,user.id,{farmId:farm.id,action,requestId,...fields},time);
  return {user,farm,move,act};
}

test('wallet starter grant, limits and trial economy balance',()=>{
  const db=openDatabase(':memory:');
  try {
    const {user}=setup(db);
    assert.equal(balance(db,user.id),200);
    assert.equal(createWallet(db,user.id),false);
    assert.equal(balance(db,user.id),200);
    assert.throws(()=>debit(db,user.id,201),/Không đủ/);
    assert.throws(()=>debit(db,user.id,-1));
    assert.throws(()=>credit(db,user.id,Number.MAX_SAFE_INTEGER));
    db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run(MAX_BALANCE-5,user.id);
    assert.throws(()=>credit(db,user.id,10),/giới hạn/);
    assert.equal(balance(db,user.id),MAX_BALANCE-5);
    assert.equal(db.prepare("SELECT count(*) n FROM economy_transactions WHERE user_id=? AND kind='starter'").get(user.id).n,1);
    const catalog=marketCatalog(at), day=marketDay(at);
    assert.equal(day.startAt,Math.floor(at/86400000)*86400000);
    assert.equal(marketDay(day.endAt-1).id,day.id);
    assert.notEqual(marketDay(day.endAt).id,day.id);
    assert.equal(catalog.filter(row=>row.featured).length,1);
    assert.ok(catalog.filter(row=>row.cropId).every(row=>row.sellPrice>=row.baseSellPrice&&row.sellPrice<=Math.floor(row.baseSellPrice*1.15)));
    const rows=Object.keys(CROPS).map(id=>{const profit=CROPS[id].yield*SELL_PRICES[id]-SEED_PRICES[id];return {id,profit,hourly:profit/(CROPS[id].durationMs/3600000)};});
    assert.ok(rows.every(row=>row.profit>0));
    assert.notEqual(rows.toSorted((a,b)=>b.profit-a.profit)[0].id,rows.toSorted((a,b)=>b.hourly-a.hourly)[0].id);
  } finally {db.close();}
});

test('buy and sell are atomic, idempotent and server priced',()=>{
  const db=openDatabase(':memory:');
  try {
    const {user,farm,move,act}=setup(db),day=marketDay(at).id;
    assert.throws(()=>act('buy',{itemId:'seed_mustard',quantity:1,marketId:day}),/đến gần/);
    move(300,445);
    const key=randomUUID(),buy=act('buy',{itemId:'seed_mustard',quantity:2,marketId:day},key);
    assert.equal(buy.state.balance,172);
    assert.equal(buy.state.inventory.find(item=>item.id==='seed_mustard').quantity,6);
    assert.equal(act('buy',{itemId:'seed_mustard',quantity:2,marketId:day},key).replayed,true);
    assert.equal(balance(db,user.id),172);
    assert.throws(()=>act('buy',{itemId:'seed_mustard',quantity:3,marketId:day},key),/đã dùng/);
    assert.throws(()=>act('buy',{itemId:'seed_mustard',quantity:-1,marketId:day}),/không hợp lệ/);
    assert.throws(()=>act('buy',{itemId:'missing',quantity:1,marketId:day}),/không giao dịch/);
    assert.throws(()=>act('buy',{itemId:'seed_mustard',quantity:1,marketId:'2000-01-01'}),/Giá chợ đã đổi/);
    assert.throws(()=>act('buy',{itemId:'seed_rice',quantity:99,marketId:day}),/Không đủ/);
    assert.throws(()=>performMarketAction(db,user.id,{farmId:farm.id,action:'buy',requestId:randomUUID(),itemId:'seed_mustard',quantity:1,marketId:day,price:0},at),/không hợp lệ/);
    db.prepare('UPDATE inventory_items SET quantity=999 WHERE farm_id=? AND item_id=?').run(farm.id,'seed_mustard');
    assert.throws(()=>act('buy',{itemId:'seed_mustard',quantity:1,marketId:day}),/đầy/);
    assert.equal(balance(db,user.id),172);
    addItem(db,farm.id,'mustard',2);move(600,445);
    const saleKey=randomUUID(),sale=act('sell',{itemId:'mustard',quantity:2,marketId:day},saleKey);
    const price=marketCatalog(at).find(row=>row.produceItem==='mustard').sellPrice;
    assert.equal(sale.state.balance,172+2*price);
    assert.equal(sale.state.inventory.find(item=>item.id==='mustard').quantity,0);
    assert.equal(act('sell',{itemId:'mustard',quantity:2,marketId:day},saleKey).replayed,true);
    assert.throws(()=>act('sell',{itemId:'mustard',quantity:2,marketId:day}),/Không đủ/);
    assert.equal(db.prepare("SELECT count(*) n FROM economy_transactions WHERE user_id=? AND kind IN ('buy','sell')").get(user.id).n,2);
    move(300,445);
    const anotherKey=randomUUID();
    const replayed=[()=>act('buy',{itemId:'seed_carrot',quantity:1,marketId:day},anotherKey),()=>act('buy',{itemId:'seed_carrot',quantity:1,marketId:day},anotherKey)].map(run=>run());
    assert.equal(replayed.filter(result=>result.replayed).length,1);
    assert.equal(db.prepare('SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id=?').get(farm.id,'seed_carrot').quantity,5);
  } finally {db.close();}
});

test('orders require accepted state and consume inventory once',()=>{
  const db=openDatabase(':memory:');
  try {
    const {user,farm,move,act}=setup(db);move(900,445);
    const order=ORDERS[0];
    assert.throws(()=>act('complete_order',{orderId:order.id}),/chưa nhận/);
    const acceptKey=randomUUID();assert.match(act('accept_order',{orderId:order.id},acceptKey).message,/Đã nhận/);
    assert.equal(act('accept_order',{orderId:order.id},acceptKey).replayed,true);
    assert.throws(()=>act('accept_order',{orderId:order.id}),/đã được nhận/);
    assert.throws(()=>act('complete_order',{orderId:order.id}),/Không đủ/);
    assert.equal(balance(db,user.id),200);
    for(const [itemId,quantity] of Object.entries(order.items))addItem(db,farm.id,itemId,quantity);
    const key=randomUUID(),done=act('complete_order',{orderId:order.id},key);
    assert.equal(done.state.balance,200+order.reward);
    assert.equal(done.state.orders.find(row=>row.id===order.id).status,'COMPLETED');
    assert.equal(act('complete_order',{orderId:order.id},key).replayed,true);
    assert.throws(()=>act('complete_order',{orderId:order.id}),/đã hoàn thành/);
    assert.equal(db.prepare("SELECT count(*) n FROM economy_transactions WHERE user_id=? AND kind='order'").get(user.id).n,1);
  } finally {db.close();}
});

test('migration from Phase 2 preserves inventory, wallet and scene after reopen',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-v2-market-')),file=path.join(dir,'old.sqlite');let db;
  try {
    const old=new Database(file);
    old.exec(`CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,name TEXT,applied_at INTEGER);
      INSERT INTO schema_migrations VALUES(1,'phase 1',0),(2,'phase 2',0);
      CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,password_hash TEXT,created_at INTEGER);
      CREATE TABLE farms(id TEXT PRIMARY KEY,owner_id TEXT,name TEXT,map_id TEXT,visibility TEXT,version INTEGER,created_at INTEGER,updated_at INTEGER);
      CREATE TABLE player_states(user_id TEXT PRIMARY KEY,farm_id TEXT,x REAL,y REAL,direction TEXT,updated_at INTEGER);
      CREATE TABLE inventory_items(farm_id TEXT,item_id TEXT,quantity INTEGER,PRIMARY KEY(farm_id,item_id));
      INSERT INTO users VALUES('u','old','hash',0);
      INSERT INTO farms VALUES('f','u','Old farm','starter','private',1,0,0);
      INSERT INTO player_states VALUES('u','f',720,650,'down',0);
      INSERT INTO inventory_items VALUES('f','rice',7);`);
    old.exec(`CREATE TABLE farm_soil_tiles(farm_id TEXT,tile_x INTEGER,tile_y INTEGER,state TEXT,updated_at INTEGER,PRIMARY KEY(farm_id,tile_x,tile_y));
      CREATE TABLE farm_crops(id INTEGER PRIMARY KEY,farm_id TEXT,tile_x INTEGER,tile_y INTEGER,crop_id TEXT,planted_at INTEGER,duration_ms INTEGER,bonus_ms INTEGER,watered_at INTEGER,harvested_at INTEGER,yield_quantity INTEGER);`);
    old.close();db=openDatabase(file);
    assert.equal(db.prepare('SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id=?').get('f','rice').quantity,7);
    assert.equal(db.prepare('SELECT balance FROM wallets WHERE user_id=?').get('u').balance,200);
    assert.equal(db.prepare('SELECT scene FROM player_states WHERE user_id=?').get('u').scene,'farm');
    db.close();db=null;db=openDatabase(file);
    assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n,9);
    assert.equal(db.prepare('SELECT balance FROM wallets WHERE user_id=?').get('u').balance,200);
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});

test('order progress and balance survive restart',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-market-restart-')),file=path.join(dir,'farm.sqlite');let db;
  try {
    db=openDatabase(file);const {user,farm,move,act}=setup(db);move(900,445);
    const order=ORDERS[0];act('accept_order',{orderId:order.id});
    for(const [itemId,quantity] of Object.entries(order.items))addItem(db,farm.id,itemId,quantity);
    db.close();db=null;db=openDatabase(file);
    assert.equal(marketState(db,user.id).orders.find(row=>row.id===order.id).status,'ACCEPTED');
    performMarketAction(db,user.id,{farmId:farm.id,action:'complete_order',orderId:order.id,requestId:randomUUID()},at);
    db.close();db=null;db=openDatabase(file);
    assert.equal(balance(db,user.id),200+order.reward);
    assert.equal(marketState(db,user.id).orders.find(row=>row.id===order.id).status,'COMPLETED');
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});

test('order templates are bounded and a market receipt replays after leaving',()=>{
  const db=openDatabase(':memory:');
  try {
    const {user,farm,move,act}=setup(db),day=marketDay(at).id;
    move(900,445);
    for(const order of ORDERS)act('accept_order',{orderId:order.id});
    assert.equal(marketState(db,user.id).orders.filter(order=>order.status==='ACCEPTED').length,ORDERS.length);
    assert.throws(()=>act('accept_order',{orderId:ORDERS[0].id}),/đã được nhận/);
    assert.throws(()=>act('accept_order',{orderId:'forged'}),/không tồn tại/);
    move(300,445);
    const key=randomUUID(),intent={farmId:farm.id,action:'buy',requestId:key,itemId:'seed_mustard',quantity:1,marketId:day};
    const first=performMarketAction(db,user.id,intent,at);
    move(720,850,'farm');
    const replay=performMarketAction(db,user.id,intent,at);
    assert.equal(replay.replayed,true);
    assert.equal(replay.transactionId,first.transactionId);
    assert.equal(balance(db,user.id),186);
    assert.throws(()=>performMarketAction(db,user.id,{...intent,quantity:2},at),/đã dùng/);
  } finally {db.close();}
});

test('HTTP and socket gate market access by farm, CSRF and scene',async()=>{
  const db=openDatabase(':memory:'),{server}=createApp(db);await new Promise(resolve=>server.listen(0,resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const request=async(path,body,cookie='',csrf='')=>{const response=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',cookie,'x-csrf-token':csrf},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};};
  const sockets=[];
  try {
    const a=await request('/register',{username:'market_a',password:'strong-pass-123'}),b=await request('/register',{username:'market_b',password:'strong-pass-456'});
    const farmA=(await request('/farms',{name:'A Farm'},a.cookie,a.data.csrf)).data.farm;
    const farmB=(await request('/farms',{name:'B Farm'},b.cookie,b.data.csrf)).data.farm;
    assert.equal((await request('/market')).status,401);
    assert.equal((await request('/market',undefined,a.cookie)).data.balance,200);
    const intent={farmId:farmA.id,action:'buy',requestId:randomUUID(),itemId:'seed_mustard',quantity:1,marketId:marketDay(Date.now()).id};
    assert.equal((await request('/market/action',intent,a.cookie)).status,403);
    assert.equal((await request('/market/action',intent,a.cookie,a.data.csrf)).status,400);
    const socket=socketClient(base,{extraHeaders:{cookie:a.cookie},transports:['websocket'],reconnection:false});sockets.push(socket);
    await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
    assert.equal((await new Promise(resolve=>socket.emit('farm:join',{farmId:farmA.id},resolve))).ok,true);
    assert.equal((await new Promise(resolve=>socket.emit('world:travel',{to:'market'},resolve))).ok,false);
    db.prepare('UPDATE player_states SET x=720,y=850 WHERE user_id=?').run(a.data.user.id);
    assert.equal((await new Promise(resolve=>socket.emit('world:travel',{to:'market'},resolve))).scene,'market');
    db.prepare('UPDATE player_states SET x=935,y=586 WHERE user_id=?').run(a.data.user.id);
    assert.equal((await new Promise(resolve=>socket.emit('farm:interact',{objectId:'lamp'},resolve))).ok,false);
    db.prepare('UPDATE player_states SET x=300,y=445 WHERE user_id=?').run(a.data.user.id);
    await new Promise(resolve=>setTimeout(resolve,130));
    assert.equal((await request('/market/action',{...intent,farmId:farmB.id},a.cookie,a.data.csrf)).status,400);
    await new Promise(resolve=>setTimeout(resolve,130));
    const bought=await request('/market/action',intent,a.cookie,a.data.csrf);
    assert.equal(bought.status,200);
    assert.equal(bought.data.state.balance,186);
    assert.equal((await request('/market',undefined,b.cookie)).data.balance,200);
    db.prepare('UPDATE player_states SET x=600,y=650 WHERE user_id=?').run(a.data.user.id);
    assert.equal((await new Promise(resolve=>socket.emit('world:travel',{to:'farm'},resolve))).scene,'farm');
    const replay=await request('/market/action',intent,a.cookie,a.data.csrf);
    assert.equal(replay.status,200);
    assert.equal(replay.data.replayed,true);
    assert.equal(replay.data.state.balance,186);
  } finally {for(const socket of sockets)socket.disconnect();await new Promise(resolve=>server.close(resolve));db.close();}
});
