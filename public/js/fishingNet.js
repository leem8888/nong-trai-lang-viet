import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {drawSwimmingFish} from './animalDrawing.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export function fishingPose(age){
 const cast=ease((age-.3)/.75),pull=ease((age-1.65)/1.45);
 return {cast,pull,spread:Math.max(.17,cast*(1-pull*.75)),caught:age>=1.8,opacity:1-ease((age-3.4)/.4),done:age>=3.8};
}
// Rotate the original upper body around the hips, preserving the painted arms.
// The cord uses this same transform so it never floats away from the hand.
export function fishingActorPose(age,side=1){
 const wind=ease(age/.3)*(1-ease((age-.3)/.3));
 const release=ease((age-.3)/.35)*(1-ease((age-1.05)/.45));
 const pull=ease((age-1.65)/1.45),settle=1-ease((age-3.15)/.65);
 const haul=Math.sin(clamp((age-1.65)/1.45)*Math.PI*3)*.018;
 const lean=side*(wind*-.10+release*.14-pull*.08+haul)*settle;
 const crouch=(wind*1.5+release*2+pull*1.2)*settle;
 const hx=side*12,hy=-8;
 return {lean,crouch,hand:{x:hx*Math.cos(lean)-hy*Math.sin(lean),y:-32+crouch+hx*Math.sin(lean)+hy*Math.cos(lean)}};
}
export const FISH_RELEASE_DELAY=.65;
export const FISH_RELEASE_TRAVEL=.4;
export function fishReleaseFrame(age){
 return age<.2?0:age<.4?1:age<FISH_RELEASE_DELAY?2:age<1.05?3:age<1.45?4:age<1.8?2:age<1.95?1:0;
}
export function drawFishReleaseActor(ctx,image,x,y,direction,age){
 if(!image?.naturalWidth)return;
 const frame=fishReleaseFrame(age),w=image.naturalWidth/3,h=image.naturalHeight/2;
 ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
 if(direction==='right')ctx.scale(-1,1);
 ctx.drawImage(image,frame%3*w,Math.floor(frame/3)*h,w,h,-42,-82,84,84);
 ctx.restore();
}
export function drawFishingActor(ctx,image,x,y,direction,age,bodyPose){
 if(!image?.naturalWidth)return;
 const side=direction==='left'?-1:1,pose=bodyPose||fishingActorPose(age,side);
 const row={down:0,up:1,left:2,right:3}[direction]??0,w=image.naturalWidth/4,h=image.naturalHeight/4;
 ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
 ctx.fillStyle='#2430202b';ctx.beginPath();ctx.ellipse(0,1,15,3.2,0,0,Math.PI*2);ctx.fill();
 // Feet stay planted; a small overlapping seam at the hips hides the split.
 ctx.drawImage(image.bitmap||image,w,row*h+h*54/86,w,h*32/86,-39,-32,78,32);
 ctx.translate(0,-32+pose.crouch);ctx.rotate(pose.lean);
 ctx.drawImage(image.bitmap||image,w,row*h,w,h*56/86,-39,-54,78,56);
 ctx.restore();
}
export function drawFishingNet(ctx,event,age,art){
 const pose=fishingPose(age);if(pose.done)return;
 const from=event.throwFrom,water=event.catchPoint;
 const dx=((water.x-from.x)-(water.y-from.y))*ISO_X,dy=((water.x-from.x)+(water.y-from.y))*ISO_Y;
 const side=dx<0?-1:1,hand=fishingActorPose(age,side).hand;
 const t=pose.cast*(1-pose.pull),x=hand.x+(dx-hand.x)*t,y=hand.y+(dy-hand.y)*t-Math.sin(pose.cast*Math.PI)*(1-pose.pull)*31;
 const rx=34*pose.spread,ry=(pose.pull>0?13:8)*pose.spread,bag=pose.pull*18;
 ctx.save();ctx.translate(from.x,from.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.globalAlpha=pose.opacity;
 // The retrieval cord stays attached to the same hand throughout the cast.
 ctx.strokeStyle='#a28c61';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(hand.x,hand.y);ctx.quadraticCurveTo((hand.x+x)/2,(hand.y+y)/2+8*(1-pose.pull),x,y);ctx.stroke();
 if(age>1.05&&age<2.6){const r=age-1.05;ctx.save();ctx.globalAlpha*=Math.max(0,1-r/1.55)*.5;ctx.strokeStyle='#cbe7dd';for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(dx,dy,30+r*15+i*5,8+r*5+i*2,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
 ctx.translate(x,y);ctx.fillStyle=pose.pull>0?'#bfba8b27':'#c4c9ad20';
 ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();
 if(pose.caught&&pose.pull>0){
  ctx.save();ctx.translate(0,bag*.45);ctx.transform(ISO_X,ISO_Y,-ISO_X,ISO_Y,0,0);ctx.filter='brightness(1.45) saturate(1.3)';
  drawSwimmingFish(ctx,event.fishId==='carp'?art.carpFish:art.livingAnimals,event.fishId||'tilapia',0,0,27,side,-.1+Math.sin(age*12)*.08,age*8,false);ctx.restore();
 }
 // Curved mesh sags into a pouch as the wet net is gathered.
 ctx.strokeStyle='#d9d5b4b8';ctx.lineWidth=.65;
 for(let i=-4;i<=4;i++){
  const f=i/5,edge=Math.sqrt(1-f*f);
  ctx.beginPath();ctx.moveTo(rx*f,-ry*edge);ctx.quadraticCurveTo(rx*f*.55,bag+ry,rx*f,ry*edge);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-rx*edge,ry*f);ctx.quadraticCurveTo(0,ry*f+bag,rx*edge,ry*f);ctx.stroke();
 }
 ctx.strokeStyle='#9d956d';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();
 if(pose.pull>0&&pose.pull<.9)for(let i=0;i<5;i++){const fall=((age*2+i*.17)%1);ctx.fillStyle='#c2e5dc';ctx.globalAlpha=pose.opacity*(1-fall)*.55;ctx.beginPath();ctx.ellipse((i-2)*rx*.3,bag+fall*19,.6,1.2,0,0,7);ctx.fill();}
 ctx.restore();
}
