// Uses the installed Edge browser and native CDP; no package-manager dependency.
import {spawn} from 'node:child_process';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {performFarmAction} from '../server/crops.js';
import {performPhase5Action} from '../server/phase5.js';
import {addItem} from '../server/crops.js';
import {performVacAction} from '../server/vac.js';
import {DECORATIONS} from '../public/js/shared/phase5.js';

const stage=process.argv[2]||'after',root=path.resolve('.qa/phase9');
mkdirSync(root,{recursive:true});
mkdirSync('docs/phase9',{recursive:true});
const db=openDatabase(':memory:');
const user=register(db,'visual_phase9','strong-pass-123');
const farm=createFarm(db,user.id,'Vườn quê thanh bình');
const {server,io}=createApp(db,{worldNow:()=>Date.UTC(2026,0,2,12),worldSettings:{epoch:Date.UTC(2026,0,1),dayMs:86400000,weatherMs:86400000,seasonMs:7*86400000,seed:'phase9-qa'}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
const port=9400+Math.floor(Math.random()*400);
const edge=spawn(process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,
  `--user-data-dir=${path.join(root,`profile-${stage}-${Date.now()}`)}`,'about:blank'
],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ws,seq=0,protocolCancellations=0;const pending=new Map(),errors=[],shots=[],checks=[];
async function command(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>reject(Error(`CDP timeout: ${method}`)),15000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function waitFor(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw Error(`Timeout: ${expression}`);}
async function load(){const position=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=?').get(user.id);await command('Page.navigate',{url:'about:blank'});await waitFor(`location.href==='about:blank'`);db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=?').run(position.x,position.y,position.scene,user.id);await command('Page.navigate',{url});await waitFor(`document.querySelector('#game:not(.hidden)') && document.querySelector('#status').textContent.includes('Đã kết nối') && window.__phase9 && window.__phase9Joined`);await pause(500);await evaluate(`document.querySelector('#onboardingSkip')?.click();__phase9.village.setState({...__phase9.village.state,context:{...__phase9.village.state.context,worldMinute:720,weather:'sunny',season:'spring'}})`);}
async function key(key){await command('Input.dispatchKeyEvent',{type:'keyDown',key,code:key==='e'?'KeyE':`Digit${key}`,windowsVirtualKeyCode:key.charCodeAt(0)});await command('Input.dispatchKeyEvent',{type:'keyUp',key});}
async function mouse(type,p,down=false){await command('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:down?'left':type==='mouseMoved'?'none':'left',buttons:down?1:0,clickCount:1});}
async function screenshot(name){await evaluate(`Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))`);const {data}=await command('Page.captureScreenshot',{format:'png'});const file=`docs/phase9/${stage}-${name}.png`;writeFileSync(file,Buffer.from(data,'base64'));shots.push(file);console.log(file);}
try{
  console.log('Edge CDP port',port);
  let target;for(let i=0;i<30;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(700)})).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
  if(!target)throw Error('Edge CDP unavailable');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!m.params.entry.url?.endsWith('/favicon.ico'))errors.push(m.params.entry.text);
    if(m.method==='Fetch.requestPaused'){
      const file=new URL(m.params.request.url).pathname.slice(1);
      let source=stage==='before'?execFileSync('git',['show',`8de04dc:public/${file}`],{encoding:'utf8'}):readFileSync(`public/${file}`,'utf8');
      if(file==='js/main.js'){source=source.replace('await returnHome(false);','await returnHome(false);window.__phase9Joined=true;');source+=`\nwindow.__phase9={get camera(){return camera},get village(){return villageUi},get player(){return player},get phase5(){return phase5Ui},get farming(){return farming},get context(){return contextual}};`;}
      command('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'content-type',value:'text/javascript'}],body:Buffer.from(source).toString('base64')}).catch(e=>{if(e.message.includes('Invalid InterceptionId'))protocolCancellations++;else errors.push(e.message);});
    }
  });
  console.log('CDP connected');await command('Page.enable');await command('Runtime.enable');await command('Log.enable');
  await command('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  if(stage==='package'){
    await command('Page.navigate',{url});await pause(500);
    for(const name of ['market-seed-v9','market-buyer-v9','market-orders-v9',...(['garden-v9','rural-props-v9'].filter(n=>{try{return readFileSync(`public/assets/${n}.png`).length>0;}catch{return false;}}))]){
      const data=await evaluate(`(async()=>{const i=new Image();i.src='/assets/${name}.png';await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;let l=c.width,r=0,t=c.height,b=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(a[(y*c.width+x)*4+3]>12){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}const o=document.createElement('canvas');const scale=Math.min(1,(${name.startsWith('market-')?1024:512})/(r-l+9));o.width=Math.round((r-l+9)*scale);o.height=Math.round((b-t+9)*scale);o.getContext('2d').drawImage(c,l,t,r-l+1,b-t+1,4*scale,4*scale,(r-l+1)*scale,(b-t+1)*scale);return o.toDataURL('image/webp',.9).split(',')[1];})()`);
      writeFileSync(`public/assets/${name}.webp`,Buffer.from(data,'base64'));console.log('Packaged',name);
    }
    const atlas=await evaluate(`(async()=>{const image=new Image();image.src='/assets/decorations-v9.png';await image.decode();const output=document.createElement('canvas');output.width=1920;output.height=128;const ctx=output.getContext('2d');for(let i=0;i<15;i++){const cell=document.createElement('canvas'),sw=image.width/5,sh=image.height/3;cell.width=Math.ceil(sw);cell.height=Math.ceil(sh);const cc=cell.getContext('2d');cc.drawImage(image,(i%5)*sw,Math.floor(i/5)*sh,sw,sh,0,0,cell.width,cell.height);const a=cc.getImageData(0,0,cell.width,cell.height).data;let l=cell.width,r=0,t=cell.height,b=0,clear=0;for(let y=0;y<cell.height;y++)for(let x=0;x<cell.width;x++){if(a[(y*cell.width+x)*4+3]>12){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}else clear++;}if(clear/(cell.width*cell.height)<.1)throw Error('Decoration cell '+i+' lacks transparent padding');const scale=Math.min(118/(r-l+1),118/(b-t+1)),w=(r-l+1)*scale,h=(b-t+1)*scale;ctx.drawImage(cell,l,t,r-l+1,b-t+1,i*128+(128-w)/2,124-h,w,h);}return output.toDataURL('image/webp',.92).split(',')[1];})()`);
    writeFileSync('public/assets/decorations-v9.webp',Buffer.from(atlas,'base64'));console.log('Packaged 15-cell decoration atlas');
    process.exitCode=0;
  }else{
  await command('Fetch.enable',{patterns:[{urlPattern:'*/js/main.js'},{urlPattern:'*/js/core/Camera.js'},{urlPattern:'*/js/phase5.js'}]});
  await command('Page.navigate',{url});await waitFor(`!!document.querySelector('#authForm')`);
  await evaluate(`fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'visual_phase9',password:'strong-pass-123'})}).then(r=>r.json())`);
  for(const [width,height] of [[1920,1080],[1366,768],[390,844]]){
    await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
    db.prepare("UPDATE player_states SET scene='farm',x=720,y=650 WHERE user_id=?").run(user.id);await load();await screenshot(`farm-${width}`);
    db.prepare("UPDATE player_states SET scene='market',x=600,y=540 WHERE user_id=?").run(user.id);await load();await screenshot(`market-${width}`);
  }
  await command('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  for(const scene of ['farm','market']){
    db.prepare('UPDATE player_states SET scene=?,x=?,y=? WHERE user_id=?').run(scene,scene==='farm'?720:600,scene==='farm'?650:540,user.id);await load();
    await evaluate(`__phase9.camera.base=.72;Object.defineProperty(__phase9.camera,'screenY',{value:384,configurable:true});__phase9.camera.fit();__phase9.camera.snap(__phase9.player.x,__phase9.player.y)`);
    await screenshot(`${scene}-matched-1366`);
  }
  for(const [name,x] of [['seed',300],['buyer',600],['orders',900]]){
    db.prepare("UPDATE player_states SET scene='market',x=?,y=430 WHERE user_id=?").run(x,user.id);await load();
    await key('e');
    await waitFor(`!document.querySelector('#panel').classList.contains('hidden')`);await screenshot(`interact-${name}`);
    assert.ok(await evaluate(`!!document.querySelector('${name==='seed'?'[data-market-form=buy]':name==='buyer'?'[data-market-form=sell]':'.order-list'}')`));checks.push(`market ${name} interaction`);
  }
  for(const [name,x,y] of [['house',712,520],['pond',990,780],['coop',1010,425]]){
    db.prepare("UPDATE player_states SET scene='farm',x=?,y=? WHERE user_id=?").run(x,y,user.id);await load();
    const p=await evaluate(`__phase9.camera.toScreen(${x},${y})`);await mouse('mousePressed',p,true);await mouse('mouseReleased',p);
    // VAC uses a contextual menu; the house opens directly.
    if(name!=='house')await evaluate(`document.querySelector('[data-context-open=${name}]')?.click()`);
    if(stage==='before'&&name==='house'){checks.push('baseline defect: direct house pointer panel closes on the opening event');await key('e');}
    await waitFor(`!document.querySelector('#panel').classList.contains('hidden')`);checks.push(`${name} projected pointer hitbox${stage==='before'&&name==='house'?' (keyboard fallback)':''}`);
  }
  db.prepare("UPDATE player_states SET scene='farm',x=720,y=650 WHERE user_id=?").run(user.id);await load();
  for(const [name,minute,weather] of [['day',720,'sunny'],['night',1320,'sunny'],['rain',720,'rainy']]){
    await evaluate(`__phase9.village.setState({...__phase9.village.state,context:{...__phase9.village.state.context,worldMinute:${minute},timeName:${JSON.stringify(name==='night'?'Tối':'Trưa')},timeOfDay:'${name==='night'?'night':'noon'}',weather:'${weather}',season:'spring'}})`);await pause(120);await screenshot(`farm-${name}`);
  }
  await evaluate(`document.querySelector('#effectsButton').click()`);await screenshot('farm-reduced-effects');
  await evaluate(`localStorage.removeItem('farm-low-effects')`);
  // Exercise pointer hit testing and drag using the actual projected pixels.
  db.prepare("UPDATE player_states SET scene='farm',x=222,y=700 WHERE user_id=?").run(user.id);await load();
  await key('1');
  await evaluate(`window.__pointerLog=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.querySelector('#canvas').addEventListener(type,e=>__pointerLog.push({type,target:e.target.id,mode:__phase9.context.mode,pointer:!!__phase9.context.pointer}),true)`);
  const points=await evaluate(`[0,1,2].map(x=>__phase9.camera.toScreen(140+x*82,750))`);
  await mouse('mouseMoved',points[0]);await mouse('mousePressed',points[0],true);await pause(250);await mouse('mouseMoved',points[1],true);await pause(60);await mouse('mouseMoved',points[2],true);await pause(60);await mouse('mouseReleased',points[2]);await pause(1000);
  const tilled=db.prepare('SELECT count(*) n FROM farm_soil_tiles WHERE farm_id=?').get(farm.id).n;
  if(tilled!==3){console.log('Pointer diagnostics',await evaluate(`JSON.stringify({events:__pointerLog,mode:__phase9.context.mode,action:__phase9.context.action,player:{x:__phase9.player.x,y:__phase9.player.y},focus:document.activeElement?.tagName,notice:document.querySelector('#notice').textContent,error:document.querySelector('#error').textContent})`));await screenshot('failed-drag');}
  assert.equal(tilled,3);checks.push('projected mouse drag tills three tiles');
  // Plant server-valid crops and place a building in this disposable fixture only.
  for(let x=0;x<3;x++)performFarmAction(db,user.id,{farmId:farm.id,action:'plant',x,y:0,cropId:'rice'});
  db.prepare('UPDATE farm_crops SET planted_at=planted_at-? WHERE farm_id=?').run(5400000,farm.id);
  db.prepare('UPDATE player_states SET x=840,y=660 WHERE user_id=?').run(user.id);
  performPhase5Action(db,user.id,{action:'place_building',farmId:farm.id,requestId:crypto.randomUUID(),definitionId:'mill',x:18,y:13,rotation:0});
  for(const [item,action,x,y,extra] of [['fingerling_tilapia','stock_fish',990,780,{fishId:'tilapia'}],['chick','add_chicken',1010,425,{}]]){
    addItem(db,farm.id,item,1);db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(x,y,user.id);
    performVacAction(db,user.id,{action,farmId:farm.id,requestId:crypto.randomUUID(),quantity:1,...extra});
  }
  db.prepare('UPDATE player_states SET x=720,y=650 WHERE user_id=?').run(user.id);
  await load();await screenshot('farm-planted-built');checks.push('planted crops and placed mill render');
  await evaluate(`__phase9.phase5.mode={type:'building',id:'kitchen'};__phase9.phase5.hover={x:980,y:650}`);await screenshot('farm-build-grid');
  assert.ok(await evaluate(`(()=>{const c=__phase9.camera,p=c.toScreen(1150,785),w=c.toWorld(p.x,p.y);return Math.abs(w.x-1150)<1e-7&&Math.abs(w.y-785)<1e-7})()`));checks.push('camera inverse and pond hit coordinate');
  // Touch, pan and zoom smoke check at the mobile viewport.
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  db.prepare('UPDATE player_states SET x=222,y=700 WHERE user_id=?').run(user.id);await load();await key('3');
  const touch=await evaluate(`__phase9.camera.toScreen(140,750)`);
  await command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.x,y:touch.y}]});await command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(500);
  assert.ok(db.prepare('SELECT watered_at FROM farm_crops WHERE farm_id=? AND tile_x=0').get(farm.id).watered_at);checks.push('mobile touch waters projected crop');
  await evaluate(`__phase9.camera.focus=1.2;__phase9.camera.fit();__phase9.camera.snap(500,650)`);await screenshot('farm-mobile-zoom-pan');
  for(const [name,x] of [['seed',300],['buyer',600],['orders',900]]){
    db.prepare("UPDATE player_states SET scene='market',x=?,y=430 WHERE user_id=?").run(x,user.id);await load();
    const p=await evaluate(`__phase9.camera.toScreen(${x},380)`);
    await command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});await command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    if(stage==='before'){checks.push(`baseline defect: mobile ${name} panel requires keyboard fallback`);await key('e');}
    await waitFor(`!document.querySelector('#panel').classList.contains('hidden')`);await screenshot(`mobile-interact-${name}`);checks.push(`mobile ${name} touch interaction`);
  }
  // Use the same unobscured day scene for before/after performance samples.
  await command('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  db.prepare("UPDATE player_states SET scene='farm',x=720,y=650 WHERE user_id=?").run(user.id);await load();
  const metrics=await evaluate(`new Promise(resolve=>{const times=[];let last=performance.now();function step(now){times.push(now-last);last=now;if(times.length<120)requestAnimationFrame(step);else{times.sort((a,b)=>a-b);resolve({p50Ms:times[60],p95Ms:times[114],heap:performance.memory?.usedJSHeapSize});}}requestAnimationFrame(step);})`);
  for(const [i,id] of Object.keys(DECORATIONS).entries()){
    const x=12+i%2,y=11+Math.floor(i/2);addItem(db,farm.id,'decor_'+id,1);
    db.prepare('UPDATE player_states SET x=700,y=? WHERE user_id=?').run((y+.5)*48,user.id);
    performPhase5Action(db,user.id,{action:'place_decoration',farmId:farm.id,requestId:crypto.randomUUID(),definitionId:id,x,y,rotation:0});
  }
  db.prepare('UPDATE player_states SET x=720,y=650 WHERE user_id=?').run(user.id);await load();await screenshot('farm-decoration-catalog');checks.push('all fifteen persisted decoration IDs render');
  writeFileSync(`docs/phase9/${stage}-metrics.json`,JSON.stringify({shots,checks,errors,protocolCancellations,metrics},null,2));
  if(errors.length)throw Error(JSON.stringify(errors));
  }
}finally{ws?.close();edge.kill();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
