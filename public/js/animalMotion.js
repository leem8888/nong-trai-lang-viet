import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {findPath} from './systems/Pathfinding.js';
export const motionRandom=(id,n)=>{const v=Math.sin(id*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Coordinates trace the grass INSIDE the rails of living-coop-yard-small-v4.png.
// All decisions use this artwork plane, not an unrelated world-space rectangle.
export function coopGeometry(yard){
  if(!yard)return null;
  const g={x:yard.x+150,y:yard.y,width:510,height:321};
  g.floor=[[.365,.535],[.887,.525],[.926,.687],[.772,.815],[.365,.793],[.324,.700]].map(([u,v])=>({x:u*g.width,y:v*g.height}));
  g.props=[{x:.563*g.width,y:.650*g.height,rx:.080*g.width,ry:.047*g.height},{x:.816*g.width,y:.655*g.height,rx:.067*g.width,ry:.072*g.height}];
  g.food={x:.56*g.width,y:.744*g.height};g.water={x:.735*g.width,y:.716*g.height};
  return g;
}
export function coopToWorld(g,p){const sx=p.x-g.width/2,sy=p.y-g.height;return {x:g.x+(sx/ISO_X+sy/ISO_Y)/2,y:g.y+(sy/ISO_Y-sx/ISO_X)/2};}
export function worldToCoop(g,p){return {x:((p.x-g.x)-(p.y-g.y))*ISO_X+g.width/2,y:((p.x-g.x)+(p.y-g.y))*ISO_Y+g.height};}
export function insideFloor(g,p){let sign=0;for(let i=0;i<g.floor.length;i++){const a=g.floor[i],b=g.floor[(i+1)%g.floor.length],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);if(Math.abs(cross)<1e-6)continue;const s=Math.sign(cross);if(sign&&sign!==s)return false;sign=s;}return true;}
export function chickenWalkable(g,p){
  // Reserve room for the whole bird, including its head and feet, behind the rails.
  if(![[-14,-30],[14,-30],[-14,4],[14,4]].every(([x,y])=>insideFloor(g,{x:p.x+x,y:p.y+y})))return false;
  return !g.props.some(o=>((p.x-o.x)/(o.rx+10))**2+((p.y-o.y)/(o.ry+5))**2<1);
}
function choosePoint(g,id,cycle,mode,others){
  const candidates=[];
  if(mode==='eat')candidates.push({...g.food,x:g.food.x+(id%3-1)*15});
  if(mode==='drink')candidates.push({...g.water,y:g.water.y+(id%2)*7});
  if(mode==='roost')candidates.push({x:g.width*.39+id%2*17,y:g.height*.72});
  for(let i=0;i<64;i++)candidates.push({x:g.width*(.37+motionRandom(id,cycle*131+i*2)*.48),y:g.height*(.62+motionRandom(id,cycle*131+i*2+1)*.17)});
  return candidates.find(p=>chickenWalkable(g,p)&&others.every(b=>Math.hypot(p.x-b.sx,p.y-b.sy)>26))||candidates.find(p=>chickenWalkable(g,p));
}
export function updateChicken(bird,id,time,g,others=[],fed=false,reduced=false){
  const key=`${g.x}:${g.y}`;
  if(!bird||bird.yard!==key){const p=choosePoint(g,id,0,'idle',others);bird={sx:p.x,sy:p.y,x:0,y:0,yard:key,at:time,next:time+1+motionRandom(id,3)*2,cycle:0,mode:'idle',path:[],speed:0,phase:motionRandom(id,5)*6,mirror:false,turn:1};}
  const dt=clamp(time-bird.at,0,.08);bird.at=time;
  const collision={world:{width:1740,height:1024,minY:-300},blocked:(x,y)=>!chickenWalkable(g,worldToCoop(g,{x,y}))};
  if(!reduced&&(time>=bird.next||fed&&bird.mode!=='eat')){
    bird.cycle++;
    const choices=['walk','peck','idle','walk','eat','drink','walk','roost'];
    bird.mode=fed?'eat':choices[Math.floor(motionRandom(id,bird.cycle+40)*choices.length)];
    const goal=choosePoint(g,id,bird.cycle,bird.mode,others),start=coopToWorld(g,{x:bird.sx,y:bird.sy});
    bird.path=['idle','peck'].includes(bird.mode)?[]:findPath(collision,start,coopToWorld(g,goal),8)||[];
    bird.next=time+3+motionRandom(id,bird.cycle+70)*5;
  }
  let moving=false;
  if(!reduced&&bird.path.length){
    const next=worldToCoop(g,bird.path[0]),dx=next.x-bird.sx,dy=next.y-bird.sy,d=Math.hypot(dx,dy);
    const targetSpeed=10+motionRandom(id,20)*5;bird.speed+=(targetSpeed-bird.speed)*(1-Math.exp(-dt*5));
    if(d<1.2)bird.path.shift();else{
      const step=Math.min(d,bird.speed*dt),p={x:bird.sx+dx/d*step,y:bird.sy+dy/d*step};
      // Yield rather than pushing another bird through a fence or prop.
      const crowd=others.some(b=>Math.hypot(p.x-b.sx,p.y-b.sy)<19&&Math.hypot(p.x-b.sx,p.y-b.sy)<Math.hypot(bird.sx-b.sx,bird.sy-b.sy));
      if(chickenWalkable(g,p)&&!crowd){bird.sx=p.x;bird.sy=p.y;moving=true;bird.phase+=step*.55;if(Math.abs(dx)>.2)bird.mirror=dx<0;}else if(!chickenWalkable(g,p))bird.path=[];
    }
  }else bird.speed*=Math.exp(-dt*6);
  bird.turn+=((bird.mirror?-1:1)-bird.turn)*(1-Math.exp(-dt*12));
  const world=coopToWorld(g,{x:bird.sx,y:bird.sy});Object.assign(bird,world,{moving});
  return bird;
}
