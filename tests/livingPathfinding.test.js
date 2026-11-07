import test from 'node:test';
import assert from 'node:assert/strict';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {findPath,clearSegment,findReachablePath} from '../public/js/systems/Pathfinding.js';
import {world} from '../server/world.js';
import {livingLayout,yardObstacles,pondObstacles,POND_OLD,coopEggApproach,coopActorDepth} from '../public/js/shared/livingLayout.js';
import {VAC_POINTS} from '../public/js/shared/vac.js';
import {coopPlacement,coopToWorld} from '../public/js/shared/coopPlacement.js';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm,snapshot} from '../server/farms.js';
import {validPosition} from '../server/world.js';

test('farmer can enter through the coop gate and reach the egg shelf without sinking behind the yard',()=>{
 const layout=livingLayout(),g=coopPlacement(layout.yard),c=new CollisionSystem(world);
 c.obstacles.push(...yardObstacles(layout.yard),...pondObstacles(layout.pond));
 const goal=coopEggApproach(layout.yard),start=coopToWorld(g,{x:g.width*.42,y:g.height*1.12});
 assert.equal(c.blocked(goal.x,goal.y),false);const route=findPath(c,start,goal,12);assert.ok(route?.length);
 let previous=start;for(const point of route){assert.ok(clearSegment(c,previous,point));previous=point;}
 for(const p of [goal,coopToWorld(g,{x:0,y:g.height*.8})])assert.ok(coopActorDepth(p.x,p.y,layout.yard)>g.x+g.y);
});

test('coop rails and house block client and server, and saved solid positions are rescued',()=>{
  const db=openDatabase(':memory:');
  try{
    const user=register(db,'coop_collision','password123'),farm=createFarm(db,user.id,'Coop test');
    const layout=livingLayout(),g=coopPlacement(layout.yard),collision=new CollisionSystem(world);
    collision.obstacles.push(...yardObstacles(layout.yard),...pondObstacles(layout.pond));
    for(const [u,v] of [[.12,.76],[.65,.93],[.30,.52]]){
      const p=coopToWorld(g,{x:g.width*u,y:g.height*v});
      assert.equal(collision.blocked(p.x,p.y),true);
      assert.equal(validPosition(p.x,p.y,'farm',db,farm.id),false);
      db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(p.x,p.y,user.id);
      const rescued=snapshot(db,user.id).player;
      assert.equal(validPosition(rescued.x,rescued.y,'farm',db,farm.id),true);
    }
  }finally{db.close();}
});

test('reported position beside coop has a walkable route toward screen right',()=>{
  const layout=livingLayout(),collision=new CollisionSystem(world);
  collision.obstacles.push(...yardObstacles(layout.yard),...pondObstacles(layout.pond));
  const start={x:1163.274947622902,y:299.4967107943554};
  for(const distance of [80,160,260,400]){
    const goal={x:start.x+distance/(2*.78),y:start.y-distance/(2*.78)};
    const path=findReachablePath(collision,start,goal);
    assert.ok(path?.length);
    const player={...start};
    for(const point of path){collision.move(player,point.x-player.x,point.y-player.y);assert.ok(Math.hypot(player.x-point.x,player.y-point.y)<.01);}
  }
});

test('eight approaches to pond and coop avoid water, yard fence and house',()=>{
  const layout=livingLayout(),collision=new CollisionSystem(world);
  collision.obstacles.push(layout.pond,...yardObstacles(layout.yard));
  const starts=[[700,650],[700,850],[850,600],[850,860],[850,500],[1050,880],[700,770],[1000,350]];
  for(const [kind,goal] of Object.entries(VAC_POINTS))for(const [x,y] of starts){
    const start={x,y};assert.equal(collision.blocked(x,y),false,`${kind} start ${x},${y}`);
    const route=findPath(collision,start,goal);assert.ok(route?.length,`${kind} ${x},${y}`);
    let previous=start;for(const point of route){assert.ok(clearSegment(collision,previous,point),`${kind} crossing obstacle from ${x},${y}`);previous=point;}
  }
});

test('legacy building footprint keeps old pond without occupying its water',()=>{
  const layout=livingLayout([{definitionId:'mill',x:20,y:12,rotation:0}]);
  assert.deepEqual(layout.pond,POND_OLD);
  const collision=new CollisionSystem(world);assert.equal(collision.blocked(VAC_POINTS.pond.x,VAC_POINTS.pond.y),false);
});

test('visible coop floor and steps block movement and cannot be crossed in one frame',()=>{
  const layout=livingLayout(),collision=new CollisionSystem(world);
  const obstacles=yardObstacles(layout.yard);collision.obstacles.push(...obstacles);
  for(const obstacle of obstacles){
    const center=obstacle.points.reduce((p,q)=>({x:p.x+q.x/obstacle.points.length,y:p.y+q.y/obstacle.points.length}),{x:0,y:0});
    assert.equal(collision.blocked(center.x,center.y),true);
  }
  const access=VAC_POINTS.coop;
  assert.equal(collision.blocked(access.x,access.y),false);
  const center=obstacles[0].points.reduce((p,q)=>({x:p.x+q.x/6,y:p.y+q.y/6}),{x:0,y:0});
  const player={...access};
  collision.move(player,(center.x-access.x)*1.5,(center.y-access.y)*1.5);
  assert.equal(collision.blocked(player.x,player.y),false);
  assert.equal(clearSegment(collision,access,center),false);
});

test('farmer standing against coop fence can leave and route around it',()=>{
  const collision=new CollisionSystem(world),obstacles=yardObstacles(livingLayout().yard);
  collision.obstacles.push(...obstacles);
  let checked=0;
  for(const obstacle of obstacles){
    for(let i=0;i<obstacle.points.length;i++){
      const a=obstacle.points[i],b=obstacle.points[(i+1)%obstacle.points.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      for(const sign of [-1,1]){
        const start={x:(a.x+b.x)/2-dy/length*15*sign,y:(a.y+b.y)/2+dx/length*15*sign};
        if(collision.blocked(start.x,start.y,14)||!collision.blocked(start.x,start.y,17))continue;
        const route=findPath(collision,start,VAC_POINTS.coop,12);
        assert.ok(route?.length,'a valid position close to the fence must have an exit');
        let previous=start;
        for(const point of route){assert.ok(clearSegment(collision,previous,point));previous=point;}
        checked++;
      }
    }
  }
  assert.ok(checked>0);
});
