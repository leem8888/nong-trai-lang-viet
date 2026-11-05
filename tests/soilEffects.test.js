import {test} from 'node:test';
import assert from 'node:assert/strict';
import {soilIsDry} from '../public/js/farming.js';

test('cracks appear on dry tilled soil and disappear after watering or crop maturity',()=>{
  assert.equal(soilIsDry({state:'EMPTY'},100),false);
  assert.equal(soilIsDry({state:'TILLED',locked:true},100),false);
  assert.equal(soilIsDry({state:'TILLED'},100),true);
  assert.equal(soilIsDry({state:'WATERED'},100),false);
  const crop={plantedAt:100,durationMs:1000,bonusMs:0,wateredAt:null};
  assert.equal(soilIsDry({state:'PLANTED',crop},500),true);
  assert.equal(soilIsDry({state:'PLANTED',crop:{...crop,wateredAt:0}},500),false);
  assert.equal(soilIsDry({state:'PLANTED',crop},1100),false);
  assert.equal(soilIsDry({state:'TILLED',crop:null},1100),true);
});
