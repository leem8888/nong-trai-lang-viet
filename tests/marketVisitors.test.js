import test from 'node:test';
import assert from 'node:assert/strict';
import {MarketVisitors} from '../public/js/marketVisitors.js';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {MARKET_WORLD,MARKET_POINTS,VILLAGE_PLACES} from '../public/js/shared/marketMap.js';
import {findPath,clearSegment} from '../public/js/systems/Pathfinding.js';

test('market routes reach every stall, village landmark and return gate',()=>{
  const collision=new CollisionSystem(MARKET_WORLD),start={x:600,y:540};
  for(const goal of [...Object.values(MARKET_POINTS),...Object.values(VILLAGE_PLACES)]){
    const route=findPath(collision,start,goal);
    assert.ok(route,`unreachable ${goal.label}`);
    let previous=start;
    for(const point of route){assert.ok(clearSegment(collision,previous,point));previous=point;}
  }
});

test('ambient visitors move and stay outside colliders',()=>{
  const collision=new CollisionSystem(MARKET_WORLD),visitors=new MarketVisitors();
  const starts=visitors.people.map(p=>({x:p.x,y:p.y}));
  for(let frame=0;frame<3600;frame++){
    visitors.update(1/60,collision);
    for(const person of visitors.people)assert.equal(collision.blocked(person.x,person.y,17),false);
  }
  visitors.people.forEach((person,i)=>assert.ok(Math.hypot(person.x-starts[i].x,person.y-starts[i].y)>20));
  const person=visitors.people[0],x=person.x,previous=person.index;
  person.pause=0;person.path=[];visitors.update(1,{blocked:()=>true});
  assert.equal(person.x,x);
  assert.equal(person.index,(previous+1)%person.route.length);
});
