import {MANGO_TREE} from './mango.js';
import {HOUSE_COLLIDER} from './house.js';
// Static farm geometry shared by prediction and authoritative movement.
export const FARM_WORLD = {
  width: 1740, height: 1024, minY: -300, margin: { left: 0, right: 0, top: -300, bottom: 0 },
  obstacles: [
    HOUSE_COLLIDER,
    { x: 50, y: -225, w: 1640, h: 15 }, { x: 50, y: 920, w: 1640, h: 15 },
    { x: 50, y: -225, w: 15, h: 1160 }, { x: 1675, y: -225, w: 15, h: 1160 },
    { x: 1300, y: 610, w: 40, h: 35 },
    { x: 215, y: 460, w: 70, h: 25 },
    { x: 1080, y: 115, w: 230, h: 130 },
    { x: MANGO_TREE.x-12, y: MANGO_TREE.y-12, w: 25, h: 15 }, { x: 910, y: 289, w: 20, h: 20 }
  ]
};
