import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {FARM_NEIGHBORS} from './villageScenery.js';
export function childBehindNeighbor(child,house){
 const x=((child.x-house.x)-(child.y-house.y))*ISO_X,y=((child.x-house.x)+(child.y-house.y))*ISO_Y;
 return Math.abs(x)<house.width/2+50&&y<-10&&y>-house.height-70;
}
const ROADS=[[[70,1000],[2500,1000]],[[-650,-285],[2500,-285]],[[-30,-650],[-30,950]],[[1770,-285],[1770,1400]]];
// Clip the road to an expanded viewport, so children arrive and leave offscreen.
export function visibleChildRoutes(camera){
 const routes=[];
 for(const [a,b] of ROADS){
  const start=camera.toScreen(...a),end=camera.toScreen(...b),dx=end.x-start.x,dy=end.y-start.y;
  let lo=0,hi=1,valid=true;
  for(const [p,q] of [[-dx,start.x+160],[dx,camera.width+160-start.x],[-dy,start.y+190],[dy,camera.height+190-start.y]]){
   if(Math.abs(p)<1e-8){if(q<0)valid=false;continue;}
   const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
  }
  if(valid&&lo<hi){const point=t=>({x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t});routes.push([point(lo),point(hi)]);}
 }
 return routes;
}
export class VillageChildren{
 constructor(random=Math.random){this.random=random;this.people=[];this.next=4+random()*5;this.clock=0;}
 spawn(camera,kind=this.random()<.4?'kite':'bike'){
  const routes=visibleChildRoutes(camera);if(!routes.length)return;
  let [from,to]=routes[Math.floor(this.random()*routes.length)];if(this.random()<.5)[from,to]=[to,from];
  const count=kind==='kite'?1:2+Math.floor(this.random()*2);
  this.people=Array.from({length:count},(_,id)=>({kind,id,x:from.x,y:from.y,from,to,delay:id*1.45,phase:id*.8,done:false}));
 }
 update(dt,camera,active=true,reduced=false){
  if(!active)return;
  dt=Math.min(dt,.1);this.clock+=dt;
  if(reduced){this.people=[];return;}
  if(!this.people.length){this.next-=dt;if(this.next<=0){this.spawn(camera);this.next=22+this.random()*30;}return;}
  for(const p of this.people){
   if(p.done)continue;if(p.delay>0){p.delay-=dt;continue;}
   const dx=p.to.x-p.x,dy=p.to.y-p.y,d=Math.hypot((dx-dy)*ISO_X,(dx+dy)*ISO_Y),speed=p.kind==='bike'?72:26;
   if(d<1){p.done=true;continue;}
   const t=Math.min(1,speed*dt/d);p.x+=dx*t;p.y+=dy*t;p.phase+=dt*(p.kind==='bike'?8:6);p.mirror=(dx-dy)<0;
  }
  this.people=this.people.filter(p=>!p.done);
 }
 layers(camera,art,front=false){
  return this.people.filter(p=>p.delay<=0&&(p.y>935||p.x>1710)===front&&camera.visible(p.x,p.y,240)).map(p=>({y:p.x+p.y,draw:ctx=>this.draw(ctx,p,art)}));
 }
 draw(ctx,p,art){
  const homes=FARM_NEIGHBORS.filter(home=>childBehindNeighbor(p,home));
  if(homes.length&&art.neighbors?.naturalWidth&&typeof document!=='undefined'){
   const houseImage=art.neighbors;
   if(this.neighborMaskSource!==houseImage){const mask=document.createElement('canvas');mask.width=houseImage.naturalWidth;mask.height=houseImage.naturalHeight;const m=mask.getContext('2d',{willReadFrequently:true});m.drawImage(houseImage,0,0);this.neighborMask=m.getImageData(0,0,mask.width,mask.height).data;this.neighborMaskSource=houseImage;}
   const cellWidth=houseImage.naturalWidth/3;
   const hideBody=homes.some(home=>{const dx=((p.x-home.x)-(p.y-home.y))*ISO_X,dy=((p.x-home.x)+(p.y-home.y))*ISO_Y;
    const u=(dx+home.width/2)/home.width,v=(dy+home.height)/home.height;if(u<0||u>=1||v<0||v>=1)return false;
    const px=Math.floor((home.variant%3+u)*cellWidth),py=Math.floor(v*houseImage.naturalHeight);
    return this.neighborMask[(py*houseImage.naturalWidth+px)*4+3]>220;
   });
   p.occluded=hideBody;
   const canvas=this.occlusionCanvas||(this.occlusionCanvas=document.createElement('canvas'));
   if(canvas.width!==480){canvas.width=480;canvas.height=300;}
   const g=canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,480,300);
   g.save();g.translate(240,250);g.transform(ISO_X,ISO_Y,-ISO_X,ISO_Y,0,0);this.drawRaw(g,{...p,x:0,y:0,hideBody},art);g.restore();
   // Mask against the actual house alpha, so a child and rope disappear behind
   // the roof while the kite remains visible in the sky above it.
   g.globalCompositeOperation='destination-out';const image=art.neighbors,cell=image.naturalWidth/3;
   for(const home of homes){const x=((home.x-p.x)-(home.y-p.y))*ISO_X,y=((home.x-p.x)+(home.y-p.y))*ISO_Y;g.drawImage(image,home.variant%3*cell,0,cell,image.naturalHeight,240+x-home.width/2,250+y-home.height,home.width,home.height);}
   g.globalCompositeOperation='source-over';
   ctx.save();ctx.translate(p.x,p.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.drawImage(canvas,-240,-250);ctx.restore();return;
  }
  p.occluded=false;this.drawRaw(ctx,p,art);
 }
 drawRaw(ctx,p,art){
  const bike=p.kind==='bike',image=bike?art.childCyclists:art.childKite;if(!image?.naturalWidth)return;
  const frame=Math.floor(p.phase)%4,columns=bike?4:2,rows=2,sw=image.naturalWidth/columns,sh=image.naturalHeight/rows;
  const col=bike?frame:frame%2,row=bike?p.id%2:Math.floor(frame/2),w=bike?79:51,h=bike?61:62;
  ctx.save();ctx.translate(p.x,p.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  if(!p.hideBody){ctx.fillStyle='#26362430';ctx.beginPath();ctx.ellipse(0,0,bike?30:10,bike?3:2,0,0,Math.PI*2);ctx.fill();}
  if(p.mirror)ctx.scale(-1,1);
  if(!p.hideBody)ctx.drawImage(image,col*sw,row*sh,sw,sh,-w/2,-h*(bike?.97:.92),w,h);
  if(!bike){
   const wind=this.clock*.8,pulse=Math.sin(wind)*8,kx=63+pulse,ky=-157+Math.sin(wind*.7)*6;
   ctx.strokeStyle='#e7d8b0b0';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(13,-43);ctx.quadraticCurveTo(45,-76,kx,ky+14);ctx.stroke();
   ctx.save();ctx.translate(kx,ky);ctx.rotate(.18+Math.sin(wind)*.12);
   ctx.fillStyle='#c86b45';ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(16,0);ctx.lineTo(0,19);ctx.lineTo(-16,0);ctx.closePath();ctx.fill();
   ctx.fillStyle='#e8ba62';ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(0,19);ctx.lineTo(-16,0);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#765b37';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(0,19);ctx.moveTo(-16,0);ctx.quadraticCurveTo(0,-3,16,0);ctx.stroke();
   ctx.strokeStyle='#c59c62';ctx.beginPath();ctx.moveTo(0,19);ctx.bezierCurveTo(9,31,-9,39,Math.sin(wind)*9,54);ctx.stroke();
   for(let i=0;i<3;i++){const y=28+i*10,x=Math.sin(wind+i)*3;ctx.fillStyle=i%2?'#779780':'#d9a456';ctx.beginPath();ctx.moveTo(x-4,y-2);ctx.lineTo(x+4,y+2);ctx.lineTo(x+4,y-2);ctx.lineTo(x-4,y+2);ctx.closePath();ctx.fill();}ctx.restore();
  }
  ctx.restore();
 }
}
