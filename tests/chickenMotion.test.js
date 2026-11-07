import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LivingFarmVisual,coopNestPoint} from '../public/js/livingVisual.js';
import {livingLayout,YARD_CANDIDATES} from '../public/js/shared/livingLayout.js';
import {coopGeometry,worldToCoop,chickenWalkable,insideFloor} from '../public/js/animalMotion.js';
import {COOP_HOUSE_OFFSET} from '../public/js/shared/coopPlacement.js';
import {drawWalkingChicken,chickenPeckFrame,chickenMotionFrame} from '../public/js/animalDrawing.js';

test('chicken feed is thrown into trough and its visible amount rises then falls',()=>{
  const visual=new LivingFarmVisual(),layout=livingLayout(),g=coopGeometry(layout.yard);
  const original=Object.getOwnPropertyDescriptor(performance,'now');let now=0,count=0;
  Object.defineProperty(performance,'now',{configurable:true,value:()=>now});
  const ctx={save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},fillRect(){},ellipse(){count++;},fill(){}};
  try{
    visual.drawTrough(ctx,g);const baseline=count;
    visual.onAction({action:'feed_chicken',entityId:1},{state:{}},null,{x:1074,y:160},layout);
    const food=worldToCoop(g,visual.event.food);
    assert.ok(food.x>g.width*.49&&food.x<g.width*.64);
    assert.ok(food.y>g.height*.61&&food.y<g.height*.66);
    now=2000;count=0;visual.drawTrough(ctx,g);assert.ok(count>baseline*5);
    now=30000;count=0;visual.drawTrough(ctx,g);assert.equal(count,baseline);
  }finally{if(original)Object.defineProperty(performance,'now',original);else delete performance.now;}
});

test('chick is smaller and turning uses a front pose instead of squeezing the sprite',()=>{
  const calls=[],scales=[];
  const ctx={save(){},restore(){},translate(){},transform(){},rotate(){},scale(x,y){scales.push([x,y]);},beginPath(){},ellipse(){},fill(){},globalAlpha:1,drawImage(...args){calls.push(args);}};
  const image={naturalWidth:1774,naturalHeight:887},bird={moving:false,mode:'idle',phase:0,turn:0,back:false};
  drawWalkingChicken(ctx,image,true,0,0,bird,0,false,{turn:image});
  assert.ok(calls.length>0);
  assert.equal(calls[0][1],image.naturalWidth/5*2,'turn passes through front-facing column');
  const chickWidth=calls[0][7];calls.length=0;
  drawWalkingChicken(ctx,image,false,0,0,{...bird,turn:1},0,false);
  assert.ok(chickWidth<calls[0][7]);
  assert.ok(scales.every(([x,y])=>Math.abs(x)===1&&y===1));
  calls.length=0;
  drawWalkingChicken(ctx,image,true,0,0,{...bird,turn:1,mode:'peck'},.35,false);
  assert.equal(calls.length,1,'peck draws one whole opaque frame');
  assert.equal(calls[0][1],image.naturalWidth/6*5,'peck uses the ground-contact pose');
});

test('walking selects four real leg poses and turning passes through five opaque perspectives',()=>{
  for(const young of [true,false]){
    const columns=[0,1,2,3].map(frame=>chickenMotionFrame({turn:1,phase:(frame+.1)*Math.PI/2},young).column);
    assert.deepEqual(columns,[0,1,2,3]);
    const turns=[.97,.5,0,-.5,-.97].map(turn=>chickenMotionFrame({turn,phase:0},young));
    assert.deepEqual(turns.map(p=>p.column),[0,1,2,3,4]);
    assert.ok(turns.every(p=>p.atlas==='turn'&&!p.mirror));
  }
});

test('pecking dips quickly, touches feed briefly, and rises to swallow',()=>{
  const frames=[];for(let t=0;t<=6;t+=.02)frames.push(chickenPeckFrame(t));
  assert.deepEqual([...new Set(frames)].sort(),[0,1,2,3,4,5]);
  assert.equal(chickenPeckFrame(.32),5);
  assert.equal(chickenPeckFrame(.4),5);
  assert.equal(chickenPeckFrame(1),0);
  for(let i=1;i<frames.length;i++)assert.ok(Math.abs(frames[i]-frames[i-1])<=1);
  assert.ok(chickenPeckFrame(.2,0,'eat',true)<chickenPeckFrame(.2,0,'eat',false),'chicks lower their heads more slowly');
});

