import {test} from 'node:test';
import assert from 'node:assert/strict';
import {avatarPose} from '../public/js/avatarMotion.js';
import {Player} from '../public/js/entities/Player.js';
test('walk animation eases in and settles without changing physical movement or stretching the avatar',()=>{
 const player=new Player(),collision={move(p,dx,dy){p.x+=dx;p.y+=dy;}};
 const start={x:player.x,y:player.y};
 for(let i=0;i<30;i++)player.update(1/60,{x:1,y:0},collision);
 assert.ok(Math.abs(player.x-start.x-90)<1e-6);assert.equal(player.y,start.y);
 assert.ok(player.walkBlend>.95);assert.ok(Math.abs(player.visualLean)<=.012);
 const stop={x:player.x,y:player.y};
 for(let i=0;i<30;i++)player.update(1/60,{x:0,y:0},collision);
 assert.equal(player.x,stop.x);assert.equal(player.y,stop.y);assert.ok(player.walkBlend<.01);assert.equal(avatarPose(player,false).frame,1);
 const reduced=avatarPose(player,false,true);assert.equal(reduced.bob,0);assert.equal(reduced.sway,0);assert.equal(reduced.lean,0);
});
