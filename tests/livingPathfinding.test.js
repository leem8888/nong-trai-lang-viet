import test from 'node:test';
import assert from 'node:assert/strict';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {findPath,clearSegment} from '../public/js/systems/Pathfinding.js';
import {world} from '../server/world.js';
import {livingLayout,yardObstacles,POND_OLD} from '../public/js/shared/livingLayout.js';
import {VAC_POINTS} from '../public/js/shared/vac.js';

test('eight approaches to pond and coop avoid water, yard fence and house',()=>{
  const layout=livingLayout(),collision=new CollisionSystem(world);
  collision.obstacles.push(layout.pond,...yardObstacles(layout.yard));
  const starts=[[700,650],[700,850],[850,600],[850,860],[850,500],[1050,880],[700,770],[1000,350]];
  for(const [kind,goal] of Object.entries(VAC_POINTS))for(const [x,y] of starts){
    const start={x,y};assert.equal(collision.blocked(x,y),false,`${kind} start ${x},${y}`);
    const route=findPath(collision,start,goal);assert.ok(route?.length,`${kind} ${x},${y}`);
    let previous=start;for(const point of route){assert.ok(clearSegment(collision,previous,point),`${kind} crossing obstacle from ${x},${y}`);previous=point;}
  }
});

test('legacy building footprint keeps old pond without occupying its water',()=>{
  const layout=livingLayout([{definitionId:'mill',x:20,y:12,rotation:0}]);
  assert.deepEqual(layout.pond,POND_OLD);
  const collision=new CollisionSystem(world);assert.equal(collision.blocked(VAC_POINTS.pond.x,VAC_POINTS.pond.y),false);
});
