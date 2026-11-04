import { CROPS, CROP_IDS, FIELD, tileAt, tileRect, cropProgress } from './shared/crops.js';
import { BUILDINGS, DECORATIONS, footprint, TILE_SIZE } from './shared/phase5.js';

const $ = id => document.getElementById(id);
const labels = { till:'Cuốc đất', plant:'Gieo hạt', water:'Tưới', harvest:'Thu hoạch' };
const key = t => `${t.x}:${t.y}`;
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));

export function traceTiles(a,b) {
  const result=[];
  const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8);
  for(let i=0;i<=steps;i++) {
    const t=tileAt(a.x+(b.x-a.x)*i/Math.max(1,steps),a.y+(b.y-a.y)*i/Math.max(1,steps));
    if(t && key(t)!==key(result.at(-1)||{})) result.push(t);
  }
  return result;
}

export function validSoilActions(tile,inventory,now) {
  if(!tile)return [];
  if(tile.state==='EMPTY')return ['till'];
  if(!tile.crop)return tile.state==='TILLED' ? ['plant','water'] : tile.state==='WATERED' ? ['plant'] : [];
  const ready=cropProgress(tile.crop,now).stage==='MATURE';
  return [
    ...(tile.crop.wateredAt===null?['water']:[]),
    ...(ready?['harvest']:[])
  ];
}

