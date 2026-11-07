import {ISO_X,ISO_Y} from './core/IsoProjection.js';
// Tight source rectangles exclude the transparent atlas gutters around each animal.
const SOURCES={chick:[195,120,495,625],chicken:[76,63,658,770],tilapia:[927,222,772,438],carp:[925,228,780,435]};
const FISH_SIZES={tilapia:{young:22,mature:32,aspect:.49},carp:{young:25,mature:44,aspect:.42}};
export function fishLength(kind,progress){const size=FISH_SIZES[kind]||FISH_SIZES.tilapia;return size.young+(size.mature-size.young)*Math.max(0,Math.min(1,progress));}
export function fishTilt(angle){return Math.max(-.22,Math.min(.22,Math.atan2(Math.sin(angle),Math.abs(Math.cos(angle)))*.25));}
function screenPlane(ctx,x,y){ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);}
export function drawHungerIcon(ctx,x,y,offsetX,offsetY,opacity){
  if(opacity<=0)return;
  ctx.save();screenPlane(ctx,x,y);ctx.translate(offsetX,offsetY);ctx.globalAlpha*=opacity;
  ctx.shadowColor='#30231555';ctx.shadowBlur=2;ctx.shadowOffsetY=1;
  const cloth=ctx.createLinearGradient(-6,0,6,0);cloth.addColorStop(0,'#bd8a45');cloth.addColorStop(.45,'#f0d298');cloth.addColorStop(1,'#c59b5b');
  ctx.fillStyle=cloth;ctx.strokeStyle='#78532e';ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(-4,-5);ctx.bezierCurveTo(-4,-1,-7,1,-6,5);ctx.quadraticCurveTo(-5,8,0,8);ctx.quadraticCurveTo(6,8,6,4);ctx.bezierCurveTo(6,0,3,-2,4,-5);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.fillStyle='#79542d';ctx.beginPath();ctx.ellipse(0,-5,4.4,1.8,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ebbd58';for(const [dx,dy,a] of [[-2,-5,-.5],[1,-5.5,.4],[2,-4.5,-.4]]){ctx.beginPath();ctx.ellipse(dx,dy,1.4,.9,a,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#a77a3c';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-3,1);ctx.quadraticCurveTo(-4,4,-3,5);ctx.moveTo(3,2);ctx.lineTo(3,5);ctx.stroke();
  ctx.restore();
}
export function drawEggNest(ctx,x,y,count){
  ctx.save();screenPlane(ctx,x,y);ctx.translate(0,1);ctx.scale(.72,.68);ctx.transform(1,-.12,0,1,0,0);
  ctx.fillStyle='#38230e55';ctx.beginPath();ctx.ellipse(0,3,17,4,0,0,Math.PI*2);ctx.fill();
  const straw=ctx.createLinearGradient(0,-5,0,6);straw.addColorStop(0,'#aa8039');straw.addColorStop(1,'#86602b');
  ctx.fillStyle=straw;ctx.beginPath();ctx.ellipse(0,0,16,4.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#765026';ctx.beginPath();ctx.ellipse(0,-1,12,3,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=.65;ctx.lineCap='round';
  for(let i=0;i<32;i++){
    const a=i*2.39996,rx=12+i%4,ry=3+i%3*.65;
    const px=Math.cos(a)*rx,py=Math.sin(a)*ry;
    ctx.strokeStyle=i%3?'#d7b66a':'#8c622d';ctx.beginPath();ctx.moveTo(px-Math.sin(a)*2.5,py-Math.cos(a)*.8);ctx.lineTo(px+Math.sin(a)*2,py+Math.cos(a)*.8);ctx.stroke();
  }
  const positions=[[-5,-1,-.8],[1,-2,.7],[6,0,-.5]];
  for(let i=0;i<Math.min(count,3);i++){
    const [ex,ey,angle]=positions[i];ctx.save();ctx.translate(ex,ey);ctx.rotate(angle);
    ctx.fillStyle='#39261145';ctx.beginPath();ctx.ellipse(1,2,4.3,2.2,0,0,Math.PI*2);ctx.fill();
    const shell=ctx.createRadialGradient(-1.2,-2,.3,0,0,5.5);shell.addColorStop(0,'#efdfbc');shell.addColorStop(.55,i%2?'#d8bd90':'#e4cfaa');shell.addColorStop(1,'#a88658');
    ctx.fillStyle=shell;ctx.beginPath();ctx.moveTo(0,-5);ctx.bezierCurveTo(3.1,-5,4,0,3,2);ctx.bezierCurveTo(1.8,5,-2,5,-3,2);ctx.bezierCurveTo(-4,0,-2.7,-5,0,-5);ctx.fill();ctx.restore();
  }
  // A few foreground straw strands tuck the eggs into the nest.
  ctx.lineWidth=.8;
  for(let i=0;i<14;i++){
    const a=.12+i/13*(Math.PI-.24),px=Math.cos(a)*14,py=Math.sin(a)*4.8;
    ctx.strokeStyle=i%3?'#b38c43':'#c7a45c';ctx.beginPath();ctx.moveTo(px-2.3,py-.5);ctx.quadraticCurveTo(px,py-1.3,px+2.5,py+.3);ctx.stroke();
  }
  ctx.restore();
}
export function drawSwimmingFish(ctx,image,kind,x,y,width,turn,tilt,phase,reduced){
  const s=SOURCES[kind],height=width*(FISH_SIZES[kind]?.aspect||.49);ctx.save();screenPlane(ctx,x,y);
  ctx.globalAlpha*=.84;ctx.rotate(Math.max(-.22,Math.min(.22,tilt)));
  const facing=Math.max(0,Math.min(1,(turn+1)/2));
  const profile=(direction,opacity)=>{
  if(opacity<.01)return;
  ctx.save();ctx.globalAlpha*=opacity;ctx.scale(direction,1);
  // The body retains its volume; bending is strongest at the tail, not a whole-sprite pulse.
  for(let i=0;i<14;i++){const u=i/14,w=s[2]/14+1,dw=width/14+.5,bend=reduced?0:Math.sin(phase+u*4)*Math.pow(1-u,2)*2.4;
    ctx.drawImage(image,s[0]+u*s[2],s[1],Math.min(w,s[2]*(1-u)),s[3],-width/2+u*width,-height/2+bend,dw,height);}
  ctx.restore();
  };
  profile(-1,1-facing);profile(1,facing);
  ctx.restore();
}
export function chickenPeckFrame(time,phase=0,mode='eat',young=false){
  const rate=(young?.65:.9)*(mode==='drink'?.65:1);
  const beat=((time*rate+phase)%1+1)%1;
  // Quick dip, brief beak contact, then a slower lift to swallow.
  const dip=beat<.25?beat/.25:beat<.39?1:beat<.78?1-(beat-.39)/.39:0;
  return Math.max(0,Math.min(5,Math.round(dip*5)));
}
export function chickenMotionFrame(bird,young){
  if(Math.abs(bird.turn)<.98)return {atlas:'turn',column:Math.max(0,Math.min(4,Math.round((1-bird.turn)*2))),row:young?0:1,mirror:false};
  const front=!!bird.frontWalk;
  return {atlas:'walk',column:Math.floor(((bird.phase%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*4),row:(young?0:2)+(front?1:0),mirror:!front&&bird.turn<0};
}
const chickenFrameBounds=new WeakMap();
function registeredChickenFrame(image,columns,rows,column,row){
  if(typeof document==='undefined')return null;
  let frames=chickenFrameBounds.get(image);
  if(!frames){
    frames=[];
    const sw=image.naturalWidth/columns,sh=image.naturalHeight/rows;
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(sw);canvas.height=Math.ceil(sh);
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
    for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
      ctx.clearRect(0,0,w,h);ctx.drawImage(image,c*sw,r*sh,sw,sh,0,0,w,h);
      const data=ctx.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),stack=new Int32Array(w*h);let largest=null;
      for(let pixel=0;pixel<w*h;pixel++){
        if(seen[pixel]||data[pixel*4+3]<100)continue;
        let length=1,count=0,minX=w,minY=h,maxX=0,maxY=0;stack[0]=pixel;seen[pixel]=1;
        while(length){
          const p=stack[--length],x=p%w,y=Math.floor(p/w);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
          for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!seen[n]&&data[n*4+3]>=100){seen[n]=1;stack[length++]=n;}
        }
        if(!largest||count>largest.count)largest={count,minX,minY,maxX,maxY};
      }
      const b=largest||{minX:0,minY:0,maxX:w-1,maxY:h-1};
      const left=Math.max(0,b.minX-2),top=Math.max(0,b.minY-2),right=Math.min(w,b.maxX+3),bottom=Math.min(h,b.maxY+3);
      frames.push({x:c*sw+left/w*sw,y:r*sh+top/h*sh,w:(right-left)/w*sw,h:(bottom-top)/h*sh,offsetX:(left/w-.5)*sw});
    }
    chickenFrameBounds.set(image,frames);
  }
  return {bounds:frames[row*columns+column],standingHeight:frames[row*columns].h};
}
export function drawWalkingChicken(ctx,image,young,x,y,bird,time,reduced,motionArt){
  const size=young?28:42,row=young?0:1;
  const walking=bird.moving||!!bird.path?.length||(bird.speed||0)>1;
  const peck=!walking&&['eat','peck','drink'].includes(bird.mode);
  let source=image,columns=6,rows=2,column=peck&&!reduced?chickenPeckFrame(bird.peckTime??time,0,bird.mode,young):0,sourceRow=row,mirror=bird.turn<0;
  if(!reduced&&(walking||Math.abs(bird.turn)<.98)){
    const pose=chickenMotionFrame(bird,young),atlas=motionArt?.[pose.atlas];
    if(atlas?.naturalWidth){source=atlas;columns=pose.atlas==='turn'?5:4;rows=pose.atlas==='turn'?2:4;column=pose.column;sourceRow=pose.row;mirror=pose.mirror;}
  }
  ctx.save();screenPlane(ctx,x,y);
  ctx.fillStyle='#31231530';ctx.beginPath();ctx.ellipse(0,1,size*.23,young?1.3:2,0,0,Math.PI*2);ctx.fill();
  ctx.scale(mirror?-1:1,1);
  const sw=source.naturalWidth/columns,sh=source.naturalHeight/rows;
  // Full opaque frames carry the actual leg and body poses. Never split or stretch feet.
  const registered=registeredChickenFrame(source,columns,rows,column,sourceRow);
  if(registered){
    const b=registered.bounds,scale=(young?24:35)/registered.standingHeight;
    ctx.drawImage(source,b.x,b.y,b.w,b.h,-b.w*scale/2,-b.h*scale,b.w*scale,b.h*scale);
  }else ctx.drawImage(source,column*sw,sourceRow*sh,sw,sh,-size/2,-size*.94,size,size);
  ctx.restore();
}
