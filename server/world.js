import { CollisionSystem, overlaps } from '../public/js/systems/CollisionSystem.js';
import { MARKET_WORLD, MARKET_POINTS, FARM_GATE } from '../public/js/shared/marketMap.js';
import { VAC_POINTS } from '../public/js/shared/vac.js';
import { BUILDINGS, DECORATIONS, footprint, TILE_SIZE } from '../public/js/shared/phase5.js';
import {livingLayout,yardObstacles,POND_OLD} from '../public/js/shared/livingLayout.js';

export const world = {
  width: 1440, height: 1024, margin: { left: 0, right: 0, top: 0, bottom: 0 },
  obstacles: [
    { x: 540, y: 90, w: 340, h: 260 }, // house reaches the north fence; no hidden playable land behind it
    { x: 50, y: 75, w: 1340, h: 15 }, { x: 50, y: 920, w: 1340, h: 15 },
    { x: 50, y: 75, w: 15, h: 860 }, { x: 1375, y: 75, w: 15, h: 860 },
    { x: 520, y: 720, w: 45, h: 35 }, { x: 1300, y: 610, w: 40, h: 35 },
    { x: 215, y: 460, w: 70, h: 25 },
    { x: 1010, y: 710, w: 280, h: 145 }, { x: 1050, y: 360, w: 230, h: 130 },
    { x: 700, y: 514, w: 25, h: 15 }, { x: 925, y: 575, w: 20, h: 20 }
  ]
};
const collision = new CollisionSystem(world);
const marketCollision = new CollisionSystem(MARKET_WORLD);
export function validPosition(x,y,scene='farm',db=null,farmId=null) {
  if(!Number.isFinite(x)||!Number.isFinite(y)||(scene==='market'?marketCollision:collision).blocked(x,y))return false;
  if(scene!=='farm'||!db||!farmId)return true;
  const buildings=db.prepare('SELECT definition_id,tile_x,tile_y,rotation FROM farm_buildings WHERE farm_id=?').all(farmId),decorations=db.prepare('SELECT definition_id,tile_x,tile_y,rotation FROM farm_decorations WHERE farm_id=?').all(farmId);
  const layout=livingLayout(buildings,decorations);
  if(layout.pond!==POND_OLD&&overlaps(x,y,14,layout.pond))return false;
  if(yardObstacles(layout.yard).some(o=>overlaps(x,y,14,o)))return false;
  const rows=[...buildings.map(o=>({...o,def:BUILDINGS[o.definition_id]})),...decorations.filter(o=>DECORATIONS[o.definition_id]?.blocking).map(o=>({...o,def:DECORATIONS[o.definition_id]}))];
  return !rows.some(o=>{const size=footprint(o.def,o.rotation),left=o.tile_x*TILE_SIZE,top=o.tile_y*TILE_SIZE;return overlaps(x,y,14,{x:left,y:top,w:size.w*TILE_SIZE,h:size.h*TILE_SIZE});});
}
export function validMovement(from,x,y,elapsedMs,scene='farm',db=null,farmId=null) {
  if (!validPosition(x,y,scene,db,farmId) || Math.hypot(x-from.x,y-from.y) > 180*Math.min(Math.max(elapsedMs,0)/1000,.5)+12) return false;
  const steps=Math.max(1,Math.ceil(Math.hypot(x-from.x,y-from.y)/7));
  for(let i=1;i<=steps;i++) if(!validPosition(from.x+(x-from.x)*i/steps,from.y+(y-from.y)*i/steps,scene,db,farmId)) return false;
  return true;
}
export const interactions = { board: { x: 343, y: 700 }, door: { x: 712, y: 385 }, lamp: { x: 935, y: 586 }, farmGate: FARM_GATE, ...VAC_POINTS };
export function inRange(player,objectId) {
  const o = player.scene==='market' ? MARKET_POINTS[objectId] : interactions[objectId];
  if(objectId==='pond'&&player.scene==='farm'&&Math.hypot(player.x-990,player.y-780)<=96)return true;
  return !!o && Math.hypot(player.x-o.x,player.y-o.y) <= 96;
}
