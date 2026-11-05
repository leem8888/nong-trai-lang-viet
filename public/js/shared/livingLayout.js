import {BUILDINGS,DECORATIONS,TILE_SIZE,footprint} from './phase5.js';
import {ISO_X,ISO_Y} from '../core/IsoProjection.js';

export function animalAccess(kind,player,layout=livingLayout(),collision){
  let points=[];
  if(kind==='pond'){
    const [p]=pondObstacles(layout.pond);
    for(let i=0;i<64;i++){
      const a=i*Math.PI/32,sx=Math.cos(a)*(p.rx+22),sy=Math.sin(a)*(p.ry+15);
      points.push({x:p.x+(sx/ISO_X+sy/ISO_Y)/2,y:p.y+(sy/ISO_Y-sx/ISO_X)/2});
    }
  }else{
    // The coop entrance faces down toward the farm. Keep the approach point
    // outside the front or side fence so the farmer remains visible while feeding.
    if(layout.yard){
      const r=layout.yard;
      for(let i=0;i<=8;i++){const t=i/8;points.push({x:r.x+t*r.w,y:r.y+r.h+34},{x:r.x-30,y:r.y+t*r.h},{x:r.x+r.w+30,y:r.y+t*r.h});}
    }else{
      const r={x:1080,y:115,w:230,h:140};
      for(let i=0;i<=8;i++){const t=i/8;points.push({x:r.x-25,y:r.y+t*r.h},{x:r.x+r.w+25,y:r.y+t*r.h},{x:r.x+t*r.w,y:r.y-25},{x:r.x+t*r.w,y:r.y+r.h+25});}
    }
  }
  if(collision)points=points.filter(p=>!collision.blocked(p.x,p.y));
  points.sort((a,b)=>Math.hypot(player.x-a.x,player.y-a.y)-Math.hypot(player.x-b.x,player.y-b.y));
  return {points,point:points[0]||null,distance:points.length?Math.hypot(player.x-points[0].x,player.y-points[0].y):Infinity};
}

// Match the upright pond artwork in projected screen space, rather than its old world rectangle.
export function pondObstacles(pond){
  const large=pond.w>300,anchorX=large?1195:1250,anchorY=large?720:705;
  const offset=(large?118:100)/(2*ISO_Y);
  return [{shape:'projectedEllipse',x:anchorX-offset,y:anchorY-offset,rx:large?230:158,ry:large?102:85}];
}

export const POND_OLD=Object.freeze({x:1110,y:630,w:280,h:145});
export const POND_LARGE=Object.freeze({x:1000,y:595,w:390,h:180});
export const YARD_CANDIDATES=Object.freeze([
  Object.freeze({x:1160,y:255,w:275,h:160}),
  Object.freeze({x:1085,y:255,w:275,h:160})
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
