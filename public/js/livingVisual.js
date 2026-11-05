import {livingLayout} from './shared/livingLayout.js';

const sourceHalf=(image,right)=>[right?image.naturalWidth/2:0,0,image.naturalWidth/2,image.naturalHeight];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};

// Visual motion is local and deterministic per server entity id. No animal positions are sent over the socket.
export class LivingFarmVisual {
  constructor(){this.event=null;}
  onAction(intent,result,before){if(result.replayed)return;this.event={kind:intent.action,entityId:intent.entityId||null,at:performance.now(),fishId:before?.pond?.fish.find(f=>f.id===intent.entityId)?.fishId||null,eggs:before?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0};}
  layout(phase5){return livingLayout(phase5?.buildings,phase5?.decorations);}
  active(kind){return this.event?.kind===kind&&performance.now()-this.event.at<2200;}
  pondLayer(ctx,art,upright,layout){const large=layout.pond.w>300,cx=large?1095:1150;return {y:1935,draw:()=>upright(ctx,cx,large?800:785,art.livingPond||art.pond,large?480:335,large?260:223)};}
  fishLayers(ctx,art,upright,vac,layout,reduced){const fish=vac?.pond?.fish||[],time=reduced?0:performance.now()/1000,large=layout.pond.w>300,rx=large?82:62,ry=large?24:20,cx=large?970:1050;
    return fish.map(row=>{const phase=time*(.52+(row.id%3)*.09)+row.id*2.399,drift=.72+.19*Math.sin(row.id*5.7),feed=this.active('feed_fish')&&row.id===this.event.entityId?smooth((performance.now()-this.event.at)/950):0;
      const x=cx+Math.cos(phase)*rx*drift*(1-feed)+feed*10,y=(large?630:665)+Math.sin(phase)*ry*drift*(1-feed)+feed*2;
      return {y:2050+row.id,draw:()=>{if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth)return;ctx.save();ctx.globalAlpha=.9;const image=row.fishId==='tilapia'?art.livingAnimals:art.animals,source=row.fishId==='tilapia'?sourceHalf(image,true):[image.naturalWidth/2,0,image.naturalWidth/2,image.naturalHeight],size=35+25*row.progress;upright(ctx,x,y,image,size,size*.59,source,Math.cos(phase)<0);ctx.restore();if(row.remainingMs===0){ctx.save();ctx.fillStyle='#fff2c9';ctx.beginPath();ctx.arc(x+15,y-10,3,0,7);ctx.fill();ctx.restore();}}};});
  }
  chickenLayers(ctx,art,upright,vac,layout,reduced,player){const yard=layout.yard,rows=vac?.coop?.chickens||[];if(!yard||!rows.length)return [];
    const time=reduced?0:performance.now()/1000;
    return rows.map(row=>{const phase=(time*.32+row.id*.83)%4,walk=phase<2.4,peck=phase>=2.4&&phase<3.15,inside=phase>=3.15;
      let x=yard.x+yard.w*.6+Math.cos(time*.9+row.id*2.2)*yard.w*.18,y=yard.y-180+Math.sin(time*.65+row.id*1.9)*yard.h*.12;
      if(inside){x=yard.x+yard.w*.48;y=yard.y-205;}
      if(this.active('feed_chicken')&&row.id===this.event.entityId){const f=smooth((performance.now()-this.event.at)/900);x=x*(1-f)+(yard.x+68)*f;y=y*(1-f)+(yard.y-177)*f;}
      if(player&&Math.hypot(player.x-x,player.y-y)<22)x+=player.x<x?18:-18;
      x=clamp(x,yard.x+23,yard.x+yard.w-23);y=clamp(y,yard.y-210,yard.y-140);
      return {y:1850+row.id,draw:()=>{if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth)return;const young=row.status==='GROWING',image=young?art.livingAnimals:art.animals,source=young?sourceHalf(image,false):[0,0,image.naturalWidth/2,image.naturalHeight],size=young?43:56,bob=(peck||this.active('feed_chicken')&&row.id===this.event.entityId)?Math.abs(Math.sin(time*12))*4:walk?Math.sin(time*9+row.id)*1.4:0;ctx.save();if(inside)ctx.globalAlpha=.77;upright(ctx,x,y+bob,image,size,size*1.05,source,Math.cos(time+row.id)<0);ctx.restore();}};
    });
  }
  effectLayers(ctx,art,upright,vac,layout){const event=this.event;if(!event)return [];const elapsed=(performance.now()-event.at)/1000;if(elapsed>2.2)return [];
    const pond=['stock_fish','feed_fish','harvest_fish'].includes(event.kind),x=pond?(layout.pond.w>300?970:1050):layout.yard?layout.yard.x+layout.yard.w*.6:1165,y=pond?(layout.pond.w>300?630:665):layout.yard?layout.yard.y-180:320;
    return [{y:2500,draw:()=>{ctx.save();ctx.globalAlpha=1-elapsed/2.2;ctx.lineWidth=2;ctx.strokeStyle=pond?'#d4f4e7':'#f8d989';for(let i=0;i<(pond?3:2);i++){ctx.beginPath();ctx.ellipse(x,y,8+elapsed*25+i*11,3+elapsed*9+i*4,0,0,7);ctx.stroke();}
      if(event.kind==='feed_fish'||event.kind==='feed_chicken'){ctx.fillStyle=pond?'#e6cf83':'#e9c369';for(let i=0;i<9;i++){const scatter=(i*19)%37-18,drop=Math.min(1,elapsed*2+i*.035);ctx.beginPath();ctx.arc(x+scatter,y-35+drop*(28+(i%3)*5),pond?2.1:2.7,0,7);ctx.fill();}}
      if(event.kind==='harvest_fish'&&art.livingAnimals?.naturalWidth){const image=event.fishId==='tilapia'?art.livingAnimals:art.animals;upright(ctx,x,y-elapsed*45,image,48,28,sourceHalf(image,true));}
      if(event.kind==='collect_eggs'&&event.eggs){ctx.fillStyle='#fff1cf';for(let i=0;i<Math.min(3,event.eggs);i++){ctx.beginPath();ctx.ellipse(x+i*14-14,y-12-elapsed*20,5,7,0,0,7);ctx.fill();}}ctx.restore();}}];
  }
  eggLayer(ctx,vac,layout){const eggs=vac?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0;if(!eggs||!layout.yard)return null;return {y:1900,draw:()=>{ctx.save();ctx.fillStyle='#fff0cb';ctx.strokeStyle='#a47c4a';for(let i=0;i<Math.min(eggs,3);i++){const x=1200+i*10,y=340-i%2*3;ctx.beginPath();ctx.ellipse(x,y,7,9,0,0,7);ctx.fill();ctx.stroke();}ctx.restore();}};}
}
