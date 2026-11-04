// A* uses the same live collision instance as movement, including player buildings.
export function clearSegment(collision,a,b){
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/7));
  for(let i=1;i<=steps;i++)if(collision.blocked(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;
  return true;
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
      if(x<0||y<0||p.x>collision.world.width||p.y>collision.world.height||closed.has(k)||g>=(best.get(k)??Infinity)||!clearSegment(collision,point(node.x,node.y),p))continue;
      best.set(k,g);push({x,y,g,f:g+heuristic(x,y),parent:node});
    }
  }
  return null;
}
