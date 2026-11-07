// Decorative art never changes collision, interaction points or buildable tiles.
import {DECORATIONS,TILE_SIZE} from './shared/phase5.js';
import {houseToWorld,HOUSE_COLLIDER} from './shared/house.js';
import {overlaps} from './systems/CollisionSystem.js';
const decorationIds=Object.keys(DECORATIONS);
const farmCart=houseToWorld(.88,1.13);
const sceneryRandom=(id,salt)=>{const n=Math.sin(id*127.1+salt*311.7)*43758.5453;return n-Math.floor(n);};
export function shrubClusters(scene){
  const anchors=scene==='market'?[[130,300],[1080,335],[340,680],[875,685]]:[[140,-90],[170,260],[350,450],[520,530],[960,455],[1470,510],[1550,810],[410,850],[130,730],[1550,-100],[1080,-120]];
  return anchors.flatMap(([x,y],group)=>Array.from({length:sceneryRandom(group,1)>.55?2:1},(_,member)=>{
    const id=group*3+member,size=72+sceneryRandom(id,5)*43;
    return {x:x+(sceneryRandom(id,2)-.5)*110+member*34,y:y+(sceneryRandom(id,3)-.5)*85-member*18,w:size,h:size*(.29+sceneryRandom(id,6)*.055),species:group%4,seed:id,mirror:sceneryRandom(id,7)>.5};
  }));
}
const shrubs={farm:shrubClusters('farm'),market:shrubClusters('market')};
function onFarmPath(x,y){
  const routes=[[[760,180],[700,470],[697,590],[720,740],[720,980]],[[700,610],[615,625]],[[713,720],[815,685],[945,690]],[[697,524],[865,420],[1065,240]]];
  return routes.some(points=>points.slice(1).some((b,i)=>{const a=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<55;}));
}
export const depth=(x,y)=>x+y;
export function sceneryLayers(scene,art,upright,reduced,placed=[],blocked=[]){
  const t=reduced?0:performance.now()/1800;
  const layers=[];
  const add=(x,y,key,w,h,sway=0,mirror=false)=>{
    if(placed.some(r=>x>r.x-60&&x<r.x+r.w+60&&y>r.y-60&&y<r.y+r.h+60))return;
    layers.push({y:depth(x,y),draw:ctx=>upright(ctx,x+Math.sin(t+x)*sway,y,art[key],w,h,undefined,mirror)});
  };
  // Trees are authored in villageScenery with distinct species.
  for(const bush of shrubs[scene]||[]){
    if(blocked.some(o=>overlaps(bush.x,bush.y,bush.w*.4,o)))continue;
    if(scene==='farm'&&(onFarmPath(bush.x,bush.y)||overlaps(bush.x,bush.y,55,HOUSE_COLLIDER)))continue;
    const key=['shrubLeaf','shrubFlower','shrubFern','shrubLeaf'][bush.species];
    add(bush.x,bush.y,key,bush.w,bush.w*.67,0,bush.mirror);
  }
  for(const [x,y] of scene==='market'?[[1050,600],[175,410]]:[[farmCart.x,farmCart.y]])add(x,y,'props',115,80);
  if(!reduced)for(let i=0;i<3;i++){const x=(scene==='market'?220:290)+i*250+Math.sin(t*.8+i)*24,y=600+Math.cos(t+i)*36;add(x,y,'butterfly',19,16+Math.sin(t*7+i)*4);}
  if(!reduced)for(let i=0;i<2;i++)add(410+i*170+Math.sin(t*.3+i)*95,210+Math.sin(t*.5+i)*24,'bird',28,17+Math.sin(t*4+i)*5);
  return layers;
}
export function paintLayers(ctx,layers){layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw(ctx));}
export function decorationLayers(rows,art,upright){return rows.filter(o=>!o.definitionId.endsWith('_path')).map(o=>{
  const x=(o.x+.5)*TILE_SIZE,y=(o.y+1)*TILE_SIZE,index=decorationIds.indexOf(o.definitionId);
  return {y:depth(x,y),draw:ctx=>upright(ctx,x,y,art,74,74,[index*128,0,128,128],Boolean(o.rotation%2))};
});}
export function drawDecorationGround(ctx,rows,art,upright){
  if(!art.naturalWidth)return;
  for(const o of rows.filter(o=>o.definitionId.endsWith('_path'))){const index=decorationIds.indexOf(o.definitionId);upright(ctx,(o.x+1)*TILE_SIZE,(o.y+1)*TILE_SIZE,art,TILE_SIZE*1.56,TILE_SIZE*1.56,[index*128,0,128,128],Boolean(o.rotation%2));}
}
export function drawNightLights(ctx,camera,scene,village){
  if(!village?.state)return;
  const minute=village.minute();if(minute>420&&minute<1080)return;
  const points=scene==='market'?[[300,325],[900,325]]:[[712,485],[935,570]];
  for(const [x,y] of points){const p=camera.toScreen(x,y),r=55*camera.zoom;ctx.save();ctx.globalCompositeOperation='screen';const glow=ctx.createRadialGradient(p.x,p.y-22*camera.zoom,0,p.x,p.y-22*camera.zoom,r);glow.addColorStop(0,'#ffd78055');glow.addColorStop(1,'#ffd78000');ctx.fillStyle=glow;ctx.fillRect(p.x-r,p.y-22*camera.zoom-r,r*2,r*2);ctx.restore();}
}
