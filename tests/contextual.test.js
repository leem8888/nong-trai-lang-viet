import test from 'node:test';
import assert from 'node:assert/strict';
import { ContextualInteraction, traceTiles, validSoilActions } from '../public/js/contextual.js';
import { tileCenter } from '../public/js/shared/crops.js';
import { coopGeometry, coopToWorld, coopHit } from '../public/js/animalMotion.js';
import { YARD_CANDIDATES } from '../public/js/shared/livingLayout.js';

test('batch soil actions wait for each tile animation before starting the next',async()=>{
  const tiles=[{x:0,y:0},{x:1,y:0}],events=[];
  let finishAnimation;
  const ui=Object.create(ContextualInteraction.prototype);
  Object.assign(ui,{mode:'actionArmed',action:'till',seed:'mustard',generation:1,preview:new Map(),isOwner:()=>true,isFarm:()=>true,renderStatus(){},notice(){},
    farming:{state:{farmId:'f',inventory:[]},tile:()=>({state:'EMPTY'}),serverNow:()=>0,updateInfo(){},setState(){},async api(url,options){events.push(`request:${JSON.parse(options.body).x}`);return {state:{}};}},
    onSoilAction:async tile=>{events.push(`animate:${tile.x}`);await new Promise(resolve=>{finishAnimation=resolve;});events.push(`done:${tile.x}`);}
  });
  const work=ui.submit(tiles);await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(events,['request:0','animate:0']);
  assert.deepEqual(ui.farming.selected,tiles[0]);
  finishAnimation();await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(events,['request:0','animate:0','done:0','request:1','animate:1']);
  finishAnimation();await work;
  assert.equal(events.at(-1),'done:1');
});

test('coop clicks follow the visible yard and exclude grass below it',()=>{
  for(const yard of YARD_CANDIDATES){
    const g=coopGeometry(yard);
    const at=(u,v)=>coopToWorld(g,{x:u*g.width,y:v*g.height});
    assert.equal(coopHit(yard,at(.65,.74)),true);
    assert.equal(coopHit(yard,at(.25,.4)),true);
    assert.equal(coopHit(yard,at(.6,1.05)),false);
    assert.equal(coopHit(yard,at(.98,.8)),false);
    assert.equal(coopHit(yard,{x:yard.x+yard.w/2,y:yard.y+yard.h-10}),false);
  }
});

test('cancelled soil animation cannot overwrite a newer tile state',async()=>{
 let finish,apply;const states=[],ui=Object.create(ContextualInteraction.prototype);
 Object.assign(ui,{mode:'actionArmed',action:'till',seed:'mustard',generation:1,preview:new Map(),isOwner:()=>true,isFarm:()=>true,renderStatus(){},notice(){},
  farming:{state:{farmId:'f',inventory:[]},tile:()=>({state:'EMPTY'}),serverNow:()=>0,updateInfo(){},setState(s){states.push(s);},async api(){return {state:{old:true}};}},
  onSoilAction:async(tile,action,applyState)=>{apply=applyState;await new Promise(resolve=>{finish=resolve;});}
 });
 const work=ui.submit([{x:0,y:0}]);await new Promise(resolve=>setImmediate(resolve));
 ui.generation++;ui.mode='contextMenuOpen';apply();finish();await work;
 assert.deepEqual(states,[]);assert.equal(ui.mode,'contextMenuOpen');
});

test('soil action tray closes three seconds after live inventory or eligible tiles reach zero',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const exhausted of ['seeds','tiles']){
  const ui=Object.create(ContextualInteraction.prototype),state={inventory:[{id:'seed_mustard',quantity:1}],tiles:[{state:'TILLED',crop:null}]};
  let closed=0;
  Object.assign(ui,{mode:'actionArmed',action:'plant',seed:'mustard',generation:1,preview:new Map(),farming:{state,serverNow:()=>0},cancel(){closed++;this.mode='idle';}});
  ui.draw(null);t.mock.timers.tick(4000);assert.equal(closed,0);
  if(exhausted==='seeds')state.inventory[0].quantity=0;else state.tiles[0].state='PLANTED';
  ui.draw(null);t.mock.timers.tick(2999);assert.equal(closed,0);t.mock.timers.tick(1);assert.equal(closed,1);
 }
});

test('till, water and harvest trays also close after three seconds with no eligible plots',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const crop={cropId:'mustard',plantedAt:0,durationMs:10000,bonusMs:0,wateredAt:null};
 for(const [action,tile,now,exhaust] of [
  ['till',{state:'EMPTY',crop:null},0,tile=>{tile.state='TILLED';}],
  ['water',{state:'PLANTED',crop:{...crop}},1000,tile=>{tile.crop.wateredAt=1000;}],
  ['harvest',{state:'PLANTED',crop:{...crop}},20000,tile=>{tile.state='EMPTY';tile.crop=null;}]
 ]){
  const ui=Object.create(ContextualInteraction.prototype);let closed=0;
  Object.assign(ui,{mode:'actionArmed',action,seed:'mustard',generation:1,preview:new Map(),farming:{state:{inventory:[],tiles:[tile]},serverNow:()=>now},cancel(){closed++;this.mode='idle';}});
  ui.draw(null);t.mock.timers.tick(4000);assert.equal(closed,0,action+' remains available');
  exhaust(tile);ui.draw(null);t.mock.timers.tick(2999);assert.equal(closed,0,action+' waits three seconds');
  t.mock.timers.tick(1);assert.equal(closed,1,action+' closes');
 }
});

test('context shows only server-valid soil actions', () => {
  const now=1_000_000;
  const crop={cropId:'mustard',plantedAt:now-1000,durationMs:60_000,bonusMs:0,wateredAt:null};
  assert.deepEqual(validSoilActions({state:'EMPTY',crop:null},[],now),['till']);
  assert.deepEqual(validSoilActions({state:'TILLED',crop:null},[],now),['plant']);
  assert.deepEqual(validSoilActions({state:'WATERED',crop:null},[],now),['plant']);
  assert.deepEqual(validSoilActions({state:'PLANTED',crop},[],now),['water']);
  assert.deepEqual(validSoilActions({state:'PLANTED',crop:{...crop,wateredAt:now}},[],now),[]);
  assert.deepEqual(validSoilActions({state:'PLANTED',crop:{...crop,plantedAt:now-60_000}},[],now),['harvest']);
});

test('rapid drag interpolates tiles and respects field bounds', () => {
  const a=tileCenter(0,0),b=tileCenter(4,0);
  assert.deepEqual(traceTiles(a,b),[0,1,2,3,4].map(x=>({x,y:0})));
  assert.deepEqual(traceTiles(a,a),[{x:0,y:0}]);
  assert.deepEqual(traceTiles({x:-100,y:750},a),[{x:0,y:0}]);
});
