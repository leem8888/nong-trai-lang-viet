import {FIELD} from './shared/crops.js';
import {ISO_X,ISO_Y} from './core/IsoProjection.js';

const depth=(x,y)=>x+y;
const railSource=[390,80,270,300],gateSource=[390,390,700,610],stakeSource=[170,755,135,230];
let cachedSource=null,cachedBack=null,cachedFront=null;
function buildFence(art,upright){cachedSource=art;
  const size=(1440+1024),create=()=>{const c=document.createElement('canvas');c.width=Math.ceil(size*ISO_X);c.height=Math.ceil(size*ISO_Y);const g=c.getContext('2d');g.translate(1024*ISO_X,0);g.transform(ISO_X,ISO_Y,-ISO_X,ISO_Y,0,0);return [c,g];};
  const [back,backCtx]=create(),[front,frontCtx]=create();cachedBack=back;cachedFront=front;
  const segments=[
    [{x:65,y:105},{x:1375,y:105}],
    [{x:65,y:105},{x:65,y:905}],
    [{x:1375,y:105},{x:1375,y:905}],
    [{x:65,y:905},{x:660,y:905}],
    [{x:780,y:905},{x:1375,y:905}]
  ];
  for(const [a,b] of segments){const dx=b.x-a.x,dy=b.y-a.y,n=Math.ceil(Math.hypot(dx,dy)/90),g=a.y===905?frontCtx:backCtx;for(let i=0;i<n;i++){const t=(i+.5)/n,x=a.x+dx*t,y=a.y+dy*t;upright(g,x,y,art,94,62,railSource,dx!==0);}}
  upright(frontCtx,720,905,art,155,145,gateSource);
}
export function drawFarmFence(ctx,art,upright,front=false){if(!art?.naturalWidth)return;if(cachedSource!==art)buildFence(art,upright);const cache=front?cachedFront:cachedBack;ctx.save();ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.translate(-1024*ISO_X,0);ctx.drawImage(cache,0,0);ctx.restore();
}

// Short, passable survey stakes mark the actual purchased crop plots. The perimeter
// fence marks the farm property; it does not imply a new movement rule.
export function fieldBoundaryLayers(ctx,tiles,art,upright){if(!art?.naturalWidth||!tiles?.length)return [];
  const owned=new Set(tiles.filter(t=>!t.locked).map(t=>`${t.x},${t.y}`)),layers=[];
  for(const tile of tiles){if(tile.locked)continue;const {x,y}=tile,rX=FIELD.x+x*FIELD.stepX,rY=FIELD.y+y*FIELD.stepY;
    for(const [dx,dy,px,py] of [[0,-1,rX+25,rY],[0,1,rX+25,rY+FIELD.height],[-1,0,rX,rY+25],[1,0,rX+FIELD.width,rY+25]]){
      if(owned.has(`${x+dx},${y+dy}`))continue;
      const horizontal=dy!==0;
      layers.push({y:depth(px,py),draw:()=>upright(ctx,px,py,art,50,28,railSource,horizontal)});
    }
  }
  return layers;
}
