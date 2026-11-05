import {test} from 'node:test';
import assert from 'node:assert/strict';
import {animalAccess,livingLayout,pondObstacles,POND_OLD,POND_LARGE} from '../public/js/shared/livingLayout.js';
import {inRange} from '../server/world.js';
import {ISO_X,ISO_Y} from '../public/js/core/IsoProjection.js';

test('every side of either pond can be used from its bank',()=>{
  for(const pond of [POND_LARGE,POND_OLD]){
    const layout={...livingLayout(),pond},[o]=pondObstacles(pond);
    for(let i=0;i<32;i++){
      const a=i*Math.PI/16,sx=Math.cos(a)*(o.rx+35),sy=Math.sin(a)*(o.ry+25);
      const p={x:o.x+(sx/ISO_X+sy/ISO_Y)/2,y:o.y+(sy/ISO_Y-sx/ISO_X)/2,scene:'farm'};
      assert.ok(animalAccess('pond',p,layout).distance<96);
      assert.ok(inRange(p,'pond',layout));
    }
  }
  assert.equal(inRange({x:300,y:500,scene:'farm'},'pond'),false);
});
test('coop entrance and yard perimeter both allow care',()=>{
  for(const p of [{x:1130,y:300},{x:1200,y:449},{x:1465,y:350}])
    assert.ok(inRange({...p,scene:'farm'},'coop'));
  assert.equal(inRange({x:300,y:500,scene:'farm'},'coop'),false);
});
