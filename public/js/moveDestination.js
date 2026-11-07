import {ISO_X,ISO_Y} from './core/IsoProjection.js';

export class MoveDestination {
 constructor(){this.point=null;this.scene=null;this.started=0;this.ended=null;}
 update(target,scene,now){
  if(scene!==this.scene){this.point=null;this.scene=scene;}
  if(target){
   if(!this.point||target.x!==this.point.x||target.y!==this.point.y||this.ended!==null){
    this.point={x:target.x,y:target.y};this.started=now;
   }
   this.ended=null;
  }else if(this.point&&this.ended===null)this.ended=now;
  if(this.ended!==null&&now-this.ended>=350)this.point=null;
 }
 draw(ctx,target,scene,reduced=false,now=performance.now()){
  this.update(target,scene,now);if(!this.point)return;
  const age=(now-this.started)/1000,fade=this.ended===null?1:Math.max(0,1-(now-this.ended)/350);
  const pulse=reduced?0:(1+Math.sin(age*5))/2,r=15+pulse*2;
  ctx.save();ctx.translate(this.point.x,this.point.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  ctx.globalAlpha=fade;
  ctx.fillStyle='#ffe9a82b';ctx.beginPath();ctx.ellipse(0,0,r, r*.46,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#4f583abd';ctx.lineWidth=4;ctx.stroke();
  ctx.strokeStyle='#ffe7a0';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#fff7d5';ctx.beginPath();ctx.ellipse(0,0,2.7,1.5,0,0,Math.PI*2);ctx.fill();
  // A brief outward ripple acknowledges the tap immediately.
  if(!reduced&&age<.45){const t=age/.45;ctx.globalAlpha=fade*(1-t)*.65;ctx.strokeStyle='#fff2c3';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,17+t*14,8+t*6,0,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
 }
}
