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
import {LivingFarmVisual} from '../public/js/livingVisual.js';
import {paintLayers} from '../public/js/scenery.js';
import {animalAccess,livingLayout,yardObstacles} from '../public/js/shared/livingLayout.js';
import {FARM_WORLD} from '../public/js/shared/farmWorld.js';
import {findPath,clearSegment} from '../public/js/systems/Pathfinding.js';

for(const pond of [POND_LARGE,POND_OLD])test(`pond ${pond.w}: walking around the rim never enters water or renders below opaque pond art`,()=>{
  const visual=new LivingFarmVisual(),layout={...livingLayout(),pond},[o]=pondObstacles(pond);
  const collision=new CollisionSystem({...FARM_WORLD,obstacles:[...FARM_WORLD.obstacles,o,...yardObstacles(layout.yard)]});
  const points=animalAccess('pond',{x:720,y:650},layout,collision).points;
  assert.ok(points.length>16);
  let current={x:720,y:650};
  for(const goal of points.filter((_,i)=>i%4===0)){
    const route=findPath(collision,current,goal);assert.ok(route,'bank destination reachable');
    for(const next of route){assert.ok(clearSegment(collision,current,next));
      const steps=Math.max(1,Math.ceil(Math.hypot(next.x-current.x,next.y-current.y)/3));
      for(let i=0;i<=steps;i++){
        const p={x:current.x+(next.x-current.x)*i/steps,y:current.y+(next.y-current.y)*i/steps};
        const sx=((p.x-o.x)-(p.y-o.y))*ISO_X,sy=((p.x-o.x)+(p.y-o.y))*ISO_Y;
        assert.ok((sx/o.rx)**2+(sy/o.ry)**2>=1,'feet stay outside visible water');
        const order=[],ground=visual.pondLayer({}, {},()=>order.push('pond'),layout);
        const fish=visual.fishLayers({}, {},()=>{}, {pond:{fish:[{id:99999,fishId:'tilapia',progress:1,remainingMs:0,fedAt:1}]}},layout,true)[0];
        paintLayers({},[{...ground,draw:()=>order.push('pond')},{...fish,draw:()=>order.push('fish')},{y:p.x+p.y,draw:()=>order.push('player')}]);
        assert.deepEqual(order,['pond','fish','player'],'opaque water cannot hide the walking avatar');
      }
      current=next;
    }
  }
});
