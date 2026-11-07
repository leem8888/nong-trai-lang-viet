import {ISO_X,ISO_Y} from './core/IsoProjection.js';
export const SOIL_DURATIONS={till:1100,plant:1200,water:1500,harvest:1300};
export function soilFrame(kind,age){
 const t=age/SOIL_DURATIONS[kind];
 if(kind==='water')return t<.12?0:t<.25?1:t<.38?2:t<.62?3:t<.8?4:t<.93?5:0;
 return t<.12?0:t<.26?1:t<.4?2:t<.55?3:t<.77?4:t<.93?5:0;
}
export function drawSoilActor(ctx,image,kind,x,y,age,mirror){
 if(!image?.naturalWidth)return;
 const frame=soilFrame(kind,age),w=image.naturalWidth/3,h=image.naturalHeight/2;
 ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);if(mirror)ctx.scale(-1,1);
 ctx.drawImage(image,frame%3*w,Math.floor(frame/3)*h,w,h,-42,-84*.94,84,84);ctx.restore();
}
export function drawSoilParticles(ctx,action,player,age,reduced){
 if(!action.point||reduced||!['plant','water'].includes(action.kind))return;
 const duration=SOIL_DURATIONS[action.kind],progress=age/duration,start=action.kind==='water'?.38:.55;if(progress<start||progress>.82)return;
 const p=action.point,side=((p.x-player.x)-(p.y-player.y))>0?1:-1;
 const dx=((player.x-p.x)-(player.y-p.y))*ISO_X,dy=((player.x-p.x)+(player.y-p.y))*ISO_Y;
 const water=action.kind==='water',startX=dx+side*22,startY=dy-(water?24:29);
 ctx.save();ctx.translate(p.x,p.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
 for(let i=0;i<(water?15:9);i++){
  const t=((progress-start)*(water?5:3)+i*.071)%1;
  const endX=Math.sin(i*2.4)*(water?7:10),endY=Math.cos(i*1.7)*3;
  const x=startX*(1-t)+endX*t,y=startY*(1-t)+endY*t+(water?0:-Math.sin(t*Math.PI)*4);
  ctx.fillStyle=water?(i%2?'#9fced3b0':'#d3ece5bd'):(i%2?'#caaa65':'#e2c98a');ctx.beginPath();ctx.ellipse(x,y,water?.7:1,water?1.4:.65,-.2,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
