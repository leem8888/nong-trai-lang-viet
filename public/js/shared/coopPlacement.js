import {ISO_X,ISO_Y} from '../core/IsoProjection.js';
// Only the house moves within the artwork; the exercise yard stays fixed.
export const COOP_HOUSE_OFFSET={u:.145,v:-.20};

export function coopPlacement(yard){return {x:yard.x+170,y:yard.y-70,width:510,height:321,rotation:-.055};}
export function coopToWorld(g,p){
  const x=p.x-g.width/2,y=p.y-g.height,c=Math.cos(g.rotation||0),s=Math.sin(g.rotation||0);
  const sx=x*c-y*s,sy=x*s+y*c;
  return {x:g.x+(sx/ISO_X+sy/ISO_Y)/2,y:g.y+(sy/ISO_Y-sx/ISO_X)/2};
}
export function worldToCoop(g,p){
  const sx=((p.x-g.x)-(p.y-g.y))*ISO_X,sy=((p.x-g.x)+(p.y-g.y))*ISO_Y,c=Math.cos(g.rotation||0),s=Math.sin(g.rotation||0);
  return {x:sx*c+sy*s+g.width/2,y:-sx*s+sy*c+g.height};
}
