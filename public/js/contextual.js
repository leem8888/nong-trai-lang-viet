import { CROPS, CROP_IDS, FIELD, tileAt, tileRect, cropProgress } from './shared/crops.js';
import { BUILDINGS, DECORATIONS, footprint, TILE_SIZE } from './shared/phase5.js';
import { VAC_POINTS, FISH, CHICKEN } from './shared/vac.js';
import { livingLayout,pondObstacles } from './shared/livingLayout.js';
import { overlaps } from './systems/CollisionSystem.js';
import { ISO_X } from './core/IsoProjection.js';

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
  if(!tile||tile.locked)return [];
  if(tile.state==='EMPTY')return ['till'];
  if(!tile.crop)return tile.state==='TILLED' ? ['plant','water'] : tile.state==='WATERED' ? ['plant'] : [];
  const ready=cropProgress(tile.crop,now).stage==='MATURE';
  return [
    ...(tile.crop.wateredAt===null?['water']:[]),
    ...(ready?['harvest']:[])
  ];
}

export class ContextualInteraction {
  constructor({canvas,camera,farming,vac,phase5,input,notice,error,isOwner,isFarm,canReach,npcAt,onNpc,openPanel,onPan,approachObject,animalAt,animalAtPosition}) {
    this.animalAt=animalAt;this.animalAtPosition=animalAtPosition;
    Object.assign(this,{canvas,camera,farming,vac,phase5,input,notice,error,isOwner,isFarm,canReach,npcAt,onNpc,openPanel,onPan,approachObject});
    this.mode='idle'; this.target=null; this.action=null; this.pointer=null; this.preview=new Map(); this.farming.preview=this.preview; this.seed='mustard'; this.touches=new Set();
    this.menu=$('contextMenu'); this.status=$('contextStatus');
    this.controller=new AbortController();const opts={signal:this.controller.signal};
    this.menu.addEventListener('click',e=>this.menuClick(e),opts);
    this.menu.addEventListener('pointerdown',e=>{
      const button=e.target.closest('[data-context-action]');
      if(!button||button.disabled||this.target?.kind!=='soil'||!this.isOwner())return;
      e.preventDefault();const tile=this.target.tile,point=this.target.point;
      if(button.dataset.cropId)this.seed=button.dataset.cropId;
      this.arm(button.dataset.contextAction);
      this.pointer={id:e.pointerId,type:e.pointerType,start:point,last:point,startedAt:performance.now(),dragging:false,moved:false};
      this.preview.clear();this.addTiles([tile]);this.canvas.setPointerCapture(e.pointerId);
      if(e.pointerType==='touch')this.pointer.dragging=true;
    },opts);
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
    const animal=this.animalAt?.(point);
    if(animal)return {kind:animal.kind,entityId:animal.entityId,point:{x:animal.x,y:animal.y},accessPoint:VAC_POINTS[animal.kind]};
    for(const [kind,rows,catalog] of [['building',this.phase5.state?.buildings||[],BUILDINGS],['decoration',this.phase5.state?.decorations||[],DECORATIONS]])for(const row of rows){
      const size=footprint(catalog[row.definitionId],row.rotation),x=row.x*TILE_SIZE,y=row.y*TILE_SIZE;
      if(point.x>=x&&point.x<x+size.w*TILE_SIZE&&point.y>=y&&point.y<y+size.h*TILE_SIZE)return {kind,row,point:{x:x+size.w*TILE_SIZE/2,y:y+size.h*TILE_SIZE/2}};
    }
    const layout=livingLayout(this.phase5.state?.buildings,this.phase5.state?.decorations),p=layout.pond;
    if(pondObstacles(p).some(o=>overlaps(point.x,point.y,25,o)))return {kind:'pond',point,accessPoint:VAC_POINTS.pond};
    const yard=layout.yard;
    if((point.x>=1020&&point.x<=1330&&point.y>=55&&point.y<=245)||(yard&&point.x>=yard.x&&point.x<=yard.x+yard.w&&point.y>=yard.y&&point.y<=yard.y+yard.h))return {kind:'coop',point,accessPoint:VAC_POINTS.coop};
    return null;
  }
  down(point,e) {
    if(!this.isFarm()){const npc=this.npcAt?.(point);if(npc){this.open({kind:'npc',npc,point:{x:npc.x,y:npc.y}});return true;}return false;}
    if(e.pointerType==='touch'){this.touches.add(e.pointerId);if(this.touches.size>1){this.cancel();return true;}}
    if(this.mode==='submitting')return true;
    const tile=tileAt(point.x,point.y);
    if(tile&&this.farming.tile(tile.x,tile.y)?.locked&&this.mode!=='actionArmed'){this.open({kind:'soil',tile,point:{x:tileRect(tile.x,tile.y).x+FIELD.width/2,y:tileRect(tile.x,tile.y).y+FIELD.height/2}});return true;}
    if(this.mode==='actionArmed'){
      if(!tile){this.cancel();return false;}
      this.pointer={id:e.pointerId,type:e.pointerType,start:point,last:point,startedAt:performance.now(),dragging:false,moved:false};
      this.preview.clear();this.addTiles([tile]);this.canvas.setPointerCapture(e.pointerId);
      if(e.pointerType==='touch')this.pointer.timer=setTimeout(()=>{if(this.pointer?.id===e.pointerId){this.pointer.dragging=true;this.mode='dragging';this.renderStatus();}},380);
      return true;
    }
    if(tile){this.open({kind:'soil',tile,point:{x:tileRect(tile.x,tile.y).x+FIELD.width/2,y:tileRect(tile.x,tile.y).y+FIELD.height/2}});return true;}
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
    const tiles=[...this.preview.values()];this.preview.clear();if(!tiles.length){this.mode='actionArmed';this.renderStatus();return;}this.submit(tiles);
  }
  releasePointer(){const p=this.pointer;this.pointer=null;if(p&&this.canvas.hasPointerCapture(p.id))this.canvas.releasePointerCapture(p.id);}
  addTiles(tiles){for(const tile of tiles){if(this.preview.size>=25)break;const current=this.farming.tile(tile.x,tile.y);if(!validSoilActions(current,this.farming.state?.inventory||[],this.farming.serverNow()).includes(this.action))continue;if(!this.preview.has(key(tile)))this.preview.set(key(tile),tile);}}
  async open(target){this.cancel();this.target=target;const generation=this.generation;
    this.mode='contextMenuOpen';this.renderMenu();this.menu.classList.remove('hidden');this.placeMenu();this.menu.querySelector('button,select')?.focus();}
  closeMenu(){this.menu.classList.add('hidden');this.farming.hover=null;if(this.mode==='contextMenuOpen')this.mode='idle';}
  cancel(){this.generation=(this.generation||0)+1;if(this.pointer?.timer)clearTimeout(this.pointer.timer);this.releasePointer();this.preview.clear();this.closeMenu();this.mode='idle';this.action=null;this.target=null;this.status.classList.add('hidden');this.touches.clear();}
  sceneChanged(){this.cancel();}
  renderMenu(){const target=this.target,owner=this.isOwner();let html='';
    this.menu.classList.toggle('pond-tray',['pond','coop'].includes(target.kind)&&!target.entityId);
    this.menu.classList.toggle('animal-tools',['pond','coop'].includes(target.kind)&&Boolean(target.entityId));
    this.menu.classList.toggle('soil-tools',target.kind==='soil');
    if(target.kind==='soil'){
      const tile=this.farming.tile(target.tile.x,target.tile.y),actions=validSoilActions(tile,this.farming.state?.inventory||[],this.farming.serverNow());
      this.menu.setAttribute('aria-label','Thao tác ô đất');
      if(tile?.locked){const p=this.farming.state.plots,next=target.tile.y*FIELD.columns+target.tile.x===p?.unlocked;this.menu.innerHTML=owner&&next&&p.nextPrice!==null?`<button class="soil-tool" data-context-open="plots" title="Mua 1 ô đất" aria-label="Mua 1 ô đất, ${p.nextPrice} Đồng Làng"><span class="soil-tool-symbol"><svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="plotCoin" x2="0.8" y2="1"><stop stop-color="#ffe7a2"/><stop offset="1" stop-color="#c58a2e"/></linearGradient></defs><circle cx="24" cy="24" r="18" fill="url(#plotCoin)" stroke="#8d5c22" stroke-width="2"/><circle cx="24" cy="24" r="13.5" fill="none" stroke="#fff0b6" stroke-width="1.5"/><rect x="19" y="19" width="10" height="10" rx="1" fill="#92703b" stroke="#ffe7a2" stroke-width="1.5"/><path d="M13 14Q19 8 27 10" fill="none" stroke="#fff6d4" stroke-width="2" stroke-linecap="round"/></svg></span><span class="tool-label">${p.nextPrice.toLocaleString('vi-VN')}</span></button>`:'<span class="soil-state">Chưa mở ô đất này</span>';return;}
      const tools={
        till:['<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 40L33 9" stroke="#80512c" stroke-width="6" stroke-linecap="round"/><path d="M13 39L33 9" stroke="#c89659" stroke-width="2" stroke-linecap="round"/><path d="M24 10L37 19L43 9L30 3Z" fill="#697f7d" stroke="#344d4b" stroke-width="2"/><path d="M29 5L41 11" stroke="#d0dfd6" stroke-width="2"/></svg>','Cuốc đất'],
        water:['<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M29 19C43 7 44 32 31 31" fill="none" stroke="#3d7561" stroke-width="5"/><path d="M15 23L5 16L3 20L16 34" fill="#6c9b78" stroke="#365c4b" stroke-width="2"/><path d="M15 16Q23 11 32 16L34 36Q24 42 13 36Z" fill="#72a27a" stroke="#365c4b" stroke-width="2"/><ellipse cx="23" cy="16" rx="9" ry="4" fill="#395e4c"/><path d="M17 23V33" stroke="#b5d2a0" stroke-width="3"/><path d="M4 23L2 27M7 27L5 31" stroke="#76bfda" stroke-width="2"/></svg>','Tưới nước'],
        harvest:['🧺','Thu hoạch']
      };
      let content=owner?actions.filter(a=>a!=='plant').map(action=>`<button class="soil-tool" data-context-action="${action}" title="${tools[action][1]} · Giữ và kéo để làm nhiều ô" aria-label="${tools[action][1]}"><span class="soil-tool-symbol">${tools[action][0]}</span><span class="tool-label">${tools[action][1]}</span></button>`).join(''):'';
      if(owner&&actions.includes('plant'))content+=CROP_IDS.map(id=>{const n=this.farming.state.inventory.find(i=>i.id===CROPS[id].seed)?.quantity||0;return `<button class="soil-tool" data-context-action="plant" data-crop-id="${id}" aria-label="Gieo ${CROPS[id].name}, còn ${n} hạt" title="${CROPS[id].name} · Giữ và kéo để gieo" ${n?'':'disabled'}><img src="/assets/items-v11/${id}.webp" alt=""><span class="tool-count">${n}</span><span class="tool-label">${CROPS[id].name}</span></button>`;}).join('');
      this.menu.innerHTML=content||`<span class="soil-state">${tile?.crop?'Cây đang lớn':'Chưa có thao tác'}</span>`;return;
    }
    if(target.kind==='coop'){
      const coop=this.vac.state?.coop;if(!coop)return;
      const tool=(action,item,label,count,enabled,entityId)=>`<button class="pond-tool" data-context-vac="${action}" ${entityId?`data-entity-id="${entityId}"`:''} title="${label}" aria-label="${label}" ${owner&&enabled?'':'disabled'}><img src="/assets/items-v11/${item}.webp" alt=""><span class="tool-count">${count}</span><span class="tool-label">${label}</span></button>`;
      if(target.entityId){const row=coop.chickens.find(r=>r.id===target.entityId);if(!row){this.closeMenu();return;}
        this.menu.setAttribute('aria-label',`Gà #${row.id}`);
        const young=row.status==='GROWING',canFeed=young?!row.growthFed:row.status==='WAITING_FOR_FEED';
        const status=young?'Gà con · Đang lớn':row.status==='WAITING_FOR_FEED'?'Trưởng thành · Chờ ăn':'Trưởng thành · Đang đẻ';
        const detail=young?`${Math.round((row.growthProgress||0)*100)}% · Còn ${Math.ceil(row.remainingMs/60000)} phút`:`${row.eggsReady}/${row.maxEggs} trứng${row.nextEggAt?` · Trứng tiếp sau ${Math.max(1,Math.ceil((row.nextEggAt-this.vac.state.serverTime)/60000))} phút`:''}`;
        this.menu.innerHTML=`<div class="fish-caption"><strong>Gà #${row.id}</strong><span>${status}</span><small>${detail}</small><small>${canFeed?'Chưa cho ăn':'Đã cho ăn'}</small></div>`+tool('feed_chicken','chicken_feed',canFeed?'Cho ăn':'Đã ăn',this.vac.count('chicken_feed'),canFeed&&this.vac.count('chicken_feed')>0,row.id)+(row.eggsReady?tool('collect_eggs','egg','Nhặt trứng',row.eggsReady,true):'');
      }else{const eggs=coop.chickens.reduce((n,c)=>n+c.eggsReady,0);this.menu.setAttribute('aria-label','Chăm sóc chuồng gà');this.menu.innerHTML=`<div class="pond-tray-heading"><span>Đàn gà</span><small>${coop.chickens.length}/${coop.capacity}</small></div><div class="pond-fingerlings">${tool('add_chicken','chick','Thêm gà',this.vac.count('chick'),this.vac.count('chick')>0&&coop.chickens.length<coop.capacity)}${tool('collect_eggs','egg','Nhặt trứng',eggs,eggs>0)}</div>`;}
      return;
    }
    if(target.kind==='pond'){
      const pond=this.vac.state?.pond;
      if(!pond)return;
      if(target.entityId){
        const fish=pond.fish.find(row=>row.id===target.entityId);
        if(!fish){this.closeMenu();return;}
        const ready=!fish.remainingMs,fed=fish.fedAt!==null,count=this.vac.count('fish_feed');
        const label=ready?'Thu hoạch cá':fed?'Cá đã được cho ăn':count?'Cho cá ăn':'Hết cám cá';
        const stage=ready?'Trưởng thành':fish.progress<.3?'Cá con':fish.progress<.75?'Đang lớn':'Sắp trưởng thành';
        this.menu.setAttribute('aria-label',`${FISH[fish.fishId].name} · ${Math.round(fish.progress*100)}% · ${label}`);
        this.menu.innerHTML=`<div class="fish-caption"><strong>${FISH[fish.fishId].name}</strong><span>${stage} · ${Math.round(fish.progress*100)}%</span><small>${ready?'Có thể thu hoạch':`Còn ${Math.ceil(fish.remainingMs/60000)} phút · ${fed?'Đã cho ăn':'Chưa cho ăn'}`}</small></div><button class="pond-tool" data-context-vac="${ready?'harvest_fish':'feed_fish'}" data-entity-id="${fish.id}" title="${label}" aria-label="${label}" ${!owner||!ready&&(fed||!count)?'disabled':''}>${ready?'<span class="harvest-net" aria-hidden="true">🕸️</span>':'<img src="/assets/items-v11/fish_feed.webp" alt="" draggable="false">'}<span class="tool-count">${ready?'✓':fed?'✓':count}</span><span class="tool-label">${ready?'Thu hoạch':fed?'Đã ăn':'Cho ăn'}</span></button>`;
      }else{
        this.menu.setAttribute('aria-label','Chọn cá giống để thả vào ao');
        this.menu.innerHTML=`<div class="pond-tray-heading"><span>Thả cá</span><small>${pond.fish.length}/${pond.capacity}</small></div><div class="pond-fingerlings">${Object.entries(FISH).map(([id,fish])=>{const count=this.vac.count(fish.fingerling);return `<button data-context-vac="stock_fish" data-fish-id="${id}" title="Thả ${fish.name} · Có ${count} cá giống" aria-label="Thả ${fish.name}" ${!owner||!count||pond.fish.length>=pond.capacity?'disabled':''}><img src="/assets/items-v11/${id}.webp" alt="" draggable="false"><span class="fish-stock">${count}</span><span class="fish-name">${fish.name}</span></button>`;}).join('')}</div>`;
      }
      return;
    }
    if(target.kind==='npc'){
      html=`<strong>${target.npc.name}</strong><small>${target.npc.role||'Người làng'}</small><button data-context-npc="${target.npc.id}">Trò chuyện</button>`;
    }else if(target.kind==='soil'){
      const tile=this.farming.tile(target.tile.x,target.tile.y);const actions=validSoilActions(tile,this.farming.state?.inventory||[],this.farming.serverNow());
      if(tile?.locked){const p=this.farming.state.plots,next=target.tile.y*FIELD.columns+target.tile.x===p?.unlocked,canBuy=owner&&next&&p?.nextPrice!==null;this.menu.innerHTML=`<strong>Ô đất chưa mua</strong><small>${!owner?'Chỉ chủ farm được mở ô.':next?`Ô tiếp theo · 48×48 · ${p.nextPrice.toLocaleString('vi-VN')} Đồng Làng`:'Cần mở các ô trước theo thứ tự.'}</small>${canBuy?'<button data-context-open="plots">Mua ô này</button>':''}`;return;}
      const crop=tile?.crop,progress=crop?cropProgress(crop,this.farming.serverNow()):null;
      html=`<strong>Ô đất ${target.tile.x+1}, ${target.tile.y+1}</strong><small>${crop?`${CROPS[crop.cropId].name} · ${Math.round(progress.progress*100)}%${progress.remainingMs?` · còn ${Math.ceil(progress.remainingMs/60000)} phút`:' · đã chín'}`:tile?.state==='EMPTY'?'Đất trống':tile?.state==='WATERED'?'Đã tưới':'Đã cuốc'}</small>`;
      if(owner&&actions.includes('plant'))html+=`<label>Hạt giống<select id="contextSeed" aria-label="Chọn hạt giống">${CROP_IDS.map(id=>`<option value="${id}" ${id===this.seed?'selected':''}>${CROPS[id].name} (${this.farming.state.inventory.find(i=>i.id===CROPS[id].seed)?.quantity||0})</option>`).join('')}</select></label>`;
      html+=owner?actions.map(action=>{const n=action==='plant'?(this.farming.state.inventory.find(i=>i.id===CROPS[this.seed].seed)?.quantity||0):1;const reason=!n?'Đã hết hạt giống':'';return `<button data-context-action="${action}" ${reason?`disabled title="${reason}"`:''}>${labels[action]}${reason?` · ${reason}`:''}</button>`;}).join(''):'<small>Bạn đang thăm farm. Chỉ chủ farm được thao tác.</small>';
      if(!actions.length&&owner)html+='<small>Ô này chưa có thao tác khả dụng.</small>';
    }else if(target.kind==='pond'||target.kind==='coop'){
      const pond=target.kind==='pond',s=pond?this.vac.state?.pond:this.vac.state?.coop;
      if(target.entityId){
        const row=(pond?s?.fish:s?.chickens)?.find(r=>r.id===target.entityId);
        if(!row){this.menu.innerHTML='<small>Vật nuôi đã được thu hoạch.</small>';return;}
        const remaining=row.remainingMs||0;
        let info=`<strong>${pond?row.name||FISH[row.fishId].name:'Gà'} #${row.id}</strong><small>${pond?`${Math.round(row.progress*100)}% · ${remaining?`Còn ${Math.ceil(remaining/60000)} phút`:'Sẵn sàng thu hoạch'}`:`${row.status==='GROWING'?'Đang lớn':row.status==='WAITING_FOR_FEED'?'Đang đói':'Đang đẻ trứng'} · ${row.eggsReady}/${row.maxEggs} trứng`}</small>`;
        if(owner){
          const feed=pond?remaining&&row.fedAt===null:row.status==='WAITING_FOR_FEED';
          if(feed)info+=`<button data-context-vac="${pond?'feed_fish':'feed_chicken'}" data-entity-id="${row.id}" ${this.vac.count(pond?'fish_feed':'chicken_feed')?'':'disabled'}>Cho ăn${this.vac.count(pond?'fish_feed':'chicken_feed')?'':' · Hết thức ăn'}</button>`;
          if(pond&&!remaining)info+=`<button data-context-vac="harvest_fish" data-entity-id="${row.id}">Thu hoạch</button>`;
          if(!pond&&row.eggsReady)info+='<button data-context-vac="collect_eggs">Nhặt trứng</button>';
          info+=`<button data-context-open="${target.kind}">Chăm sóc ${pond?'ao cá':'đàn gà'}</button>`;
        }
        this.menu.innerHTML=info;return;
      }
      const canAct=owner;
      html=`<strong>${pond?'Ao cá':'Chuồng gà'}</strong><small>${s?`${pond?s.fish.length:s.chickens.length}/${s.capacity} con`:'Đang tải…'}</small>`;
      if(canAct&&s){
        if(pond&&s.fish.length<s.capacity){const fishId=Object.keys(FISH).find(id=>this.vac.count(FISH[id].fingerling)>0);if(fishId)html+=`<button data-context-vac="stock_fish" data-fish-id="${fishId}">Thả ${FISH[fishId].name}</button>`;}
        if(!pond&&s.chickens.length<s.capacity&&this.vac.count(CHICKEN.item)>0)html+='<button data-context-vac="add_chicken">Nuôi thêm gà con</button>';
        if(pond){const ready=s.fish.find(row=>!row.remainingMs),hungry=s.fish.find(row=>row.remainingMs&&row.fedAt===null);if(ready)html+=`<button data-context-vac="harvest_fish" data-entity-id="${ready.id}">Thu hoạch cá</button>`;if(hungry)html+=`<button data-context-vac="feed_fish" data-entity-id="${hungry.id}" ${(this.vac.count('fish_feed')||0)?'':'disabled title="Hết cám cá"'}>Cho cá ăn${this.vac.count('fish_feed')?'':' · Hết cám'}</button>`;}
        else{const eggs=s.chickens.reduce((n,row)=>n+row.eggsReady,0),hungry=s.chickens.find(row=>row.status==='WAITING_FOR_FEED');if(eggs)html+=`<button data-context-vac="collect_eggs">Nhặt trứng (${eggs})</button>`;if(hungry)html+=`<button data-context-vac="feed_chicken" data-entity-id="${hungry.id}" ${(this.vac.count('chicken_feed')||0)?'':'disabled title="Hết thức ăn gà"'}>Cho gà ăn${this.vac.count('chicken_feed')?'':' · Hết thức ăn'}</button>`;}
      }
      html+=owner?`<button data-context-open="${target.kind}">Xem và chăm sóc</button>`:'<small>Chỉ chủ farm được thao tác.</small>';
    }else{const def=(target.kind==='building'?BUILDINGS:DECORATIONS)[target.row.definitionId];html=`<strong>${def?.name||'Công trình'}</strong>${owner?`<button data-context-open="${target.kind==='building'?'craft':'decor'}">${target.kind==='building'?'Chế biến · Xem mẻ':'Trang trí · Di chuyển'}</button><button data-context-open="${target.kind==='building'?'build':'decor'}">${target.kind==='building'?'Xây dựng · Di chuyển':'Cất hoặc đổi vị trí'}</button>`:'<small>Chỉ chủ farm được thao tác.</small>'}`;}
    this.menu.innerHTML=html;
  }
  placeMenu(){if(this.menu.classList.contains('hidden')||!this.target||this.menu.matches(':hover'))return;let p=this.target.point;
    if(['pond','coop'].includes(this.target.kind)&&this.target.entityId){const animal=this.animalAtPosition?.(this.target.entityId,this.target.kind);if(animal)p=animal;}
    const rect=this.menu.getBoundingClientRect(),screen=this.camera.toScreen(p.x,p.y);let x=screen.x,y=screen.y;const margin=12;
    if(this.target.kind==='pond'&&!this.target.entityId){const layout=livingLayout(this.phase5.state?.buildings,this.phase5.state?.decorations),[o]=pondObstacles(layout.pond),edge=this.camera.toScreen(o.x+o.rx/(2*ISO_X),o.y-o.rx/(2*ISO_X));x=edge.x+12;y=edge.y-rect.height/2;}
    else if(this.target.kind==='coop'&&!this.target.entityId){const yard=livingLayout(this.phase5.state?.buildings,this.phase5.state?.decorations).yard;if(yard){const edge=this.camera.toScreen(yard.x+yard.w,yard.y-140);x=edge.x+12;y=edge.y-rect.height/2;}}
    else if(this.target.kind==='soil'){const edge=this.camera.toScreen(p.x+FIELD.width/2,p.y-FIELD.height/2);x=edge.x+12;y=edge.y-rect.height/2;}
    else if(['pond','coop'].includes(this.target.kind)){x+=20;y-=rect.height+12;}
    else{x-=rect.width/2;y=y+28+rect.height<innerHeight-margin?y+28:y-rect.height-28;}
    this.menu.style.left=`${Math.max(margin,Math.min(innerWidth-rect.width-margin,x))}px`;this.menu.style.top=`${Math.max(margin,Math.min(innerHeight-rect.height-margin,y))}px`;}
  arm(action){if(!this.isOwner()||!this.isFarm())return;this.closeMenu();this.action=action;this.mode='actionArmed';this.renderStatus();}
  menuClick(e){if(e.detail>0&&e.target.closest('[data-context-action]'))return;const action=e.target.closest('[data-context-action]')?.dataset.contextAction,open=e.target.closest('[data-context-open]')?.dataset.contextOpen,vac=e.target.closest('[data-context-vac]'),npc=e.target.closest('[data-context-npc]');if(action){if(e.target.disabled)return;const tile=this.target?.tile;this.seed=e.target.closest('[data-crop-id]')?.dataset.cropId||$('contextSeed')?.value||this.seed;this.arm(action);if(tile)this.submit([tile]);}if(open){this.closeMenu();this.mode='idle';if(open==='plots')this.farming.showPlots();else if(open==='pond'||open==='coop')this.vac.open(open);else this.phase5.open(open);}if(vac&&!vac.disabled){this.vac.current=this.target.kind;this.closeMenu();this.mode='idle';this.vac.act({action:vac.dataset.contextVac,...(vac.dataset.entityId?{entityId:Number(vac.dataset.entityId)}:{}),...(vac.dataset.fishId?{fishId:vac.dataset.fishId,quantity:1}:{}),...(vac.dataset.contextVac==='add_chicken'?{quantity:1}:{})},vac);}if(npc&&!npc.disabled){const id=npc.dataset.contextNpc;this.closeMenu();this.mode='idle';this.onNpc?.(id);}}
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
  draw(ctx){if(this.mode==='contextMenuOpen')this.placeMenu();if(this.mode==='contextMenuOpen'&&this.target?.kind==='soil'){const r=tileRect(this.target.tile.x,this.target.tile.y);ctx.save();ctx.strokeStyle='#fff1a2';ctx.lineWidth=1.5;ctx.strokeRect(r.x+1,r.y+1,r.w-2,r.h-2);ctx.restore();return;}if(!this.preview.size)return;ctx.save();ctx.fillStyle='#e8cf7470';ctx.strokeStyle='#fff2a8';ctx.lineWidth=2;for(const tile of this.preview.values()){const r=tileRect(tile.x,tile.y);ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);ctx.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4);}ctx.restore();}
  destroy(){this.cancel();this.controller.abort();}
}
