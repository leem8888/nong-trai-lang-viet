import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bananaReachFrame,TreeHarvestVisual} from '../public/js/treeHarvest.js';
test('banana harvest uses whole-body tiptoe poses without drawing a stretched arm',()=>{
 assert.deepEqual([0,.25,.6,1,1.5,2].map(bananaReachFrame),[0,1,2,3,4,5]);
 const visual=new TreeHarvestVisual(),draws=[],scales=[];
 visual.event={kind:'banana',at:performance.now()-600,tree:{x:0,y:0}};
 const sheet={naturalWidth:1536,naturalHeight:1024};
 const ctx={save(){},restore(){},translate(){},transform(){},scale(x,y){scales.push([x,y]);},drawImage(...args){draws.push(args);}};
 visual.drawActor(ctx,null,30,0,'left',{bananaReach:sheet});
 assert.equal(draws.length,1);assert.equal(draws[0][0],sheet);
 assert.equal(draws[0][7],84);assert.equal(draws[0][8],84);
 assert.ok(scales.every(([x,y])=>Math.abs(x)===1&&y===1));
});
test('mango harvest uses the complete reach poses with no extra painted or stretched arm',()=>{
 const visual=new TreeHarvestVisual(),draws=[],sheet={naturalWidth:1536,naturalHeight:1024};
 const ctx={save(){},restore(){},translate(){},transform(){},scale(){},drawImage(...args){draws.push(args);}};
 for(const age of [0,.25,.6,1,1.5,2]){
  visual.event={kind:'mango',at:performance.now()-age*1000,tree:{x:0,y:0}};
  visual.drawActor(ctx,null,30,0,'left',{bananaReach:sheet});
 }
 assert.equal(draws.length,6);
 assert.ok(draws.every(args=>args[0]===sheet&&args[7]===84&&args[8]===84));
 assert.equal(new Set(draws.map(args=>`${args[1]}:${args[2]}`)).size,6);
});
