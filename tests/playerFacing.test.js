import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Player,movementFacing} from '../public/js/entities/Player.js';
test('facing follows screen movement and stays stable near diagonal boundaries',()=>{
 for(const [x,y,want] of [[-1,1,'left'],[1,-1,'right'],[-1,-1,'up'],[1,1,'down']])assert.equal(movementFacing(x,y),want);
 let facing='right';for(let i=0;i<100;i++)facing=movementFacing(1,i%2?.31:.35,facing);
 assert.equal(facing,'right');
 assert.equal(movementFacing(0,0,'left'),'left');
});
test('blocked movement keeps its face and stops walking; sliding faces actual travel',()=>{
 const p=new Player();p.direction='left';p.state='walk';
 p.update(.016,{x:1,y:0},{move(){}});assert.equal(p.direction,'left');assert.equal(p.state,'idle');assert.equal(p.walkDistance,0);
 p.update(.016,{x:1,y:1},{move(p){p.y+=2;}});assert.equal(p.direction,'left');assert.equal(p.state,'walk');assert.ok(p.walkDistance>0);
});
