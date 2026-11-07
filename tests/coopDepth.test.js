import {test} from 'node:test';
import assert from 'node:assert/strict';
import {livingLayout,coopActorDepth,yardObstacles} from '../public/js/shared/livingLayout.js';
import {coopPlacement,coopToWorld} from '../public/js/shared/coopPlacement.js';
import {circleOverlapsPolygon} from '../public/js/systems/geometry.js';
test('actors on the near side of the coop render above its composite ground',()=>{
 const yard=livingLayout().yard,g=coopPlacement(yard);
 for(const [u,v] of [[.2,.96],[.85,.98],[.94,.92]]){
  const p=coopToWorld(g,{x:u*g.width,y:v*g.height});
  assert.equal(yardObstacles(yard).some(o=>circleOverlapsPolygon(p,14,o.points)),false);
  assert.ok(coopActorDepth(p.x,p.y,yard)>g.x+g.y);
 }
 const behind=coopToWorld(g,{x:g.width*.6,y:g.height*.35});
 assert.equal(coopActorDepth(behind.x,behind.y,yard),behind.x+behind.y);
});
