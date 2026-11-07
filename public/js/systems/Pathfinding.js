// A* uses the same live collision instance as movement, including player buildings.
export function clearSegment(collision,a,b){
  const distance=Math.hypot(b.x-a.x,b.y-a.y);
  const steps=Math.max(1,Math.ceil(distance/7));
  const tightStart=collision.blocked(a.x,a.y,17),tightEnd=collision.blocked(b.x,b.y,17);
  for(let i=1;i<=steps;i++){
    const t=i/steps;
    // Movement uses radius 14. Let a farmer standing close to a fence step away
    // before restoring the route's extra clearance, rather than rejecting every exit.
    const radius=Math.min(17,tightStart?14+distance*t/6:17,tightEnd?14+distance*(1-t)/6:17);
    if(collision.blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,radius))return false;
  }
  return true;
}
export function findReachablePath(collision,start,goal,range=0){
  const candidates=[];
  if(!collision.blocked(goal.x,goal.y))candidates.push({...goal});
  const limit=range||96;
  for(let radius=12;radius<=limit;radius+=12)for(let i=0;i<32;i++){
    const angle=i*Math.PI/16,p={x:goal.x+Math.cos(angle)*radius,y:goal.y+Math.sin(angle)*radius};
    if(!collision.blocked(p.x,p.y))candidates.push(p);
  }
  candidates.sort((a,b)=>range?Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y):Math.hypot(a.x-goal.x,a.y-goal.y)-Math.hypot(b.x-goal.x,b.y-goal.y));
  // Bound work per click so unreachable destinations cannot freeze the render loop.
  const shortlist=candidates.slice(0,24);
  for(const step of [24,12])for(const p of shortlist){const route=findPath(collision,start,p,step);if(route)return route;}
  return null;
}
export function findApproachPath(collision,start,goal,range){
  // Candidate endpoints must fit inside the interaction's actual arrival radius.
  // In particular, a close-range action must not use the 12-unit candidate ring.
  return findReachablePath(collision,start,goal,Math.max(1,range-8));
}
export function findPath(collision,start,goal,step=24){
  if(collision.blocked(goal.x,goal.y))return null;
  if(clearSegment(collision,start,goal))return [{...goal}];
  const point=(x,y)=>({x:x*step+step/2,y:y*step+step/2}),key=(x,y)=>`${x},${y}`;
  const nearest=p=>{const gx=Math.floor(p.x/step),gy=Math.floor(p.y/step),nodes=[];for(let y=gy-3;y<=gy+3;y++)for(let x=gx-3;x<=gx+3;x++){const q=point(x,y);if(!collision.blocked(q.x,q.y)&&clearSegment(collision,p,q))nodes.push({x,y,d:Math.hypot(q.x-p.x,q.y-p.y)});}return nodes.sort((a,b)=>a.d-b.d)[0];};
  const a=nearest(start),b=nearest(goal);if(!a||!b)return null;
  const first={x:a.x,y:a.y,g:0,f:0,parent:null},open=[first],best=new Map([[key(a.x,a.y),0]]),closed=new Set();
  const heuristic=(x,y)=>Math.hypot(x-b.x,y-b.y);
  const push=n=>{open.push(n);let i=open.length-1;while(i>0){const p=(i-1)>>1;if(open[p].f<=n.f)break;open[i]=open[p];i=p;}open[i]=n;};
  const pop=()=>{const n=open[0],tail=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let child=i*2+1;if(child+1<open.length&&open[child+1].f<open[child].f)child++;if(tail.f<=open[child].f)break;open[i]=open[child];i=child;}open[i]=tail;}return n;};
  let iterations=0;
  while(open.length&&iterations++<16000){
    const node=pop(),id=key(node.x,node.y);if(closed.has(id))continue;closed.add(id);
    if(node.x===b.x&&node.y===b.y){const path=[{...goal}];for(let n=node;n;n=n.parent)path.push(point(n.x,n.y));path.reverse();return path;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const x=node.x+dx,y=node.y+dy,k=key(x,y),p=point(x,y),g=node.g+Math.hypot(dx,dy);
      if(x<0||p.y<(collision.world.minY||0)||p.x>collision.world.width||p.y>collision.world.height||closed.has(k)||g>=(best.get(k)??Infinity)||!clearSegment(collision,point(node.x,node.y),p))continue;
      best.set(k,g);push({x,y,g,f:g+heuristic(x,y),parent:node});
    }
  }
  return null;
}
