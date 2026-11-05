import {ISO_X,ISO_Y} from './core/IsoProjection.js';
export const LIFE_IDS=['banyan','well','bamboo','shade','flame','cottage','pavilion','ducks','pets'];
export function drawLife(ctx,x,y,id,w,h,art,upright){const index=LIFE_IDS.indexOf(id);if(index<0)return;upright(ctx,x,y,art.villageLife,w,h,[index*384,0,384,384]);}
function drawNeighbor(ctx,x,y,variant){
  const colors=[['#f5dfad','#a84e39','#5d3d2d'],['#d8ddbc','#5d8062','#704c35'],['#f0d2a9','#bb7852','#68412c']][variant%3];
  ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  ctx.fillStyle='#334d3080';ctx.beginPath();ctx.ellipse(0,-8,137,21,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=colors[0];ctx.strokeStyle=colors[2];ctx.lineWidth=5;ctx.fillRect(-100,-102,200,91);ctx.strokeRect(-100,-102,200,91);
  ctx.fillStyle=colors[1];ctx.beginPath();if(variant%3===1){ctx.moveTo(-121,-100);ctx.lineTo(-92,-178);ctx.lineTo(88,-178);ctx.lineTo(121,-100);}else{ctx.moveTo(-125,-103);ctx.lineTo(0,variant%3===2?-185:-170);ctx.lineTo(125,-103);}ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#f5d19b';ctx.lineWidth=3;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-88+i*43,-111);ctx.lineTo(-74+i*35,variant%3===1?-170:-145);ctx.stroke();}
  ctx.fillStyle=colors[2];ctx.fillRect(-20,-75,40,64);ctx.fillStyle='#e9be77';ctx.beginPath();ctx.arc(9,-44,3,0,7);ctx.fill();
  for(const sx of [-73,50]){ctx.fillStyle='#577d65';ctx.fillRect(sx,-76,24,29);ctx.strokeStyle='#fff0c5';ctx.lineWidth=3;ctx.strokeRect(sx,-76,24,29);ctx.beginPath();ctx.moveTo(sx+12,-76);ctx.lineTo(sx+12,-47);ctx.stroke();}
  ctx.fillStyle='#9a6a42';ctx.fillRect(-110,-18,220,12);ctx.fillStyle='#5b8b4c';for(const sx of [-106,109]){ctx.beginPath();ctx.arc(sx,-24,17,0,7);ctx.fill();}
  ctx.restore();
}
export function villageScenery(scene,art,upright,reduced,placed=[]){
  const layers=[],t=reduced?0:performance.now()/2000;
  const add=(x,y,id,w,h,sway=0)=>{
    if(placed.some(r=>x>r.x-110&&x<r.x+r.w+110&&y>r.y-110&&y<r.y+r.h+110))return;
    layers.push({y:x+y,draw:ctx=>drawLife(ctx,x+Math.sin(t+x)*sway,y,id,w,h,art,upright)});
  };
  const addHome=(x,y,variant)=>{layers.push({y:x+y,draw:ctx=>{const image=art.neighbors;if(image?.naturalWidth){const cell=image.naturalWidth/3;upright(ctx,x,y,image,330,250,[variant%3*cell,0,cell,image.naturalHeight]);}else drawNeighbor(ctx,x,y,variant);}});};
  if(scene==='farm'){
    for(const [x,y,id,w,h] of [[180,180,'bamboo',170,220],[355,160,'flame',210,210],[1240,175,'shade',245,245],[180,440,'bamboo',125,175],[1330,570,'shade',185,185],[560,910,'flame',140,145]])add(x,y,id,w,h,1);
    [[260,-150],[1020,-170],[-160,380],[1620,550],[1560,1190],[650,1290],[-120,1110]].forEach(([x,y],i)=>addHome(x,y,i));
    add(-180,820,'bamboo',190,240);add(1750,1050,'shade',240,240);
  }else{
    add(1450,400,'banyan',380,340);add(1180,930,'well',175,185);add(1670,1060,'pavilion',350,245);
    for(const [x,y] of [[355,1140],[815,1280],[1685,1360]])add(x,y,'cottage',330,245);
    for(const [x,y,id,w,h] of [[100,170,'shade',220,220],[1070,160,'bamboo',190,230],[105,700,'flame',190,190],[1060,690,'shade',180,180],[1750,300,'bamboo',200,255],[1820,800,'flame',230,230],[950,1020,'shade',170,170],[540,1350,'bamboo',150,205],[1780,1160,'shade',180,180],[1250,1300,'flame',200,195],[270,850,'bamboo',145,195]])add(x,y,id,w,h,1);
    [[390,-170],[1280,-180],[-150,690],[2210,610],[1020,1740],[2170,1430]].forEach(([x,y],i)=>addHome(x,y,i));
    add(1260+Math.sin(t*.6)*10,1020+Math.cos(t*.6)*6,'ducks',78,65);
    add(560+Math.sin(t*.35)*5,1110,'pets',62,62);
  }
  return layers;
}
