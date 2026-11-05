import {ISO_X,ISO_Y} from './core/IsoProjection.js';

const railSource=[390,80,270,300],gateSource=[390,390,700,610];
let cachedSource=null,cachedBack=null,cachedFront=null;
function buildFence(art,upright){cachedSource=art;
  const size=(1740+1024),create=()=>{const c=document.createElement('canvas');c.width=Math.ceil(size*ISO_X)+600;c.height=Math.ceil(size*ISO_Y)+400;const g=c.getContext('2d');g.translate(1024*ISO_X+300,200);g.transform(ISO_X,ISO_Y,-ISO_X,ISO_Y,0,0);return [c,g];};
  const [back,backCtx]=create(),[front,frontCtx]=create();cachedBack=back;cachedFront=front;
  const segments=[
    [{x:65,y:-195},{x:1675,y:-195}],
    [{x:65,y:-195},{x:65,y:905}],
    [{x:1675,y:-195},{x:1675,y:905}],
    [{x:65,y:905},{x:660,y:905}],
    [{x:780,y:905},{x:1675,y:905}]
  ];
  for(const [a,b] of segments){const dx=b.x-a.x,dy=b.y-a.y,n=Math.ceil(Math.hypot(dx,dy)/90),g=a.y===905?frontCtx:backCtx;for(let i=0;i<n;i++){const t=(i+.5)/n,x=a.x+dx*t,y=a.y+dy*t;upright(g,x,y,art,94,62,railSource,dx!==0);}}
  // Match the gate baseline to the south fence (screen slope ISO_Y / ISO_X).
  // Shear only the upright image plane: posts stay vertical, feet land on the rails.
  // The source feet sit 50px above the crop bottom; align that contact line to y=905.
  frontCtx.save();frontCtx.translate(720,905);
  frontCtx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  frontCtx.transform(1,ISO_Y/ISO_X,0,1,0,0);
  const image=art.bitmap||art,scaleX=image.width/art.naturalWidth,scaleY=image.height/art.naturalHeight;
  frontCtx.drawImage(image,gateSource[0]*scaleX,gateSource[1]*scaleY,gateSource[2]*scaleX,gateSource[3]*scaleY,-82,-133,155,145);
  frontCtx.restore();
}
export function drawFarmFence(ctx,art,upright,front=false){if(!art?.naturalWidth)return;if(cachedSource!==art)buildFence(art,upright);const cache=front?cachedFront:cachedBack;ctx.save();ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.translate(-1024*ISO_X-300,-200);ctx.drawImage(cache,0,0);ctx.restore();
}
