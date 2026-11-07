import {ISO_X,ISO_Y} from './core/IsoProjection.js';
export const HOE_DURATION_MS=1100;
export function hoeFrame(age){
 const t=age/HOE_DURATION_MS;
 return t<.1?0:t<.23?1:t<.4?2:t<.52?3:t<.66?4:t<.82?5:t<.92?1:0;
}
export function drawHoeActor(ctx,image,x,y,age,mirror=false){
 if(!image?.naturalWidth)return;
 const frame=hoeFrame(age),w=image.naturalWidth/3,h=image.naturalHeight/2;
 ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
 if(mirror)ctx.scale(-1,1);
 ctx.drawImage(image,frame%3*w,Math.floor(frame/3)*h,w,h,-42,-84*.94,84,84);ctx.restore();
}
export function drawHoeImpact(ctx,point,age){
 const t=(age-HOE_DURATION_MS*.52)/1000;if(t<0||t>.43)return;
 ctx.save();ctx.translate(point.x,point.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
 for(let i=0;i<8;i++){
  const direction=(i-3.5)/3.5,x=direction*t*(19+i%3*8),y=-Math.sin(t/.43*Math.PI)*(4+i%3*2)+t*3;
  ctx.globalAlpha=Math.max(0,1-t/.43);ctx.fillStyle=i%2?'#9c7446':'#604329';ctx.beginPath();ctx.ellipse(x,y,1.3+i%2*.6,.8,i*.7,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
