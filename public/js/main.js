import { GameLoop } from './core/GameLoop.js';
import { Camera } from './core/Camera.js';
import { InputManager } from './core/InputManager.js';
import { Player } from './entities/Player.js';
import { CollisionSystem } from './systems/CollisionSystem.js';

const $=id=>document.getElementById(id);
let csrf='', farm=null, socket=null, loop=null, player=null, input=null, camera=null, lamp=0;
const world={width:1440,height:1024,margin:{left:0,right:0,top:0,bottom:0},obstacles:[
{x:480,y:265,w:460,h:220},{x:50,y:75,w:1340,h:15},{x:50,y:920,w:1340,h:15},{x:50,y:75,w:15,h:860},{x:1375,y:75,w:15,h:860},
{x:320,y:720,w:45,h:35},{x:1060,y:610,w:40,h:35},{x:1170,y:365,w:40,h:35},{x:215,y:460,w:70,h:25},{x:700,y:514,w:25,h:15},{x:925,y:575,w:20,h:20}]};
const objects={board:{x:343,y:700,label:'Bảng thông tin'},door:{x:712,y:520,label:'Cửa nhà'},lamp:{x:935,y:586,label:'Đèn sân'}};
async function api(url,options={}) { const response=await fetch('/api'+url,{...options,headers:{'content-type':'application/json','x-csrf-token':csrf,...options.headers}}); const data=await response.json(); if(!response.ok) throw Error(data.error); return data; }
function showError(message){$('error').textContent=message;$('error').classList.remove('hidden');setTimeout(()=>$('error').classList.add('hidden'),4500);}
function screen(id){for(const name of ['welcome','create','game'])$(name).classList.toggle('hidden',name!==id);}
function panel(html){$('panelContent').innerHTML=html;$('panel').classList.remove('hidden');input.active=false;}
function closePanel(){$('panel').classList.add('hidden');if(input)input.active=true;}
$('closePanel').onclick=closePanel;
let mode='login';
for(const name of ['login','register'])$(name+'Tab').onclick=()=>{mode=name;$('authSubmit').textContent=name==='login'?'Đăng nhập':'Đăng ký';};
$('authForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/'+mode,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});csrf=data.csrf;await enter(data.farm);}catch(error){showError(error.message);}};
$('farmForm').onsubmit=async e=>{e.preventDefault();try{const data=await api('/farms',{method:'POST',body:JSON.stringify({name:new FormData(e.target).get('name')})});await enter(data.farm);}catch(error){showError(error.message);}};
$('menuButton').onclick=()=>panel('<h2>Tạm nghỉ</h2><p>Trạng thái được lưu trên máy chủ.</p><button id="logout">Đăng xuất</button>');
$('panel').addEventListener('click',async e=>{if(e.target.id==='logout'){try{await api('/logout',{method:'POST'});}catch{} socket?.disconnect();loop?.stop();location.reload();}});
function nearest(){return Object.entries(objects).map(([id,o])=>({id,...o,d:Math.hypot(player.x-o.x,player.y-o.y)})).filter(o=>o.d<=96).sort((a,b)=>a.d-b.d)[0];}
function interact(id=nearest()?.id){if(!id)return;const o=objects[id];if(Math.hypot(player.x-o.x,player.y-o.y)>96){showError('Hãy đến gần vật thể.');return;}
if(id==='board')panel(`<h2>${escapeHtml(farm.name)}</h2><p>Chủ nông trại: ${escapeHtml($('userName').textContent)}</p><p>Ngày tạo: ${new Date(farm.created_at).toLocaleDateString('vi-VN')}</p>`);
if(id==='door')panel('<h2>Ngôi nhà mái ngói</h2><p>Một gian nhà ấm cúng nhìn ra sân gạch. Nội thất sẽ được mở rộng ở các phase sau.</p>');
if(id==='lamp')socket.emit('farm:interact',{objectId:'lamp'},result=>{if(!result.ok)showError(result.error);});}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function enter(existing){if(!existing){screen('create');return;}farm=existing;const state=await api('/farm');lamp=state.objects.find(o=>o.object_id==='lamp')?.state||0;
$('farmName').textContent=farm.name;$('userName').textContent=(await api('/me')).user.username;screen('game');
const canvas=$('canvas'),ctx=canvas.getContext('2d');player=new Player();player.place(state.player.x,state.player.y,state.player.direction);camera=new Camera(world);camera.snap(player.x,player.y);
const collision=new CollisionSystem(world);input=new InputManager(canvas,camera,$('joystick'),key=>{if(key==='e')interact();if(key==='escape')closePanel();});input.active=true;
input.onPoint=point=>{const entry=Object.entries(objects).find(([,o])=>Math.hypot(point.x-o.x,point.y-o.y)<38);if(entry){interact(entry[0]);return true;}return false;};
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);camera.resize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
socket=io({withCredentials:true});socket.on('connect',()=>{ $('status').textContent='Đã kết nối';socket.emit('farm:join',{farmId:farm.id},r=>{if(r.ok){player.place(r.snapshot.player.x,r.snapshot.player.y,r.snapshot.player.direction);lamp=r.snapshot.objects.find(o=>o.object_id==='lamp')?.state||0;}else showError(r.error);});});socket.on('disconnect',()=>{$('status').textContent='Mất kết nối';});socket.on('farm:object',o=>{if(o.objectId==='lamp')lamp=o.state;});
let saveAt=0;loop=new GameLoop((dt)=>{input.active=$('panel').classList.contains('hidden');player.update(dt,input.vector(player),collision);camera.update(player,dt);const near=nearest();$('prompt').style.display=near?'block':'none';if(near)$('prompt').textContent=`E · ${near.label}`;const time=performance.now();if(socket.connected&&time-saveAt>180){saveAt=time;socket.emit('player:move',{x:player.x,y:player.y,direction:player.direction},r=>{if(r&&!r.ok&&r.player)player.place(r.player.x,r.player.y);});}},()=>draw(ctx));loop.start();}
function draw(ctx){ctx.clearRect(0,0,camera.width,camera.height);ctx.save();camera.apply(ctx);ctx.fillStyle='#95bc69';ctx.fillRect(0,0,world.width,world.height);
// Repeating texture keeps the map tile based and avoids a flattened background image.
for(let y=0;y<world.height;y+=48)for(let x=0;x<world.width;x+=48){if(!camera.visible(x,y,80))continue;ctx.fillStyle=(x/48+y/48)%3===0?'#8eb662':'#98bf6d';ctx.fillRect(x,y,48,48);ctx.fillStyle='#6f9a53';ctx.fillRect(x+8,y+12,2,5);ctx.fillRect(x+31,y+36,3,4);}
ctx.fillStyle='#c89b65';ctx.fillRect(640,485,140,435);ctx.fillRect(100,630,570,70);ctx.fillStyle='#bc7758';ctx.fillRect(590,485,250,135);for(let y=490;y<615;y+=23){ctx.strokeStyle='#9f6147';ctx.beginPath();ctx.moveTo(590,y);ctx.lineTo(840,y);ctx.stroke();}
for(let row=0;row<3;row++)for(let col=0;col<5;col++){ctx.fillStyle='#74583f';ctx.fillRect(105+col*82,730+row*55,70,42);ctx.fillStyle='#9b7a50';ctx.fillRect(109+col*82,733+row*55,62,34);}
ctx.fillStyle='#6eaa86';ctx.fillRect(1010,710,280,145);ctx.fillStyle='#2f765a';ctx.font='18px system-ui';ctx.fillText('Ao tương lai',1070,785);ctx.fillStyle='#b4a474';ctx.fillRect(1050,360,230,130);ctx.fillStyle='#574532';ctx.fillText('Chuồng tương lai',1083,427);
ctx.fillStyle='#d6bd6c';for(let x=50;x<1390;x+=26){ctx.fillRect(x,75,8,22);ctx.fillRect(x,918,8,22);}for(let y=75;y<930;y+=26){ctx.fillRect(50,y,20,7);ctx.fillRect(1370,y,20,7);}
for(const [x,y] of [[350,740],[1080,630],[1190,385],[245,475]]){ctx.fillStyle='#604627';ctx.fillRect(x-5,y-28,11,31);ctx.fillStyle='#39734c';ctx.beginPath();ctx.arc(x,y-39,29,0,7);ctx.fill();}
for(const [x,y] of [[155,370],[1310,560]]){ctx.fillStyle='#608b3e';for(let i=0;i<6;i++){ctx.save();ctx.translate(x+i*8,y);ctx.rotate((i-3)*.16);ctx.fillRect(-2,-65,5,75);ctx.restore();}}
ctx.fillStyle='#dbb85d';ctx.fillRect(480,265,460,220);ctx.fillStyle='#9c4d39';ctx.beginPath();ctx.moveTo(455,275);ctx.lineTo(710,155);ctx.lineTo(965,275);ctx.closePath();ctx.fill();for(let x=510;x<930;x+=22){ctx.strokeStyle='#71392d';ctx.beginPath();ctx.moveTo(x,260);ctx.lineTo(x+140,190);ctx.stroke();}ctx.fillStyle='#643d2c';ctx.fillRect(680,385,65,100);ctx.fillStyle='#ebd8aa';ctx.fillRect(540,350,65,60);ctx.fillRect(820,350,65,60);
ctx.fillStyle='#8a582d';ctx.fillRect(320,665,45,55);ctx.fillStyle='#f0d797';ctx.fillRect(323,668,39,40);ctx.fillStyle='#68543a';ctx.fillRect(690,500,45,25);ctx.fillStyle=lamp?'#ffe87e':'#a38b59';ctx.fillRect(929,560,16,28);if(lamp){ctx.fillStyle='#fff3a066';ctx.beginPath();ctx.arc(937,570,62,0,7);ctx.fill();}
ctx.fillStyle='#425932';ctx.beginPath();ctx.ellipse(player.x,player.y+5,18,8,0,0,7);ctx.fill();ctx.fillStyle='#294555';ctx.fillRect(player.x-11,player.y-35,22,30);ctx.fillStyle='#e2ad82';ctx.beginPath();ctx.arc(player.x,player.y-42,12,0,7);ctx.fill();ctx.fillStyle='#483323';ctx.fillRect(player.x-13,player.y-54,26,7);ctx.fillStyle='#213c52';const step=player.state==='walk'&&Math.sin(player.elapsed*16)>0?4:0;ctx.fillRect(player.x-9,player.y-5,7,12+step);ctx.fillRect(player.x+3,player.y-5,7,16-step);ctx.restore();}
try{const data=await api('/me');csrf=data.csrf;await enter(data.farm);}catch{screen('welcome');}
