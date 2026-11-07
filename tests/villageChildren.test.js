import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VillageChildren,visibleChildRoutes,childBehindNeighbor} from '../public/js/villageChildren.js';
import {Camera} from '../public/js/core/Camera.js';
import {FARM_WORLD} from '../public/js/shared/farmWorld.js';
import {FARM_NEIGHBORS} from '../public/js/villageScenery.js';
test('child on the eastern road is masked behind the neighboring house rather than painted on its roof',()=>{
 const house=FARM_NEIGHBORS.find(h=>h.x===1980&&h.y===550);
 assert.equal(childBehindNeighbor({x:1770,y:324},house),true);
 assert.equal(childBehindNeighbor({x:1980,y:700},house),false);
 assert.equal(childBehindNeighbor({x:900,y:1000},house),false);
});
test('ambient children stay on exterior roads, appear in small groups and leave without accumulating',()=>{
 const camera=new Camera(FARM_WORLD);camera.isometric=true;camera.resize(1366,900);camera.snap(900,790);
 assert.ok(visibleChildRoutes(camera).length);
 const children=new VillageChildren(()=>.6);children.spawn(camera,'bike');assert.equal(children.people.length,3);
 for(let i=0;i<2000;i++){
  children.update(.1,camera);
  assert.ok(children.people.length<=3);
  for(const p of children.people)assert.ok(p.y>=1000||p.y<=-285||p.x<=-30||p.x>=1770);
 }
 children.spawn(camera,'kite');assert.equal(children.people.length,1);
 children.update(.1,camera,true,true);assert.equal(children.people.length,0);
});
