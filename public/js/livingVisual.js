import {coopGeometry,coopToWorld,updateChicken} from './animalMotion.js';
import {drawSwimmingFish,drawWalkingChicken,fishLength,fishTilt,drawEggNest,drawHungerIcon} from './animalDrawing.js';
import {livingLayout,pondObstacles} from './shared/livingLayout.js';
import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {COOP_HOUSE_OFFSET} from './shared/coopPlacement.js';
import {movementFacing} from './entities/Player.js';
import {drawFishingNet,fishingPose,FISH_RELEASE_DELAY,FISH_RELEASE_TRAVEL} from './fishingNet.js';

// Pond water and fish stay below actors sorted by their world-space feet.
const POND_GROUND_DEPTH=-10000;
const sourceHalf=(image,right)=>[right?image.naturalWidth/2:0,0,image.naturalWidth/2,image.naturalHeight];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
export function advanceFishPosition(position,target,dt,speed=11){
  const dx=target.x-position.x,dy=target.y-position.y;
  const distance=Math.hypot((dx-dy)*ISO_X,(dx+dy)*ISO_Y);
  const step=Math.min(1,speed*clamp(dt,0,.1)/(distance||1));
  return {x:position.x+dx*step,y:position.y+dy*step};
}
export function fishHungerOpacity(fish,time){
  if(fish.fedAt!==null||fish.remainingMs===0||fish.progress>=1)return 0;
  const phase=((time+fish.id*2.17)%9+9)%9;
  return phase<3?Math.min(1,phase/.35,(3-phase)/.35):0;
}
export function chickenHungerOpacity(chicken,time){
  const hungry=chicken.status==='WAITING_FOR_FEED'||chicken.status==='GROWING'&&!chicken.growthFed;
  return hungry?fishHungerOpacity({id:chicken.id,fedAt:null,progress:0,remainingMs:1},time):0;
}
const random=(id,n)=>{const v=Math.sin(id*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
export function coopNestPoint(yard){const g=coopGeometry(yard);return g?coopToWorld(g,{x:g.width*(.155+COOP_HOUSE_OFFSET.u),y:g.height*(.60+COOP_HOUSE_OFFSET.v)}):null;}
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
  constructor(){this.event=null;this.hits=[];this.releases=new Map();this.chickenMotion=new Map();this.fishHeadings=new Map();this.fishPositions=new Map();}
  animalAt(point){return this.hits.filter(p=>Math.hypot((point.x-p.x)-(point.y-p.y),((point.x-p.x)+(point.y-p.y))*.5)<36).sort((a,b)=>Math.hypot(point.x-a.x,point.y-a.y)-Math.hypot(point.x-b.x,point.y-b.y))[0];}
  onAction(intent,result,before,player,layout){if(result.replayed)return;this.event={kind:intent.action,entityId:intent.entityId||null,at:performance.now(),fishId:before?.pond?.fish.find(f=>f.id===intent.entityId)?.fishId||null,eggs:before?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0};
    if(intent.action==='harvest_fish'&&layout?.pond&&player){
      this.event.harvestFish=before?.pond?.fish.find(f=>f.id===intent.entityId);
      const [o]=pondObstacles(layout.pond),sx=((player.x-o.x)-(player.y-o.y))*ISO_X,sy=((player.x-o.x)+(player.y-o.y))*ISO_Y;
      const norm=Math.hypot(sx/o.rx,sy/o.ry)||1,dx=sx/norm*.70,dy=sy/norm*.70;
      this.event.catchPoint={x:o.x+(dx/ISO_X+dy/ISO_Y)/2,y:o.y+(dy/ISO_Y-dx/ISO_X)/2};
      const position=this.fishPositions.get(intent.entityId);
      if(position)this.event.catchPoint={x:position.x,y:position.y};
      this.event.throwFrom={x:player.x,y:player.y};
      player.direction=movementFacing(this.event.catchPoint.x-player.x,this.event.catchPoint.y-player.y,player.direction);
    }
    if(intent.action==='feed_fish'&&layout?.pond&&player){
      const [o]=pondObstacles(layout.pond),sx=((player.x-o.x)-(player.y-o.y))*ISO_X,sy=((player.x-o.x)+(player.y-o.y))*ISO_Y;
      const norm=Math.hypot(sx/o.rx,sy/o.ry)||1,dx=sx/norm*.62,dy=sy/norm*.62;
      this.event.food={x:o.x+(dx/ISO_X+dy/ISO_Y)/2,y:o.y+(dy/ISO_Y-dx/ISO_X)/2};
      this.event.throwFrom={x:player.x,y:player.y};
    }
    if(intent.action==='feed_chicken'&&layout?.yard&&player){
      const g=coopGeometry(layout.yard);
      this.event.food=coopToWorld(g,{x:g.width*.565,y:g.height*.642});
      this.event.throwFrom={x:player.x,y:player.y};
      this.chickenFeed={at:performance.now(),food:this.event.food,throwFrom:this.event.throwFrom};
      player.direction=movementFacing(this.event.food.x-player.x,this.event.food.y-player.y,player.direction);
    }
    if(intent.action==='stock_fish'&&player&&layout){
      const known=new Set(before?.pond?.fish.map(f=>f.id)||[]),[o]=pondObstacles(layout.pond);
      const sx=((player.x-o.x)-(player.y-o.y))*ISO_X,sy=((player.x-o.x)+(player.y-o.y))*ISO_Y;
      const norm=Math.hypot(sx/o.rx,sy/o.ry)||1,dx=sx/norm*.87,dy=sy/norm*.87;
      let index=0;for(const fish of result.state.pond.fish)if(!known.has(fish.id))this.releases.set(fish.id,{at:performance.now()+index++*280,x:o.x+12+(dx/ISO_X+dy/ISO_Y)/2,y:o.y+12+(dy/ISO_Y-dx/ISO_X)/2});
      this.event.releaseHold=Math.max(0,index-1)*.28;
      this.event.duration=2100+this.event.releaseHold*1000;
      this.event.throwFrom={x:player.x,y:player.y};
      player.direction=movementFacing(o.x-player.x,o.y-player.y,player.direction);
    }
    if(intent.action==='collect_eggs'&&player&&layout?.yard){
      this.event.throwFrom={x:player.x,y:player.y};
      this.event.nest=coopNestPoint(layout.yard);
      player.direction=movementFacing(this.event.nest.x-player.x,this.event.nest.y-player.y,player.direction);
      this.event.eggs=Math.max(0,this.event.eggs-(result.state?.coop?.chickens||[]).reduce((n,c)=>n+c.eggsReady,0));
    }
  }
  layout(phase5){return livingLayout(phase5?.buildings,phase5?.decorations);}
  drawTrough(ctx,g){
    const age=this.chickenFeed?(performance.now()-this.chickenFeed.at)/1000:Infinity;
    const amount=Number.isFinite(age)?smooth((age-.9)/.9)*(1-smooth((age-9)/17)):0;
    ctx.save();ctx.translate(-g.width/2,-g.height);
    ctx.beginPath();ctx.moveTo(g.width*.494,g.height*.619);ctx.lineTo(g.width*.633,g.height*.619);ctx.lineTo(g.width*.630,g.height*.657);ctx.lineTo(g.width*.491,g.height*.657);ctx.closePath();ctx.clip();
    ctx.fillStyle='#654022';ctx.fillRect(g.width*.48,g.height*.61,g.width*.17,g.height*.06);
    const count=8+Math.round(amount*95);
    for(let i=0;i<count;i++){
      const x=g.width*(.497+random(i,61)*.13),y=g.height*(.623+random(i,62)*.031);
      ctx.fillStyle=i%3?'#dba244':'#f5cb6b';ctx.beginPath();ctx.ellipse(x,y,1.1+random(i,63)*.6,.7,random(i,64),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  active(kind){return this.event?.kind===kind&&performance.now()-this.event.at<2200;}
  pondLayer(ctx,art,upright,layout){const large=layout.pond.w>300,cx=large?1195:1250;// Water and its painted rim are ground, not a foreground occluder.
    return {y:POND_GROUND_DEPTH,draw:()=>upright(ctx,cx,large?720:705,art.livingPond||art.pond,large?480:335,large?260:223)};}
  visibleFish(vac,now=performance.now()){
    const fish=vac?.pond?.fish||[],event=this.event;
    if(event?.kind!=='harvest_fish'||!event.harvestFish||fishingPose((now-event.at)/1000).caught||fish.some(f=>f.id===event.entityId))return fish;
    return [...fish,event.harvestFish];
  }
  fishLayers(ctx,art,upright,vac,layout,reduced){const fish=this.visibleFish(vac),time=reduced?0:performance.now()/1000;
    const activeIds=new Set(fish.map(f=>f.id));for(const id of this.releases.keys())if(!activeIds.has(id))this.releases.delete(id);
    for(const id of this.fishHeadings.keys())if(!activeIds.has(id))this.fishHeadings.delete(id);
    for(const id of this.fishPositions.keys())if(!activeIds.has(id))this.fishPositions.delete(id);
    return fish.map(row=>{
      const harvesting=this.event?.kind==='harvest_fish'&&this.event.entityId===row.id&&this.event.catchPoint;
      const normal=harvesting?this.event.catchPoint:fishMotion(row.id,time,layout.pond),ahead=fishMotion(row.id,time+.12,layout.pond),release=this.releases.get(row.id);
      const landing=FISH_RELEASE_DELAY+FISH_RELEASE_TRAVEL;
      const age=release?(performance.now()-release.at)/1000:10,enter=reduced?1:smooth((age-landing)/3.6);
      if(release&&age>4.5)this.releases.delete(row.id);
      let x=normal.x,y=normal.y;
      if(release&&!reduced){x=release.x+(x-release.x)*enter;y=release.y+(y-release.y)*enter;}
      if(!reduced&&this.event?.kind==='feed_fish'&&this.event.food){
        const age=(performance.now()-this.event.at)/1000,wait=1.1+random(row.id,90)*2.2;
        const blend=smooth((age-wait)/3.5)*(1-smooth((age-10)/5));
        const angle=row.id*2.39996,spread=9+random(row.id,91)*15;
        const sx=Math.cos(angle)*spread,sy=Math.sin(angle)*spread*.5;
        const food={x:this.event.food.x+(sx/ISO_X+sy/ISO_Y)/2,y:this.event.food.y+(sy/ISO_Y-sx/ISO_X)/2};
        x+=(food.x-x)*blend;y+=(food.y-y)*blend;
      }
      const previous=this.fishPositions.get(row.id),now=performance.now()/1000;
      const position=previous&&!reduced?advanceFishPosition(previous,{x,y},now-previous.at):{x,y};
      const vx=previous?position.x-previous.x:ahead.x-normal.x,vy=previous?position.y-previous.y:ahead.y-normal.y;
      x=position.x;y=position.y;this.fishPositions.set(row.id,{x,y,at:now});
      const speed=Math.hypot(ahead.x-normal.x,ahead.y-normal.y)/.12;
      const dx=(vx-vy)*ISO_X,dy=(vx+vy)*ISO_Y;
      let heading=this.fishHeadings.get(row.id);if(!heading){heading={turn:dx<0?-1:1,tilt:0,at:time};this.fishHeadings.set(row.id,heading);}
      const dt=clamp(time-heading.at,0,.1);heading.at=time;
      // Integrate phase instead of multiplying absolute time by a changing rate,
      // which made the tail jump whenever swimming speed changed.
      heading.tailPhase??=row.id*2.1;
      heading.tailPhase=(heading.tailPhase+dt*(1.6+Math.min(speed,20)*.02))%(Math.PI*2);
      const tailPhase=heading.tailPhase;
      if(heading.angle===undefined)heading.angle=Math.atan2(dy,dx);
      if(Math.hypot(dx,dy)>.001){
        const target=Math.atan2(dy,dx),difference=Math.atan2(Math.sin(target-heading.angle),Math.cos(target-heading.angle));
        heading.angle+=clamp(difference,-dt*1.35,dt*1.35);
      }
      const horizontal=Math.cos(heading.angle);
      if(Math.abs(horizontal)>.3)heading.facing=horizontal<0?-1:1;
      heading.facing??=heading.turn<0?-1:1;
      heading.turn+=(heading.facing-heading.turn)*(1-Math.exp(-dt*8));
      heading.tilt=fishTilt(heading.angle);
      const mirror=heading.turn<0;
      if(!harvesting)this.hits.push({kind:'pond',entityId:row.id,x,y});
      return {y:POND_GROUND_DEPTH+1,draw:()=>{if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth||age<(reduced?0:landing))return;
        ctx.save();
        const harvestable=row.remainingMs===0||row.progress>=1;
        // Mature fish stay bright even with reduced effects; young fish remain below the water tint.
        ctx.globalAlpha=harvestable?1:.72+(reduced?0:.06*Math.sin(time*.7+row.id));
        ctx.filter=harvestable?'brightness(1.55) saturate(1.35) contrast(1.08)':'none';
        const image=row.fishId==='tilapia'?art.livingAnimals:art.carpFish,size=fishLength(row.fishId,row.progress);
        drawSwimmingFish(ctx,image,row.fishId,x,y,size,heading.turn,heading.tilt,tailPhase,reduced);ctx.restore();
        const hunger=fishHungerOpacity(row,performance.now()/1000);
        drawHungerIcon(ctx,x,y,(mirror?-1:1)*size*.28,-size*.3-13,hunger*.95);
        if(!reduced){
          ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
          ctx.lineWidth=.8;ctx.strokeStyle='#c5efe58a';
          for(let i=0;i<2;i++){const phase=(time*.35+row.id*.37+i*.5)%1;ctx.globalAlpha=(1-phase)*.10;ctx.beginPath();ctx.ellipse((mirror?1:-1)*(size*.25+phase*12),-size*.25,4+phase*9,1.5+phase*3,0,0,Math.PI*2);ctx.stroke();}
          ctx.restore();
          if(release&&age>=landing&&age<landing+1.5){
            const splash=age-landing;ctx.save();ctx.translate(release.x,release.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
            for(let i=0;i<2;i++){const t=splash-i*.14;if(t<0)continue;ctx.globalAlpha=Math.max(0,1-t/1.25)*.48;ctx.strokeStyle='#c3e6db';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(0,0,3+t*17,1+t*6,0,0,Math.PI*2);ctx.stroke();}
            if(splash<.42)for(let i=0;i<5;i++){const a=i*2.399;ctx.globalAlpha=(1-splash/.42)*.6;ctx.fillStyle='#d0ece3';ctx.beginPath();ctx.ellipse(Math.cos(a)*splash*17,-Math.sin(splash/.42*Math.PI)*5+Math.sin(a)*splash*5,.7,.9,0,0,7);ctx.fill();}ctx.restore();
          }
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
      const feedAge=this.chickenFeed?(performance.now()-this.chickenFeed.at)/1000:Infinity;
      const eating=feedAge>1.35+random(row.id,77)*1.8&&feedAge<15;
      const bird=updateChicken(this.chickenMotion.get(row.id),row.id,time,g,others,eating,reduced);
      this.chickenMotion.set(row.id,bird);
      this.hits.push({kind:'coop',entityId:row.id,x:bird.x-10/(2*ISO_Y),y:bird.y-10/(2*ISO_Y)});
      return {y:1850+bird.sy*.01,draw:()=>{
        if(!art.livingAnimals?.naturalWidth||!art.animals?.naturalWidth)return;
        const young=row.status==='GROWING',image=art.chickenPeck;
        if(!image?.naturalWidth)return;
        drawWalkingChicken(ctx,image,young,bird.x,bird.y,bird,time,reduced,{walk:art.chickenWalk,turn:art.chickenTurn});drawHungerIcon(ctx,bird.x,bird.y,0,young?-33:-45,chickenHungerOpacity(row,performance.now()/1000)*.95);
      }};
    });
  }
  effectLayers(ctx,art,upright,vac,layout){const event=this.event;if(!event)return [];const elapsed=(performance.now()-event.at)/1000;
    if(event.kind==='harvest_fish'&&event.catchPoint&&event.throwFrom)return elapsed<3.8?[{y:2100,draw:()=>drawFishingNet(ctx,event,elapsed,art)}]:[];
    if(event.kind==='stock_fish'&&event.throwFrom){
      return [...this.releases.entries()].map(([id,release])=>({y:2100,draw:()=>{
        const t=((performance.now()-release.at)/1000-FISH_RELEASE_DELAY)/FISH_RELEASE_TRAVEL;if(t<0||t>=1)return;
        const row=vac?.pond?.fish.find(f=>f.id===id);if(!row)return;
        const from=event.throwFrom;
        const right=((release.x-from.x)-(release.y-from.y))>0;
        const handX=(right?1:-1)*16*(1-t),handY=-12*(1-t);
        const x=from.x+(release.x-from.x)*t+(handX/ISO_X+handY/ISO_Y)/2,y=from.y+(release.y-from.y)*t+(handY/ISO_Y-handX/ISO_X)/2;
        ctx.save();ctx.globalAlpha=1-t*.25;
        drawSwimmingFish(ctx,row.fishId==='tilapia'?art.livingAnimals:art.carpFish,row.fishId,x,y,14,right?1:-1,.18,t*3,false);ctx.restore();
      }}));
    }
    if(event.kind==='collect_eggs'&&event.nest&&event.throwFrom){
      if(elapsed>2)return [];
      return [{y:2100,draw:()=>{
        const from=event.nest,to=event.throwFrom,count=Math.min(3,event.eggs);
        ctx.save();ctx.translate(from.x,from.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
        const handX=((to.x-from.x)-(to.y-from.y))*ISO_X,handY=((to.x-from.x)+(to.y-from.y))*ISO_Y-36;
        for(let i=0;i<count;i++){
          const t=(elapsed-.2-i*.24)/.7;if(t<0||t>=1)continue;
          const blend=t*t*(3-2*t),x=(i-1)*5*(1-blend)+handX*blend,y=-4+(handY+4)*blend-Math.sin(t*Math.PI)*9;
          ctx.save();ctx.translate(x,y);ctx.rotate(-.15+t*.3);ctx.globalAlpha=1-smooth((t-.8)/.2);
          const shell=ctx.createRadialGradient(-1,-2,.2,0,0,5);shell.addColorStop(0,'#fff0d0');shell.addColorStop(.6,'#e6cba1');shell.addColorStop(1,'#ac875b');ctx.fillStyle=shell;
          ctx.beginPath();ctx.moveTo(0,-4.5);ctx.bezierCurveTo(3,-4.5,4,1,2,3);ctx.bezierCurveTo(0,5,-3,3,-3,0);ctx.bezierCurveTo(-3,-2,-2,-4.5,0,-4.5);ctx.fill();ctx.restore();
        }
        ctx.restore();
      }}];
    }
    if(['feed_fish','feed_chicken'].includes(event.kind)&&event.food&&event.throwFrom){
      const chicken=event.kind==='feed_chicken';
      if(chicken){
        if(elapsed>2.2)return [];
        return [{y:2100,draw:()=>{
          const food=event.food,from=event.throwFrom;
          ctx.save();ctx.translate(food.x,food.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
          const dx=((from.x-food.x)-(from.y-food.y))*ISO_X,dy=((from.x-food.x)+(from.y-food.y))*ISO_Y;
          const handX=dx+(dx<0?19:-19),handY=dy-38;
          // Two small handfuls. Every grain has its own flight time and lands
          // inside the trough; no floating food icon or shower of sparks.
          for(let i=0;i<34;i++){
            const launch=.24+Math.floor(i/17)*.38+(i%17)*.009,flight=.58+random(i,81)*.12;
            const t=(elapsed-launch)/flight;if(t<0||t>1)continue;
            const endX=(random(i,82)-.5)*48,endY=(random(i,83)-.5)*5;
            const x=handX*(1-t)+endX*t,y=handY*(1-t)+endY*t-4*t*(1-t)*(38+random(i,84)*9);
            ctx.globalAlpha=Math.min(1,(1-t)*12);ctx.fillStyle=i%3?'#d7b465':'#f0d28b';
            ctx.beginPath();ctx.ellipse(x,y,.75+random(i,85)*.35,.55,i*.8,0,Math.PI*2);ctx.fill();
          }
          ctx.restore();
        }}];
      }
      if(elapsed>13)return [];
      return [{y:2500,draw:()=>{
        const food=event.food,from=event.throwFrom;
        ctx.save();ctx.translate(food.x,food.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
        const handX=((from.x-food.x)-(from.y-food.y))*ISO_X+8,handY=((from.x-food.x)+(from.y-food.y))*ISO_Y-29;
        for(let i=0;i<(chicken?24:16);i++){
          const launch=i*.018,t=clamp((elapsed-launch)/.85,0,1),angle=i*2.39996,r=6+random(i,31)*24;
          const endX=Math.cos(angle)*r*(chicken?.8:1),endY=Math.sin(angle)*r*(chicken?.16:.45);
          const x=handX*(1-t)+endX*t,y=handY*(1-t)+endY*t-Math.sin(t*Math.PI)*24;
          ctx.globalAlpha=chicken?1-smooth((elapsed-1.1)/.5):elapsed<.85?1:1-smooth((elapsed-7-random(i,32)*3)/3);
          ctx.fillStyle=i%3?'#c99a49':'#f1d38c';ctx.beginPath();ctx.ellipse(x,y,1.6,t===1?.85:1.4,0,0,Math.PI*2);ctx.fill();
          const rippleAge=elapsed-launch-.85;
          if(!chicken&&rippleAge>=0&&rippleAge<1.3&&i%4===0){ctx.globalAlpha=(1-rippleAge/1.3)*.3;ctx.strokeStyle='#cbe9ce';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(endX,endY,2+rippleAge*9,1+rippleAge*3,0,0,Math.PI*2);ctx.stroke();}
        }
        ctx.restore();
      }}];
    }
    if(elapsed>2.2)return [];
    const pond=['stock_fish','feed_fish','harvest_fish'].includes(event.kind),nest=event.kind==='collect_eggs'?coopNestPoint(layout.yard):null,x=event.food?.x??nest?.x??(pond?(layout.pond.w>300?970:1050):layout.yard?layout.yard.x+layout.yard.w*.6:1165),y=event.food?.y??nest?.y??(pond?(layout.pond.w>300?630:665):layout.yard?layout.yard.y-180:180);
    return [{y:2500,draw:()=>{ctx.save();ctx.globalAlpha=1-elapsed/2.2;ctx.lineWidth=2;ctx.strokeStyle=pond?'#d4f4e7':'#f8d989';for(let i=0;i<(pond?3:2);i++){ctx.beginPath();ctx.ellipse(x,y,8+elapsed*25+i*11,3+elapsed*9+i*4,0,0,7);ctx.stroke();}
      if(event.kind==='feed_fish'||event.kind==='feed_chicken'){ctx.fillStyle=pond?'#e6cf83':'#e9c369';for(let i=0;i<9;i++){const scatter=(i*19)%37-18,drop=Math.min(1,elapsed*2+i*.035);ctx.beginPath();ctx.arc(x+scatter,y-35+drop*(28+(i%3)*5),pond?2.1:2.7,0,7);ctx.fill();}}
      if(event.kind==='harvest_fish'&&art.livingAnimals?.naturalWidth){const image=event.fishId==='tilapia'?art.livingAnimals:art.animals;upright(ctx,x,y-elapsed*45,image,48,28,sourceHalf(image,true));}
      if(event.kind==='collect_eggs'&&event.eggs){ctx.fillStyle='#fff1cf';for(let i=0;i<Math.min(3,event.eggs);i++){ctx.beginPath();ctx.ellipse(x+i*14-14,y-12-elapsed*20,5,7,0,0,7);ctx.fill();}}ctx.restore();}}];
  }
  eggLayer(ctx,vac,layout){
    let eggs=vac?.coop?.chickens.reduce((n,c)=>n+c.eggsReady,0)||0;const nest=coopNestPoint(layout.yard);
    if(this.event?.kind==='collect_eggs'){
      const age=(performance.now()-this.event.at)/1000;
      eggs+=Math.max(0,Math.min(3,this.event.eggs)-Math.max(0,Math.floor((age-.2)/.24)+1));
    }
    if(!nest)return null;
    return {y:1900,draw:()=>drawEggNest(ctx,nest.x,nest.y,eggs)};
  }
}
