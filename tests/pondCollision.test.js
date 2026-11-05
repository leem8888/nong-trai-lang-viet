import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pondObstacles,POND_LARGE,POND_OLD} from '../public/js/shared/livingLayout.js';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {ISO_X,ISO_Y} from '../public/js/core/IsoProjection.js';

for(const pond of [POND_LARGE,POND_OLD])test(`pond ${pond.w}: projected water blocks walking while surrounding ground stays accessible`,()=>{
  const [o]=pondObstacles(pond);
  const collision=new CollisionSystem({width:1440,height:1024,obstacles:[o]});
  const point=(sx,sy)=>({x:o.x+(sx/ISO_X+sy/ISO_Y)/2,y:o.y+(sy/ISO_Y-sx/ISO_X)/2});
  assert.ok(collision.blocked(o.x,o.y));
  for(let i=0;i<32;i++){
    const angle=i*Math.PI/16;
    const water=point(Math.cos(angle)*o.rx*.9,Math.sin(angle)*o.ry*.9);
    assert.ok(collision.blocked(water.x,water.y));
  }
  for(const side of [-1,1]){
    const bank=point(side*(o.rx+30),0);
    assert.equal(collision.blocked(bank.x,bank.y),false);
    const player={...bank};
    collision.move(player,(o.x-bank.x)*.95,(o.y-bank.y)*.95);
    assert.equal(collision.blocked(player.x,player.y),false);
    assert.ok(Math.hypot(player.x-o.x,player.y-o.y)>30);
  }
});
