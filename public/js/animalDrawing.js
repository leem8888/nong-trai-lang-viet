import {ISO_X,ISO_Y} from './core/IsoProjection.js';
// Tight source rectangles exclude the transparent atlas gutters around each animal.
const SOURCES={chick:[195,120,495,625],chicken:[76,63,658,770],tilapia:[927,222,772,438],carp:[934,230,788,439]};
function screenPlane(ctx,x,y){ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);}
export function drawSwimmingFish(ctx,image,kind,x,y,width,turn,tilt,phase,reduced){
  const s=SOURCES[kind],height=width*.49;ctx.save();screenPlane(ctx,x,y);
  ctx.globalAlpha*=.84;ctx.rotate(tilt);ctx.scale(turn,1);
  // The body retains its volume; bending is strongest at the tail, not a whole-sprite pulse.
  for(let i=0;i<14;i++){const u=i/14,w=s[2]/14+1,dw=width/14+.5,bend=reduced?0:Math.sin(phase+u*4)*Math.pow(1-u,2)*2.4;
    ctx.drawImage(image,s[0]+u*s[2],s[1],Math.min(w,s[2]*(1-u)),s[3],-width/2+u*width,-height/2+bend,dw,height);}
  ctx.restore();
}
export function drawWalkingChicken(ctx,image,young,x,y,bird,time,reduced){
  const s=SOURCES[young?'chick':'chicken'],width=young?23:29,height=young?29:35;
  const peck=!bird.moving&&['eat','peck','drink'].includes(bird.mode),cycle=(Math.sin(time*(bird.mode==='drink'?4:7)+bird.phase)+1)/2;
  const nod=!reduced&&peck?Math.pow(cycle,5)*3:0,bob=reduced?0:bird.moving?Math.sin(bird.phase*2)*.65:Math.sin(time*2+bird.phase)*.18;
  ctx.save();screenPlane(ctx,x,y);
  ctx.fillStyle='#31231538';ctx.beginPath();ctx.ellipse(0,1,width*.35,2.4,0,0,Math.PI*2);ctx.fill();
  ctx.scale(bird.turn,1);ctx.rotate(reduced?0:peck?nod*.025:bird.moving?Math.sin(bird.phase)*.025:0);
  // Upper head and body move subtly while the two leg regions alternate their stride.
  const split=.79,head=.34;
  ctx.drawImage(image,s[0],s[1],s[2],s[3]*head,-width/2,-height+bob+nod,width,height*head);
  ctx.drawImage(image,s[0],s[1]+s[3]*head,s[2],s[3]*(split-head),-width/2,-height+height*head+bob,width,height*(split-head));
  for(let i=0;i<2;i++){const lift=!reduced&&bird.moving?Math.max(0,Math.sin(bird.phase+i*Math.PI))*1.6:0;
    ctx.drawImage(image,s[0]+s[2]*i/2,s[1]+s[3]*split,s[2]/2,s[3]*(1-split),-width/2+width*i/2,-height*(1-split)-lift,width/2,height*(1-split));}
  ctx.restore();
}
