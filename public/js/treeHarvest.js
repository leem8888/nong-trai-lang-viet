import {ISO_X,ISO_Y} from './core/IsoProjection.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export function bananaReachFrame(age){return age<.18?0:age<.38?1:age<.85?2:age<1.2?3:age<1.75?4:5;}
export class TreeHarvestVisual{
 constructor(){this.event=null;}
 get active(){return !!this.event&&performance.now()-this.event.at<2200;}
 async play(kind,tree,player,ui){
  const at=performance.now();this.event={kind,tree,player:{x:player.x,y:player.y},at,size:ui.size?.()||180};ui.harvestAt=at;
  try{await new Promise(resolve=>setTimeout(resolve,2200));}finally{ui.harvestAt=null;this.event=null;}
 }
 drawActor(ctx,image,x,y,direction,art={}){
  const event=this.event,age=(performance.now()-event.at)/1000;
  const side=((event.tree.x-x)-(event.tree.y-y))<0?-1:1;
  if(art.bananaReach?.naturalWidth){
    const sheet=art.bananaReach,frame=bananaReachFrame(age),w=sheet.naturalWidth/3,h=sheet.naturalHeight/2;
    ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
    if(side>0)ctx.scale(-1,1);
    ctx.drawImage(sheet,frame%3*w,Math.floor(frame/3)*h,w,h,-42,-84*.94,84,84);ctx.restore();return;
  }
  const row={down:0,up:1,left:2,right:3}[direction]??0,w=image.naturalWidth/4,h=image.naturalHeight/4;
  ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  ctx.drawImage(image.bitmap||image,w,row*h,w,h,-39,-86,78,86);ctx.restore();
 }
 drawFruit(ctx,art){
  if(!this.active)return;const e=this.event,age=(performance.now()-e.at)/1000,banana=e.kind==='banana';
  ctx.save();ctx.translate(e.tree.x,e.tree.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  const handX=((e.player.x-e.tree.x)-(e.player.y-e.tree.y))*ISO_X,handY=((e.player.x-e.tree.x)+(e.player.y-e.tree.y))*ISO_Y-48;
  for(let i=0;i<(banana?1:3);i++){
   const t=(age-(banana?.9:.9+i*.22))/(banana?.85:.7);if(t<0||t>=1)continue;
   const blend=ease(t),sx=banana?14:(i-1)*e.size*.15,sy=banana?-80:-e.size*(.65-i*.06);
   ctx.save();ctx.translate(sx+(handX-sx)*blend,sy+(handY-sy)*blend);ctx.rotate(Math.sin(t*Math.PI)*.15);ctx.globalAlpha=1-ease((t-.8)/.2);
   if(banana&&art.bananaBunchRipe?.naturalWidth)ctx.drawImage(art.bananaBunchRipe.bitmap||art.bananaBunchRipe,-12,-18,24,36);
   else {const skin=ctx.createLinearGradient(-4,-6,4,6);skin.addColorStop(0,'#fff195');skin.addColorStop(.4,'#ffd044');skin.addColorStop(1,'#d99020');ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(0,-6);ctx.bezierCurveTo(6,-6,6,2,1,7);ctx.bezierCurveTo(-2,9,-5,3,-4,-1);ctx.bezierCurveTo(-4,-4,-2,-6,0,-6);ctx.fill();}
   ctx.restore();
  }
  ctx.restore();
 }
}
