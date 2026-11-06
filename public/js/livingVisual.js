import {coopGeometry,coopToWorld,updateChicken} from './animalMotion.js';
import {drawSwimmingFish,drawWalkingChicken} from './animalDrawing.js';
import {livingLayout,pondObstacles} from './shared/livingLayout.js';
import {ISO_X,ISO_Y} from './core/IsoProjection.js';

// Pond water and fish stay below actors sorted by their world-space feet.
const POND_GROUND_DEPTH=-10000;
const sourceHalf=(image,right)=>[right?image.naturalWidth/2:0,0,image.naturalWidth/2,image.naturalHeight];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
const random=(id,n)=>{const v=Math.sin(id*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
export function coopNestPoint(yard){const g=coopGeometry(yard);return g?coopToWorld(g,{x:g.width*.12,y:g.height*.62}):null;}
export function fishMotion(id,time,pond){
  const period=6+random(id,1)*5,t=time/period+random(id,2)*19,index=Math.floor(t),u=t-index;
  const territory=id*2.3999632297,radius=.28+random(id,6)*.10;
  const point=n=>{const a=random(id,n*2+10)*Math.PI*2,r=.18+random(id,n*2+11)*.32;return {x:Math.cos(territory)*radius+Math.cos(a)*r,y:Math.sin(territory)*radius+Math.sin(a)*r};};
  // Cubic B-splines have continuous speed and curvature and stay inside their control polygon.
  const weights=[(1-u)**3/6,(3*u**3-6*u*u+4)/6,(-3*u**3+3*u*u+3*u+1)/6,u**3/6];
  let sx=0,sy=0;for(let i=0;i<4;i++){const p=point(index+i);sx+=p.x*weights[i];sy+=p.y*weights[i];}
  const [o]=pondObstacles(pond);sx*=o.rx*.84;sy*=o.ry*.72;
  return {x:o.x+12+(sx/ISO_X+sy/ISO_Y)/2,y:o.y+12+(sy/ISO_Y-sx/ISO_X)/2};
}

// Visual motion is local and deterministic per server entity id. No animal positions are sent over the socket.
export class LivingFarmVisual {
  constructor(){this.event=null;this.hits=[];this.releases=new Map();this.chickenMotion=new Map();this.fishHeadings=new Map();}
  animalAt(point){return this.hits.filter(p=>Math.hypot((point.x-p.x)-(point.y-p.y),((point.x-p.x)+(point.y-p.y))*.5)<36).sort((a,b)=>Math.hypot(point.x-a.x,point.y-a.y)-Math.hypot(point.x-b.x,point.y-b.y))[0];}
  onAction(intent,result,before,player,layout){if(result.replayed)return;this.event={kind:intent.action,entityId:intent.entityId||null,at:performance.now(),fishId:before?.pond?.fish.find(f=>f.id===intent.entityId)?.fishId||null,eggs:before?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0};
    if(intent.action==='feed_fish'&&layout?.pond){const [o]=pondObstacles(layout.pond);this.event.food={x:o.x+12,y:o.y+12};}
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
  pondLayer(ctx,art,upright,layout){const large=layout.pond.w>300,cx=large?1195:1250;// Water and its painted rim are ground, not a foreground occluder.
    return {y:POND_GROUND_DEPTH,draw:()=>upright(ctx,cx,large?720:705,art.livingPond||art.pond,large?480:335,large?260:223)};}
  fishLayers(ctx,art,upright,vac,layout,reduced){const fish=vac?.pond?.fish||[],time=reduced?0:performance.now()/1000;
    const activeIds=new Set(fish.map(f=>f.id));for(const id of this.releases.keys())if(!activeIds.has(id))this.releases.delete(id);
    for(const id of this.fishHeadings.keys())if(!activeIds.has(id))this.fishHeadings.delete(id);
    return fish.map(row=>{
      const normal=fishMotion(row.id,time,layout.pond),ahead=fishMotion(row.id,time+.12,layout.pond),release=this.releases.get(row.id);
      const age=release?(performance.now()-release.at)/1000:10,enter=reduced?1:smooth(age/3.6);
      if(release&&age>4.5)this.releases.delete(row.id);
      let x=normal.x,y=normal.y;
      if(release&&!reduced){x=release.x+(x-release.x)*enter;y=release.y+(y-release.y)*enter;}
      if(!reduced&&this.active('feed_fish')&&this.event.food){const age=(performance.now()-this.event.at)/1000,blend=smooth(age/.7)*(1-smooth((age-1.3)/.9))*.65;x+=(this.event.food.x-x)*blend;y+=(this.event.food.y-y)*blend;}
      const vx=release&&enter<1?normal.x-release.x:ahead.x-normal.x,vy=release&&enter<1?normal.y-release.y:ahead.y-normal.y;
      const speed=Math.hypot(ahead.x-normal.x,ahead.y-normal.y)/.12;
      const tailPhase=time*(4+Math.min(speed,20)*.16)+row.id*2.1;
      const dx=(vx-vy)*ISO_X,dy=(vx+vy)*ISO_Y;
      let heading=this.fishHeadings.get(row.id);if(!heading){heading={turn:dx<0?-1:1,tilt:0,at:time};this.fishHeadings.set(row.id,heading);}
      const dt=clamp(time-heading.at,0,.1);heading.at=time;
      const direction=Math.abs(dx)>.025?(dx<0?-1:1):Math.sign(heading.turn)||1;
      heading.turn+=(direction-heading.turn)*(1-Math.exp(-dt*6));
      const targetTilt=clamp(Math.atan2(dy,Math.abs(dx)||.001)*direction*.38,-.48,.48);
      heading.tilt+=(targetTilt-heading.tilt)*(1-Math.exp(-dt*3));
      const mirror=heading.turn<0;
      this.hits.push({kind:'pond',entityId:row.id,x,y});
      return {y:POND_GROUND_DEPTH+1,draw:()=>{if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth||age<0)return;
        ctx.save();
        const harvestable=row.remainingMs===0||row.progress>=1;
        // Mature fish stay bright even with reduced effects; young fish remain below the water tint.
        ctx.globalAlpha=harvestable?1:.72+(reduced?0:.06*Math.sin(time*.7+row.id));
        ctx.filter=harvestable?'brightness(1.55) saturate(1.35) contrast(1.08)':'none';
        const image=row.fishId==='tilapia'?art.livingAnimals:art.animals,size=22+10*row.progress;
        drawSwimmingFish(ctx,image,row.fishId,x,y,size,heading.turn,heading.tilt,tailPhase,reduced);ctx.restore();
        if(!reduced){
          ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
          ctx.lineWidth=.8;ctx.strokeStyle='#c5efe58a';
          for(let i=0;i<2;i++){const phase=(time*.35+row.id*.37+i*.5)%1;ctx.globalAlpha=(1-phase)*.10;ctx.beginPath();ctx.ellipse((mirror?1:-1)*(size*.25+phase*12),-size*.25,4+phase*9,1.5+phase*3,0,0,Math.PI*2);ctx.stroke();}
          ctx.restore();
          if(release&&age>=0&&age<1.8){ctx.save();ctx.translate(release.x,release.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.globalAlpha=(1-age/1.8)*.8;ctx.strokeStyle='#d4f7ec';ctx.lineWidth=1.2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,-8,5+age*18+i*4,2+age*7+i*2,0,0,Math.PI*2);ctx.stroke();}for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillStyle='#d9fbf0';ctx.beginPath();ctx.arc(Math.cos(a)*age*20,-8-Math.sin(age/1.8*Math.PI)*14+Math.sin(a)*age*7,1.4,0,Math.PI*2);ctx.fill();}ctx.restore();}
        }
        if(row.remainingMs===0){ctx.save();ctx.fillStyle='#fff2c9';ctx.beginPath();ctx.arc(x+15,y-10,3,0,7);ctx.fill();ctx.restore();}
      }};});
  }
  chickenLayers(ctx,art,upright,vac,layout,reduced,player){
    const rows=vac?.coop?.chickens||[],g=coopGeometry(layout.yard);
    const alive=new Set(rows.map(r=>r.id));for(const id of this.chickenMotion.keys())if(!alive.has(id))this.chickenMotion.delete(id);
    if(!g||!rows.length)return [];
    const time=performance.now()/1000;
    // Update in id order so overlap avoidance does not depend on API response ordering.
    return [...rows].sort((a,b)=>a.id-b.id).map(row=>{
      const others=[...this.chickenMotion.entries()].filter(([id])=>id!==row.id).map(([,b])=>b);
      const bird=updateChicken(this.chickenMotion.get(row.id),row.id,time,g,others,this.active('feed_chicken')&&row.id===this.event.entityId,reduced);
      this.chickenMotion.set(row.id,bird);
      this.hits.push({kind:'coop',entityId:row.id,x:bird.x-10/(2*ISO_Y),y:bird.y-10/(2*ISO_Y)});
      return {y:1850+bird.sy*.01,draw:()=>{
        if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth)return;
        const young=row.status==='GROWING',image=young?art.livingAnimals:art.animals;
        drawWalkingChicken(ctx,image,young,bird.x,bird.y,bird,time,reduced);
      }};
    });
  }
  effectLayers(ctx,art,upright,vac,layout){const event=this.event;if(!event)return [];const elapsed=(performance.now()-event.at)/1000;if(elapsed>2.2)return [];
    const pond=['stock_fish','feed_fish','harvest_fish'].includes(event.kind),nest=event.kind==='collect_eggs'?coopNestPoint(layout.yard):null,x=event.food?.x??nest?.x??(pond?(layout.pond.w>300?970:1050):layout.yard?layout.yard.x+layout.yard.w*.6:1165),y=event.food?.y??nest?.y??(pond?(layout.pond.w>300?630:665):layout.yard?layout.yard.y-180:180);
    return [{y:2500,draw:()=>{ctx.save();ctx.globalAlpha=1-elapsed/2.2;ctx.lineWidth=2;ctx.strokeStyle=pond?'#d4f4e7':'#f8d989';for(let i=0;i<(pond?3:2);i++){ctx.beginPath();ctx.ellipse(x,y,8+elapsed*25+i*11,3+elapsed*9+i*4,0,0,7);ctx.stroke();}
      if(event.kind==='feed_fish'||event.kind==='feed_chicken'){ctx.fillStyle=pond?'#e6cf83':'#e9c369';for(let i=0;i<9;i++){const scatter=(i*19)%37-18,drop=Math.min(1,elapsed*2+i*.035);ctx.beginPath();ctx.arc(x+scatter,y-35+drop*(28+(i%3)*5),pond?2.1:2.7,0,7);ctx.fill();}}
      if(event.kind==='harvest_fish'&&art.livingAnimals?.naturalWidth){const image=event.fishId==='tilapia'?art.livingAnimals:art.animals;upright(ctx,x,y-elapsed*45,image,48,28,sourceHalf(image,true));}
      if(event.kind==='collect_eggs'&&event.eggs){ctx.fillStyle='#fff1cf';for(let i=0;i<Math.min(3,event.eggs);i++){ctx.beginPath();ctx.ellipse(x+i*14-14,y-12-elapsed*20,5,7,0,0,7);ctx.fill();}}ctx.restore();}}];
  }
  eggLayer(ctx,vac,layout){const eggs=vac?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0,nest=coopNestPoint(layout.yard);if(!eggs||!nest)return null;return {y:1900,draw:()=>{ctx.save();ctx.translate(nest.x,nest.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.fillStyle='#fff0cb';ctx.strokeStyle='#a47c4a';for(let i=0;i<Math.min(eggs,3);i++){const x=i*11-11,y=i%2*2;ctx.beginPath();ctx.ellipse(x,y,5,7,-.2,0,7);ctx.fill();ctx.stroke();}ctx.restore();}};}
}
