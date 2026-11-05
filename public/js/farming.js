import { CROPS, CROP_IDS, FIELD, tileAt, tileRect, cropProgress } from './shared/crops.js';
import { ISO_X, ISO_Y } from './core/IsoProjection.js';

const stageNames = { SEED:'Hạt mới gieo', SPROUT:'Nảy mầm', GROWING:'Đang lớn', MATURE:'Đã trưởng thành' };
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
  async unlockPlot(){if(this.unlocking)return;this.unlocking=true;this.unlockRequestId??=crypto.randomUUID();this.unlockIntent??={action:'unlock_plot',farmId:this.state.farmId,requestId:this.unlockRequestId,expectedCount:this.state.plots.unlocked+1};document.querySelector('[data-unlock-plot]')?.setAttribute('disabled','');try{const r=await this.api('/farming/action',{method:'POST',body:JSON.stringify(this.unlockIntent)});this.unlockRequestId=null;this.unlockIntent=null;this.setState(r.state);this.showNotice(r.message);this.showPlots();}catch(e){if(e.status>=400&&e.status<500){this.unlockRequestId=null;this.unlockIntent=null;}this.showError(e.message);try{this.setState(await this.api('/farming'));this.showPlots();}catch{}}finally{this.unlocking=false;document.querySelector('[data-unlock-plot]')?.removeAttribute('disabled');}}
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
    if(!target.crop){info.textContent=`Ô (${target.x+1}, ${target.y+1}) · ${target.state==='EMPTY'?'Chưa cuốc':target.state==='WATERED'?'Đã tưới':'Đã cuốc'}`;document.getElementById('cropProgress').value=0;return;}
    const crop=CROPS[target.crop.cropId], growth=cropProgress(target.crop,this.serverNow());
    const minutes=Math.ceil(growth.remainingMs/60000);
    info.textContent=`${crop.name} · ${stageNames[growth.stage]}${minutes?` · còn khoảng ${minutes} phút`: ' · có thể thu hoạch'}`;
    document.getElementById('cropProgress').value=growth.progress;
  }
  showInventory() {
    if(!this.state)return;
    const rows=this.state.inventory.filter(item=>item.quantity>0).map(item=>`<li><span style="color:${item.color}">${item.icon||'◆'}</span> ${item.name}: <b>${item.quantity}</b><small>${item.description}</small></li>`).join('');
    this.openPanel(`<h2>Túi đồ</h2><ul class="inventory-list">${rows||'<li>Chưa có vật phẩm. Hãy cuốc đất, nhận hạt miễn phí nếu đã hết, rồi gieo và thu hoạch.</li>'}</ul><p>Chạm ô đã cuốc để chọn hạt giống và gieo. Khi có nông sản, đến Chợ Quê để bán.</p>`);
  }
  draw(ctx) {
    if(!this.state)return;
    const time=this.serverNow();
    if(this.isometric&&this.terrainArt?.naturalWidth){
      if(this.meadowSource!==this.terrainArt){const image=this.terrainArt,c=document.createElement('canvas');c.width=c.height=128;c.getContext('2d').drawImage(image,image.naturalWidth*.75,image.naturalHeight*.25,image.naturalWidth*.25,image.naturalHeight*.25,0,0,128,128);this.meadowPattern=ctx.createPattern(c,'repeat');this.meadowSource=image;}
      const owned=this.state.tiles.filter(tile=>!tile.locked);ctx.save();ctx.beginPath();for(const tile of owned){const r=tileRect(tile.x,tile.y);ctx.rect(r.x-6,r.y-6,FIELD.stepX+12,FIELD.stepY+12);}ctx.fillStyle='#aa925e';ctx.globalAlpha=.32;ctx.shadowColor='#3a5135';ctx.shadowBlur=12;ctx.fill();ctx.clip();ctx.shadowBlur=0;ctx.globalAlpha=.72;ctx.fillStyle=this.meadowPattern;ctx.fillRect(FIELD.x-10,FIELD.y-10,FIELD.columns*FIELD.stepX+20,FIELD.rows*FIELD.stepY+20);ctx.restore();
    }
    for(const tile of this.state.tiles) {
      const r=tileRect(tile.x,tile.y);
      if(tile.locked)continue;
      if(this.isometric&&this.soilArt?.naturalWidth&&this.upright){
        if(tile.state==='EMPTY'&&!tile.crop){ctx.fillStyle='#8e6743';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#b08a5b';for(let i=0;i<3;i++)ctx.fillRect(r.x+8+i*12,r.y+13+i%2*11,7,3);ctx.strokeStyle='#d3ad76';ctx.lineWidth=1.5;ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);}else{const image=this.soilArt,cw=image.naturalWidth/4,ch=image.naturalHeight/2,variant=(tile.x*3+tile.y*5)%4,wet=tile.state==='WATERED'||Boolean(tile.crop?.wateredAt),offset=56/(4*ISO_Y);ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.fillStyle=wet?'#4d4034':'#795b3b';ctx.fillRect(r.x,r.y,r.w,r.h);this.upright(ctx,r.x+r.w/2+offset,r.y+r.h/2+offset,image,76,56,[variant*cw,wet?ch:0,cw,ch]);ctx.restore();ctx.strokeStyle='#ae8a57';ctx.lineWidth=1;ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);}
        continue;
      }
      ctx.fillStyle=tile.state==='EMPTY'?'#795b3b':tile.state==='WATERED'?'#4d4034':'#644d35';
      ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.strokeStyle='#a78957';ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);
      if(tile.state==='EMPTY'){ctx.fillStyle='#9b7853';for(let i=0;i<3;i++)ctx.fillRect(r.x+8+i*18,r.y+13+i%2*9,9,2);}
      else {ctx.strokeStyle=tile.state==='WATERED'?'#678d91':'#9d7651';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(r.x+5,r.y+11+i*9);ctx.lineTo(r.x+r.w-5,r.y+11+i*9);ctx.stroke();}}
      if(tile.state==='WATERED'||tile.crop?.wateredAt){ctx.fillStyle='#6aa4b2';ctx.fillRect(r.x+4,r.y+4,8,3);ctx.fillRect(r.x+r.w-13,r.y+r.h-8,6,3);}
      if(tile.crop&&cropProgress(tile.crop,time).stage!=='MATURE'){ctx.save();ctx.fillStyle='#332217ed';ctx.shadowColor='#21170ed0';ctx.shadowBlur=3;ctx.beginPath();ctx.ellipse(r.x+r.w/2,r.y+r.h/2,r.w*.34,r.h*.34,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      if(tile.crop&&!this.isometric) this.drawCrop(ctx,r,tile.crop,time);
    }
    const next=this.state.tiles.find(tile=>tile.locked&&tile.y*FIELD.columns+tile.x===this.state.plots?.unlocked);
    if(next){const r=tileRect(next.x,next.y);ctx.save();ctx.translate(r.x+r.w/2,r.y+r.h/2);if(this.isometric)ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.fillStyle='#76502d';ctx.fillRect(-1.5,-7,3,17);ctx.fillStyle='#a36b3d';ctx.strokeStyle='#e1b77d';ctx.lineWidth=1.3;ctx.beginPath();ctx.roundRect(-27,-22,54,17,2);ctx.fill();ctx.stroke();ctx.strokeStyle='#bd8550';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-23,-18);ctx.lineTo(23,-18);ctx.moveTo(-23,-9);ctx.lineTo(23,-9);ctx.stroke();ctx.fillStyle='#fff0cb';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Mua đất',0,-13);ctx.restore();}
    if(this.preview?.size){ctx.save();ctx.fillStyle='#e8cf7470';ctx.strokeStyle='#fff2a8';ctx.lineWidth=2;for(const tile of this.preview.values()){const r=tileRect(tile.x,tile.y);ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);ctx.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4);}ctx.restore();}
    if(this.hover){const r=tileRect(this.hover.x,this.hover.y),locked=this.tile(this.hover.x,this.hover.y)?.locked;ctx.save();ctx.strokeStyle=locked?'#d8e9be':'#fff1a2';ctx.lineWidth=1.5;ctx.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);ctx.restore();}
    this.updateInfo();
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
