import {findPath} from './systems/Pathfinding.js';

// Ambient visitors are visual only. Quest NPCs and every trade still use server state.
const ROUTES=[
  [{x:590,y:690},{x:360,y:485},{x:350,y:415},{x:590,y:495},{x:610,y:690}],
  [{x:1000,y:710},{x:890,y:490},{x:900,y:420},{x:750,y:510},{x:1050,y:735}],
  [{x:1180,y:1010},{x:1060,y:765},{x:650,y:500},{x:660,y:420},{x:940,y:660},{x:1180,y:1010}]
];
export class MarketVisitors {
  constructor(){this.people=ROUTES.map((route,i)=>({x:route[0].x,y:route[0].y,route,index:1,path:[],pause:1+i*1.4,phase:i*1.8,moving:false,id:i}));}
  update(dt,collision,active=true){
    if(!active||!collision)return;
    for(const p of this.people){
      if(p.pause>0){p.pause-=dt;p.moving=false;continue;}
      if(!p.path.length){
        const goal=p.route[p.index];p.path=findPath(collision,p,goal,24)||[];
        if(!p.path.length){p.index=(p.index+1)%p.route.length;p.pause=2;continue;}
      }
      const next=p.path[0],dx=next.x-p.x,dy=next.y-p.y,len=Math.hypot(dx,dy);
      if(len<2){p.path.shift();if(!p.path.length){p.index=(p.index+1)%p.route.length;p.pause=1.2+p.id*.55;}continue;}
      const step=Math.min(len,Math.min(dt,.05)*(45+p.id*5));
      const x=p.x+dx/len*step,y=p.y+dy/len*step;
      if(collision.blocked(x,y,17)){p.path=[];p.pause=1;continue;}
      p.x=x;p.y=y;p.moving=true;p.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');p.phase+=step*.13;
    }
  }
}
