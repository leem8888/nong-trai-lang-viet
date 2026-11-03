import { CROPS, CROP_IDS, FIELD, tileAt, tileRect, cropProgress } from './shared/crops.js';

const stageNames = { SEED:'Hạt mới gieo', SPROUT:'Nảy mầm', GROWING:'Đang lớn', MATURE:'Đã trưởng thành' };
export class FarmingUI {
  constructor(api, showError, showNotice, openPanel) {
    this.api=api; this.showError=showError; this.showNotice=showNotice; this.openPanel=openPanel;
    this.tool='till'; this.cropId='mustard'; this.state=null; this.hover=null; this.selected=null;
    this.receivedAt=0; this.lastInfo=0;
    for(const button of document.querySelectorAll('[data-tool]')) button.onclick=()=>this.chooseTool(button.dataset.tool);
    const select=document.getElementById('seedSelect');
    for(const id of CROP_IDS) select.add(new Option(CROPS[id].name,id));
    select.value=this.cropId; select.onchange=()=>{this.cropId=select.value;this.chooseTool('plant');};
    document.getElementById('inventoryButton').onclick=()=>this.showInventory();
    document.getElementById('claimSeeds').onclick=()=>this.act('claim_seeds');
    this.chooseTool('till');
  }
  chooseTool(tool) {
    this.tool=tool;
    for(const button of document.querySelectorAll('[data-tool]')) button.classList.toggle('selected',button.dataset.tool===tool);
  }
  setState(state) { this.state=state; this.receivedAt=performance.now(); this.updateInfo(true); this.updateSeeds(); }
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
    if(!this.state)return;
    try {
      const payload={farmId:this.state.farmId,action};
      if(action!=='claim_seeds') { if(!tile)return; payload.x=tile.x;payload.y=tile.y; }
      if(action==='plant') payload.cropId=this.cropId;
      const result=await this.api('/farming/action',{method:'POST',body:JSON.stringify(payload)});
      this.setState(result.state); this.showNotice(result.message);
    } catch(error) { this.showError(error.message); }
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
    const rows=this.state.inventory.filter(item=>item.quantity>0).map(item=>`<li><span style="color:${item.color}">◆</span> ${item.name}: <b>${item.quantity}</b><small>${item.description}</small></li>`).join('');
    this.openPanel(`<h2>Túi đồ</h2><ul class="inventory-list">${rows||'<li>Chưa có vật phẩm.</li>'}</ul><p>Chọn loại hạt ở thanh công cụ trước khi gieo.</p>`);
  }
  draw(ctx) {
    if(!this.state)return;
    const time=this.serverNow();
    for(const tile of this.state.tiles) {
      const r=tileRect(tile.x,tile.y);
      ctx.fillStyle=tile.state==='EMPTY'?'#795b3b':tile.state==='WATERED'?'#4d4034':'#644d35';
      ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.strokeStyle='#a78957';ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);
      if(tile.state==='WATERED'||tile.crop?.wateredAt){ctx.fillStyle='#6aa4b2';ctx.fillRect(r.x+4,r.y+4,8,3);ctx.fillRect(r.x+r.w-13,r.y+r.h-8,6,3);}
      if(tile.crop) this.drawCrop(ctx,r,tile.crop,time);
    }
    const mark=this.hover||this.selected;
    if(mark){const r=tileRect(mark.x,mark.y);ctx.strokeStyle='#fff1a2';ctx.lineWidth=3;ctx.strokeRect(r.x+1.5,r.y+1.5,r.w-3,r.h-3);ctx.lineWidth=1;}
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
