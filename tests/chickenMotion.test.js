import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LivingFarmVisual} from '../public/js/livingVisual.js';
import {livingLayout,YARD_CANDIDATES} from '../public/js/shared/livingLayout.js';
import {coopGeometry,worldToCoop,chickenWalkable,insideFloor} from '../public/js/animalMotion.js';

for(const yard of YARD_CANDIDATES)test(`chickens remain inside the artwork rails for ten simulated minutes, yard ${yard.x}`,()=>{
  const visual=new LivingFarmVisual(),layout={...livingLayout(),yard},g=coopGeometry(yard);
  const original=Object.getOwnPropertyDescriptor(performance,'now');let time=0;
  Object.defineProperty(performance,'now',{configurable:true,value:()=>time*1000});
  const modes=new Set(),positions=new Map(),travel=new Map(),rows=[1,2,3,4].map(id=>({id,status:'WAITING_FOR_FEED',eggsReady:0}));
  try{
    for(time=0;time<600;time+=.08){
      visual.hits=[];visual.chickenLayers(null,{},null,{coop:{chickens:rows}},layout,false);
      for(const [id,bird] of visual.chickenMotion){
        if(!bird.moving&&!bird.path.length)modes.add(bird.mode);const p=worldToCoop(g,bird);
        assert.ok(chickenWalkable(g,p),'full bird remains behind rails and outside feed/water props');
        for(const [dx,dy] of [[-14,-30],[14,-30],[-14,4],[14,4]])assert.ok(insideFloor(g,{x:p.x+dx,y:p.y+dy}));
        const previous=positions.get(id);if(previous){const d=Math.hypot(p.x-previous.x,p.y-previous.y);assert.ok(d<1.4,'no teleporting');travel.set(id,(travel.get(id)||0)+d);}positions.set(id,p);
      }
    }
    for(const mode of ['walk','idle','peck','eat','drink','roost'])assert.ok(modes.has(mode),mode);
    for(const id of [1,2,3,4])assert.ok(travel.get(id)>100,'each chicken actually walks');
    // A layout change and reduced-effects mode must not retain an escaped position.
    visual.chickenLayers(null,{},null,{coop:{chickens:rows.slice(0,1)}},{...layout,yard:YARD_CANDIDATES[1]},true);
    assert.equal(visual.chickenMotion.size,1);
  }finally{if(original)Object.defineProperty(performance,'now',original);else delete performance.now;}
});
