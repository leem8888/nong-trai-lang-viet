import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFishPosition,fishHungerOpacity,chickenHungerOpacity} from '../public/js/livingVisual.js';
import {ISO_X,ISO_Y} from '../public/js/core/IsoProjection.js';
import {fishTilt} from '../public/js/animalDrawing.js';

test('chick hunger and adult hunger disappear when their respective feeding is complete',()=>{
  const chick={id:1,status:'GROWING',growthFed:false};
  assert.ok(chickenHungerOpacity(chick,0)>0);
  assert.equal(chickenHungerOpacity({...chick,growthFed:true},0),0);
  assert.ok(chickenHungerOpacity({...chick,status:'WAITING_FOR_FEED'},0)>0);
  assert.equal(chickenHungerOpacity({...chick,status:'PRODUCING'},0),0);
  assert.equal(chickenHungerOpacity(chick,3),0);
});

test('hungry fish show a short recurring hint, hidden after feeding or maturity',()=>{
  const fish={id:1,fedAt:null,progress:.5,remainingMs:1000};
  assert.ok(fishHungerOpacity(fish,0)>0);
  assert.equal(fishHungerOpacity(fish,3),0);
  assert.equal(fishHungerOpacity(fish,9),fishHungerOpacity(fish,0));
  assert.equal(fishHungerOpacity({...fish,fedAt:123},0),0);
  assert.equal(fishHungerOpacity({...fish,remainingMs:0,progress:1},0),0);
  assert.notEqual(fishHungerOpacity({...fish,id:2},0),fishHungerOpacity(fish,0));
});

test('fish remain upright through every swimming direction',()=>{
  for(let angle=-Math.PI*2;angle<=Math.PI*2;angle+=.01)assert.ok(Math.abs(fishTilt(angle))<=.22);
  assert.ok(Math.abs(fishTilt(Math.PI))<1e-9);
});

test('fish approach food at a bounded speed even after a delayed frame',()=>{
  const start={x:900,y:600},target={x:1200,y:400};
  for(const dt of [0,1/60,.1,5]){
    const next=advanceFishPosition(start,target,dt);
    const dx=next.x-start.x,dy=next.y-start.y;
    assert.ok(Math.hypot((dx-dy)*ISO_X,(dx+dy)*ISO_Y)<=11*Math.min(dt,.1)+1e-9);
  }
  assert.deepEqual(advanceFishPosition(start,start,.1),start);
  const nearby={x:900.01,y:600.01};
  assert.deepEqual(advanceFishPosition(start,nearby,.1),nearby);
});
