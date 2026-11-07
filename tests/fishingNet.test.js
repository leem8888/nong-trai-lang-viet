import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fishingPose,fishingActorPose} from '../public/js/fishingNet.js';
import {LivingFarmVisual} from '../public/js/livingVisual.js';
test('harvested fish stays in the pond until the net lifts it, without duplicating server rows',()=>{
 const visual=new LivingFarmVisual(),fish={id:7,fishId:'carp'},other={id:8};
 visual.event={kind:'harvest_fish',entityId:7,harvestFish:fish,at:1000};
 const vac={pond:{fish:[other]}};
 for(const age of [0,.3,1.05,1.65,1.799])assert.deepEqual(visual.visibleFish(vac,1000+age*1000),[other,fish]);
 for(const age of [1.8,2.5,3.8,10])assert.deepEqual(visual.visibleFish(vac,1000+age*1000),[other]);
 assert.deepEqual(visual.visibleFish({pond:{fish:[fish,other]}},1100),[fish,other]);
 visual.event={kind:'feed_fish',at:1000};
 assert.deepEqual(visual.visibleFish(vac,1100),[other]);
});
test('casting shifts weight then recovers without stretching the hand away from the hips',()=>{
 assert.ok(fishingActorPose(.3).lean<0);
 assert.ok(fishingActorPose(.8).lean>0);
 assert.ok(fishingActorPose(3.1).lean<0);
 for(let age=0;age<=3.8;age+=.02){
  const pose=fishingActorPose(age);
  assert.ok(Math.abs(Math.hypot(pose.hand.x,pose.hand.y+32-pose.crouch)-Math.hypot(12,8))<1e-9);
 }
 assert.equal(Math.abs(fishingActorPose(3.8).lean),0);
 assert.equal(fishingActorPose(3.8).crouch,0);
});
test('fishing casts an empty net before retrieving a visible catch',()=>{
 assert.equal(fishingPose(.2).cast,0);
 assert.ok(fishingPose(.7).cast>0);assert.equal(fishingPose(.7).caught,false);
 assert.equal(fishingPose(1.3).cast,1);assert.equal(fishingPose(1.3).pull,0);
 const pulled=fishingPose(2.5);assert.ok(pulled.pull>0&&pulled.pull<1);assert.equal(pulled.caught,true);
 assert.equal(fishingPose(3.2).pull,1);assert.ok(pulled.spread>fishingPose(3.2).spread);
 assert.equal(fishingPose(3.8).done,true);assert.equal(fishingPose(3.8).opacity,0);
});
