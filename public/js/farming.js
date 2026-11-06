import { CROPS, CROP_IDS, FIELD, tileAt, tileRect, cropProgress } from './shared/crops.js';
import { ISO_X, ISO_Y } from './core/IsoProjection.js';
import { itemArtwork } from './itemArtwork.js';

const stageNames = { SEED:'Hạt mới gieo', SPROUT:'Nảy mầm', GROWING:'Đang lớn', MATURE:'Đã trưởng thành' };
export function soilIsDry(tile,time){
  return !tile.locked&&tile.state==='PLANTED'&&!!tile.crop&&tile.crop.wateredAt==null&&cropProgress(tile.crop,time).stage!=='MATURE';
}
export class FarmingUI {
  constructor(api, showError, showNotice, openPanel) {
    this.api=api; this.showError=showError; this.showNotice=showNotice; this.openPanel=openPanel;
    this.tool='till'; this.cropId='mustard'; this.state=null; this.hover=null; this.selected=null;
    this.receivedAt=0; this.lastInfo=0; this.pending=false;
    for(const button of document.querySelectorAll('[data-tool]')) button.onclick=()=>this.chooseTool(button.dataset.tool);
    const select=document.getElementById('seedSelect');
    for(const id of CROP_IDS) select.add(new Option(CROPS[id].name,id));
    select.value=this.cropId; select.onchange=()=>{this.cropId=select.value;this.chooseTool('plant');};
    document.getElementById('inventoryButton').onclick=()=>this.showInventory();
    document.getElementById('claimSeeds').onclick=()=>this.act('claim_seeds');
    const expand=document.createElement('button');expand.type='button';expand.id='plotsButton';expand.textContent='Mở ô ruộng';expand.onclick=()=>this.showPlots();document.getElementById('toolbar').append(expand);
    document.getElementById('panel').addEventListener('click',e=>{if(e.target.closest('[data-unlock-plot]'))this.unlockPlot();});
    this.chooseTool('till');
  }
  chooseTool(tool) {
    this.tool=tool;
    for(const button of document.querySelectorAll('[data-tool]')) button.classList.toggle('selected',button.dataset.tool===tool);
  }
  setState(state) { this.state=state; this.receivedAt=performance.now(); this.updateInfo(true); this.updateSeeds();const p=state.plots;if(p)document.getElementById('plotsButton').textContent=`Ô ruộng ${p.unlocked}/${p.max}`; }
  showPlots(){const p=this.state?.plots;if(!p)return;this.openPanel(`<h2>Mở rộng ruộng</h2><p>Đã mở <b>${p.unlocked}/${p.max}</b> ô. Mỗi ô vuông 48×48, mở lần lượt từng ô.</p>${p.nextPrice===null?'<p>Đã mở toàn bộ ô ruộng.</p>':`<p>Mở ô số ${p.unlocked+1}: <b>${p.nextPrice.toLocaleString('vi-VN')} Đồng Làng</b></p><button data-unlock-plot ${this.unlocking?'disabled':''}>Xác nhận mở thêm 1 ô</button>`}<p class="hint">Giá các lần mở: 100, 175, 300, 475… Đồng Làng. Giá tăng theo số lần bạn đã mua ô.</p>`);}
  async unlockPlot(){if(this.unlocking)return;this.unlocking=true;this.unlockRequestId??=crypto.randomUUID();this.unlockIntent??={action:'unlock_plot',farmId:this.state.farmId,requestId:this.unlockRequestId,expectedCount:this.state.plots.unlocked+1};document.querySelector('[data-unlock-plot]')?.setAttribute('disabled','');try{const r=await this.api('/farming/action',{method:'POST',body:JSON.stringify(this.unlockIntent)});this.unlockRequestId=null;this.unlockIntent=null;this.setState(r.state);this.showNotice(r.message);document.getElementById('closePanel')?.click();}catch(e){if(e.status>=400&&e.status<500){this.unlockRequestId=null;this.unlockIntent=null;}this.showError(e.message);try{this.setState(await this.api('/farming'));this.showPlots();}catch{}}finally{this.unlocking=false;document.querySelector('[data-unlock-plot]')?.removeAttribute('disabled');}}
  updateSeeds() {
    if(!this.state)return;
    const select=document.getElementById('seedSelect');
    for(const option of select.options) option.textContent=`${CROPS[option.value].name} (${this.state.inventory.find(i=>i.id===CROPS[option.value].seed)?.quantity||0})`;
    const total=this.state.inventory.filter(i=>i.category==='seed').reduce((sum,i)=>sum+i.quantity,0);
    document.getElementById('claimSeeds').hidden=total>0;
  }
  serverNow() { return Math.floor(this.state.serverTime+performance.now()-this.receivedAt); }
  tile(x,y) { return this.state?.tiles.find(tile=>tile.x===x&&tile.y===y); }
  async act(action=this.tool, tile=this.selected) {
    if(!this.state||this.pending)return;
    if(action!=='claim_seeds'&&!tile)return;
    this.pending=true;
    document.getElementById('cropInfo').textContent='Đang xử lý…';
    try {
      const payload={farmId:this.state.farmId,action};
      if(action!=='claim_seeds') { payload.x=tile.x;payload.y=tile.y; }
      if(action==='plant') payload.cropId=this.cropId;
      const result=await this.api('/farming/action',{method:'POST',body:JSON.stringify(payload)});
      this.setState(result.state); this.showNotice(result.message,action);
    } catch(error) { this.showError(error.message); } finally { this.pending=false; this.updateInfo(true); }
  }
  point(point) {
    const tile=tileAt(point.x,point.y);
    if(!tile)return false;
    this.selected=tile; this.updateInfo(true); this.act(this.tool,tile); return true;
  }
  key(key) { const tools={1:'till',2:'plant',3:'water',4:'harvest'}; if(tools[key])this.chooseTool(tools[key]); }
  updateInfo(force=false) {
    if(!this.state || (!force&&performance.now()-this.lastInfo<500))return;
    this.lastInfo=performance.now();
    const target=this.selected ? this.tile(this.selected.x,this.selected.y) : null;
    const info=document.getElementById('cropInfo');
    if(!target){info.textContent='Chọn công cụ rồi nhấp vào ô ruộng.';document.getElementById('cropProgress').value=0;return;}
    if(!target.crop){info.textContent=`Ô (${target.x+1}, ${target.y+1}) · ${target.state==='EMPTY'?'Chưa cuốc':'Đã cuốc'}`;document.getElementById('cropProgress').value=0;return;}
    const crop=CROPS[target.crop.cropId], growth=cropProgress(target.crop,this.serverNow());
    const minutes=Math.ceil(growth.remainingMs/60000);
    info.textContent=`${crop.name} · ${stageNames[growth.stage]} · ${growth.stage==='MATURE'||target.crop.wateredAt!=null?'Đã tưới nước':'Cần tưới nước'}${minutes?` · còn khoảng ${minutes} phút`: ' · có thể thu hoạch'}`;
    document.getElementById('cropProgress').value=growth.progress;
  }
  showInventory() {
    if(!this.state)return;
    const items=this.state.inventory.filter(item=>item.quantity>0);
    const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const groups=[['seed','Hạt giống'],['stock','Con giống'],['produce','Nông sản'],['feed','Thức ăn'],['decoration','Trang trí']];
    const render=item=>`<li class="bag-slot" tabindex="0" title="${escape(item.description)}" aria-label="${escape(item.name)}: ${item.quantity}"><div class="bag-picture">${itemArtwork(item.id,item.name)}<span class="bag-quantity" aria-label="Số lượng">${item.quantity.toLocaleString('vi-VN')}</span></div><span class="bag-item-name">${escape(item.name)}</span></li>`;
    const known=new Set(groups.map(([id])=>id));
    if(items.some(item=>!known.has(item.category)))groups.push(['other','Vật phẩm khác']);
    const sections=groups.map(([id,label])=>{const rows=items.filter(item=>id==='other'?!known.has(item.category):item.category===id);return rows.length?`<section class="bag-group"><h3>${label}<span>${rows.length}</span></h3><ul class="bag-grid">${rows.map(render).join('')}</ul></section>`:'';}).join('');
    this.openPanel(`<div class="inventory-bag"><div class="bag-heading"><span class="bag-emblem" aria-hidden="true">🎒</span><div><h2>Túi đồ</h2><p>${items.length} loại vật phẩm đang có</p></div></div>${sections||'<div class="bag-empty">Túi đang trống.<br><small>Gieo trồng và thu hoạch để nhận vật phẩm.</small></div>'}<p class="bag-footer">Số lượng hiển thị ở góc mỗi vật phẩm.</p></div>`);
  }
  draw(ctx) {
    if(!this.state)return;
    const time=this.serverNow();
    for(const tile of this.state.tiles) {
      const r=tileRect(tile.x,tile.y);
      if(this.isometric&&tile.state==='EMPTY'&&!tile.crop){this.drawEmptyBed(ctx,r,tile);continue;}
      if(tile.locked)continue;
      if(this.isometric&&this.soilArt?.naturalWidth&&this.upright){
        if(tile.state==='EMPTY'&&!tile.crop){ctx.fillStyle='#8e6743';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#b08a5b';for(let i=0;i<3;i++)ctx.fillRect(r.x+8+i*12,r.y+13+i%2*11,7,3);ctx.strokeStyle='#d3ad76';ctx.lineWidth=1.5;ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);}else{this.drawRaisedBed(ctx,r,tile,time);}

        continue;
      }
      ctx.fillStyle=tile.state==='EMPTY'?'#795b3b':tile.state==='WATERED'?'#4d4034':'#644d35';
      ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.strokeStyle='#a78957';ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);
      if(tile.state==='EMPTY'){ctx.fillStyle='#9b7853';for(let i=0;i<3;i++)ctx.fillRect(r.x+8+i*18,r.y+13+i%2*9,9,2);}
      else {ctx.strokeStyle=tile.state==='WATERED'?'#678d91':'#9d7651';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(r.x+5,r.y+11+i*9);ctx.lineTo(r.x+r.w-5,r.y+11+i*9);ctx.stroke();}}
      if(tile.crop&&cropProgress(tile.crop,time).stage!=='MATURE'){ctx.save();ctx.fillStyle='#332217ed';ctx.shadowColor='#21170ed0';ctx.shadowBlur=3;ctx.beginPath();ctx.ellipse(r.x+r.w/2,r.y+r.h/2,r.w*.34,r.h*.34,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      if(tile.crop&&!this.isometric) this.drawCrop(ctx,r,tile.crop,time);
    }
    const next=this.state.tiles.find(tile=>tile.locked&&tile.y*FIELD.columns+tile.x===this.state.plots?.unlocked);
    if(next){const r=tileRect(next.x,next.y);ctx.save();ctx.translate(r.x+r.w/2,r.y+r.h/2);if(this.isometric)ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.scale(.7,.7);ctx.fillStyle='#76502d';ctx.fillRect(-1.5,-7,3,17);ctx.fillStyle='#a36b3d';ctx.strokeStyle='#e1b77d';ctx.lineWidth=1.3;ctx.beginPath();ctx.roundRect(-27,-22,54,17,2);ctx.fill();ctx.stroke();ctx.strokeStyle='#bd8550';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-23,-18);ctx.lineTo(23,-18);ctx.moveTo(-23,-9);ctx.lineTo(23,-9);ctx.stroke();ctx.fillStyle='#fff0cb';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Mua đất',0,-13);ctx.restore();}
    if(this.preview?.size){ctx.save();ctx.fillStyle='#e8cf7470';ctx.strokeStyle='#fff2a8';ctx.lineWidth=2;for(const tile of this.preview.values()){const r=tileRect(tile.x,tile.y);ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);ctx.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4);}ctx.restore();}
    if(this.hover){const r=tileRect(this.hover.x,this.hover.y),locked=this.tile(this.hover.x,this.hover.y)?.locked;ctx.save();ctx.strokeStyle=locked?'#d8e9be':'#fff1a2';ctx.lineWidth=1.5;ctx.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);ctx.restore();}
    this.updateInfo();
  }
  drawEmptyBed(ctx,r,tile){
    const artKey=tile.locked?'lockedBedArt':'emptyBedArt';
    if(!this[artKey]){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=56;
      const ground=canvas.getContext('2d');this.drawRaisedBed(ground,{x:4,y:4,w:48,h:48},{locked:true,state:'EMPTY'},0,tile.locked);
      ground.strokeStyle=tile.locked?'#4f8238':'#78904b';ground.lineWidth=1.4;ground.lineCap='round';
      for(const [x,y] of [[14,23],[34,17],[21,36],[39,31]]){ground.beginPath();ground.moveTo(x,y+3);ground.lineTo(x-2,y);ground.moveTo(x,y+3);ground.lineTo(x+2,y-1);ground.stroke();}
      this[artKey]=canvas;
    }
    ctx.save();ctx.globalAlpha=.96;ctx.drawImage(this[artKey],r.x-4,r.y-4);ctx.restore();
  }
  drawRaisedBed(ctx,r,tile,time=this.serverNow(),green=false) {
    const x=r.x+3,y=r.y+3,w=r.w-6,h=r.h-6;
    const shape=(left,top,width,height,radius)=>{ctx.beginPath();ctx.roundRect(left,top,width,height,radius);};
    ctx.save();
    ctx.fillStyle=green?'#354923a0':'#231a14a0';shape(x-1,y+1,w+3,h+3,13);ctx.fill();
    // Curved contours gradually rise to the crown instead of outlining a flat lid.
    for(let i=0;i<=24;i++){
      const t=i/24,inset=t*15,lift=Math.sin(t*Math.PI/2)*9;
      const brown=ctx.createLinearGradient(x,y,x+w,y+h),light=Math.round(66+38*Math.sin(t*Math.PI/2));
      brown.addColorStop(0,green?`rgb(${light+100},${light+130},${light+10})`:`rgb(${light+12},${Math.round(light*.69)},${Math.round(light*.43)})`);
      brown.addColorStop(1,green?`rgb(${light+75},${light+110},${light+5})`:`rgb(${light-6},${Math.round(light*.55)},${Math.round(light*.33)})`);
      ctx.fillStyle=brown;
      shape(x+inset-lift,y+inset-lift,w-inset*2,h-inset*2,Math.min(14,(w-inset*2)/2));ctx.fill();
    }
    // Moist clods follow the mound's curved surface; every bed uses the same texture.
    for(let i=0;i<65;i++){
      const u=((i*17)%61)/61,v=((i*29+7)%67)/67;
      const crown=Math.max(0,1-((u-.5)*2)**2-((v-.5)*2)**2),lift=Math.sqrt(crown)*9;
      const px=x+3+u*(w-6)-lift,py=y+3+v*(h-6)-lift;
      ctx.fillStyle=green?(i%3===0?'#e8eea45c':'#416d3560'):(i%3===0?'#ac805147':'#21180e70');
      ctx.beginPath();ctx.ellipse(px,py,.6+i%4*.24,.45+i%3*.16,-.4,0,Math.PI*2);ctx.fill();
      if(i%7===0){ctx.fillStyle=green?'#f0f4b964':'#bea17d52';ctx.beginPath();ctx.ellipse(px-.3,py-.5,.8,.35,-.4,0,Math.PI*2);ctx.fill();}
    }
    this.drawSoilCracks(ctx,r,tile,time);
    ctx.restore();
  }
  drawSoilCracks(ctx,r,tile,time){
    const x=r.x+3,y=r.y+3,w=r.w-6,h=r.h-6;
    if(soilIsDry(tile,time)){
      const cracks=[[[4,17],[8,13],[12,15],[13,9]],[[8,13],[7,8]],[[27,7],[30,12],[35,13],[37,18]],[[30,12],[27,17]],[[6,28],[10,31],[9,36]],[[10,31],[17,33],[18,37]],[[26,34],[30,30],[35,31],[38,27]],[[30,30],[28,25]]];
      const surface=([px,py])=>{const u=px/w,v=py/h,lift=Math.sqrt(Math.max(0,1-((u-.5)*2)**2-((v-.5)*2)**2))*9;return [x+px-lift,y+py-lift];};
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      for(const [color,width,offset] of [['#dbb57b9c',3.2,1],['#20130eef',1.9,0]]){
        ctx.beginPath();for(const crack of cracks)crack.forEach((p,i)=>{const [px,py]=surface(p);if(i)ctx.lineTo(px,py+offset);else ctx.moveTo(px,py+offset);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
      }
      ctx.restore();
    }
  }
  drawFieldBorders(ctx) {
    const inside=[],outside=[];
    const x=FIELD.x-1,y=FIELD.y-1;
    const right=x+FIELD.columns*FIELD.stepX,bottom=y+FIELD.rows*FIELD.stepY;
    for(let column=1;column<FIELD.columns;column++){
      const lineX=x+column*FIELD.stepX;
      inside.push([lineX,y,lineX,bottom]);
    }
    for(let row=1;row<FIELD.rows;row++){
      const lineY=y+row*FIELD.stepY;
      inside.push([x,lineY,right,lineY]);
    }
    outside.push([x,y,right,y],[right,y,right,bottom],[right,bottom,x,bottom],[x,bottom,x,y]);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const stroke=(edges,color,width,offset=0)=>{
      ctx.beginPath();
      for(const [x1,y1,x2,y2] of edges){ctx.moveTo(x1,y1+offset);ctx.lineTo(x2,y2+offset);}
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
    };
    // Light earthen shoulders and a dark groove remain visible over grass and wet soil.
    stroke(inside,'#c29a61',6);
    stroke(inside,'#50351f',3.5);
    stroke(inside,'#936638',1.5);
    // The outer trench encloses every plot, including land not purchased yet.
    stroke(outside,'#44301e',10);
    stroke(outside,'#b48b53',7);
    stroke(outside,'#79502e',5);
    stroke(outside,'#50351f',2.5);
    ctx.restore();
  }
  drawCrop(ctx,r,crop,time) {
    const definition=CROPS[crop.cropId], growth=cropProgress(crop,time);
    const cx=r.x+r.w/2,cy=r.y+r.h/2;
    if(growth.stage==='SEED'){ctx.fillStyle=definition.color;ctx.fillRect(cx-4,cy-3,8,6);return;}
    const height=growth.stage==='SPROUT'?12:growth.stage==='GROWING'?24:31;
    ctx.fillStyle='#3b783e';ctx.fillRect(cx-2,cy+13-height,4,height);
    ctx.beginPath();ctx.ellipse(cx-9,cy+7-height*.55,10,5,-.5,0,7);ctx.ellipse(cx+9,cy+7-height*.55,10,5,.5,0,7);ctx.fill();
    if(growth.stage==='SPROUT')return;
    ctx.fillStyle=definition.color;
    const large=growth.stage==='MATURE';
    if(definition.shape==='leaf') {for(const offset of [-12,0,12]){ctx.beginPath();ctx.ellipse(cx+offset,cy+3,large?10:7,large?8:5,0,0,7);ctx.fill();}}
    else if(definition.shape==='root'){ctx.beginPath();ctx.moveTo(cx-7,cy+4);ctx.lineTo(cx+7,cy+4);ctx.lineTo(cx,cy+(large?20:13));ctx.fill();}
    else if(definition.shape==='stalk'||definition.shape==='cob'){for(const offset of [-8,0,8]){ctx.fillRect(cx+offset-2,cy-height+1,large?6:4,large?15:9);}}
    else {for(const offset of [-10,0,10]){ctx.beginPath();ctx.arc(cx+offset,cy-9+(offset===0?-6:0),large?6:4,0,7);ctx.fill();}}
    if(large){ctx.fillStyle='#f7e7a0';ctx.fillRect(r.x+r.w-10,r.y+3,5,5);}
  }
}
