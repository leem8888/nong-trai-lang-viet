import {BUILDINGS,DECORATIONS,TILE_SIZE,footprint} from './phase5.js';
import {ISO_X,ISO_Y} from '../core/IsoProjection.js';
import {circleOverlapsPolygon} from '../systems/geometry.js';
import {coopPlacement,coopToWorld,worldToCoop,COOP_HOUSE_OFFSET} from './coopPlacement.js';

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
      const obstacles=yardObstacles(layout.yard);
      for(const obstacle of obstacles){
        const center=obstacle.points.reduce((c,p)=>({x:c.x+p.x/obstacle.points.length,y:c.y+p.y/obstacle.points.length}),{x:0,y:0});
        for(let i=0;i<obstacle.points.length;i++){
          const a=obstacle.points[i],b=obstacle.points[(i+1)%obstacle.points.length];
          for(let j=0;j<=4;j++){
            const x=a.x+(b.x-a.x)*j/4,y=a.y+(b.y-a.y)*j/4,d=Math.hypot(x-center.x,y-center.y)||1;
            points.push({x:x+(x-center.x)/d*36,y:y+(y-center.y)/d*36});
          }
        }
      }
      points=points.filter(p=>!obstacles.some(o=>circleOverlapsPolygon(p,18,o.points)));
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
export function yardObstacles(yard){
  if(!yard)return [];
  // Ground footprints in the 510 × 321 upright artwork, shared with server movement.
  const g=coopPlacement(yard),toWorld=([u,v])=>coopToWorld(g,{x:u*g.width,y:v*g.height});
  return [
    // The full fenced footprint is larger than the chickens' inner roaming area.
    // Include the restored left side and the front gate in the current artwork.
    [[.065,.65],[.39,.46],[.40,.50],[.09,.69]],
    [[.39,.46],[.92,.47],[.92,.51],[.39,.50]],
    [[.91,.48],[.98,.74],[.94,.74],[.89,.50]],
    [[.98,.73],[.79,.97],[.77,.93],[.94,.71]],
    [[.78,.97],[.50,.945],[.50,.90],[.78,.92]],
    [[.34,.93],[.16,.90],[.065,.67],[.10,.65],[.19,.85],[.34,.88]],
    [[.205,.53],[.325,.42],[.49,.43],[.49,.47],[.38,.61],[.23,.60]]
  ].map(outline=>({shape:'polygon',points:outline.map(toWorld)}));
}

// The coop image includes its ground. Its anchor is below the angled front
// fence, so ordinary x+y sorting can paint that ground over a nearby actor.
export function coopActorDepth(x,y,yard){
  if(!yard)return x+y;
  const placement=coopPlacement(yard),local=worldToCoop(placement,{x,y});
  if(local.x>-.15*placement.width&&local.x<1.15*placement.width&&local.y>placement.height*.55&&local.y<placement.height*1.2)return Math.max(x+y,placement.x+placement.y+.1);
  const g=coopPlacement(yard),sx=(x-y)*ISO_X,sy=(x+y)*ISO_Y;
  const outline=yardObstacles(yard)[0].points.map(p=>({x:(p.x-p.y)*ISO_X,y:(p.x+p.y)*ISO_Y}));
  const edges=[];
  for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length];
    if(sx>=Math.min(a.x,b.x)&&sx<=Math.max(a.x,b.x)&&Math.abs(b.x-a.x)>1e-6)edges.push(a.y+(b.y-a.y)*(sx-a.x)/(b.x-a.x));
  }
  return edges.length&&sy>=Math.max(...edges)?Math.max(x+y,g.x+g.y+.1):x+y;
}

export function coopEggApproach(yard){
  if(!yard)return null;
  const g=coopPlacement(yard);return coopToWorld(g,{x:g.width*.30,y:g.height*.69});
}
