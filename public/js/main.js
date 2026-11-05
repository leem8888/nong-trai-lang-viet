import {FARM_HOUSE,HOUSE_DEPTH,houseActorDepth,HOUSE_DOOR} from './shared/house.js';
import {drawFarmSign} from './farmSign.js';
import {MangoUI} from './mango.js';
import {MANGO_TREE} from './shared/mango.js';
import {coopGeometry} from './animalMotion.js';
import { FARM_WORLD as farmWorld } from './shared/farmWorld.js';
import {drawLife,villageScenery} from './villageScenery.js';
import {FarmTerrain} from './terrain.js';
import {LivingFarmVisual} from './livingVisual.js';
import {drawFarmFence} from './farmFence.js';
import {findReachablePath,findPath} from './systems/Pathfinding.js';
import {depth,sceneryLayers,paintLayers,drawNightLights,decorationLayers,drawDecorationGround} from './scenery.js';
﻿import { GameLoop } from './core/GameLoop.js';
import { Camera } from './core/Camera.js';
import { ISO_X, ISO_Y } from './core/IsoProjection.js';
import { InputManager } from './core/InputManager.js';
import { Player } from './entities/Player.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { FarmingUI } from './farming.js';
import { CROP_IDS, FIELD, tileAt, tileRect, cropProgress } from './shared/crops.js';
import { MarketUI } from './market.js';
import { VacUI } from './vac.js';
import { Phase5UI } from './phase5.js';
import { VillageUI } from './village.js';
import { SocialUI } from './social.js';
import { BUILDINGS, DECORATIONS, footprint, TILE_SIZE } from './shared/phase5.js';
import { VAC_POINTS } from './shared/vac.js';
import {livingLayout,yardObstacles,pondObstacles,animalAccess} from './shared/livingLayout.js';
import { MARKET_WORLD, MARKET_POINTS, FARM_GATE, VILLAGE_PLACES } from './shared/marketMap.js';
import { createOnboarding } from './onboarding.js';
import { audioSettings, saveAudio, cue } from './audio.js';
import { ContextualInteraction } from './contextual.js';

const $=id=>document.getElementById(id);
const livingVisual=new LivingFarmVisual();
let csrf='', farm=null, socket=null, loop=null, player=null, input=null, camera=null, collision=null, farming=null, marketUi=null, vacUi=null, phase5Ui=null, villageUi=null, socialUi=null, contextual=null, lamp=0, scene='farm', visiting=null, selfId=null;
const remoteMembers=new Map();let ownEmote=null;
const farmTerrain=new FarmTerrain();
let mangoUi=null;
const art = Object.fromEntries([...CROP_IDS.map(id=>['mature_'+id,'items-v11/'+id+'.webp']),['terrain','terrain-atlas-v1.png'],['unpurchasedGrass','unpurchased-grass-iso-v1.png'],['soilBeds','soil-beds-v1.png'],['farmFence','farm-fence-gate-v1.png'],['farmSurroundings','farm-surroundings-roads-v2.svg'],['neighbors','neighbor-homes.png'],['villageLife','village-life-v10.webp'],['surroundings','surroundings-v10.svg'],['marketLifeGround','market-life-ground-v10.svg'],['decorations','decorations-v9.webp'],['farmGround','farm-ground-v9.svg'],['marketGround','market-ground-v9.svg'],['garden','garden-v9.webp'],['props','rural-props-v9.webp'],['bird','bird-v9.svg'],['butterfly','butterfly-v9.svg'],['seedV9','market-seed-v9.webp'],['buyerV9','market-buyer-v9.webp'],['ordersV9','market-orders-v9.webp'],['house','farmhouse-v4.png'],['pond','lotus-pond.webp'],['coop','chicken-coop.webp'],['walk','farmer-walk.webp'],['actions','farmer-actions.webp'],['tree','mango-tree-leaves-v2.png'],['stall','seed-stall.webp'],['npcs','village-npcs.webp'],['stages','rice-stages.webp'],['crops','mature-crops.webp'],['soy','soy-crop.webp'],['production','production-buildings.webp'],['animals','farm-animals.webp']].map(([key,file])=>{const image=new Image();image.file=file;image.onerror=()=>{image.failed=true;console.warn(`Không tải được asset ${file}`);};return [key,image];}));
for(const [key,file] of [['livingPond','living-pond-v1.png'],['livingCoop','living-coop-empty-v1.png'],['coopYard','living-coop-yard-small-v4.png'],['livingAnimals','living-animals-v1.png']]){const image=new Image();image.file=file;image.onerror=()=>{image.failed=true;console.warn(`Không tải được asset ${file}`);};art[key]=image;}
async function loadArt(keys){keys=[...new Set([...keys,...(keys.includes('stall')?['marketLifeGround','seedV9','buyerV9','ordersV9']:['farmGround','terrain','unpurchasedGrass','soilBeds','farmFence','farmSurroundings','decorations',...CROP_IDS.map(id=>'mature_'+id)]),'garden','props','butterfly','tree','bird','villageLife','surroundings','neighbors'])];await Promise.all(keys.map(async key=>{const image=art[key];if(!image.src)image.src=`/assets/${image.file}`;try{await image.decode();if(!image.bitmapPromise&&!(['walk','actions','npcs','stages','crops','production','animals'].includes(key))){image.bitmapPromise=(async()=>{const ground=key.endsWith('Ground')||key==='decorations'||key==='villageLife'||key==='surroundings'||key==='neighbors'||key==='terrain',width=key==='surroundings'?1600:ground?image.naturalWidth:Math.min(image.naturalWidth,1024);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(image.naturalHeight*width/image.naturalWidth);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.bitmap=await createImageBitmap(canvas);})().catch(()=>{});}if(image.bitmapPromise)await image.bitmapPromise;}catch{image.failed=true;}}));}
function upright(ctx,x,y,image,width,height,source,mirror=false){if(!image.naturalWidth&&!image.failed)return;ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);if(mirror)ctx.scale(-1,1);if(image.failed){ctx.fillStyle='#78543d';ctx.fillRect(-width/2,-height,width,height);ctx.strokeStyle='#f1d89f';ctx.strokeRect(-width/2,-height,width,height);}else if(source)ctx.drawImage(image.bitmap||image,...source.map((v,i)=>image.bitmap?v*(i%2?image.bitmap.height/image.naturalHeight:image.bitmap.width/image.naturalWidth):v),-width/2,-height,width,height);else ctx.drawImage(image.bitmap||image,-width/2,-height,width,height);ctx.restore();}
const objects={board:{x:570,y:430,label:'Bảng thông tin'},door:{...HOUSE_DOOR,label:'Cửa nhà'},lamp:{x:920,y:300,label:'Đèn sân'},farmGate:{...FARM_GATE,label:'Ra chợ làng'},...VAC_POINTS};
async function api(url,options={}) { const destination=actionDestination(url,options);if(destination){await approach(destination.point,destination.range);if(url==='/vac/action'||url==='/farming/action'||url==='/mango/action')await confirmActionPosition(destination);}const response=await fetch('/api'+url,{...options,headers:{'content-type':'application/json','x-csrf-token':csrf,...options.headers}}); const data=await response.json(); if(!response.ok) throw Object.assign(Error(data.error),{status:response.status}); return data; }
async function confirmActionPosition(destination){
  for(let attempt=0;attempt<3;attempt++){
    if(!socket?.connected)throw Error('Mất kết nối. Hãy kết nối lại rồi thử thao tác.');
    const result=await new Promise(resolve=>socket.timeout(5000).emit('player:move',{x:player.x,y:player.y,direction:player.direction},(error,result)=>resolve(error?null:result)));
    if(result?.ok)return;
    if(result?.player){player.place(result.player.x,result.player.y);await approach(destination.point,destination.range);}
    else break;
  }
  throw Error('Movement unavailable');
}
function actionDestination(url,options){if(options.method!=='POST'||!options.body||!player)return null;let p;try{p=JSON.parse(options.body);}catch{return null;}
  if(url==='/farming/action'&&Number.isInteger(p.x)&&Number.isInteger(p.y)){const r=tileRect(p.x,p.y);return {point:{x:r.x+r.w/2,y:r.y+r.h/2},range:60};}
  if(url==='/mango/action')return {point:MANGO_TREE,range:75};
  if(url==='/vac/action')return {point:VAC_POINTS[['stock_fish','feed_fish','harvest_fish'].includes(p.action)||p.action==='convert'&&p.recipeId==='soy_feed'?'pond':'coop'],range:86};
  if(url==='/market/action')return {point:MARKET_POINTS[p.action==='buy'?'seedShop':p.action==='sell'?'buyer':'orderBoard'],range:86};
  if(url==='/phase5/action'&&p.action!=='unlock'){
    const state=phase5Ui?.state,job=state?.jobs.find(row=>row.id===p.jobId),building=state?.buildings.find(row=>row.id===(p.buildingId||job?.buildingId)),object=[...(state?.buildings||[]),...(state?.decorations||[])].find(row=>row.id===p.id);
    const row=building||object||p;if(Number.isInteger(row.x)&&Number.isInteger(row.y))return {point:{x:(row.x+1)*TILE_SIZE,y:(row.y+1)*TILE_SIZE},range:130};
  }
  return null;}
