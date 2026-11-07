import {MANGO_TREE} from './mango.js';
import {HOUSE_COLLIDER} from './house.js';
import {BANANA_TREE} from './banana.js';
// Static farm geometry shared by prediction and authoritative movement.
export const FARM_WORLD = {
  width: 1740, height: 1024, minY: -300,
  // The playable interior ends at the visible fence feet, including the south
  // gate (travel triggers inside it). Never allow positions outside the fence.
  margin: { left: 65, right: 65, top: -195, bottom: 119 },
  obstacles: [
    HOUSE_COLLIDER,
    {x:BANANA_TREE.x-12,y:BANANA_TREE.y-10,w:24,h:20},
    { x: 1300, y: 610, w: 40, h: 35 },
    { x: 215, y: 460, w: 70, h: 25 },
    { x: MANGO_TREE.x-12, y: MANGO_TREE.y-12, w: 25, h: 15 }, { x: 910, y: 289, w: 20, h: 20 }
  ]
};
