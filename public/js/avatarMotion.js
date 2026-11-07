import {ISO_X,ISO_Y} from './core/IsoProjection.js';
export function avatarPose(motion,moving,reduced=false){
 const blend=motion.walkBlend??(moving?1:0),distance=motion.walkDistance||0,phase=distance/18*Math.PI/2;
 return {
  frame:moving||blend>.22?Math.floor(distance/18)%4:1,
  bob:reduced?0:-Math.abs(Math.sin(phase))*1.1*blend-Math.sin((motion.visualClock||0)*1.7)*.18*(1-blend),
  sway:reduced?0:Math.sin(phase)*.4*blend,
  lean:reduced?0:(motion.visualLean||0)+Math.sin(phase*.5)*.006*blend,
  shadow:15+(reduced?0:Math.abs(Math.sin(phase))*1.5*blend)
 };
}
export function drawMovingAvatar(ctx,image,x,y,direction,moving,motion,reduced=false){
 if(!image?.naturalWidth)return;
 const pose=avatarPose(motion,moving,reduced),row={down:0,up:1,left:2,right:3}[direction]??0,w=image.naturalWidth/4,h=image.naturalHeight/4;
 ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
 ctx.fillStyle='#2430202b';ctx.beginPath();ctx.ellipse(0,1,pose.shadow,3.2,0,0,Math.PI*2);ctx.fill();
 ctx.translate(pose.sway,pose.bob);ctx.rotate(pose.lean);
 ctx.drawImage(image,pose.frame*w,row*h,w,h,-39,-86,78,86);ctx.restore();
}