let errorTimer,noticeTimer;
let actionEffect=null;
function showError(message){if(message==='Movement unavailable')message='Không thể tới vị trí này. Hãy kiểm tra lối đi rồi thử lại.';cue('error');$('error').textContent=message;$('error').classList.remove('hidden');clearTimeout(errorTimer);errorTimer=setTimeout(()=>$('error').classList.add('hidden'),4500);}
function showNotice(message,kind='ok'){cue(kind);if(['till','plant','water','harvest','mango_harvest','stock_fish','feed_fish','harvest_fish','add_chicken','feed_chicken','collect_eggs','start','claim','place_building','place_decoration'].includes(kind))actionEffect={kind,at:performance.now()};$('notice').textContent=message;$('notice').classList.remove('hidden');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.add('hidden'),2800);}
function screen(id){for(const name of ['welcome','create','game','loading'])$(name).classList.toggle('hidden',name!==id);}
function loadingFailure(){screen('loading');$('loadingMessage').textContent='Không thể tải nông trại. Hãy kiểm tra kết nối rồi thử lại.';$('loadingRetry').classList.remove('hidden');}
let panelOpener=null;
let onboarding=null;
function panel(html){contextual?.cancel();if($('panel').classList.contains('hidden'))panelOpener=document.activeElement;$('panelContent').innerHTML=html;$('panel').classList.remove('hidden');if(input)input.active=false;$('closePanel').focus();}
function closePanel(){$('panel').classList.add('hidden');if(input)input.active=true;if(panelOpener?.isConnected)panelOpener.focus();panelOpener=null;}
function syncPhase5Collision(){if(!phase5Ui?.state||scene!=='farm'||!collision)return;const s=phase5Ui.state,layout=livingLayout(s.buildings,s.decorations);const dynamic=[...s.buildings.map(o=>{const z=footprint(BUILDINGS[o.definitionId],o.rotation);return {x:o.x*TILE_SIZE,y:o.y*TILE_SIZE,w:z.w*TILE_SIZE,h:z.h*TILE_SIZE};}),...s.decorations.filter(o=>DECORATIONS[o.definitionId]?.blocking).map(o=>({x:o.x*TILE_SIZE,y:o.y*TILE_SIZE,w:TILE_SIZE,h:TILE_SIZE})),...pondObstacles(layout.pond),...yardObstacles(layout.yard)];collision.obstacles=[...new CollisionSystem(farmWorld).obstacles,...dynamic];}
$('closePanel').onclick=closePanel;
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('panel').classList.contains('hidden')){event.preventDefault();closePanel();}});
window.addEventListener('keydown',event=>{if($('panel').classList.contains('hidden')||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(event.key.toLowerCase()))closePanel();});
document.addEventListener('pointerdown',event=>{if(!$('panel').classList.contains('hidden')&&!$('panel').contains(event.target))closePanel();},{capture:true});
let mode='login';
for(const name of ['login','register'])$(name+'Tab').onclick=()=>{mode=name;for(const tab of ['login','register'])$(tab+'Tab').setAttribute('aria-selected',String(tab===name));$('authSubmit').textContent=name==='login'?'Đăng nhập':'Đăng ký';$('authForm').elements.password.autocomplete=name==='login'?'current-password':'new-password';};
$('authForm').onsubmit=async e=>{e.preventDefault();const button=$('authSubmit');if(button.disabled)return;button.disabled=true;const label=button.textContent;button.textContent='Đang xử lý…';try{const data=await api('/'+mode,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});csrf=data.csrf;await enter(data.farm);}catch(error){if(!$('loading').classList.contains('hidden'))loadingFailure();else showError(error.message);}finally{button.disabled=false;button.textContent=label;}};
$('farmForm').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');if(button.disabled)return;button.disabled=true;button.textContent='Đang tạo…';try{const data=await api('/farms',{method:'POST',body:JSON.stringify({name:new FormData(e.target).get('name')})});await enter(data.farm);}catch(error){if(!$('loading').classList.contains('hidden'))loadingFailure();else showError(error.message);}finally{button.disabled=false;button.textContent='Bắt đầu làm vườn';}};
$('menuButton').onclick=()=>panel(`<h2>Menu</h2><p>Trạng thái được lưu trên máy chủ.</p><div class="menu-actions"><button data-menu="historyButton">Lịch sử</button><button data-menu="questsButton">Nhiệm vụ</button><button data-menu="effectsButton">Hiệu ứng</button><button data-menu="socialButton">Thăm farm</button><button id="replayTutorial">Xem hướng dẫn</button><button id="logout">Đăng xuất</button></div><label class="audio-row"><input id="audioMute" type="checkbox" ${audioSettings.muted?'':'checked'}> Bật âm thanh</label><label>Âm lượng <input id="audioVolume" type="range" min="0" max="1" step="0.05" value="${audioSettings.volume}"></label>`);
$('panel').addEventListener('click',async e=>{if(e.target.dataset.menu){closePanel();$(e.target.dataset.menu)?.click();}if(e.target.id==='replayTutorial'){closePanel();onboarding?.start(true);}if(e.target.id==='logout'){try{await api('/logout',{method:'POST'});}catch{} socket?.disconnect();loop?.stop();location.reload();}});
$('panel').addEventListener('input',e=>{if(e.target.id==='audioMute')audioSettings.muted=!e.target.checked;if(e.target.id==='audioVolume')audioSettings.volume=Number(e.target.value);saveAudio();});
function nearbyObjects(){return visiting?{}:{...(scene==='market'?MARKET_POINTS:objects),...Object.fromEntries((villageUi?.npcs(scene)||[]).map(n=>[`npc:${n.id}`,{x:n.x,y:n.y,label:`Trò chuyện · ${n.name}`}]))};}
function nearest(){return Object.entries(nearbyObjects()).filter(([id])=>!['pond','coop'].includes(id)).map(([id,o])=>({id,...o,d:scene==='farm'&&['pond','coop'].includes(id)?animalAccess(id,player,livingVisual.layout(phase5Ui?.state)).distance:Math.hypot(player.x-o.x,player.y-o.y)})).filter(o=>o.d<=96).sort((a,b)=>a.d-b.d)[0];}
async function interact(id=nearest()?.id){if(!id||['pond','coop'].includes(id))return;const o=nearbyObjects()[id];if(!o)return;try{await approach(o,86);}catch(error){showError(error.message);return;}
if(id.startsWith('npc:'))return villageUi.interact(id.slice(4));
if(id==='farmGate')return travel('market');if(id==='returnGate')return travel('farm');
if(id==='seedShop')return marketUi.open('shop');if(id==='buyer')return marketUi.open('buyer');if(id==='orderBoard')return marketUi.open('orders');
if(id==='pond'||id==='coop')return vacUi.open(id);
if(id==='board')panel(`<h2>${escapeHtml(farm.name)}</h2><p>Chủ nông trại: ${escapeHtml($('userName').textContent)}</p><p>Ngày tạo: ${new Date(farm.created_at).toLocaleDateString('vi-VN')}</p>`);
if(id==='door')panel('<h2>Ngôi nhà mái ngói</h2><p>Một gian nhà ấm cúng nhìn ra sân gạch. Nội thất sẽ được mở rộng ở các phase sau.</p>');
if(id==='lamp')socket.emit('farm:interact',{objectId:'lamp'},result=>{if(!result.ok)showError(result.error);});}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function applyScene(next,x,y,direction='down'){
contextual?.sceneChanged();if(phase5Ui)phase5Ui.mode=null;scene=next;const world=scene==='market'?MARKET_WORLD:farmWorld;
void loadArt(scene==='market'?['stall','walk','npcs']:['house','pond','coop','walk','npcs','tree','stages','crops','soy','production','animals','actions','livingPond','livingCoop','coopYard','livingAnimals']);
collision=new CollisionSystem(world);camera.isometric=true;camera.setWorld(world);camera.resize(innerWidth,innerHeight);player.place(x,y,direction);camera.snap(x,y);input?.clear();
syncPhase5Collision();
$('farmHud').classList.toggle('hidden',scene==='market');$('villagePlaces')?.classList.toggle('hidden',scene!=='market');$('marketHud').classList.toggle('hidden',scene!=='market');
$('help').textContent=visiting?'WASD / mũi tên: đi dạo · Chỉ chủ farm được thao tác.':scene==='market'?'Đến gần quầy, bảng đơn hoặc cổng rồi nhấn E.':'WASD / mũi tên: đi · E: tương tác · 1–4: công cụ · Nhấp ô ruộng để dùng';
if(visiting)$('farmHud').classList.add('hidden');
if(!visiting&&scene==='farm')$('help').textContent='Chạm ô đất để thao tác. Chọn công cụ rồi giữ và kéo để làm nhiều ô.';
}
let traveling=false,travelAt=0;
function walkTo(point){const path=findReachablePath(collision,player,point);contextual?.cancel();if(path)input.setPath(path);else input.cancelPath();}
let autoApproaching=0;
async function approach(point,range){
  if(!point||!player||!input)throw Error('Movement unavailable');
  const kind=Object.keys(VAC_POINTS).find(k=>point===VAC_POINTS[k]);if(kind){const access=animalAccess(kind,player,livingVisual.layout(phase5Ui?.state),collision);if(!access.point)throw Error('Movement unavailable');if(access.distance<=24)return;let reachable=null,checked=0;for(const candidate of access.points){const path=findPath(collision,player,candidate);if(path){reachable=candidate;break;}if(++checked%4===0)await new Promise(resolve=>setTimeout(resolve,0));}if(!reachable)throw Error('Movement unavailable');point=reachable;range=24;}
  if(Math.hypot(player.x-point.x,player.y-point.y)<=range)return;
  const route=findReachablePath(collision,player,point,Math.max(12,range-8));
  if(!route)throw Error('Movement unavailable');
  input.setPath(route);autoApproaching++;
  let lastX=player.x,lastY=player.y,stalledAt=performance.now(),retries=0;
  const start=performance.now();
  try{
    while(Math.hypot(player.x-point.x,player.y-point.y)>range){
      await new Promise(resolve=>setTimeout(resolve,70));
      if(Math.hypot(player.x-point.x,player.y-point.y)<=range)break;
      if(Math.hypot(player.x-lastX,player.y-lastY)>.5){lastX=player.x;lastY=player.y;stalledAt=performance.now();}
      if(!input.target||performance.now()-start>60000)throw Error('Movement unavailable');
      if(performance.now()-stalledAt>1200){
        const next=retries++<2?findReachablePath(collision,player,point,Math.max(12,range-8)):null;
        if(!next){input.cancelPath();throw Error('Movement unavailable');}
        input.setPath(next);stalledAt=performance.now();
      }
    }
    input.cancelPath();await new Promise(resolve=>setTimeout(resolve,230));
  }finally{autoApproaching--;}
}
function autoTravel(){if(visiting||traveling||!socket?.connected||performance.now()-travelAt<1800||!$('panel').classList.contains('hidden'))return;const gate=scene==='farm'?FARM_GATE:MARKET_POINTS.returnGate;if(Math.hypot(player.x-gate.x,player.y-gate.y)<=26)travel(scene==='farm'?'market':'farm');}
function travel(to){if(traveling)return;if(visiting)return showError('Hãy về nông trại của bạn trước.');if(!socket?.connected){showError('Mất kết nối với server.');return;}traveling=true;travelAt=performance.now();socket.timeout(6000).emit('world:travel',{to},async (error,result)=>{traveling=false;if(error){showError('Không thể chuyển cảnh. Hãy thử lại.');return;}
if(!result.ok){showError(result.error);return;}applyScene(result.scene,result.x,result.y);try{marketUi.setState(await api('/market'));}catch(error){showError(error.message);}
});}
function applyVisitSnapshot(s){
  lamp=s.objects.find(o=>o.objectId==='lamp')?.state||0;
  mangoUi?.setState(s.mango||null);
  farming.state={farmId:s.farm.id,serverTime:Date.now(),plots:s.plots,inventory:[],tiles:s.tiles.map(t=>({x:t.x,y:t.y,locked:t.locked,state:t.state,crop:t.cropId?{cropId:t.cropId,plantedAt:t.plantedAt,durationMs:t.durationMs,bonusMs:t.bonusMs,wateredAt:t.wateredAt}:null}))};
  phase5Ui.state={farmId:s.farm.id,level:s.level,buildings:s.buildings,decorations:s.decorations,jobs:[]};vacUi.state={pond:s.pond,coop:s.coop};syncPhase5Collision();
}
function applyMembers(members){const ids=new Set();for(const m of members){if(m.userId===selfId)continue;ids.add(m.userId);const old=remoteMembers.get(m.userId);remoteMembers.set(m.userId,{...m,drawX:old?.drawX??m.x,drawY:old?.drawY??m.y,emote:old?.emote});}for(const id of remoteMembers.keys())if(!ids.has(id))remoteMembers.delete(id);}
function visitFarm(result){visiting=result.farm;closePanel();applyScene('farm',result.player.x,result.player.y,result.player.direction);applyVisitSnapshot(result.snapshot);applyMembers(result.members);$('farmName').textContent=result.farm.name;$('visitLabel').textContent=`Đang thăm nông trại của ${result.farm.ownerName}`;$('visitBanner').classList.remove('hidden');for(const id of ['balance','historyButton','questsButton'])$(id).classList.add('hidden');showNotice('Đã vào nông trại. Bạn có thể đi dạo và chào hỏi.');}
async function returnHome(sendLeave=true){if(sendLeave&&socket?.connected)await new Promise(resolve=>socket.emit('social:leave',{},resolve));visiting=null;remoteMembers.clear();$('visitBanner').classList.add('hidden');for(const id of ['balance','historyButton','questsButton'])$(id).classList.remove('hidden');$('farmName').textContent=farm.name;closePanel();try{const state=await api('/farm');applyScene(state.player.scene||'farm',state.player.x,state.player.y,state.player.direction);lamp=state.objects.find(o=>o.object_id==='lamp')?.state||0;farming.setState(await api('/farming'));marketUi.setState(await api('/market'));vacUi.setState(await api('/vac'));await phase5Ui.load();await villageUi.load();if(mangoUi)await mangoUi.load();}catch(error){showError(error.message);}}
function drawRemote(ctx){for(const m of remoteMembers.values()){m.drawX+=(m.x-m.drawX)*.25;m.drawY+=(m.y-m.drawY)*.25;const moving=Math.hypot(m.x-m.drawX,m.y-m.drawY)>1;drawAvatar(ctx,m.drawX,m.drawY,m.direction,moving?Math.sin(performance.now()/90)*4:0,m.name,m.role==='owner'?'#9b633e':'#567462');if(m.emote&&Date.now()-m.emote.at<2600){ctx.font='24px system-ui';ctx.textAlign='center';ctx.fillText({wave:'👋',hello:'🌾',thanks:'🙏',happy:'😊'}[m.emote.name],m.drawX,m.drawY-85);ctx.textAlign='start';}}}
function tutorialTile(state){
  if(state.step<4&&state.crop)return farming.state?.tiles.find(t=>t.x===state.crop.x&&t.y===state.crop.y);
  return farming.state?.tiles.find(t=>!t.locked&&!t.crop&&t.state!=='EMPTY')||farming.state?.tiles.find(t=>!t.locked&&!t.crop);
}
function tutorialTarget(state){
  if(state.step===7)return null;
  if(state.step===4||state.step===5)return scene==='farm'?FARM_GATE:MARKET_POINTS[state.step===4?'buyer':'seedShop'];
  if(scene==='market')return MARKET_POINTS.returnGate;
  const tile=tutorialTile(state);return tile?tileRectCenter(tile):null;
}
function tileRectCenter(tile){const r=tileRect(tile.x,tile.y);return {x:r.x+r.w/2,y:r.y+r.h/2};}
async function aimTutorial(state){
  if(visiting)throw Error('Hãy về nông trại của bạn trước.');
  closePanel();contextual?.cancel();
  farming.setState(await api('/farming'));
  if(state.step===4||state.step===5){if(scene==='farm')return interact('farmGate');return interact(state.step===4?'buyer':'seedShop');}
  if(scene==='market')return interact('returnGate');
  const tile=tutorialTile(state);if(!tile)throw Error('Hãy thu hoạch một ô hoặc dùng Bỏ qua để chơi tự do.');
  const point=tileRectCenter(tile);await approach(point,60);camera.snap(player.x,player.y);
  if(state.step<4)contextual.seed='mustard';
  await contextual.open({kind:'soil',tile,point});
  if(state.step===1){const seed=document.querySelector('[data-context-action=plant][data-crop-id=mustard]');seed?.classList.add('tutorial-choice');seed?.focus();}
}
async function enter(existing){if(!existing){screen('create');return;}screen('loading');farm=existing;const state=await api('/farm');lamp=state.objects.find(o=>o.object_id==='lamp')?.state||0;
$('farmName').textContent=farm.name;const me=await api('/me');selfId=me.user.id;$('userName').textContent=me.user.username;await loadArt((state.player.scene||'farm')==='market'?['stall','walk','npcs']:['house','pond','coop','walk','npcs','tree','stages','crops','soy','livingPond','livingCoop','coopYard','livingAnimals','animals']);
onboarding=createOnboarding({api,aim:aimTutorial,target:tutorialTarget,error:showError,enabled:()=>!visiting});
setInterval(()=>onboarding?.refresh(),1000);
const places=document.createElement('nav');places.id='villagePlaces';places.setAttribute('aria-label','Khu vực làng');for(const place of Object.values(VILLAGE_PLACES)){const button=document.createElement('button');button.textContent=place.label;button.onclick=()=>{closePanel();walkTo(place);};places.append(button);}document.getElementById('game').append(places);
const canvas=$('canvas'),ctx=canvas.getContext('2d');player=new Player();player.place(state.player.x,state.player.y,state.player.direction);scene=state.player.scene||'farm';camera=new Camera(scene==='market'?MARKET_WORLD:farmWorld);camera.snap(player.x,player.y);
camera.isometric=true;camera.snap(player.x,player.y);
farming=new FarmingUI(api,showError,showNotice,panel);farming.setState(await api('/farming'));
marketUi=new MarketUI(api,panel,showError,showNotice,async()=>farming.setState(await api('/farming')));marketUi.setState(await api('/market'));
vacUi=new VacUI(api,panel,showError,showNotice,async()=>{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));},(intent,result,before)=>livingVisual.onAction(intent,result,before,player,livingVisual.layout(phase5Ui?.state)));vacUi.setState(await api('/vac'));
 mangoUi=new MangoUI(api,showNotice,showError,async()=>{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));});await mangoUi.load();
 phase5Ui=new Phase5UI(api,panel,closePanel,showNotice,showError,async()=>{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));});phase5Ui.refreshCollision=syncPhase5Collision;await phase5Ui.load();
 villageUi=new VillageUI(api,panel,showNotice,showError,async()=>{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));});await villageUi.load();
 const landLevel=document.createElement('span'),questProgress=document.createElement('span');landLevel.id='landLevel';questProgress.id='questProgress';landLevel.title='Cấp mở rộng đất hiện có';questProgress.title='Tiến độ năm nhiệm vụ chính, không phải điểm kinh nghiệm';$('worldHud').append(landLevel,questProgress);
 const updateProgressHud=()=>{landLevel.textContent=`Đất ${phase5Ui.state?.level||0}/2`;const quests=villageUi.state?.quests?.quests?.filter(q=>!q.id.startsWith('daily_'))||[];questProgress.textContent=`Nhiệm vụ ${quests.filter(q=>q.status==='CLAIMED').length}/${quests.length||5}`;};updateProgressHud();setInterval(updateProgressHud,1000);
 socialUi=new SocialUI(api,panel,showError,showNotice,visitFarm);$('returnFarm').onclick=()=>returnHome();$('emoteButton').onclick=()=>socket?.emit('social:emote',{emote:'wave'},r=>{if(!r.ok)showError(r.error);});
 const wave=document.createElement('button');wave.textContent='👋';wave.title='Vẫy tay';wave.setAttribute('aria-label','Vẫy tay chào');wave.onclick=()=>socket?.emit('social:emote',{emote:'wave'},r=>{if(!r.ok)showError(r.error);});document.querySelector('#hud>div:last-child').append(wave);
 collision=new CollisionSystem(scene==='market'?MARKET_WORLD:farmWorld);input=new InputManager(canvas,camera,$('joystick'),key=>{if(phase5Ui?.mode){phase5Ui.key(key);return;}if(key==='e')interact();if(key==='escape')closePanel();if(!visiting&&scene==='farm'){if(key==='b')phase5Ui.open('build');else if({1:'till',2:'plant',3:'water',4:'harvest'}[key])contextual?.arm({1:'till',2:'plant',3:'water',4:'harvest'}[key]);}});input.active=true;