test('adult keeps walking frames during waypoint and crowd pauses instead of flashing a peck pose',()=>{
 const peck={naturalWidth:1200,naturalHeight:400},walk={naturalWidth:800,naturalHeight:800},drawn=[];
 const ctx={save(){},restore(){},translate(){},transform(){},scale(){},beginPath(){},ellipse(){},fill(){},drawImage(image){drawn.push(image);}};
 for(const bird of [{path:[{x:1,y:1}],speed:4},{path:[],speed:2}]){
  drawWalkingChicken(ctx,peck,false,0,0,{moving:false,mode:'eat',turn:1,phase:0,...bird},0,false,{walk});
  assert.equal(drawn.at(-1),walk);
 }
 drawWalkingChicken(ctx,peck,false,0,0,{moving:false,mode:'eat',turn:1,phase:0,path:[],speed:0},.35,false,{walk});
 assert.equal(drawn.at(-1),peck);
});

test('ready eggs render over the nesting shelf inside the coop',()=>{
  const layout=livingLayout(),g=coopGeometry(layout.yard),point=worldToCoop(g,coopNestPoint(layout.yard));
  assert.ok(point.x>g.width*(.1+COOP_HOUSE_OFFSET.u)&&point.x<g.width*(.2+COOP_HOUSE_OFFSET.u));
  assert.ok(point.y>g.height*(.57+COOP_HOUSE_OFFSET.v)&&point.y<g.height*(.67+COOP_HOUSE_OFFSET.v));
  const visual=new LivingFarmVisual();
  assert.ok(visual.eggLayer(null,{coop:{chickens:[{eggsReady:0}]}},layout),'empty straw nest remains visible');
  assert.ok(visual.eggLayer(null,{coop:{chickens:[{eggsReady:2}]}},layout));
});

for(const yard of YARD_CANDIDATES)test(`chickens remain inside the artwork rails for ten simulated minutes, yard ${yard.x}`,()=>{
  const visual=new LivingFarmVisual(),layout={...livingLayout(),yard},g=coopGeometry(yard);
  const original=Object.getOwnPropertyDescriptor(performance,'now');let time=0;
  Object.defineProperty(performance,'now',{configurable:true,value:()=>time*1000});
  const modes=new Set(),positions=new Map(),travel=new Map(),rows=[1,2,3,4].map(id=>({id,status:'WAITING_FOR_FEED',eggsReady:0}));
  try{
    for(time=0;time<600;time+=.08){
      visual.hits=[];visual.chickenLayers(null,{},null,{coop:{chickens:rows}},layout,false);
      for(const [id,bird] of visual.chickenMotion){
        if(!bird.moving&&!bird.path.length)modes.add(bird.mode);const p=worldToCoop(g,bird);
        assert.ok(chickenWalkable(g,p),'full bird remains behind rails and outside feed/water props');
        for(const [dx,dy] of [[-14,-30],[14,-30],[-14,4],[14,4]])assert.ok(insideFloor(g,{x:p.x+dx,y:p.y+dy}));
        const previous=positions.get(id);if(previous){const d=Math.hypot(p.x-previous.x,p.y-previous.y);assert.ok(d<1.4,'no teleporting');travel.set(id,(travel.get(id)||0)+d);}positions.set(id,p);
      }
    }
    for(const mode of ['walk','idle','peck','eat','drink','roost'])assert.ok(modes.has(mode),mode);
    for(const id of [1,2,3,4])assert.ok(travel.get(id)>100,'each chicken actually walks');
    // A layout change and reduced-effects mode must not retain an escaped position.
    visual.chickenLayers(null,{},null,{coop:{chickens:rows.slice(0,1)}},{...layout,yard:YARD_CANDIDATES[1]},true);
    assert.equal(visual.chickenMotion.size,1);
  }finally{if(original)Object.defineProperty(performance,'now',original);else delete performance.now;}
});
