import {ISO_X,ISO_Y} from '../core/IsoProjection.js';
// Rendering and collision share the same upright image anchor and dimensions.
export const FARM_HOUSE=Object.freeze({x:790,y:160,width:480,height:300});
export function houseToWorld(u,v){const sx=(u-.5)*FARM_HOUSE.width,sy=(v-1)*FARM_HOUSE.height;return {x:FARM_HOUSE.x+(sx/ISO_X+sy/ISO_Y)/2,y:FARM_HOUSE.y+(sy/ISO_Y-sx/ISO_X)/2};}
export const HOUSE_DOOR=Object.freeze({...houseToWorld(.43,.98)});
// Trace the foundation/porch footprint, not the roof silhouette or an old Cartesian box.
const points=[[.035,.78],[.16,.61],[.85,.62],[.975,.70],[.975,.76],[.845,.88],[.63,.875],[.61,.90],[.23,.88],[.23,.85],[.035,.835]].map(([u,v])=>Object.freeze(houseToWorld(u,v)));
const minX=Math.min(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y));
export const HOUSE_COLLIDER=Object.freeze({shape:'polygon',points:Object.freeze(points),x:minX,y:minY,w:Math.max(...points.map(p=>p.x))-minX,h:Math.max(...points.map(p=>p.y))-minY});
export const HOUSE_DEPTH=Math.max(...points.map(p=>p.x+p.y));
// A single depth for an angled facade hides actors standing at its left front corner.
// Raise only front-side actors above the house, without reordering the house over other scenery.
export function houseActorDepth(x,y){
 const sx=((x-FARM_HOUSE.x)-(y-FARM_HOUSE.y))*ISO_X,sy=((x-FARM_HOUSE.x)+(y-FARM_HOUSE.y))*ISO_Y;
 const outline=HOUSE_COLLIDER.points.map(p=>({x:((p.x-FARM_HOUSE.x)-(p.y-FARM_HOUSE.y))*ISO_X,y:((p.x-FARM_HOUSE.x)+(p.y-FARM_HOUSE.y))*ISO_Y}));
 const min=Math.min(...outline.map(p=>p.x)),max=Math.max(...outline.map(p=>p.x));
 if(sx<min-35||sx>max+35)return x+y;
 const column=Math.max(min+1e-6,Math.min(max-1e-6,sx)),edges=[];
 for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];if(column>=Math.min(a.x,b.x)&&column<=Math.max(a.x,b.x)&&Math.abs(b.x-a.x)>1e-6)edges.push(a.y+(b.y-a.y)*(column-a.x)/(b.x-a.x));}
 return edges.length&&sy>=Math.max(...edges)?Math.max(x+y,HOUSE_DEPTH+.1):x+y;
}