const farmHud=$('farmHud'),utilityButton=document.createElement('button'),utilityMenu=document.createElement('div');
utilityButton.id='farmUtilityButton';utilityButton.innerHTML='<svg class="dock-icon" aria-hidden="true"><use href="/assets/ui-icons.svg#menu"></use></svg><span>Nông trại</span>';utilityButton.setAttribute('aria-expanded','false');utilityButton.setAttribute('aria-controls','farmUtilityMenu');
utilityMenu.id='farmUtilityMenu';utilityMenu.className='hidden';
for(const id of ['inventoryButton','claimSeeds','toolbar','craftButton','buildButton','decorButton','expandButton','cropInfo','cropProgress','vacStatus','craftStatus'])utilityMenu.append($(id));
farmHud.replaceChildren(utilityButton,utilityMenu);
for(const [id,icon,label,activate] of [
  ['quickInventory','bag','Túi đồ',()=>farming.showInventory()],
  ['quickQuests','quest','Nhiệm vụ',()=>$('questsButton').click()],
  ['quickBuild','build','Xây dựng',()=>phase5Ui.open('build')],
  ['quickSocial','friends','Bạn bè',()=>$('socialButton').click()]
]){const button=document.createElement('button');button.id=id;button.className='quick-action';button.type='button';button.title=label;button.setAttribute('aria-label',label);button.innerHTML=`<svg class="dock-icon" aria-hidden="true"><use href="/assets/ui-icons.svg#${icon}"></use></svg><span class="quick-label">${label}</span>`;button.onclick=()=>{utilityMenu.classList.add('hidden');utilityButton.setAttribute('aria-expanded','false');activate();};farmHud.insertBefore(button,utilityMenu);}
utilityButton.onclick=()=>{const show=utilityMenu.classList.toggle('hidden')===false;utilityButton.setAttribute('aria-expanded',String(show));contextual?.closeMenu();};
utilityMenu.addEventListener('click',e=>{if(e.target.closest('button')){utilityMenu.classList.add('hidden');utilityButton.setAttribute('aria-expanded','false');}});
const contextMenu=document.createElement('div');contextMenu.id='contextMenu';contextMenu.className='hidden';contextMenu.setAttribute('role','dialog');contextMenu.setAttribute('aria-label','Thao tác ngữ cảnh');document.getElementById('game').append(contextMenu);
const contextStatus=document.createElement('div');contextStatus.id='contextStatus';contextStatus.className='hidden';contextStatus.setAttribute('role','status');contextStatus.innerHTML='<span id="contextInstruction"></span><button id="contextDone" type="button">Xong</button><button id="contextCancel" type="button">Hủy</button>';document.getElementById('game').append(contextStatus);
contextual=new ContextualInteraction({mango:mangoUi,canvas,camera,farming,vac:vacUi,phase5:phase5Ui,input,notice:showNotice,error:showError,isOwner:()=>!visiting,isFarm:()=>scene==='farm',canReach:(point,max)=>Math.hypot(player.x-point.x,player.y-point.y)<=max,npcAt:point=>visiting?null:villageUi.npcs(scene).find(n=>Math.hypot(point.x-n.x,point.y-n.y)<38),onNpc:id=>interact(`npc:${id}`),openPanel:panel,onPan:point=>walkTo(point),animalAt:point=>livingVisual.animalAt(point),animalAtPosition:(id,kind)=>livingVisual.hits.find(h=>h.kind===kind&&h.entityId===id),approachObject:approach});
input.onManual=()=>{if(contextual?.mode==='contextMenuOpen')contextual.cancel();};
applyScene(scene,player.x,player.y,player.direction);
void onboarding.start();
input.onPoint=(point,event)=>{if(!visiting){const gate=scene==='farm'?FARM_GATE:MARKET_POINTS.returnGate;if(Math.hypot(point.x-gate.x,point.y-gate.y)<65){walkTo(gate);return true;}}if(scene==='farm'&&phase5Ui?.mode)return visiting?true:phase5Ui.point(point);if(contextual.down(point,event))return true;if(!visiting){const entry=Object.entries(nearbyObjects()).find(([,o])=>Math.hypot(point.x-o.x,point.y-o.y)<38);if(entry){void interact(entry[0]);return true;}}walkTo(point);return true;};
canvas.addEventListener('pointermove',e=>{const point=camera.toWorld(e.clientX,e.clientY);farming.hover=scene==='farm'&&!phase5Ui?.mode&&contextual?.mode!=='contextMenuOpen'?tileAt(point.x,point.y):null;if(phase5Ui)phase5Ui.hover=point;});canvas.addEventListener('pointerleave',()=>{farming.hover=null;});
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);camera.resize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
socket=io({withCredentials:true});socialUi.setSocket(socket);
let clientReady=false,joinedReady=false;
socket.on('connect',()=>{ joinedReady=false;socket.emit('farm:join',{farmId:farm.id},async r=>{
  if(!r.ok)return showError(r.error);
  joinedReady=true;if(clientReady)$('status').textContent='Đã kết nối';
  if(visiting){const wanted=visiting.id;const joined=await new Promise(resolve=>socket.emit('social:join',{farmId:wanted},resolve));if(joined.ok)return visitFarm(joined);showError(joined.error);visiting=null;}
  await returnHome(false);
});});
socket.on('disconnect',()=>{joinedReady=false;$('status').textContent='Mất kết nối';remoteMembers.clear();});
socket.on('social:members',applyMembers);
socket.on('social:move',m=>{const old=remoteMembers.get(m.userId);if(old)Object.assign(old,{x:m.x,y:m.y,direction:m.direction});});
socket.on('social:emote',m=>{if(m.userId===selfId)ownEmote={name:m.emote,at:Date.now()};const old=remoteMembers.get(m.userId);if(old)old.emote={name:m.emote,at:Date.now()};});
socket.on('social:farm',s=>{if(visiting?.id===s.farm.id)applyVisitSnapshot(s);});
socket.on('social:revoked',m=>{showError(m.reason);returnHome();});
socket.on('social:replaced',()=>{if(visiting){showError('Phiên khác đã vào nông trại.');returnHome(false);}});
socket.on('farm:mango',state=>{if(!visiting)mangoUi?.setState(state);});
socket.on('farm:object',o=>{if(!visiting&&o.objectId==='lamp')lamp=o.state;});socket.on('farm:farming',state=>{if(!visiting)farming.setState(state);});socket.on('farm:market',state=>{if(!visiting)marketUi.setState(state);});socket.on('farm:vac',state=>{if(!visiting)vacUi.setState(state);});socket.on('farm:phase5',state=>{if(!visiting)phase5Ui.setState(state);});socket.on('farm:quests',state=>{if(!visiting&&villageUi?.state){villageUi.state.quests=state;villageUi.updateHud();}});
setInterval(async()=>{if(document.visibilityState==='visible'&&!visiting)try{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));vacUi.setState(await api('/vac'));await phase5Ui.load();await villageUi.load();await mangoUi.load();}catch{}},30000);
let saveAt=0,hudAt=0,moveSeq=0,lastSentMove=null;loop=new GameLoop((dt)=>{input.active=$('panel').classList.contains('hidden')||autoApproaching>0;player.update(dt,input.vector(player),collision);camera.update(player,dt);autoTravel();const near=nearest();$('prompt').style.display=near?'block':'none';if(near)$('prompt').textContent=['farmGate','returnGate'].includes(near.id)?`Đi qua cổng · ${near.label}`:`E · ${near.label}`;const time=performance.now();if(time-hudAt>1000){hudAt=time;villageUi.updateHud();}if(socket.connected&&time-saveAt>180&&(!lastSentMove||Math.hypot(player.x-lastSentMove.x,player.y-lastSentMove.y)>.1||player.direction!==lastSentMove.direction)){saveAt=time;lastSentMove={x:player.x,y:player.y,direction:player.direction};const seq=++moveSeq;socket.emit('player:move',{x:player.x,y:player.y,direction:player.direction,seq},r=>{if(seq===moveSeq&&r&&!r.ok&&r.player)player.place(r.player.x,r.player.y);});}},()=>draw(ctx));screen('game');loop.start();clientReady=true;if(socket.connected&&joinedReady)$('status').textContent='Đã kết nối';}
const plantRoots=new WeakMap();
function drawCenteredPlant(ctx,x,y,image,width,height,source){
  if(!image.naturalWidth)return;
  const frame=source||[0,0,image.naturalWidth,image.naturalHeight],key=frame.join(',');
  let frames=plantRoots.get(image);if(!frames){frames=new Map();plantRoots.set(image,frames);}
  let root=frames.get(key);
  if(!root){
    const c=document.createElement('canvas');c.width=128;c.height=128;
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,...frame,0,0,128,128);
    const pixels=g.getImageData(0,0,128,128).data;let bottom=127;
    const solid=(px,py)=>pixels[(py*128+px)*4+3]>80;
    while(bottom>0&&!Array.from({length:128},(_,px)=>solid(px,bottom)).some(Boolean))bottom--;
    let sum=0,count=0;
    for(let py=Math.max(0,bottom-8);py<=bottom;py++)for(let px=0;px<128;px++)if(solid(px,py)){sum+=px;count++;}
    // Sprite soil has depth: its frontmost pixel is below the actual ground contact center.
    const groundDepth=source?19:12;
    root={x:count?(sum/count+.5)/128:.5,y:(bottom+1-groundDepth)/128};frames.set(key,root);
  }
  ctx.save();ctx.fillStyle='#21150e66';ctx.beginPath();ctx.ellipse(x,y,8,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
  // Align the center of the sprite's soil footprint with the center of the plot.
  const dx=(.5-root.x)*width,dy=(1-root.y)*height;
  upright(ctx,x+dx/(2*ISO_X)+dy/(2*ISO_Y),y-dx/(2*ISO_X)+dy/(2*ISO_Y),image,width,height,source);
}
function drawCoopFacing(ctx,x,y,image,width,height){upright(ctx,x,y,image,width,height);}
function drawIsometricFarm(ctx){
  if(!farmTerrain.drawSurroundings(ctx,art.terrain,camera))drawSurroundings(ctx);
  if(art.farmSurroundings?.naturalWidth){
    // Village roads stay outside the actual fence, including the extended northern garden.
    ctx.save();ctx.beginPath();ctx.rect(-1100,-1000,4300,3600);ctx.rect(65,-195,1610,1100);ctx.clip('evenodd');
    ctx.drawImage(art.farmSurroundings.bitmap||art.farmSurroundings,-1100,-1000,4300,3600);ctx.restore();
  }
  if(!farmTerrain.draw(ctx,art.terrain)&&art.farmGround.complete&&art.farmGround.naturalWidth)ctx.drawImage(art.farmGround.bitmap||art.farmGround,0,0,farmWorld.width,farmWorld.height);
  drawFarmFence(ctx,art.farmFence,upright);
  phase5Ui?.drawGround(ctx,camera);
  villageUi?.drawSeason(ctx,camera);
  drawDecorationGround(ctx,phase5Ui?.state?.decorations||[],art.decorations,upright);
  farming.isometric=true;farming.soilArt=art.soilBeds;farming.grassArt=art.unpurchasedGrass;farming.terrainArt=art.terrain;farming.upright=upright;farming.draw(ctx);contextual?.draw(ctx);
  const cropLayers=[];
  for(const tile of farming.state?.tiles||[]){if(!tile.crop)continue;const rect=tileRect(tile.x,tile.y),growth=cropProgress(tile.crop,farming.serverNow()),x=rect.x+rect.w/2,y=rect.y+rect.h/2;
    cropLayers.push({y:depth(x,y),draw:()=>{
    if(growth.stage==='MATURE')drawCenteredPlant(ctx,x,y,art['mature_'+tile.crop.cropId],52,52);
    else if(growth.stage==='SEED'){ctx.save();for(const [dx,dy] of [[-3,-2],[3,-2],[0,4]]){ctx.fillStyle='#302117';ctx.beginPath();ctx.ellipse(x+dx,y+dy+.5,2.5,1.8,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d8bd81';ctx.beginPath();ctx.ellipse(x+dx,y+dy,1.8,1.2,-.3,0,Math.PI*2);ctx.fill();}ctx.restore();}
    else{const index=growth.stage==='GROWING'?1:0;drawCenteredPlant(ctx,x,y,art.stages,52,43,[index*543,0,543,724]);}
    if(growth.stage!=='SEED')farming.drawSoilCracks(ctx,rect,tile,farming.serverNow());
    }});
  }
  livingVisual.hits=[];
  const livingLayoutNow=livingVisual.layout(phase5Ui?.state);
  const layers=[...cropLayers,
    {y:depth(1195,235),draw:()=>livingLayoutNow.yard?drawCoopFacing(ctx,coopGeometry(livingLayoutNow.yard).x,coopGeometry(livingLayoutNow.yard).y,art.coopYard,510,321):upright(ctx,1195,235,art.livingCoop,280,187)},
    {y:HOUSE_DEPTH,draw:()=>upright(ctx,FARM_HOUSE.x,FARM_HOUSE.y,art.house,FARM_HOUSE.width,FARM_HOUSE.height)},
    {y:depth(MANGO_TREE.x,MANGO_TREE.y),draw:()=>{const size=mangoUi?.size()||100;upright(ctx,MANGO_TREE.x,MANGO_TREE.y,art.tree,size,size);mangoUi?.draw(ctx);}},
    {y:depth(1460,310),draw:()=>drawLife(ctx,1460,310,'shade',140,140,art,upright)},
    livingVisual.pondLayer(ctx,art,upright,livingLayoutNow),
    {y:houseActorDepth(player.x,player.y),draw:()=>drawIsoAvatar(ctx,player.x,player.y,player.direction,player.state==='walk', $('userName').textContent,actionEffect)}
  ];
  for(const building of phase5Ui?.state?.buildings||[]){const size=footprint(BUILDINGS[building.definitionId],building.rotation),x=(building.x+size.w/2)*TILE_SIZE,y=(building.y+size.h)*TILE_SIZE,index={mill:0,kitchen:1,rack:2}[building.definitionId]??0;layers.push({y:depth(x,y),draw:()=>upright(ctx,x,y,art.production,130,108,[index*724,0,724,724])});}
  layers.push(...livingVisual.fishLayers(ctx,art,upright,vacUi?.state,livingLayoutNow,villageUi?.reduced));
  layers.push(...livingVisual.chickenLayers(ctx,art,upright,vacUi?.state,livingLayoutNow,villageUi?.reduced,player));
  const egg= livingVisual.eggLayer(ctx,vacUi?.state,livingLayoutNow);if(egg)layers.push(egg);
  layers.push(...livingVisual.effectLayers(ctx,art,upright,vacUi?.state,livingLayoutNow));
  for(const npc of villageUi?.npcs(scene)||[])layers.push({y:depth(npc.x,npc.y),draw:()=>drawIsoNpc(ctx,npc)});
  for(const member of remoteMembers.values()){member.drawX+=(member.x-member.drawX)*.25;member.drawY+=(member.y-member.drawY)*.25;layers.push({y:houseActorDepth(member.drawX,member.drawY),draw:()=>drawIsoAvatar(ctx,member.drawX,member.drawY,member.direction,Math.hypot(member.x-member.drawX,member.y-member.drawY)>1,member.name)});}
  const occupied=[...(phase5Ui?.state?.buildings||[]),...(phase5Ui?.state?.decorations||[])].map(b=>{const z=footprint(BUILDINGS[b.definitionId]||DECORATIONS[b.definitionId],b.rotation);return {x:b.x*TILE_SIZE,y:b.y*TILE_SIZE,w:z.w*TILE_SIZE,h:z.h*TILE_SIZE};});
  occupied.push({x:FIELD.x,y:FIELD.y,w:FIELD.columns*FIELD.stepX,h:FIELD.rows*FIELD.stepY},livingLayoutNow.pond,...(livingLayoutNow.yard?[livingLayoutNow.yard]:[]));
  layers.push(...villageScenery('farm',art,upright,villageUi?.reduced,occupied).map(l=>({y:l.y,draw:()=>l.draw(ctx)})));
  layers.push(...sceneryLayers('farm',art,upright,villageUi?.reduced,occupied).map(l=>({y:l.y,draw:()=>l.draw(ctx)})));
  const fixtures=[['lantern',920,300]].map(([definitionId,x,y])=>({definitionId,x:x/TILE_SIZE-.5,y:y/TILE_SIZE-1,rotation:0}));
  layers.push(...decorationLayers([...(phase5Ui?.state?.decorations||[]),...fixtures],art.decorations,upright).map(l=>({y:l.y,draw:()=>l.draw(ctx)})));
  layers.push({y:depth(570,430),draw:()=>drawFarmSign(ctx,art.decorations,upright,visiting?.name||farm.name)});
  paintLayers(ctx,layers);
  drawFarmFence(ctx,art.farmFence,upright,true);
  phase5Ui?.draw(ctx,camera);drawActionFeedback(ctx);
}
function drawIsoAvatar(ctx,x,y,direction,moving,name,action){const actionIndex={till:0,plant:1,water:2,harvest:3}[action?.kind],acting=actionIndex!==undefined&&performance.now()-action.at<750;if(acting)upright(ctx,x,y,art.actions,90,91,[actionIndex*543,0,543,724]);else{const row={down:0,up:1,left:2,right:3}[direction]??0,frame=moving?Math.floor(performance.now()/135)%4:1,w=art.walk.naturalWidth/4||315,h=art.walk.naturalHeight/4||312;const bob=moving?Math.sin(performance.now()/110)*1.5:0;upright(ctx,x,y+bob,art.walk,78,86,[frame*w,row*h,w,h]);}ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8dd';ctx.strokeStyle='#38523f';ctx.lineWidth=3;ctx.strokeText(name,0,-95);ctx.fillText(name,0,-95);ctx.restore();}
function drawIsoNpc(ctx,npc){npc={...npc,y:npc.y+(villageUi?.reduced?0:Math.sin(performance.now()/1400+npc.x)*.6)};const index={tu:0,lan:1,ba:2,na:3}[npc.id]??0;upright(ctx,npc.x,npc.y,art.npcs,72,92,[index*543,0,543,724]);ctx.save();ctx.translate(npc.x,npc.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8dd';ctx.strokeStyle='#38523f';ctx.lineWidth=3;ctx.strokeText(npc.name,0,-98);ctx.fillText(npc.name,0,-98);ctx.restore();}
function drawIsoMarket(ctx){
  drawSurroundings(ctx);
  if(art.marketLifeGround.naturalWidth)ctx.drawImage(art.marketLifeGround.bitmap||art.marketLifeGround,0,0,MARKET_WORLD.width,MARKET_WORLD.height);
  villageUi?.drawSeason(ctx,camera);
  const layers=[...sceneryLayers('market',art,upright,villageUi?.reduced),...villageScenery('market',art,upright,villageUi?.reduced)];
  for(const [x,key,w,h] of [[300,'seedV9',290,206],[600,'buyerV9',310,211],[900,'ordersV9',280,220]])layers.push({y:depth(x,340),draw:()=>drawMarketStall(ctx,x,key,w,h)});
  for(const npc of villageUi?.npcs(scene)||[])layers.push({y:depth(npc.x,npc.y),draw:()=>drawIsoNpc(ctx,npc)});
  layers.push({y:depth(player.x,player.y),draw:()=>drawIsoAvatar(ctx,player.x,player.y,player.direction,player.state==='walk',$('userName').textContent)});
  for(const member of remoteMembers.values())layers.push({y:depth(member.x,member.y),draw:()=>drawIsoAvatar(ctx,member.x,member.y,member.direction,false,member.name)});
  paintLayers(ctx,layers);
  worldLabel(ctx,600,710,'Về nông trại');
}
function drawSurroundings(ctx){if(art.surroundings.naturalWidth)ctx.drawImage(art.surroundings.bitmap||art.surroundings,-1100,-1000,4300,3600);}
function drawMarketStall(ctx,x,key,w,h){
  const image=art[key];upright(ctx,x,340,image,w,h);
  const region={seedV9:[.30,.35,.19,.30],ordersV9:[.225,.52,.14,.20]}[key];
  if(villageUi?.reduced||!region||!image.naturalWidth)return;
  // Gentle breathing in the authored vendor region; the building's anchor is fixed.
  const [rx,ry,rw,rh]=region,bitmap=image.bitmap||image,breath=1+Math.sin(performance.now()/1100+x)*.008;
  ctx.save();ctx.translate(x,340);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  ctx.beginPath();ctx.rect(-w/2+rx*w,-h+ry*h,rw*w,rh*h);ctx.clip();
  ctx.drawImage(bitmap,rx*bitmap.width,ry*bitmap.height,rw*bitmap.width,rh*bitmap.height,-w/2+rx*w,-h+ry*h,rw*w,rh*h*breath);ctx.restore();
}
function worldLabel(ctx,x,y,label){ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);ctx.font='bold 14px system-ui';ctx.textAlign='center';const w=ctx.measureText(label).width+24;ctx.fillStyle='#fff0cf';ctx.strokeStyle='#a77b4d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-w/2,-12,w,25,8);ctx.fill();ctx.stroke();ctx.fillStyle='#65472e';ctx.fillText(label,0,6);ctx.restore();}

function draw(ctx){contextual?.placeMenu();ctx.clearRect(0,0,camera.width,camera.height);ctx.save();camera.apply(ctx);if(scene==='market'){drawIsoMarket(ctx);onboarding?.draw(ctx);ctx.restore();villageUi?.drawAtmosphere(ctx,camera.width,camera.height);drawNightLights(ctx,camera,scene,villageUi);return;}if(camera.isometric){drawIsometricFarm(ctx);onboarding?.draw(ctx);ctx.restore();villageUi?.drawAtmosphere(ctx,camera.width,camera.height);drawNightLights(ctx,camera,scene,villageUi);return;}ctx.fillStyle='#95bc69';ctx.fillRect(0,0,farmWorld.width,farmWorld.height);
// Repeating texture keeps the map tile based and avoids a flattened background image.
for(let y=0;y<farmWorld.height;y+=48)for(let x=0;x<farmWorld.width;x+=48){if(!camera.visible(x,y,80))continue;ctx.fillStyle=(x/48+y/48)%3===0?'#8eb662':'#98bf6d';ctx.fillRect(x,y,48,48);ctx.fillStyle='#6f9a53';ctx.fillRect(x+8,y+12,2,5);ctx.fillRect(x+31,y+36,3,4);}
phase5Ui?.drawGround(ctx,camera);
villageUi?.drawSeason(ctx,camera);
ctx.fillStyle='#c89b65';ctx.fillRect(640,485,140,435);ctx.fillRect(100,630,570,70);ctx.fillStyle='#bc7758';ctx.fillRect(590,485,250,135);for(let y=490;y<615;y+=23){ctx.strokeStyle='#9f6147';ctx.beginPath();ctx.moveTo(590,y);ctx.lineTo(840,y);ctx.stroke();}
for(let row=0;row<3;row++)for(let col=0;col<5;col++){ctx.fillStyle='#74583f';ctx.fillRect(105+col*82,730+row*55,70,42);ctx.fillStyle='#9b7a50';ctx.fillRect(109+col*82,733+row*55,62,34);}
vacUi.draw(ctx);
ctx.fillStyle='#d6bd6c';for(let x=50;x<1390;x+=26){ctx.fillRect(x,75,8,22);ctx.fillRect(x,918,8,22);}for(let y=75;y<930;y+=26){ctx.fillRect(50,y,20,7);ctx.fillRect(1370,y,20,7);}
for(const [x,y] of [[550,740],[1080,630],[1190,385],[245,475]]){const sway=villageUi?.reduced?0:Math.sin(performance.now()/1700+x*.02)*2;ctx.fillStyle='#604627';ctx.fillRect(x-5,y-28,11,31);ctx.fillStyle='#39734c';ctx.beginPath();ctx.arc(x+sway,y-39,29,0,7);ctx.fill();ctx.fillStyle='#51865a';ctx.beginPath();ctx.arc(x-9+sway,y-49,10,0,7);ctx.fill();}
for(const [x,y] of [[155,370],[1310,560]]){ctx.fillStyle='#608b3e';for(let i=0;i<6;i++){ctx.save();ctx.translate(x+i*8,y);ctx.rotate((i-3)*.16+(villageUi?.reduced?0:Math.sin(performance.now()/1300+i)*.018));ctx.fillRect(-2,-65,5,75);ctx.restore();}}
ctx.fillStyle='#dbb85d';ctx.fillRect(480,265,460,220);ctx.fillStyle='#9c4d39';ctx.beginPath();ctx.moveTo(455,275);ctx.lineTo(710,155);ctx.lineTo(965,275);ctx.closePath();ctx.fill();for(let x=510;x<930;x+=22){ctx.strokeStyle='#71392d';ctx.beginPath();ctx.moveTo(x,260);ctx.lineTo(x+140,190);ctx.stroke();}ctx.fillStyle='#643d2c';ctx.fillRect(680,385,65,100);ctx.fillStyle='#ebd8aa';ctx.fillRect(540,350,65,60);ctx.fillRect(820,350,65,60);
ctx.fillStyle='#8a582d';ctx.fillRect(320,665,45,55);ctx.fillStyle='#f0d797';ctx.fillRect(323,668,39,40);ctx.fillStyle='#68543a';ctx.fillRect(690,500,45,25);ctx.fillStyle=lamp?'#ffe87e':'#a38b59';ctx.fillRect(929,560,16,28);if(lamp){ctx.fillStyle='#fff3a066';ctx.beginPath();ctx.arc(937,570,62,0,7);ctx.fill();}
ctx.fillStyle='#72502e';ctx.fillRect(700,823,40,34);ctx.fillStyle='#f5dd9b';ctx.fillRect(686,804,68,25);ctx.fillStyle='#503b26';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText('CHỢ QUÊ',720,821);ctx.textAlign='start';
farming.draw(ctx);phase5Ui?.draw(ctx,camera);villageUi?.drawNpcs(ctx,camera,scene);drawRemote(ctx);drawPlayer(ctx);drawActionFeedback(ctx);if(ownEmote&&Date.now()-ownEmote.at<2600){ctx.font='25px system-ui';ctx.fillText({wave:'👋',hello:'🌾',thanks:'🙏',happy:'😊'}[ownEmote.name],player.x-12,player.y-68);}ctx.restore();villageUi?.drawAtmosphere(ctx,camera.width,camera.height);drawNightLights(ctx,camera,scene,villageUi);}
function drawActionFeedback(ctx){if(!actionEffect)return;const age=performance.now()-actionEffect.at;if(age>550){actionEffect=null;return;}const icon={till:'⛏',plant:'🌱',water:'💧',harvest:'🌾',mango_harvest:'🥭',stock_fish:'🐟',feed_fish:'🐟',harvest_fish:'🐟',add_chicken:'🐣',feed_chicken:'🌽',collect_eggs:'🥚',start:'⚙',claim:'✨',place_building:'🔨',place_decoration:'✨'}[actionEffect.kind];if(!icon)return;ctx.save();ctx.globalAlpha=1-age/550;ctx.font='23px system-ui';ctx.textAlign='center';ctx.fillText(icon,player.x+17,player.y-43-(villageUi?.reduced?0:age/22));ctx.restore();}
function drawAvatar(ctx,x,y,direction,step,name,shirt){ctx.fillStyle='#42593266';ctx.beginPath();ctx.ellipse(x,y+6,18,6,0,0,7);ctx.fill();ctx.fillStyle='#353f44';ctx.fillRect(x-9,y-9,7,16+step);ctx.fillRect(x+2,y-9,7,16-step);ctx.fillStyle='#523b2c';ctx.fillRect(x-10,y+4+step,9,4);ctx.fillRect(x+2,y+4-step,9,4);ctx.fillStyle='#e7c48f';ctx.fillRect(x-13,y-29,5,18);ctx.fillRect(x+8,y-29,5,18);ctx.fillStyle=shirt;ctx.beginPath();ctx.roundRect(x-10,y-35,20,29,5);ctx.fill();ctx.fillStyle='#d9b77c';ctx.fillRect(x-3,y-35,6,27);ctx.fillStyle='#e6b987';ctx.beginPath();ctx.ellipse(x,y-43,11,13,0,0,7);ctx.fill();ctx.fillStyle='#352f2b';ctx.beginPath();ctx.ellipse(x,y-52,12,6,0,Math.PI,7);ctx.fill();ctx.fillRect(x-11,y-52,22,3);if(direction!=='up'){ctx.fillStyle='#493325';const eye=direction==='left'?-4:direction==='right'?4:0;ctx.fillRect(x-4+eye,y-45,2,2);if(!eye)ctx.fillRect(x+3,y-45,2,2);}ctx.fillStyle='#fff7d8';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(name,x,y-65);ctx.textAlign='start';}
function drawPlayer(ctx){drawAvatar(ctx,player.x,player.y,player.direction,player.state==='walk'?Math.sin(player.elapsed*14)*4:0,$('userName').textContent,'#274e58');}
function drawMarket(ctx){
ctx.fillStyle='#80ad71';ctx.fillRect(0,0,MARKET_WORLD.width,MARKET_WORLD.height);
for(let y=0;y<800;y+=48)for(let x=0;x<1200;x+=48){ctx.fillStyle=(x/48+y/48)%2?'#86b476':'#80ad70';ctx.fillRect(x,y,48,48);ctx.fillStyle='#5b9162';ctx.fillRect(x+13,y+28,3,4);}
ctx.fillStyle='#c6a47b';ctx.fillRect(100,405,1000,230);ctx.fillRect(545,340,110,440);
ctx.fillStyle='#b69064';for(let x=120;x<1080;x+=65)for(let y=425;y<620;y+=55)ctx.fillRect(x,y,28,12);
ctx.fillStyle='#a4774a';for(const [x,y,w] of [[180,225,240],[480,225,240],[780,225,240]]){ctx.fillRect(x,y,w,120);ctx.fillStyle='#6e4930';ctx.fillRect(x+15,y+100,w-30,24);ctx.fillStyle='#a4774a';}
for(const [x,color] of [[180,'#c75e4d'],[480,'#d3ae64'],[780,'#6f9561']]){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-12,235);ctx.lineTo(x+120,165);ctx.lineTo(x+252,235);ctx.closePath();ctx.fill();ctx.strokeStyle='#e9d7a0';for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(x+i*42,230);ctx.lineTo(x+120,168);ctx.stroke();}}
for(const [x,y] of [[130,480],[1055,485],[280,450],[670,510]]){ctx.fillStyle='#926733';ctx.beginPath();ctx.ellipse(x,y,21,12,0,0,7);ctx.fill();ctx.strokeStyle='#dbbd82';ctx.stroke();ctx.fillStyle='#d8b85a';ctx.fillRect(x-12,y-6,24,5);}
for(const [x,y,label,color] of [[300,380,'HẠT GIỐNG','#5a944d'],[600,380,'THU MUA','#d9974e'],[900,380,'ĐƠN LÀNG','#7199a7']]){ctx.fillStyle='#65452e';ctx.fillRect(x-18,y-28,36,40);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y-35,18,0,7);ctx.fill();ctx.fillStyle='#fff1cb';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y-105);}
for(const [x,goods] of [[300,['🌾','🌱','🌽']],[600,['🥕','🍅','🐟']],[900,['📜','🧺','🌾']]]){ctx.fillStyle='#8a5a36';ctx.beginPath();ctx.ellipse(x,320,85,17,0,0,7);ctx.fill();ctx.font='23px system-ui';ctx.textAlign='center';goods.forEach((good,i)=>ctx.fillText(good,x+(i-1)*48,315));}
ctx.textAlign='start';
ctx.fillStyle='#745131';ctx.fillRect(575,660,50,45);ctx.fillStyle='#fff0bd';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText('VỀ FARM',600,735);ctx.textAlign='start';
for(const [x,y] of [[55,65],[55,745]]){ctx.fillStyle='#c9ae71';ctx.fillRect(x,y,1090,15);}for(const x of [55,1130])for(let y=65;y<760;y+=22){ctx.fillStyle='#c9ae71';ctx.fillRect(x,y,15,9);}
}
$('loadingRetry').onclick=()=>location.reload();
try{const data=await api('/me');csrf=data.csrf;await enter(data.farm);}catch(error){if(error.status===401)screen('welcome');else loadingFailure();}
