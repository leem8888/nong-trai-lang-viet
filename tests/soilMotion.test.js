import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SOIL_DURATIONS,soilFrame,drawSoilActor} from '../public/js/soilMotion.js';
test('sowing, watering and harvesting each use six poses with planted feet and a recovery',()=>{
 for(const kind of ['plant','water','harvest']){
  const frames=new Set(),calls=[],image={naturalWidth:1536,naturalHeight:1024,bitmap:{width:1024,height:683}};
  const ctx={save(){},restore(){},translate(){},transform(){},scale(){},drawImage(...args){calls.push(args);}};
  for(let age=0;age<SOIL_DURATIONS[kind];age+=10){frames.add(soilFrame(kind,age));drawSoilActor(ctx,image,kind,0,0,age,false);}
  assert.deepEqual([...frames].sort(),[0,1,2,3,4,5]);assert.equal(soilFrame(kind,SOIL_DURATIONS[kind]),0);
  assert.ok(calls.every(a=>a[0]===image&&a[5]===-42&&a[6]===-84*.94&&a[7]===84&&a[8]===84));
 }
});