export class ContextualInteraction {
  constructor({canvas,camera,farming,vac,phase5,input,notice,error,isOwner,isFarm,canReach,npcAt,onNpc,openPanel,onPan}) {
    Object.assign(this,{canvas,camera,farming,vac,phase5,input,notice,error,isOwner,isFarm,canReach,npcAt,onNpc,openPanel,onPan});
    this.mode='idle'; this.target=null; this.action=null; this.pointer=null; this.preview=new Map(); this.farming.preview=this.preview; this.seed='mustard'; this.touches=new Set();
    this.menu=$('contextMenu'); this.status=$('contextStatus');
    this.controller=new AbortController();const opts={signal:this.controller.signal};
    this.menu.addEventListener('click',e=>this.menuClick(e),opts);
    this.menu.addEventListener('change',e=>{if(e.target.id==='contextSeed'){this.seed=e.target.value;this.renderMenu();this.placeMenu();$('contextSeed')?.focus();}},opts);
    $('contextCancel').addEventListener('click',()=>this.cancel(),opts);
    $('contextDone').addEventListener('click',()=>this.cancel(),opts);
    canvas.addEventListener('pointermove',e=>this.move(e),opts);
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>this.finish(e,type),opts);
    document.addEventListener('pointerdown',e=>{if(this.mode==='contextMenuOpen'&&!this.menu.contains(e.target)&&e.target!==canvas)this.closeMenu();},opts);
    window.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.mode!=='idle'){this.cancel();e.preventDefault();}},opts);
    window.addEventListener('blur',()=>this.cancel(),opts);
    canvas.addEventListener('contextmenu',e=>{if(this.mode!=='idle'){e.preventDefault();this.cancel();}},opts);
  }
  objectAt(point) {
    for(const [kind,rows,catalog] of [['building',this.phase5.state?.buildings||[],BUILDINGS],['decoration',this.phase5.state?.decorations||[],DECORATIONS]])for(const row of rows){
      const size=footprint(catalog[row.definitionId],row.rotation),x=row.x*TILE_SIZE,y=row.y*TILE_SIZE;
      if(point.x>=x&&point.x<x+size.w*TILE_SIZE&&point.y>=y&&point.y<y+size.h*TILE_SIZE)return {kind,row,point:{x:x+size.w*TILE_SIZE/2,y:y+size.h*TILE_SIZE/2}};
    }
    if(Math.hypot(point.x-990,point.y-780)<80)return {kind:'pond',point:{x:990,y:780}};
    if(Math.hypot(point.x-1010,point.y-425)<80)return {kind:'coop',point:{x:1010,y:425}};
    return null;
  }
  down(point,e) {
    if(!this.isFarm()){const npc=this.npcAt?.(point);if(npc){this.open({kind:'npc',npc,point:{x:npc.x,y:npc.y}});return true;}return false;}
    if(e.pointerType==='touch'){this.touches.add(e.pointerId);if(this.touches.size>1){this.cancel();return true;}}
    if(this.mode==='submitting')return true;
    const tile=tileAt(point.x,point.y);
    if(this.mode==='actionArmed'){
      if(!tile){this.cancel();return false;}
      this.pointer={id:e.pointerId,type:e.pointerType,start:point,last:point,startedAt:performance.now(),dragging:false,moved:false};
      this.preview.clear();this.addTiles([tile]);this.canvas.setPointerCapture(e.pointerId);
      if(e.pointerType==='touch')this.pointer.timer=setTimeout(()=>{if(this.pointer?.id===e.pointerId){this.pointer.dragging=true;this.mode='dragging';this.renderStatus();}},380);
      return true;
    }
    if(tile){this.open({kind:'soil',tile,point:{x:tileRect(tile.x,tile.y).x+35,y:tileRect(tile.x,tile.y).y+21}});return true;}
    const object=this.objectAt(point);if(object){this.open(object);return true;}
    const npc=this.npcAt?.(point);if(npc){this.open({kind:'npc',npc,point:{x:npc.x,y:npc.y}});return true;}
    this.closeMenu();return false;
  }
  move(e) {
    const p=this.pointer;if(!p||p.id!==e.pointerId)return;
    const point=this.camera.toWorld(e.clientX,e.clientY);
    const distance=Math.hypot(point.x-p.start.x,point.y-p.start.y);
    if(p.type==='touch'&&!p.dragging){if(distance>12){clearTimeout(p.timer);p.moved=true;this.releasePointer();this.mode='actionArmed';this.preview.clear();this.renderStatus();this.onPan?.(point);}return;}
    if(distance>5)p.dragging=true;
    if(p.dragging){this.mode='dragging';this.addTiles(traceTiles(p.last,point));this.renderStatus();}
    p.last=point;
  }
  finish(e,type) {
    if(e.pointerType==='touch')this.touches.delete(e.pointerId);
    const p=this.pointer;if(!p||p.id!==e.pointerId)return;
    clearTimeout(p.timer);this.releasePointer();
    if(type!=='pointerup'||this.touches.size||p.moved){this.preview.clear();this.mode='actionArmed';this.renderStatus();return;}
    if(p.dragging)this.addTiles(traceTiles(p.last,this.camera.toWorld(e.clientX,e.clientY)));
    const tiles=[...this.preview.values()];this.preview.clear();this.submit(tiles);
  }
  releasePointer(){const p=this.pointer;this.pointer=null;if(p&&this.canvas.hasPointerCapture(p.id))this.canvas.releasePointerCapture(p.id);}
  addTiles(tiles){for(const tile of tiles){if(this.preview.size>=25)break;if(!this.preview.has(key(tile)))this.preview.set(key(tile),tile);}}
  open(target){this.cancel();this.target=target;this.mode='contextMenuOpen';this.renderMenu();this.menu.classList.remove('hidden');this.placeMenu();this.menu.querySelector('button,select')?.focus();}
  closeMenu(){this.menu.classList.add('hidden');if(this.mode==='contextMenuOpen')this.mode='idle';}
  cancel(){this.generation=(this.generation||0)+1;if(this.pointer?.timer)clearTimeout(this.pointer.timer);this.releasePointer();this.preview.clear();this.closeMenu();this.mode='idle';this.action=null;this.target=null;this.status.classList.add('hidden');this.touches.clear();}
  sceneChanged(){this.cancel();}
  renderMenu(){const target=this.target,owner=this.isOwner();let html='';
    if(target.kind==='npc'){
      const reachable=this.canReach(target.point,96);html=`<strong>${target.npc.name}</strong><small>${target.npc.role||'Người làng'}</small><button data-context-npc="${target.npc.id}" ${reachable?'':'disabled title="Đến gần để trò chuyện"'}>Trò chuyện${reachable?'':' · Đến gần'}</button>`;
    }else if(target.kind==='soil'){
      const tile=this.farming.tile(target.tile.x,target.tile.y);const actions=validSoilActions(tile,this.farming.state?.inventory||[],this.farming.serverNow());
      const crop=tile?.crop,progress=crop?cropProgress(crop,this.farming.serverNow()):null;
      html=`<strong>Ô đất ${target.tile.x+1}, ${target.tile.y+1}</strong><small>${crop?`${CROPS[crop.cropId].name} · ${Math.round(progress.progress*100)}%${progress.remainingMs?` · còn ${Math.ceil(progress.remainingMs/60000)} phút`:' · đã chín'}`:tile?.state==='EMPTY'?'Đất trống':tile?.state==='WATERED'?'Đã tưới':'Đã cuốc'}</small>`;
      if(owner&&actions.includes('plant'))html+=`<label>Hạt giống<select id="contextSeed" aria-label="Chọn hạt giống">${CROP_IDS.map(id=>`<option value="${id}" ${id===this.seed?'selected':''}>${CROPS[id].name} (${this.farming.state.inventory.find(i=>i.id===CROPS[id].seed)?.quantity||0})</option>`).join('')}</select></label>`;
      const reachable=this.canReach(target.point,110);
      html+=owner?actions.map(action=>{const n=action==='plant'?(this.farming.state.inventory.find(i=>i.id===CROPS[this.seed].seed)?.quantity||0):1;const reason=!reachable?'Đến gần ô đất để thao tác':!n?'Đã hết hạt giống':'';return `<button data-context-action="${action}" ${reason?`disabled title="${reason}"`:''}>${labels[action]}${reason?` · ${reason}`:''}</button>`;}).join(''):'<small>Bạn đang thăm farm. Chỉ chủ farm được thao tác.</small>';
      if(!actions.length&&owner)html+='<small>Ô này chưa có thao tác khả dụng.</small>';
    }else if(target.kind==='pond'||target.kind==='coop'){
      const pond=target.kind==='pond',s=pond?this.vac.state?.pond:this.vac.state?.coop;
      const reachable=this.canReach(target.point,96),canAct=owner&&reachable;
      html=`<strong>${pond?'Ao cá':'Chuồng gà'}</strong><small>${s?`${pond?s.fish.length:s.chickens.length}/${s.capacity} con`:'Đang tải…'}</small>`;
      if(canAct&&s){
        if(pond){const ready=s.fish.find(row=>!row.remainingMs),hungry=s.fish.find(row=>row.remainingMs&&row.fedAt===null);if(ready)html+=`<button data-context-vac="harvest_fish" data-entity-id="${ready.id}">Thu hoạch cá</button>`;if(hungry)html+=`<button data-context-vac="feed_fish" data-entity-id="${hungry.id}" ${(this.vac.count('fish_feed')||0)?'':'disabled title="Hết cám cá"'}>Cho cá ăn${this.vac.count('fish_feed')?'':' · Hết cám'}</button>`;}
        else{const eggs=s.chickens.reduce((n,row)=>n+row.eggsReady,0),hungry=s.chickens.find(row=>row.status==='WAITING_FOR_FEED');if(eggs)html+=`<button data-context-vac="collect_eggs">Nhặt trứng (${eggs})</button>`;if(hungry)html+=`<button data-context-vac="feed_chicken" data-entity-id="${hungry.id}" ${(this.vac.count('chicken_feed')||0)?'':'disabled title="Hết thức ăn gà"'}>Cho gà ăn${this.vac.count('chicken_feed')?'':' · Hết thức ăn'}</button>`;}
      }
      html+=owner?`<button data-context-open="${target.kind}" ${reachable?'':'disabled title="Đến gần để thao tác"'}>Xem và chăm sóc${reachable?'':' · Đến gần'}</button>`:'<small>Chỉ chủ farm được thao tác.</small>';
    }else{const def=(target.kind==='building'?BUILDINGS:DECORATIONS)[target.row.definitionId];html=`<strong>${def?.name||'Công trình'}</strong>${owner?`<button data-context-open="${target.kind==='building'?'craft':'decor'}">${target.kind==='building'?'Chế biến · Xem mẻ':'Trang trí · Di chuyển'}</button><button data-context-open="${target.kind==='building'?'build':'decor'}">${target.kind==='building'?'Xây dựng · Di chuyển':'Cất hoặc đổi vị trí'}</button>`:'<small>Chỉ chủ farm được thao tác.</small>'}`;}
    this.menu.innerHTML=html;
  }
  placeMenu(){if(this.menu.classList.contains('hidden')||!this.target)return;const p=this.target.point,rect=this.menu.getBoundingClientRect(),screen=this.camera.toScreen(p.x,p.y);let x=screen.x,y=screen.y;const margin=12;x=Math.max(margin,Math.min(innerWidth-rect.width-margin,x-rect.width/2));y=y+28+rect.height<innerHeight-margin?y+28:y-rect.height-28;this.menu.style.left=`${x}px`;this.menu.style.top=`${Math.max(margin,Math.min(innerHeight-rect.height-margin,y))}px`;}
  arm(action){if(!this.isOwner()||!this.isFarm())return;this.closeMenu();this.action=action;this.mode='actionArmed';this.renderStatus();}
  menuClick(e){const action=e.target.closest('[data-context-action]')?.dataset.contextAction,open=e.target.closest('[data-context-open]')?.dataset.contextOpen,vac=e.target.closest('[data-context-vac]'),npc=e.target.closest('[data-context-npc]');if(action){if(e.target.disabled)return;this.seed=$('contextSeed')?.value||this.seed;this.arm(action);}if(open){this.closeMenu();this.mode='idle';if(open==='pond'||open==='coop')this.vac.open(open);else this.phase5.open(open);}if(vac&&!vac.disabled){this.vac.current=this.target.kind;this.closeMenu();this.mode='idle';this.vac.act({action:vac.dataset.contextVac,...(vac.dataset.entityId?{entityId:Number(vac.dataset.entityId)}:{})},vac);}if(npc&&!npc.disabled){const id=npc.dataset.contextNpc;this.closeMenu();this.mode='idle';this.onNpc?.(id);}}
  renderStatus(text){this.status.classList.toggle('hidden',this.mode==='idle'||this.mode==='contextMenuOpen');$('contextInstruction').textContent=text||`${labels[this.action]} · ${this.mode==='dragging'?`${this.preview.size} ô đã chọn`: 'chạm một ô hoặc giữ và kéo qua nhiều ô'} · Esc để hủy`;}
  async submit(tiles){if(this.mode==='submitting'||!tiles.length)return;this.mode='submitting';this.renderStatus(`Đang xử lý 0/${tiles.length} ô…`);let ok=0,skipped=0,failed=0,firstError='';const action=this.action,seed=this.seed,generation=this.generation;
    for(const [index,tile] of tiles.entries()){
      if(generation!==this.generation||!this.isOwner()||!this.isFarm()){firstError='Đã rời farm hoặc mất quyền thao tác.';failed++;break;}
      const current=this.farming.tile(tile.x,tile.y),allowed=validSoilActions(current,this.farming.state.inventory,this.farming.serverNow());
      if(!allowed.includes(action)){skipped++;continue;}
      if(action==='plant'&&(this.farming.state.inventory.find(i=>i.id===CROPS[seed].seed)?.quantity||0)<1){skipped++;continue;}
      try{const result=await this.farming.api('/farming/action',{method:'POST',body:JSON.stringify({farmId:this.farming.state.farmId,action,x:tile.x,y:tile.y,...(action==='plant'?{cropId:seed}:{})})});this.farming.setState(result.state);ok++;}
      catch(error){failed++;firstError||=error.message;try{this.farming.setState(await this.farming.api('/farming'));}catch{firstError+=' · Không thể đồng bộ lại';break;}}
      this.renderStatus(`Đang xử lý ${index+1}/${tiles.length} ô · thành công ${ok}${failed?` · lỗi ${failed}`:''}`);
      if(index<tiles.length-1)await delay(140);
    }
    this.farming.selected=tiles.at(-1);this.farming.updateInfo(true);this.notice(`${labels[action]}: ${ok} thành công${skipped?`, ${skipped} bỏ qua`:''}${failed?`, ${failed} lỗi · ${firstError}`:''}`,action);
    if(generation===this.generation){this.mode='actionArmed';this.renderStatus();}
  }
  draw(ctx){if(!this.preview.size)return;ctx.save();ctx.fillStyle='#e8cf7470';ctx.strokeStyle='#fff2a8';ctx.lineWidth=2;for(const tile of this.preview.values()){const r=tileRect(tile.x,tile.y);ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);ctx.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4);}ctx.restore();}
  destroy(){this.cancel();this.controller.abort();}
}
