import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {farmingState,performFarmAction} from '../server/crops.js';
import {balance,credit} from '../server/economy.js';
import {FIELD,tileCenter} from '../public/js/shared/crops.js';
import {npcsForScene} from '../public/js/shared/npcs.js';
import {FarmingUI} from '../public/js/farming.js';
function setup(db){const u=register(db,'plot_test','strong-pass-123'),f=createFarm(db,u.id,'Ô vuông');return {u,f,unlock:(requestId=randomUUID())=>performFarmAction(db,u.id,{action:'unlock_plot',farmId:f.id,requestId})};}
test('five starter squares, escalating prices, idempotent debit and all 32 plots work',()=>{
  const db=openDatabase(':memory:');try{const {u,f,unlock}=setup(db);credit(db,u.id,1000000);const initial=balance(db,u.id),state=farmingState(db,u.id);assert.equal(FIELD.width,FIELD.height);assert.equal(state.tiles.length,32);assert.equal(state.tiles.filter(t=>!t.locked).length,5);
    assert.throws(()=>performFarmAction(db,u.id,{farmId:f.id,action:'till',x:5,y:0}),/chưa mở/);
    const key=randomUUID();assert.equal(unlock(key).state.plots.unlocked,6);assert.equal(balance(db,u.id),initial-100);assert.equal(unlock(key).replayed,true);assert.equal(balance(db,u.id),initial-100);
    assert.equal(unlock().state.plots.nextPrice,300);assert.equal(balance(db,u.id),initial-275);
    for(let i=7;i<32;i++)unlock();assert.equal(farmingState(db,u.id).plots.nextPrice,null);const after=balance(db,u.id);assert.throws(()=>unlock(),/toàn bộ/);assert.equal(balance(db,u.id),after);
    const p=tileCenter(7,3);db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(p.x,p.y,u.id);performFarmAction(db,u.id,{farmId:f.id,action:'till',x:7,y:3});assert.equal(db.prepare('SELECT state FROM farm_soil_tiles WHERE farm_id=? AND tile_x=7 AND tile_y=3').get(f.id).state,'TILLED');
    const ledger=db.prepare("SELECT SUM(-delta) amount,COUNT(*) n FROM economy_transactions WHERE user_id=? AND item_id='farm_plot'").get(u.id);assert.equal(ledger.n,27);assert.equal(ledger.amount,initial-after);assert.equal(db.pragma('foreign_key_check').length,0);
  }finally{db.close();}
});
test('plot unlock rejects insufficient money, forged farm and wrong scene without partial updates',()=>{
  const db=openDatabase(':memory:');try{const {u,f,unlock}=setup(db);db.prepare('UPDATE wallets SET balance=99 WHERE user_id=?').run(u.id);assert.throws(()=>unlock(),/Không đủ/);assert.equal(farmingState(db,u.id).plots.unlocked,5);assert.equal(balance(db,u.id),99);
    const other=register(db,'plot_other','strong-pass-123');createFarm(db,other.id,'Farm riêng');assert.throws(()=>performFarmAction(db,other.id,{action:'unlock_plot',farmId:f.id,requestId:randomUUID()}),/quyền/);
    credit(db,u.id,100);db.prepare("UPDATE player_states SET scene='market' WHERE user_id=?").run(u.id);assert.throws(()=>unlock(),/về nông trại/);assert.equal(balance(db,u.id),199);assert.equal(db.prepare('SELECT COUNT(*) n FROM farm_plot_receipts').get().n,0);
  }finally{db.close();}
});
test('a stale unlock confirmation cannot charge for a different plot or higher price',()=>{
  const db=openDatabase(':memory:');try{const {u,f,unlock}=setup(db);credit(db,u.id,1000);const before=balance(db,u.id);unlock();assert.throws(()=>performFarmAction(db,u.id,{action:'unlock_plot',farmId:f.id,requestId:randomUUID(),expectedCount:6}),/đã thay đổi/);assert.equal(balance(db,u.id),before-100);assert.equal(farmingState(db,u.id).plots.unlocked,6);}finally{db.close();}
});
test('plot migration preserves occupied legacy coordinates, crop IDs, timers, inventory and wallets',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'plot-migration-')),file=path.join(dir,'farm.sqlite');let db;
  try{db=openDatabase(file);const {u,f}=setup(db),at=Date.now();db.prepare('INSERT INTO farm_soil_tiles VALUES (?,?,?,?,?)').run(f.id,4,2,'PLANTED',at);db.prepare('INSERT INTO farm_crops(id,farm_id,tile_x,tile_y,crop_id,planted_at,duration_ms,bonus_ms,watered_at,yield_quantity) VALUES (78,?,4,2,?,?,?,?,?,3)').run(f.id,'rice',at-1000,5400000,540000,at);const before=db.prepare('SELECT * FROM farm_crops').all(),wallet=balance(db,u.id),items=db.prepare('SELECT * FROM inventory_items ORDER BY item_id').all();
    db.exec('DROP TABLE farm_plot_receipts;DROP TABLE farm_plot_expansions;DELETE FROM schema_migrations WHERE version=9;');db.close();db=openDatabase(file);
    assert.deepEqual(db.prepare('SELECT * FROM farm_crops').all(),before);assert.equal(balance(db,u.id),wallet);assert.deepEqual(db.prepare('SELECT * FROM inventory_items ORDER BY item_id').all(),items);assert.equal(farmingState(db,u.id).plots.unlocked,21);assert.equal(farmingState(db,u.id).plots.nextPrice,100);assert.equal(db.pragma('foreign_key_check').length,0);db.close();db=openDatabase(file);assert.equal(farmingState(db,u.id).plots.unlocked,21);assert.deepEqual(db.prepare('SELECT * FROM farm_crops').all(),before);
  }finally{db?.close();rmSync(dir,{recursive:true,force:true});}
});
test('farm client hides NPCs even when a stale server returns old farm NPC data',()=>{
  const npcs=[{id:'tu',scene:'farm'},{id:'lan',scene:'market'}];assert.deepEqual(npcsForScene(npcs,'farm'),[]);assert.deepEqual(npcsForScene(npcs,'market'),[{id:'lan',scene:'market'}]);
});
test('young crop has a dark soil mound and mature crop does not',()=>{
  for(const [time,expected] of [[100,1],[1100,0]]){let ellipses=0;const ctx={fillRect(){},strokeRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},ellipse(){ellipses++;}};
    FarmingUI.prototype.draw.call({state:{tiles:[{x:0,y:0,state:'PLANTED',crop:{cropId:'rice',plantedAt:100,durationMs:1000,bonusMs:0,wateredAt:null}}]},isometric:true,serverNow:()=>time,updateInfo(){}},ctx);assert.equal(ellipses,expected);
  }
});
test('owned untilled soil stays visible in isometric view',()=>{
  const fills=[];const ctx={fillRect(...args){fills.push(args);},strokeRect(){}};
  FarmingUI.prototype.draw.call({state:{tiles:[{x:0,y:0,locked:false,state:'EMPTY',crop:null}]},isometric:true,soilArt:{naturalWidth:4},upright(){},serverNow:()=>0,updateInfo(){}},ctx);
  assert.deepEqual(fills[0],[FIELD.x,FIELD.y,FIELD.width,FIELD.height]);
});
test('unbought plots leave terrain untouched until hovered',()=>{
  const marks=[];const ctx={save(){},restore(){},strokeRect(...args){marks.push(args);}};
  const tile={x:0,y:0,locked:true},ui={state:{tiles:[tile],plots:{unlocked:8}},selected:tile,serverNow:()=>0,updateInfo(){},tile:()=>tile};
  FarmingUI.prototype.draw.call(ui,ctx);
  assert.equal(marks.length,0);
  ui.hover=tile;FarmingUI.prototype.draw.call(ui,ctx);
  assert.deepEqual(marks,[[FIELD.x+1,FIELD.y+1,FIELD.width-2,FIELD.height-2]]);
});
