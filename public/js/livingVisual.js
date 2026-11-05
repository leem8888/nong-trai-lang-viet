import {livingLayout,pondObstacles} from './shared/livingLayout.js';
import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {findPath} from './systems/Pathfinding.js';
import {overlaps} from './systems/CollisionSystem.js';

const sourceHalf=(image,right)=>[right?image.naturalWidth/2:0,0,image.naturalWidth/2,image.naturalHeight];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
const random=(id,n)=>{const v=Math.sin(id*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
export function fishMotion(id,time,pond){
  const period=5+random(id,1)*5,t=time/period+random(id,2)*10,index=Math.floor(t),blend=smooth(t-index);
  const destination=n=>{const a=random(id,n*2+10)*Math.PI*2,r=.2+random(id,n*2+11)*.62;return {x:Math.cos(a)*r,y:Math.sin(a)*r};};
  const a=destination(index),b=destination(index+1),[o]=pondObstacles(pond);
  const sx=(a.x+(b.x-a.x)*blend)*o.rx*.78,sy=(a.y+(b.y-a.y)*blend)*o.ry*.68;
  return {x:o.x+12+(sx/ISO_X+sy/ISO_Y)/2,y:o.y+12+(sy/ISO_Y-sx/ISO_X)/2};
}

// Visual motion is local and deterministic per server entity id. No animal positions are sent over the socket.
export class LivingFarmVisual {
  constructor(){this.event=null;this.hits=[];this.releases=new Map();this.chickenMotion=new Map();}
  animalAt(point){return this.hits.filter(p=>Math.hypot((point.x-p.x)-(point.y-p.y),((point.x-p.x)+(point.y-p.y))*.5)<36).sort((a,b)=>Math.hypot(point.x-a.x,point.y-a.y)-Math.hypot(point.x-b.x,point.y-b.y))[0];}
  onAction(intent,result,before,player,layout){if(result.replayed)return;this.event={kind:intent.action,entityId:intent.entityId||null,at:performance.now(),fishId:before?.pond?.fish.find(f=>f.id===intent.entityId)?.fishId||null,eggs:before?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0};
    if(intent.action==='feed_chicken'){const bird=this.chickenMotion.get(intent.entityId);if(bird)bird.next=0;}
    if(intent.action==='stock_fish'&&player&&layout){
      const known=new Set(before?.pond?.fish.map(f=>f.id)||[]),[o]=pondObstacles(layout.pond);
      const sx=((player.x-o.x)-(player.y-o.y))*ISO_X,sy=((player.x-o.x)+(player.y-o.y))*ISO_Y;
      const norm=Math.hypot(sx/o.rx,sy/o.ry)||1,dx=sx/norm*.87,dy=sy/norm*.87;
      let index=0;for(const fish of result.state.pond.fish)if(!known.has(fish.id))this.releases.set(fish.id,{at:performance.now()+index++*280,x:o.x+12+(dx/ISO_X+dy/ISO_Y)/2,y:o.y+12+(dy/ISO_Y-dx/ISO_X)/2});
    }
  }
  layout(phase5){return livingLayout(phase5?.buildings,phase5?.decorations);}
  active(kind){return this.event?.kind===kind&&performance.now()-this.event.at<2200;}
  pondLayer(ctx,art,upright,layout){const large=layout.pond.w>300,cx=large?1195:1250;return {y:1935,draw:()=>upright(ctx,cx,large?720:705,art.livingPond||art.pond,large?480:335,large?260:223)};}
  fishLayers(ctx,art,upright,vac,layout,reduced){const fish=vac?.pond?.fish||[],time=reduced?0:performance.now()/1000;
    const activeIds=new Set(fish.map(f=>f.id));for(const id of this.releases.keys())if(!activeIds.has(id))this.releases.delete(id);
    return fish.map(row=>{
      const normal=fishMotion(row.id,time,layout.pond),ahead=fishMotion(row.id,time+.12,layout.pond),release=this.releases.get(row.id);
      const age=release?(performance.now()-release.at)/1000:10,enter=reduced?1:smooth(age/3.6);
      if(release&&age>4.5)this.releases.delete(row.id);
      let x=normal.x,y=normal.y;
      if(release&&!reduced){x=release.x+(x-release.x)*enter;y=release.y+(y-release.y)*enter;}
      const vx=release&&enter<1?normal.x-release.x:ahead.x-normal.x,vy=release&&enter<1?normal.y-release.y:ahead.y-normal.y;
      const speed=Math.hypot(ahead.x-normal.x,ahead.y-normal.y)/.12;
      const tail=reduced?0:Math.sin(time*(5+Math.min(speed,20)*.3)+row.id*2.1),mirror=vx-vy<0;
      this.hits.push({kind:'pond',entityId:row.id,x:x-10,y:y-10});
      return {y:2050+row.id,draw:()=>{if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth||age<0)return;
        ctx.save();ctx.globalAlpha=.78+(reduced?0:.1*Math.sin(time*.7+row.id));
        const image=row.fishId==='tilapia'?art.livingAnimals:art.animals,source=row.fishId==='tilapia'?sourceHalf(image,true):[image.naturalWidth/2,0,image.naturalWidth/2,image.naturalHeight],size=35+25*row.progress;
        upright(ctx,x,y,image,size*(1+tail*.045),size*(.59+tail*.015),source,mirror);ctx.restore();
        if(!reduced){
          ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
          ctx.lineWidth=.8;ctx.strokeStyle='#c5efe58a';
          for(let i=0;i<2;i++){const phase=(time*.7+row.id*.37+i*.5)%1;ctx.globalAlpha=(1-phase)*.35;ctx.beginPath();ctx.ellipse((mirror?1:-1)*(size*.25+phase*12),-size*.25,4+phase*9,1.5+phase*3,0,0,Math.PI*2);ctx.stroke();}
          ctx.restore();
          if(release&&age>=0&&age<1.8){ctx.save();ctx.translate(release.x,release.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.globalAlpha=(1-age/1.8)*.8;ctx.strokeStyle='#d4f7ec';ctx.lineWidth=1.2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,-8,5+age*18+i*4,2+age*7+i*2,0,0,Math.PI*2);ctx.stroke();}for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillStyle='#d9fbf0';ctx.beginPath();ctx.arc(Math.cos(a)*age*20,-8-Math.sin(age/1.8*Math.PI)*14+Math.sin(a)*age*7,1.4,0,Math.PI*2);ctx.fill();}ctx.restore();}
        }
        if(row.remainingMs===0){ctx.save();ctx.fillStyle='#fff2c9';ctx.beginPath();ctx.arc(x+15,y-10,3,0,7);ctx.fill();ctx.restore();}
      }};});
  }
  chickenLayers(ctx,art,upright,vac,layout,reduced,player){const yard=layout.yard,rows=vac?.coop?.chickens||[];if(!yard||!rows.length)return [];
    const time=reduced?0:performance.now()/1000;
    const bounds={x:yard.x+15,y:yard.y-170,w:yard.w-30,h:110};
    const feeder={x:yard.x+70,y:yard.y-130,w:38,h:23},water={x:yard.x+yard.w-69,y:yard.y-150,w:36,h:30};
    const collision={world:{width:1740,height:1024},blocked:(x,y)=>x<bounds.x||x>bounds.x+bounds.w||y<bounds.y||y>bounds.y+bounds.h||[feeder,water].some(o=>overlaps(x,y,9,o))};
    const alive=new Set(rows.map(r=>r.id));for(const id of this.chickenMotion.keys())if(!alive.has(id))this.chickenMotion.delete(id);
    return rows.map(row=>{
      let motion=this.chickenMotion.get(row.id);
      if(!motion||motion.yard!==yard.x){motion={x:bounds.x+20+row.id%3*22,y:bounds.y+bounds.h-16,at:time,next:0,path:[],mode:'walk',yard:yard.x,mirror:false};this.chickenMotion.set(row.id,motion);}
      const dt=clamp(time-motion.at,0,.08);motion.at=time;
      if(!reduced&&time>=motion.next){
        const cycle=Math.floor(time/7+row.id*1.7)%6;
        motion.mode=this.active('feed_chicken')&&row.id===this.event.entityId?'eat':['walk','eat','walk','drink','walk','roost'][cycle];
        let goal=motion.mode==='eat'?{x:feeder.x+feeder.w/2,y:feeder.y+feeder.h+15}:motion.mode==='drink'?{x:water.x-16,y:water.y+water.h/2}:motion.mode==='roost'?{x:bounds.x+14,y:bounds.y+12}:{x:bounds.x+random(row.id,Math.floor(time/7)+30)*(bounds.w-20)+10,y:bounds.y+random(row.id,Math.floor(time/7)+50)*(bounds.h-20)+10};
        if(!collision.blocked(goal.x,goal.y))motion.path=findPath(collision,motion,goal,10)||[];
        motion.next=time+6+random(row.id,cycle+80)*3;
      }
      let moving=false;
      if(!reduced&&motion.path.length){const target=motion.path[0],dx=target.x-motion.x,dy=target.y-motion.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*22);if(d<.5)motion.path.shift();else{const nx=motion.x+dx/d*step,ny=motion.y+dy/d*step;if(!collision.blocked(nx,ny)){motion.x=nx;motion.y=ny;motion.mirror=dx-dy<0;moving=true;}else motion.path=[];}}
      const settled=!motion.path.length,climbing=motion.mode==='roost'&&settled;
      let x=motion.x,y=motion.y;
      this.hits.push({kind:'coop',entityId:row.id,x:x-22,y:y-22});
      return {y:1850+row.id,draw:()=>{if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth)return;const young=row.status==='GROWING',image=young?art.livingAnimals:art.animals,source=young?sourceHalf(image,false):[0,0,image.naturalWidth/2,image.naturalHeight],size=young?38:49,bob=reduced?0:moving?Math.sin(time*12+row.id)*1.8:settled&&['eat','drink'].includes(motion.mode)?Math.abs(Math.sin(time*7+row.id))*4:0;ctx.save();upright(ctx,x-(climbing?8:0),y+bob-(climbing?8:0),image,size,size*(motion.mode==='drink'&&settled?.96:1.05),source,motion.mirror);ctx.restore();
        if(!reduced&&settled&&['eat','drink'].includes(motion.mode)){ctx.save();ctx.fillStyle=motion.mode==='drink'?'#a9e2df':'#e3c780';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+7+i*3,y-7+Math.sin(time*6+i)*2,1.2,0,7);ctx.fill();}ctx.restore();}
      }};
    });
  }
  effectLayers(ctx,art,upright,vac,layout){const event=this.event;if(!event)return [];const elapsed=(performance.now()-event.at)/1000;if(elapsed>2.2)return [];
    const pond=['stock_fish','feed_fish','harvest_fish'].includes(event.kind),x=pond?(layout.pond.w>300?970:1050):layout.yard?layout.yard.x+layout.yard.w*.6:1165,y=pond?(layout.pond.w>300?630:665):layout.yard?layout.yard.y-180:180;
    return [{y:2500,draw:()=>{ctx.save();ctx.globalAlpha=1-elapsed/2.2;ctx.lineWidth=2;ctx.strokeStyle=pond?'#d4f4e7':'#f8d989';for(let i=0;i<(pond?3:2);i++){ctx.beginPath();ctx.ellipse(x,y,8+elapsed*25+i*11,3+elapsed*9+i*4,0,0,7);ctx.stroke();}
      if(event.kind==='feed_fish'||event.kind==='feed_chicken'){ctx.fillStyle=pond?'#e6cf83':'#e9c369';for(let i=0;i<9;i++){const scatter=(i*19)%37-18,drop=Math.min(1,elapsed*2+i*.035);ctx.beginPath();ctx.arc(x+scatter,y-35+drop*(28+(i%3)*5),pond?2.1:2.7,0,7);ctx.fill();}}
      if(event.kind==='harvest_fish'&&art.livingAnimals?.naturalWidth){const image=event.fishId==='tilapia'?art.livingAnimals:art.animals;upright(ctx,x,y-elapsed*45,image,48,28,sourceHalf(image,true));}
      if(event.kind==='collect_eggs'&&event.eggs){ctx.fillStyle='#fff1cf';for(let i=0;i<Math.min(3,event.eggs);i++){ctx.beginPath();ctx.ellipse(x+i*14-14,y-12-elapsed*20,5,7,0,0,7);ctx.fill();}}ctx.restore();}}];
  }
  eggLayer(ctx,vac,layout){const eggs=vac?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0;if(!eggs||!layout.yard)return null;return {y:1900,draw:()=>{ctx.save();ctx.fillStyle='#fff0cb';ctx.strokeStyle='#a47c4a';for(let i=0;i<Math.min(eggs,3);i++){const x=1230+i*10,y=95-i%2*3;ctx.beginPath();ctx.ellipse(x,y,7,9,0,0,7);ctx.fill();ctx.stroke();}ctx.restore();}};}
}
