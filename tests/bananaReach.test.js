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
