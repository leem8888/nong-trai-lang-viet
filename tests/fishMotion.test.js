import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fishMotion,LivingFarmVisual} from '../public/js/livingVisual.js';
import {POND_LARGE,POND_OLD,pondObstacles,livingLayout} from '../public/js/shared/livingLayout.js';
import {ISO_X,ISO_Y} from '../public/js/core/IsoProjection.js';

test('fish wander smoothly on distinct paths inside both pond sizes',()=>{
  for(const pond of [POND_LARGE,POND_OLD])for(let id=1;id<=6;id++){
    const [o]=pondObstacles(pond);
    for(let t=0;t<90;t+=.1){
      const p=fishMotion(id,t,pond),q=fishMotion(id,t+.016,pond);
      const sx=((p.x-o.x-12)-(p.y-o.y-12))*ISO_X,sy=((p.x-o.x-12)+(p.y-o.y-12))*ISO_Y;
      assert.ok((sx/o.rx)**2+(sy/o.ry)**2<.8);
      assert.ok(Math.hypot(q.x-p.x,q.y-p.y)<2,'no jumps at direction changes');
    }
  }
  assert.notDeepEqual(fishMotion(1,12,POND_LARGE),fishMotion(2,12,POND_LARGE));
});
test('stocking animates only new fish from the player bank and ignores replayed actions',()=>{
  const visual=new LivingFarmVisual(),before={pond:{fish:[{id:1}]}},result={state:{pond:{fish:[{id:1},{id:2},{id:3}]}}};
  visual.onAction({action:'stock_fish'},result,before,{x:700,y:620},livingLayout());
  assert.deepEqual([...visual.releases.keys()],[2,3]);
  assert.ok(visual.releases.get(3).at>visual.releases.get(2).at);
  const old=visual.releases.get(2);
  visual.onAction({action:'stock_fish'},{...result,replayed:true},before,{x:700,y:620},livingLayout());
  assert.equal(visual.releases.get(2),old);
});
