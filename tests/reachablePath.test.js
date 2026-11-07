import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {findReachablePath,findApproachPath,clearSegment} from '../public/js/systems/Pathfinding.js';
import {tileCenter} from '../public/js/shared/crops.js';

test('watering reaches every selected tile within its eight-unit arrival radius',()=>{
  const c=new CollisionSystem({width:1740,height:1024,obstacles:[]});
  let player={...tileCenter(0,0)};
  for(let x=0;x<5;x++){
    const center=tileCenter(x,0),goal={x:center.x-28,y:center.y+28};
    const route=findApproachPath(c,player,goal,8);
    assert.ok(route?.length);
    for(const point of route){c.move(player,point.x-player.x,point.y-player.y);}
    assert.ok(Math.hypot(player.x-goal.x,player.y-goal.y)<=8);
  }
});

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
