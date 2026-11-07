import {ISO_X,ISO_Y} from './core/IsoProjection.js';

const random=(seed,salt)=>{const n=Math.sin(seed*127.1+salt*311.7)*43758.5453;return n-Math.floor(n);};
const world=(home,x,y)=>({x:home.x+(x/ISO_X+y/ISO_Y)/2,y:home.y+(y/ISO_Y-x/ISO_X)/2});
export function neighborYard(home){
 const seed=home.variant+home.x*.013+home.y*.007;
 const width=190+random(seed,1)*35,front=53+random(seed,2)*18;
 return {seed,width,front,fence:Math.floor(random(seed,3)*3),paved:random(seed,4)>.45,gate:.48+random(seed,5)*.25,
  plants:Array.from({length:4+Math.floor(random(seed,6)*4)},(_,i)=>({
   x:(i%2?-1:1)*(145+random(seed,i+20)*55),y:-75+random(seed,i+40)*95,
   species:Math.floor(random(seed,i+60)*3),size:55+random(seed,i+80)*35,
  }))};
}
function local(ctx,home,draw){
 ctx.save();ctx.translate(home.x,home.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);draw();ctx.restore();
}
function ground(ctx,home,yard){local(ctx,home,()=>{
 const {width:w,front:f,seed}=yard;
 const corners=[[-w,-14],[-12,-103],[w,-8],[8,f]];
 ctx.beginPath();corners.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
 ctx.fillStyle=yard.paved?'#a8976a':'#a49968';ctx.fill();ctx.save();ctx.clip();
 for(let i=0;i<180;i++){
  const x=(random(seed,i+100)-.5)*w*2,y=-100+random(seed,i+300)*(f+100);
  ctx.fillStyle=i%3?'#bdad7b55':'#6f825441';ctx.fillRect(x,y,2+random(seed,i+500)*5,1.3);
 }
 if(yard.paved){ctx.strokeStyle='#736e5149';ctx.lineWidth=.65;
  for(let i=-10;i<14;i++){ctx.beginPath();ctx.moveTo(-w,i*12);ctx.lineTo(w,i*12+w*.38);ctx.stroke();
   ctx.beginPath();ctx.moveTo(i*25,-120);ctx.lineTo(i*25-180,100);ctx.stroke();}
 }
 // Grass grows along the boundary rather than stopping at a clean diamond.
 for(let i=0;i<65;i++){
  const edge=i%4,a=corners[edge],b=corners[(edge+1)%4],t=random(seed,i+700);
  const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
  ctx.fillStyle=i%2?'#6b8a3d99':'#7e974a88';ctx.beginPath();ctx.ellipse(x,y,3+random(seed,i+800)*7,1.6,0,0,7);ctx.fill();
 }
 if(random(seed,901)>.45){
  ctx.save();ctx.translate(-w*.54,8);ctx.transform(1,.3,-.7,.45,0,0);
  ctx.fillStyle='#715b37';ctx.fillRect(-22,-17,48,33);
  for(let row=0;row<3;row++)for(let col=0;col<5;col++){
   const x=-17+col*9,y=-12+row*10;ctx.fillStyle=(row+col)%2?'#638b39':'#8baa42';
   ctx.beginPath();ctx.ellipse(x,y,4,2.4,-.4,0,7);ctx.ellipse(x+2,y-2,2.5,4,.5,0,7);ctx.fill();
  }
  ctx.restore();
 }
 // An uneven stepping-stone path leads from the porch to the gate.
 for(let i=0;i<5;i++){const x=10+i*15,y=5+i*8;ctx.fillStyle=i%2?'#c0b391':'#cbbf9b';ctx.beginPath();ctx.ellipse(x,y,10,3.5,.35,0,7);ctx.fill();}
 ctx.restore();
 });}
function fence(ctx,home,yard,a,b){local(ctx,home,()=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),count=Math.ceil(length/15),height=yard.fence===2?25:21;
 if(yard.fence===2){
  ctx.fillStyle='#b48c65';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(b[0],b[1]-height);ctx.lineTo(a[0],a[1]-height);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#80684b';ctx.lineWidth=.7;
  for(let row=0;row<3;row++)for(let i=0;i<count;i++){
   const t=(i+(row%2)*.5)/count;if(t>1)continue;const x=a[0]+dx*t,y=a[1]+dy*t;
   ctx.beginPath();ctx.moveTo(x,y-row*8);ctx.lineTo(x,y-row*8-8);ctx.stroke();
  }
 }
 for(const lift of [6,16]){ctx.strokeStyle=yard.fence===1?'#7c6040':'#887344';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(a[0],a[1]-lift);ctx.lineTo(b[0],b[1]-lift);ctx.stroke();
  ctx.strokeStyle='#d8c58a';ctx.lineWidth=.8;ctx.stroke();}
 for(let i=0;i<=count;i++){
  if(yard.fence===2&&i!==0&&i!==count)continue;
  const t=i/count,x=a[0]+dx*t,y=a[1]+dy*t;
  ctx.strokeStyle=yard.fence===1?'#806047':'#a38c53';ctx.lineWidth=yard.fence===2?7:4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-height-(i%3===0?3:0));ctx.stroke();
  ctx.strokeStyle='#e2cea0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-1,y-2);ctx.lineTo(x-1,y-height);ctx.stroke();
 }
 });}
export function neighborYardLayers(home,art,upright){
 const yard=neighborYard(home),w=yard.width,f=yard.front;
 const left=[-w,-14],back=[-12,-103],right=[w,-8],front=[8,f];
 const layers=[{y:-9500,draw:ctx=>ground(ctx,home,yard)}];
 const edge=(a,b)=>layers.push({y:home.x+home.y+Math.max(a[1],b[1])/ISO_Y,draw:ctx=>fence(ctx,home,yard,a,b)});
 edge(left,back);edge(back,right);edge(left,front);
 // Two gateposts leave a real opening in the street-facing boundary.
 const point=t=>[front[0]+(right[0]-front[0])*t,front[1]+(right[1]-front[1])*t];
 edge(front,point(yard.gate-.11));edge(point(yard.gate+.11),right);
 for(const p of yard.plants){const at=world(home,p.x,p.y),key=['shrubLeaf','shrubFlower','shrubFern'][p.species];
  layers.push({y:at.x+at.y,draw:ctx=>{if(art[key]?.naturalWidth)upright(ctx,at.x,at.y,art[key],p.size,p.size*.67,undefined,p.x<0);}});
 }
 // One tall plant per property; opposite corners vary the roof silhouette.
 const treeX=random(yard.seed,900)>.5?-w+18:w-18,tree=world(home,treeX,-65);
 layers.push({y:tree.x+tree.y,draw:ctx=>{
  const index=yard.fence===1?2:3,image=art.villageLife;
  if(image?.naturalWidth)upright(ctx,tree.x,tree.y,image,115+yard.fence*14,155+yard.fence*17,[index*384,0,384,384]);
 }});
 return layers;
}
