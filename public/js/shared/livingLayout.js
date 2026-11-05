import {BUILDINGS,DECORATIONS,TILE_SIZE,footprint} from './phase5.js';

export const POND_OLD=Object.freeze({x:1010,y:710,w:280,h:145});
export const POND_LARGE=Object.freeze({x:900,y:675,w:390,h:180});
export const YARD_CANDIDATES=Object.freeze([
  Object.freeze({x:1130,y:500,w:190,h:105}),
  Object.freeze({x:1055,y:500,w:220,h:105})
]);
const hits=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const rect=row=>{const def=BUILDINGS[row.definitionId??row.definition_id]||DECORATIONS[row.definitionId??row.definition_id];if(!def)return null;const size=footprint(def,row.rotation);return {x:(row.x??row.tile_x)*TILE_SIZE,y:(row.y??row.tile_y)*TILE_SIZE,w:size.w*TILE_SIZE,h:size.h*TILE_SIZE};};
export function livingLayout(buildings=[],decorations=[]){const occupied=[...buildings,...decorations].map(rect).filter(Boolean);
  const pond=occupied.some(area=>hits(area,POND_LARGE))?POND_OLD:POND_LARGE;
  const yard=YARD_CANDIDATES.find(area=>!occupied.some(other=>hits(area,other))&&!hits(area,pond))||null;
  return {pond,yard};
}
export function yardObstacles(yard){if(!yard)return [];const {x,y,w,h}=yard;return [
  {x,y,w,h:8},{x:x+w-8,y,w:8,h},
  {x,y:y+h-8,w,h:8},
  {x,y,w:8,h:32},{x,y:y+70,w:8,h:h-70},
  {x:x+48,y:y+20,w:34,h:20},
  {x:x+w-66,y:y+33,w:30,h:25}
];}
