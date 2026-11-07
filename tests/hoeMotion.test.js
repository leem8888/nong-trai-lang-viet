import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hoeFrame,HOE_DURATION_MS,drawHoeActor} from '../public/js/hoeMotion.js';
test('hoe cycle raises, strikes, pulls and returns without moving the feet anchor',()=>{
 assert.deepEqual([0,150,340,500,610,820,950,1050].map(hoeFrame),[0,1,2,3,4,5,1,0]);
 assert.equal(hoeFrame(HOE_DURATION_MS),0);
 const calls=[],ctx={save(){},restore(){},translate(){},transform(){},scale(){},drawImage(...args){calls.push(args);}};
 for(let t=0;t<HOE_DURATION_MS;t+=50)drawHoeActor(ctx,{naturalWidth:1536,naturalHeight:1024},0,0,t);
 assert.ok(calls.every(args=>args[5]===-42&&args[6]===-84*.94&&args[7]===84&&args[8]===84));
});
