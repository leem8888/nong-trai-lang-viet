import { GameLoop } from './core/GameLoop.js';
import { Camera } from './core/Camera.js';
import { InputManager } from './core/InputManager.js';
import { Player } from './entities/Player.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { FarmingUI } from './farming.js';
import { tileAt } from './shared/crops.js';
import { MarketUI } from './market.js';
import { VacUI } from './vac.js';
import { Phase5UI } from './phase5.js';
import { VillageUI } from './village.js';
import { BUILDINGS, DECORATIONS, footprint, TILE_SIZE } from './shared/phase5.js';
import { VAC_POINTS } from './shared/vac.js';
import { MARKET_WORLD, MARKET_POINTS, FARM_GATE } from './shared/marketMap.js';

const $=id=>document.getElementById(id);
let csrf='', farm=null, socket=null, loop=null, player=null, input=null, camera=null, collision=null, farming=null, marketUi=null, vacUi=null, phase5Ui=null, villageUi=null, lamp=0, scene='farm';
const farmWorld={width:1440,height:1024,margin:{left:0,right:0,top:0,bottom:0},obstacles:[
{x:480,y:265,w:460,h:220},{x:50,y:75,w:1340,h:15},{x:50,y:920,w:1340,h:15},{x:50,y:75,w:15,h:860},{x:1375,y:75,w:15,h:860},
{x:520,y:720,w:45,h:35},{x:1060,y:610,w:40,h:35},{x:215,y:460,w:70,h:25},{x:700,y:514,w:25,h:15},{x:925,y:575,w:20,h:20},
{x:1010,y:710,w:280,h:145},{x:1050,y:360,w:230,h:130}]};
const objects={board:{x:343,y:700,label:'Bảng thông tin'},door:{x:712,y:520,label:'Cửa nhà'},lamp:{x:935,y:586,label:'Đèn sân'},farmGate:{...FARM_GATE,label:'Ra chợ làng'},...VAC_POINTS};
async function api(url,options={}) { const response=await fetch('/api'+url,{...options,headers:{'content-type':'application/json','x-csrf-token':csrf,...options.headers}}); const data=await response.json(); if(!response.ok) throw Error(data.error); return data; }
function showError(message){$('error').textContent=message;$('error').classList.remove('hidden');setTimeout(()=>$('error').classList.add('hidden'),4500);}
function showNotice(message){$('notice').textContent=message;$('notice').classList.remove('hidden');setTimeout(()=>$('notice').classList.add('hidden'),2800);}
function screen(id){for(const name of ['welcome','create','game'])$(name).classList.toggle('hidden',name!==id);}
function panel(html){$('panelContent').innerHTML=html;$('panel').classList.remove('hidden');if(input)input.active=false;}
function closePanel(){$('panel').classList.add('hidden');if(input)input.active=true;}
function syncPhase5Collision(){if(!phase5Ui?.state||scene!=='farm'||!collision)return;const s=phase5Ui.state;const dynamic=[...s.buildings.map(o=>{const z=footprint(BUILDINGS[o.definitionId],o.rotation);return {x:o.x*TILE_SIZE,y:o.y*TILE_SIZE,w:z.w*TILE_SIZE,h:z.h*TILE_SIZE};}),...s.decorations.filter(o=>DECORATIONS[o.definitionId]?.blocking).map(o=>({x:o.x*TILE_SIZE,y:o.y*TILE_SIZE,w:TILE_SIZE,h:TILE_SIZE}))];collision.obstacles=[...new CollisionSystem(farmWorld).obstacles,...dynamic];}
$('closePanel').onclick=closePanel;
let mode='login';
for(const name of ['login','register'])$(name+'Tab').onclick=()=>{mode=name;$('authSubmit').textContent=name==='login'?'Đăng nhập':'Đăng ký';};
$('authForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/'+mode,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});csrf=data.csrf;await enter(data.farm);}catch(error){showError(error.message);}};
$('farmForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/farms',{method:'POST',body:JSON.stringify({name:new FormData(e.target).get('name')})});await enter(data.farm);}catch(error){showError(error.message);}};
$('menuButton').onclick=()=>panel('<h2>Tạm nghỉ</h2><p>Trạng thái được lưu trên máy chủ.</p><button id="logout">Đăng xuất</button>');
$('panel').addEventListener('click',async e=>{if(e.target.id==='logout'){try{await api('/logout',{method:'POST'});}catch{} socket?.disconnect();loop?.stop();location.reload();}});
function nearbyObjects(){return {...(scene==='market'?MARKET_POINTS:objects),...Object.fromEntries((villageUi?.npcs(scene)||[]).map(n=>[`npc:${n.id}`,{x:n.x,y:n.y,label:`Trò chuyện · ${n.name}`}]))};}
function nearest(){return Object.entries(nearbyObjects()).map(([id,o])=>({id,...o,d:Math.hypot(player.x-o.x,player.y-o.y)})).filter(o=>o.d<=96).sort((a,b)=>a.d-b.d)[0];}
function interact(id=nearest()?.id){if(!id)return;const o=nearbyObjects()[id];if(!o||Math.hypot(player.x-o.x,player.y-o.y)>96){showError('Hãy đến gần vật thể.');return;}
if(id.startsWith('npc:'))return villageUi.interact(id.slice(4));
if(id==='farmGate')return travel('market');if(id==='returnGate')return travel('farm');
if(id==='seedShop')return marketUi.open('shop');if(id==='buyer')return marketUi.open('buyer');if(id==='orderBoard')return marketUi.open('orders');
if(id==='pond'||id==='coop')return vacUi.open(id);
if(id==='board')panel(`<h2>${escapeHtml(farm.name)}</h2><p>Chủ nông trại: ${escapeHtml($('userName').textContent)}</p><p>Ngày tạo: ${new Date(farm.created_at).toLocaleDateString('vi-VN')}</p>`);
if(id==='door')panel('<h2>Ngôi nhà mái ngói</h2><p>Một gian nhà ấm cúng nhìn ra sân gạch. Nội thất sẽ được mở rộng ở các phase sau.</p>');
if(id==='lamp')socket.emit('farm:interact',{objectId:'lamp'},result=>{if(!result.ok)showError(result.error);});}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function applyScene(next,x,y,direction='down'){
scene=next;const world=scene==='market'?MARKET_WORLD:farmWorld;
collision=new CollisionSystem(world);camera.setWorld(world);player.place(x,y,direction);camera.snap(x,y);input?.clear();
syncPhase5Collision();
$('farmHud').classList.toggle('hidden',scene==='market');$('marketHud').classList.toggle('hidden',scene!=='market');
$('help').textContent=scene==='market'?'Đến gần quầy, bảng đơn hoặc cổng rồi nhấn E.':'WASD / mũi tên: đi · E: tương tác · 1–4: công cụ · Nhấp ô ruộng để dùng';
}
function travel(to){if(!socket?.connected){showError('Mất kết nối với server.');return;}socket.emit('world:travel',{to},async result=>{
if(!result.ok){showError(result.error);return;}applyScene(result.scene,result.x,result.y);try{marketUi.setState(await api('/market'));}catch(error){showError(error.message);}
});}
async function enter(existing){if(!existing){screen('create');return;}farm=existing;const state=await api('/farm');lamp=state.objects.find(o=>o.object_id==='lamp')?.state||0;
$('farmName').textContent=farm.name;$('userName').textContent=(await api('/me')).user.username;screen('game');
const canvas=$('canvas'),ctx=canvas.getContext('2d');player=new Player();player.place(state.player.x,state.player.y,state.player.direction);scene=state.player.scene||'farm';camera=new Camera(scene==='market'?MARKET_WORLD:farmWorld);camera.snap(player.x,player.y);
farming=new FarmingUI(api,showError,showNotice,panel);farming.setState(await api('/farming'));
marketUi=new MarketUI(api,panel,showError,showNotice,async()=>farming.setState(await api('/farming')));marketUi.setState(await api('/market'));
vacUi=new VacUI(api,panel,showError,showNotice,async()=>{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));});vacUi.setState(await api('/vac'));
 phase5Ui=new Phase5UI(api,panel,closePanel,showNotice,showError,async()=>{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));});phase5Ui.refreshCollision=syncPhase5Collision;await phase5Ui.load();
 villageUi=new VillageUI(api,panel,showNotice,showError,async()=>{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));});await villageUi.load();
 collision=new CollisionSystem(scene==='market'?MARKET_WORLD:farmWorld);input=new InputManager(canvas,camera,$('joystick'),key=>{if(phase5Ui?.mode){phase5Ui.key(key);return;}if(key==='e')interact();if(key==='escape')closePanel();if(scene==='farm'){if(key==='b')phase5Ui.open('build');else farming.key(key);}});input.active=true;
