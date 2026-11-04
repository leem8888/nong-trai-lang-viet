// Decorative art never changes collision, interaction points or buildable tiles.
import {DECORATIONS,TILE_SIZE} from './shared/phase5.js';
const decorationIds=Object.keys(DECORATIONS);
export const depth=(x,y)=>x+y;
export function sceneryLayers(scene,art,upright,reduced,placed=[]){
  const t=reduced?0:performance.now()/1800;
  const layers=[];
  const add=(x,y,key,w,h,sway=0)=>{
    if(placed.some(r=>x>r.x-60&&x<r.x+r.w+60&&y>r.y-60&&y<r.y+r.h+60))return;
    layers.push({y:depth(x,y),draw:ctx=>upright(ctx,x+Math.sin(t+x)*sway,y,art[key],w,h)});
  };
  const trees=scene==='market'?[[95,170,225],[1070,160,240],[105,700,185],[1090,700,185]]:[[180,180,225],[355,160,200],[1240,175,250],[180,440,165],[1330,570,175],[560,910,140]];
  for(const [x,y,w] of trees)add(x,y,'tree',w,w,1.3);
  const gardens=scene==='market'?[[130,300],[1080,335],[340,680],[875,685]]:[[400,488],[515,505],[940,505],[1190,590],[100,690],[435,920],[1255,885]];
  for(const [x,y] of gardens)add(x,y,'garden',130,47,.4);
  for(const [x,y] of scene==='market'?[[1050,600],[175,410]]:[[930,520],[320,480]])add(x,y,'props',115,80);
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
