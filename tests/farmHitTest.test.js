import {test} from 'node:test';
import assert from 'node:assert/strict';
import {avatarHit,farmFixtureAt} from '../public/js/farmHitTest.js';
import {HOUSE_DOOR,houseToWorld} from '../public/js/shared/house.js';
import {ISO_X,ISO_Y} from '../public/js/core/IsoProjection.js';
const offset=(p,x,y)=>({x:p.x+(x/ISO_X+y/ISO_Y)/2,y:p.y+(y/ISO_Y-x/ISO_X)/2});
test('click targets follow the visible door and sign instead of the interaction approach point',()=>{
 assert.equal(farmFixtureAt(houseToWorld(.4,.68)),'door');
 for(const p of [HOUSE_DOOR,houseToWorld(.31,1.1),houseToWorld(.75,.7)])assert.equal(farmFixtureAt(p),null);
 assert.equal(farmFixtureAt(offset({x:570,y:430},0,-35)),'board');
 assert.equal(farmFixtureAt({x:570,y:430}),null);
 assert.equal(farmFixtureAt(offset({x:720,y:905},0,-65)),'farmGate');
});
test('avatar hit region covers visible head, torso and feet for priority over objects behind it',()=>{
 const player={x:700,y:300};
 for(const [x,y] of [[0,-75],[15,-40],[0,0]])assert.equal(avatarHit(offset(player,x,y),player),true);
 for(const [x,y] of [[35,-40],[0,-100],[0,20]])assert.equal(avatarHit(offset(player,x,y),player),false);
});
