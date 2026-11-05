import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {findReachablePath,clearSegment} from '../public/js/systems/Pathfinding.js';

test('walk around obstacles and approach blocked destinations on accessible ground',()=>{
  const c=new CollisionSystem({width:800,height:700,obstacles:[{x:330,y:180,w:100,h:340}]});
  const start={x:180,y:350};
  for(const [goal,range] of [[{x:600,y:350},0],[{x:380,y:350},86]]){
    const route=findReachablePath(c,start,goal,range);
    assert.ok(route?.length);
    let previous=start;
    for(const p of route){assert.ok(clearSegment(c,previous,p));previous=p;}
    assert.ok(Math.hypot(previous.x-goal.x,previous.y-goal.y)<=(range||1));
  }
});
