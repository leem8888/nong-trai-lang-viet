import { CollisionSystem } from '../public/js/systems/CollisionSystem.js';

export const world = {
  width: 1440, height: 1024, margin: { left: 0, right: 0, top: 0, bottom: 0 },
  obstacles: [
    { x: 480, y: 265, w: 460, h: 220 }, // house
    { x: 50, y: 75, w: 1340, h: 15 }, { x: 50, y: 920, w: 1340, h: 15 },
    { x: 50, y: 75, w: 15, h: 860 }, { x: 1375, y: 75, w: 15, h: 860 },
    { x: 520, y: 720, w: 45, h: 35 }, { x: 1060, y: 610, w: 40, h: 35 },
    { x: 1170, y: 365, w: 40, h: 35 }, { x: 215, y: 460, w: 70, h: 25 },
    { x: 700, y: 514, w: 25, h: 15 }, { x: 925, y: 575, w: 20, h: 20 }
  ]
};
const collision = new CollisionSystem(world);
export function validPosition(x,y) { return Number.isFinite(x) && Number.isFinite(y) && !collision.blocked(x,y); }
export function validMovement(from,x,y,elapsedMs) {
  if (!validPosition(x,y) || Math.hypot(x-from.x,y-from.y) > 180*Math.min(Math.max(elapsedMs,0)/1000,.5)+12) return false;
  const steps=Math.max(1,Math.ceil(Math.hypot(x-from.x,y-from.y)/7));
  for(let i=1;i<=steps;i++) if(!validPosition(from.x+(x-from.x)*i/steps,from.y+(y-from.y)*i/steps)) return false;
  return true;
}
export const interactions = { board: { x: 343, y: 700 }, door: { x: 712, y: 520 }, lamp: { x: 935, y: 586 } };
export function inRange(player,objectId) {
  const o = interactions[objectId];
  return !!o && Math.hypot(player.x-o.x,player.y-o.y) <= 96;
}
