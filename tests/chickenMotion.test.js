import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LivingFarmVisual} from '../public/js/livingVisual.js';
import {livingLayout} from '../public/js/shared/livingLayout.js';
import {overlaps} from '../public/js/systems/CollisionSystem.js';

test('chickens stay in the run, avoid feeding props and alternate eating drinking and roosting',()=>{
  const visual=new LivingFarmVisual(),layout=livingLayout(),yard=layout.yard;
  const original=Object.getOwnPropertyDescriptor(performance,'now');let time=0;
  Object.defineProperty(performance,'now',{configurable:true,value:()=>time*1000});
  const modes=new Set(),rows=[1,2,3,4].map(id=>({id,status:'WAITING_FOR_FEED',eggsReady:0}));
  const props=[{x:yard.x+70,y:yard.y-130,w:38,h:23},{x:yard.x+yard.w-69,y:yard.y-150,w:36,h:30}];
  try{
    for(time=0;time<90;time+=.05){
      visual.hits=[];visual.chickenLayers(null,{},null,{coop:{chickens:rows}},layout,false);
      for(const bird of visual.chickenMotion.values()){
        modes.add(bird.mode);
        assert.ok(bird.x>=yard.x+15&&bird.x<=yard.x+yard.w-15);
        assert.ok(bird.y>=yard.y-170&&bird.y<=yard.y-60);
        assert.equal(props.some(p=>overlaps(bird.x,bird.y,9,p)),false);
      }
    }
    for(const mode of ['walk','eat','drink','roost'])assert.ok(modes.has(mode));
  }finally{if(original)Object.defineProperty(performance,'now',original);else delete performance.now;}
});
