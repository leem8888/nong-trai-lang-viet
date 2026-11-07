import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {findPath} from './systems/Pathfinding.js';
import {coopPlacement,coopToWorld,worldToCoop,COOP_HOUSE_OFFSET} from './shared/coopPlacement.js';
export {coopToWorld,worldToCoop};
export const motionRandom=(id,n)=>{const v=Math.sin(id*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Coordinates trace the grass INSIDE the rails of living-coop-yard-small-v4.png.
// All decisions use this artwork plane, not an unrelated world-space rectangle.
export function coopGeometry(yard){
  if(!yard)return null;
  const g=coopPlacement(yard);
  g.floor=[[.365,.535],[.887,.525],[.926,.687],[.772,.815],[.365,.793],[.324,.700]].map(([u,v])=>({x:u*g.width,y:v*g.height}));
  g.props=[{x:.563*g.width,y:.650*g.height,rx:.080*g.width,ry:.047*g.height},{x:.816*g.width,y:.655*g.height,rx:.067*g.width,ry:.072*g.height}];
  g.food={x:.56*g.width,y:.744*g.height};g.water={x:.735*g.width,y:.716*g.height};
  return g;
}
export function coopHit(yard,point){
  const g=coopGeometry(yard);
  if(!g)return false;
  const p=worldToCoop(g,point);
  if(insideFloor(g,p))return true;
  // The house and steps occupy the left side of the same upright artwork.
  const outline=[[.08,.26],[.24,.07],[.43,.25],[.39,.64],[.28,.83],[.07,.77]].map(([u,v])=>({x:(u+COOP_HOUSE_OFFSET.u)*g.width,y:(v+COOP_HOUSE_OFFSET.v)*g.height}));
  let inside=false;
  for(let i=0,j=outline.length-1;i<outline.length;j=i++){
    const a=outline[i],b=outline[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function insideFloor(g,p){let sign=0;for(let i=0;i<g.floor.length;i++){const a=g.floor[i],b=g.floor[(i+1)%g.floor.length],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);if(Math.abs(cross)<1e-6)continue;const s=Math.sign(cross);if(sign&&sign!==s)return false;sign=s;}return true;}
export function chickenWalkable(g,p){
  // Reserve room for the whole bird, including its head and feet, behind the rails.
  if(![[-14,-30],[14,-30],[-14,4],[14,4]].every(([x,y])=>insideFloor(g,{x:p.x+x,y:p.y+y})))return false;
  return !g.props.some(o=>((p.x-o.x)/(o.rx+10))**2+((p.y-o.y)/(o.ry+5))**2<1);
}
function choosePoint(g,id,cycle,mode,others){
  const candidates=[];
  if(mode==='eat')for(let i=0;i<5;i++)candidates.push({...g.food,x:g.width*(.46+((id+i)%5)*.045)});
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
    const targetSpeed=((fed?17:10)+motionRandom(id,20)*5)*(.4+.6*Math.abs(bird.turn));bird.speed+=(targetSpeed-bird.speed)*(1-Math.exp(-dt*3));
    if(d<1.2)bird.path.shift();else{
      const step=Math.min(d,bird.speed*dt*(Math.abs(bird.turn)<.95?.2:1)),p={x:bird.sx+dx/d*step,y:bird.sy+dy/d*step};
      // Yield rather than pushing another bird through a fence or prop.
      const crowd=others.some(b=>Math.hypot(p.x-b.sx,p.y-b.sy)<19&&Math.hypot(p.x-b.sx,p.y-b.sy)<Math.hypot(bird.sx-b.sx,bird.sy-b.sy));
      if(chickenWalkable(g,p)&&!crowd){bird.sx=p.x;bird.sy=p.y;moving=true;bird.phase+=step*.48;if(Math.abs(dy)>.8)bird.back=dy<0;bird.frontWalk=Math.abs(dx)<Math.abs(dy)*(bird.frontWalk?.7:.35);if(Math.abs(dx)>Math.max(.8,Math.abs(dy)*.35))bird.mirror=dx<0;}else if(!chickenWalkable(g,p))bird.path=[];
    }
  }else bird.speed*=Math.exp(-dt*6);
  bird.turn+=clamp((bird.mirror?-1:1)-bird.turn,-dt*3,dt*3);
  // Start the feeding motion upright on arrival; walking phase must not jump
  // the head into the middle of an unrelated animation cycle.
  bird.peckTime=!moving&&!bird.path.length&&bird.speed<=1&&['eat','peck','drink'].includes(bird.mode)?(bird.peckTime||0)+dt:0;
  const world=coopToWorld(g,{x:bird.sx,y:bird.sy});Object.assign(bird,world,{moving});
  return bird;
}
