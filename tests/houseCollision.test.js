import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {HOUSE_COLLIDER,HOUSE_DEPTH,FARM_HOUSE,HOUSE_DOOR,houseToWorld,houseActorDepth} from '../public/js/shared/house.js';
import {FARM_WORLD} from '../public/js/shared/farmWorld.js';
import {insidePolygon,rectangleOverlapsObstacle} from '../public/js/systems/geometry.js';
import {CollisionSystem} from '../public/js/systems/CollisionSystem.js';
import {findPath,clearSegment} from '../public/js/systems/Pathfinding.js';
import {validPosition,validMovement} from '../server/world.js';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm,snapshot} from '../server/farms.js';
import {performPhase5Action} from '../server/phase5.js';
const center=houseToWorld(.5,.77);
test('visible house foundation blocks both client and server while front ground is accessible',()=>{
 const c=new CollisionSystem(FARM_WORLD);
 for(const [u,v] of [[.25,.78],[.5,.77],[.77,.76],[.55,.9]]){const p=houseToWorld(u,v);assert.equal(c.blocked(p.x,p.y),true,`foundation ${u},${v}`);assert.equal(validPosition(p.x,p.y),false);}
 assert.equal(c.blocked(HOUSE_DOOR.x,HOUSE_DOOR.y),false,'door interaction remains on walkable porch approach');
 const front=houseToWorld(.5,1.12);assert.equal(c.blocked(front.x,front.y),false);assert.ok(houseActorDepth(front.x,front.y)>HOUSE_DEPTH,'front ground is painted above porch');
 const corner=houseToWorld(.12,.89);assert.equal(c.blocked(corner.x,corner.y),false);assert.ok(corner.x+corner.y<HOUSE_DEPTH);assert.ok(houseActorDepth(corner.x,corner.y)>HOUSE_DEPTH,'front-corner actor is drawn above opaque facade');
 for(let x=450;x<=900;x+=15)for(let y=-160;y<=340;y+=15)assert.equal(c.blocked(x,y),!validPosition(x,y));
});
test('keyboard movement and long frame substeps cannot tunnel through any side of house',()=>{
 const c=new CollisionSystem(FARM_WORLD);
 for(const start of [houseToWorld(-.12,.78),houseToWorld(1.12,.78),houseToWorld(.5,.35),houseToWorld(.5,1.2)]){
   assert.equal(c.blocked(start.x,start.y),false);
   for(const distance of [9,180,800]){const p={...start};for(let i=0;i<100;i++){const d=Math.hypot(center.x-p.x,center.y-p.y)||1;const old={...p};c.move(p,(center.x-p.x)/d*distance,(center.y-p.y)/d*distance);assert.equal(insidePolygon(p,HOUSE_COLLIDER.points),false);assert.equal(c.blocked(p.x,p.y),false);if(Math.hypot(p.x-old.x,p.y-old.y)<.01)break;}}
 }
 const near=houseToWorld(.22,.91),inside=houseToWorld(.29,.79);assert.ok(Math.hypot(near.x-inside.x,near.y-inside.y)<102);assert.equal(validMovement(near,inside.x,inside.y,500),false);
});
test('A-star routes across the house must go around its foundation',()=>{
 const c=new CollisionSystem(FARM_WORLD);
 for(const [a,b] of [[{x:400,y:130},{x:900,y:130}],[{x:640,y:-170},{x:640,y:380}]]){
 const route=findPath(c,a,b);assert.ok(route?.length);let previous=a;for(const p of route){assert.ok(clearSegment(c,previous,p));previous=p;}assert.deepEqual(previous,b);
 }
 assert.equal(findPath(c,{x:720,y:650},center),null);
});
test('saved position inside house is rescued and construction cannot overlap the foundation',()=>{
 const db=openDatabase(':memory:');try{const u=register(db,'house_fix','password123'),f=createFarm(db,u.id,'Nhà quê');
 db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(center.x,center.y,u.id);const s=snapshot(db,u.id);assert.equal(validPosition(s.player.x,s.player.y,'farm',db,f.id),true);assert.equal(insidePolygon(s.player,HOUSE_COLLIDER.points),false);
 db.prepare('UPDATE player_states SET x=650,y=300 WHERE user_id=?').run(u.id);
 assert.equal(rectangleOverlapsObstacle({x:576,y:96,w:96,h:96},HOUSE_COLLIDER),true);
 assert.throws(()=>performPhase5Action(db,u.id,{action:'place_building',farmId:f.id,requestId:randomUUID(),definitionId:'mill',x:12,y:2,rotation:0}),/vật cản/);
 assert.equal(db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(u.id).balance,200);assert.equal(db.prepare('SELECT count(*) n FROM farm_buildings').get().n,0);
 }finally{db.close();}
});
