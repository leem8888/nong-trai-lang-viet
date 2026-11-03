import { CollisionSystem } from '../public/js/systems/CollisionSystem.js';
import { MARKET_WORLD, MARKET_POINTS, FARM_GATE } from '../public/js/shared/marketMap.js';
import { VAC_POINTS } from '../public/js/shared/vac.js';

export const world = {
  width: 1440, height: 1024, margin: { left: 0, right: 0, top: 0, bottom: 0 },
  obstacles: [
    { x: 480, y: 265, w: 460, h: 220 }, // house
    { x: 50, y: 75, w: 1340, h: 15 }, { x: 50, y: 920, w: 1340, h: 15 },
    { x: 50, y: 75, w: 15, h: 860 }, { x: 1375, y: 75, w: 15, h: 860 },
    { x: 520, y: 720, w: 45, h: 35 }, { x: 1060, y: 610, w: 40, h: 35 },
    { x: 215, y: 460, w: 70, h: 25 },
    { x: 1010, y: 710, w: 280, h: 145 }, { x: 1050, y: 360, w: 230, h: 130 },
    { x: 700, y: 514, w: 25, h: 15 }, { x: 925, y: 575, w: 20, h: 20 }
  ]
};
const collision = new CollisionSystem(world);
const marketCollision = new CollisionSystem(MARKET_WORLD);
export function validPosition(x,y,scene='farm') { return Number.isFinite(x) && Number.isFinite(y) && !(scene==='market'?marketCollision:collision).blocked(x,y); }
export function validMovement(from,x,y,elapsedMs,scene='farm') {
  if (!validPosition(x,y,scene) || Math.hypot(x-from.x,y-from.y) > 180*Math.min(Math.max(elapsedMs,0)/1000,.5)+12) return false;
  const steps=Math.max(1,Math.ceil(Math.hypot(x-from.x,y-from.y)/7));
  for(let i=1;i<=steps;i++) if(!validPosition(from.x+(x-from.x)*i/steps,from.y+(y-from.y)*i/steps,scene)) return false;
  return true;
}
export const interactions = { board: { x: 343, y: 700 }, door: { x: 712, y: 520 }, lamp: { x: 935, y: 586 }, farmGate: FARM_GATE, ...VAC_POINTS };
export function inRange(player,objectId) {
  const o = player.scene==='market' ? MARKET_POINTS[objectId] : interactions[objectId];
  return !!o && Math.hypot(player.x-o.x,player.y-o.y) <= 96;
}
