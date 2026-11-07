import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FARM_WORLD} from '../public/js/shared/farmWorld.js';
import {FARM_GATE} from '../public/js/shared/marketMap.js';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {findPath} from '../public/js/systems/Pathfinding.js';
import {validPosition,validMovement} from '../server/world.js';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm,snapshot} from '../server/farms.js';

test('all four visible farm fences reject positions on and outside their feet',()=>{
 const c=new CollisionSystem(FARM_WORLD);
 for(let x=0;x<=1740;x+=5)for(const y of [-250,-195,905,920,980]){
  assert.ok(c.blocked(x,y),`${x},${y}`);assert.equal(validPosition(x,y),false);
 }
 for(let y=-300;y<=1024;y+=5)for(const x of [14,50,65,1675,1690,1720]){
  assert.ok(c.blocked(x,y),`${x},${y}`);assert.equal(validPosition(x,y),false);
 }
 for(const [start,delta] of [[{x:500,y:870},{x:0,y:500}],[{x:100,y:500},{x:-500,y:0}],[{x:1630,y:500},{x:500,y:0}],[{x:1000,y:-160},{x:0,y:-500}]]){
  assert.equal(c.blocked(start.x,start.y),false);
  const p={...start};c.move(p,delta.x,delta.y);assert.equal(c.blocked(p.x,p.y),false);
  assert.ok(p.x>=79&&p.x<=1661&&p.y>=-181&&p.y<=891);
  assert.equal(validMovement(start,start.x+delta.x,start.y+delta.y,500),false);
 }
 assert.equal(findPath(c,{x:500,y:870},{x:500,y:940}),null);
 assert.equal(c.blocked(FARM_GATE.x,FARM_GATE.y),false);
 assert.ok(findPath(c,{x:500,y:870},FARM_GATE));
});

test('saved players outside any farm fence return to walkable ground on load',()=>{
 const db=openDatabase(':memory:');
 try{
  const user=register(db,'fence_rescue','password123'),farm=createFarm(db,user.id,'Fence');
  for(const [x,y] of [[500,970],[25,500],[1710,500],[1000,-250]]){
   db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(x,y,user.id);
   const {player}=snapshot(db,user.id);
   assert.ok(validPosition(player.x,player.y,'farm',db,farm.id));
  }
 }finally{db.close();}
});