applyScene(scene,player.x,player.y,player.direction);
input.onPoint=point=>{if(scene==='farm'&&phase5Ui?.mode)return phase5Ui.point(point);if(scene==='farm'&&tileAt(point.x,point.y))return farming.point(point);const entry=Object.entries(nearbyObjects()).find(([,o])=>Math.hypot(point.x-o.x,point.y-o.y)<38);if(entry){interact(entry[0]);return true;}return false;};
canvas.addEventListener('pointermove',e=>{const point=camera.toWorld(e.clientX,e.clientY);farming.hover=scene==='farm'&&!phase5Ui?.mode?tileAt(point.x,point.y):null;if(phase5Ui)phase5Ui.hover=point;});canvas.addEventListener('pointerleave',()=>{farming.hover=null;});
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);camera.resize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
socket=io({withCredentials:true});socket.on('connect',()=>{ $('status').textContent='Đã kết nối';socket.emit('farm:join',{farmId:farm.id},async r=>{if(r.ok){applyScene(r.snapshot.player.scene||'farm',r.snapshot.player.x,r.snapshot.player.y,r.snapshot.player.direction);lamp=r.snapshot.objects.find(o=>o.object_id==='lamp')?.state||0;try{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));vacUi.setState(await api('/vac'));await phase5Ui.load();await villageUi.load();}catch(error){showError(error.message);}}else showError(r.error);});});socket.on('disconnect',()=>{$('status').textContent='Mất kết nối';});socket.on('farm:object',o=>{if(o.objectId==='lamp')lamp=o.state;});socket.on('farm:farming',state=>farming.setState(state));socket.on('farm:market',state=>marketUi.setState(state));socket.on('farm:vac',state=>vacUi.setState(state));socket.on('farm:phase5',state=>phase5Ui.setState(state));socket.on('farm:quests',state=>{if(villageUi?.state){villageUi.state.quests=state;villageUi.updateHud();}});
setInterval(async()=>{if(document.visibilityState==='visible')try{farming.setState(await api('/farming'));marketUi.setState(await api('/market'));vacUi.setState(await api('/vac'));await phase5Ui.load();await villageUi.load();}catch{}},30000);
let saveAt=0,hudAt=0;loop=new GameLoop((dt)=>{input.active=$('panel').classList.contains('hidden');player.update(dt,input.vector(player),collision);camera.update(player,dt);const near=nearest();$('prompt').style.display=near?'block':'none';if(near)$('prompt').textContent=`E · ${near.label}`;const time=performance.now();if(time-hudAt>1000){hudAt=time;villageUi.updateHud();}if(socket.connected&&time-saveAt>180){saveAt=time;socket.emit('player:move',{x:player.x,y:player.y,direction:player.direction},r=>{if(r&&!r.ok&&r.player)player.place(r.player.x,r.player.y);});}},()=>draw(ctx));loop.start();}
function draw(ctx){ctx.clearRect(0,0,camera.width,camera.height);ctx.save();camera.apply(ctx);if(scene==='market'){drawMarket(ctx);villageUi?.drawSeason(ctx,camera);villageUi?.drawNpcs(ctx,camera,scene);drawPlayer(ctx);ctx.restore();villageUi?.drawAtmosphere(ctx,camera.width,camera.height);return;}ctx.fillStyle='#95bc69';ctx.fillRect(0,0,farmWorld.width,farmWorld.height);
// Repeating texture keeps the map tile based and avoids a flattened background image.
for(let y=0;y<farmWorld.height;y+=48)for(let x=0;x<farmWorld.width;x+=48){if(!camera.visible(x,y,80))continue;ctx.fillStyle=(x/48+y/48)%3===0?'#8eb662':'#98bf6d';ctx.fillRect(x,y,48,48);ctx.fillStyle='#6f9a53';ctx.fillRect(x+8,y+12,2,5);ctx.fillRect(x+31,y+36,3,4);}
phase5Ui?.drawGround(ctx,camera);
villageUi?.drawSeason(ctx,camera);
ctx.fillStyle='#c89b65';ctx.fillRect(640,485,140,435);ctx.fillRect(100,630,570,70);ctx.fillStyle='#bc7758';ctx.fillRect(590,485,250,135);for(let y=490;y<615;y+=23){ctx.strokeStyle='#9f6147';ctx.beginPath();ctx.moveTo(590,y);ctx.lineTo(840,y);ctx.stroke();}
for(let row=0;row<3;row++)for(let col=0;col<5;col++){ctx.fillStyle='#74583f';ctx.fillRect(105+col*82,730+row*55,70,42);ctx.fillStyle='#9b7a50';ctx.fillRect(109+col*82,733+row*55,62,34);}
vacUi.draw(ctx);
ctx.fillStyle='#d6bd6c';for(let x=50;x<1390;x+=26){ctx.fillRect(x,75,8,22);ctx.fillRect(x,918,8,22);}for(let y=75;y<930;y+=26){ctx.fillRect(50,y,20,7);ctx.fillRect(1370,y,20,7);}
for(const [x,y] of [[550,740],[1080,630],[1190,385],[245,475]]){ctx.fillStyle='#604627';ctx.fillRect(x-5,y-28,11,31);ctx.fillStyle='#39734c';ctx.beginPath();ctx.arc(x,y-39,29,0,7);ctx.fill();}
for(const [x,y] of [[155,370],[1310,560]]){ctx.fillStyle='#608b3e';for(let i=0;i<6;i++){ctx.save();ctx.translate(x+i*8,y);ctx.rotate((i-3)*.16);ctx.fillRect(-2,-65,5,75);ctx.restore();}}
ctx.fillStyle='#dbb85d';ctx.fillRect(480,265,460,220);ctx.fillStyle='#9c4d39';ctx.beginPath();ctx.moveTo(455,275);ctx.lineTo(710,155);ctx.lineTo(965,275);ctx.closePath();ctx.fill();for(let x=510;x<930;x+=22){ctx.strokeStyle='#71392d';ctx.beginPath();ctx.moveTo(x,260);ctx.lineTo(x+140,190);ctx.stroke();}ctx.fillStyle='#643d2c';ctx.fillRect(680,385,65,100);ctx.fillStyle='#ebd8aa';ctx.fillRect(540,350,65,60);ctx.fillRect(820,350,65,60);
ctx.fillStyle='#8a582d';ctx.fillRect(320,665,45,55);ctx.fillStyle='#f0d797';ctx.fillRect(323,668,39,40);ctx.fillStyle='#68543a';ctx.fillRect(690,500,45,25);ctx.fillStyle=lamp?'#ffe87e':'#a38b59';ctx.fillRect(929,560,16,28);if(lamp){ctx.fillStyle='#fff3a066';ctx.beginPath();ctx.arc(937,570,62,0,7);ctx.fill();}
ctx.fillStyle='#72502e';ctx.fillRect(700,823,40,34);ctx.fillStyle='#f5dd9b';ctx.fillRect(686,804,68,25);ctx.fillStyle='#503b26';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText('CHỢ QUÊ',720,821);ctx.textAlign='start';
farming.draw(ctx);phase5Ui?.draw(ctx,camera);villageUi?.drawNpcs(ctx,camera,scene);drawPlayer(ctx);ctx.restore();villageUi?.drawAtmosphere(ctx,camera.width,camera.height);}
function drawPlayer(ctx){ctx.fillStyle='#425932';ctx.beginPath();ctx.ellipse(player.x,player.y+5,18,8,0,0,7);ctx.fill();ctx.fillStyle='#294555';ctx.fillRect(player.x-11,player.y-35,22,30);ctx.fillStyle='#e2ad82';ctx.beginPath();ctx.arc(player.x,player.y-42,12,0,7);ctx.fill();ctx.fillStyle='#483323';ctx.fillRect(player.x-13,player.y-54,26,7);ctx.fillStyle='#213c52';const step=player.state==='walk'&&Math.sin(player.elapsed*16)>0?4:0;ctx.fillRect(player.x-9,player.y-5,7,12+step);ctx.fillRect(player.x+3,player.y-5,7,16-step);}
function drawMarket(ctx){
ctx.fillStyle='#80ad71';ctx.fillRect(0,0,MARKET_WORLD.width,MARKET_WORLD.height);
for(let y=0;y<800;y+=48)for(let x=0;x<1200;x+=48){ctx.fillStyle=(x/48+y/48)%2?'#86b476':'#80ad70';ctx.fillRect(x,y,48,48);ctx.fillStyle='#5b9162';ctx.fillRect(x+13,y+28,3,4);}
ctx.fillStyle='#c6a47b';ctx.fillRect(100,405,1000,230);ctx.fillRect(545,340,110,440);
ctx.fillStyle='#b69064';for(let x=120;x<1080;x+=65)for(let y=425;y<620;y+=55)ctx.fillRect(x,y,28,12);
ctx.fillStyle='#a4774a';for(const [x,y,w] of [[180,225,240],[480,225,240],[780,225,240]]){ctx.fillRect(x,y,w,120);ctx.fillStyle='#6e4930';ctx.fillRect(x+15,y+100,w-30,24);ctx.fillStyle='#a4774a';}
for(const [x,color] of [[180,'#c75e4d'],[480,'#d3ae64'],[780,'#6f9561']]){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-12,235);ctx.lineTo(x+120,165);ctx.lineTo(x+252,235);ctx.closePath();ctx.fill();ctx.strokeStyle='#e9d7a0';for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(x+i*42,230);ctx.lineTo(x+120,168);ctx.stroke();}}
for(const [x,y] of [[130,480],[1055,485],[280,450],[670,510]]){ctx.fillStyle='#926733';ctx.beginPath();ctx.ellipse(x,y,21,12,0,0,7);ctx.fill();ctx.strokeStyle='#dbbd82';ctx.stroke();ctx.fillStyle='#d8b85a';ctx.fillRect(x-12,y-6,24,5);}
for(const [x,y,label,color] of [[300,380,'HẠT GIỐNG','#5a944d'],[600,380,'THU MUA','#d9974e'],[900,380,'ĐƠN LÀNG','#7199a7']]){ctx.fillStyle='#65452e';ctx.fillRect(x-18,y-28,36,40);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y-35,18,0,7);ctx.fill();ctx.fillStyle='#fff1cb';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y-105);}
ctx.fillStyle='#745131';ctx.fillRect(575,660,50,45);ctx.fillStyle='#fff0bd';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText('VỀ FARM',600,735);ctx.textAlign='start';
for(const [x,y] of [[55,65],[55,745]]){ctx.fillStyle='#c9ae71';ctx.fillRect(x,y,1090,15);}for(const x of [55,1130])for(let y=65;y<760;y+=22){ctx.fillStyle='#c9ae71';ctx.fillRect(x,y,15,9);}
}
try{const data=await api('/me');csrf=data.csrf;await enter(data.farm);}catch{screen('welcome');}
