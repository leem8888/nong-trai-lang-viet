import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {openEdge,pause} from './edge-driver.mjs';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';

const dir='docs/market-big-update';mkdirSync(dir,{recursive:true});
const db=openDatabase(':memory:'),user=register(db,'market_big_qa','strong-pass-123');
createFarm(db,user.id,'Vườn kiểm thử');
db.prepare("UPDATE player_states SET scene='market',x=600,y=540 WHERE user_id=?").run(user.id);
const {server,io}=createApp(db,{worldNow:()=>Date.UTC(2026,0,2,12),worldSettings:{epoch:Date.UTC(2026,0,1),dayMs:86400000,weatherMs:86400000,seasonMs:7*86400000,seed:'phase9-qa'}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
let browser;const report={checks:[],frames:[],errors:[],requestsFailed:[],performance:{}};
try{
  browser=await openEdge('big-market');
  const {command,evaluate,waitFor}=browser;
  browser.onEvent(m=>{
    if(m.method==='Network.loadingFailed')report.requestsFailed.push(m.params.errorText);
    if(m.method==='Fetch.requestPaused'){
      const source=readFileSync('public/js/main.js','utf8')+'\nwindow.__marketQA={get camera(){return camera},get player(){return player},get visitors(){return marketVisitors},get market(){return marketUi}};';
      command('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'content-type',value:'text/javascript'}],body:Buffer.from(source).toString('base64')}).catch(e=>browser.errors.push(e.message));
    }
  });
  await command('Network.enable');await command('Fetch.enable',{patterns:[{urlPattern:'*/js/main.js'}]});await browser.viewport(1366,768);await browser.navigate(url);
  await waitFor(`!!document.querySelector('#authForm')`);
  await evaluate(`fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'market_big_qa',password:'strong-pass-123'})}).then(r=>r.json())`);
  await browser.navigate(url);
  await waitFor(`!!document.querySelector('#game:not(.hidden)')`,30000);
  await pause(1000);
  if(await evaluate(`!!document.querySelector('#onboarding:not(.hidden)')`)){
    await evaluate(`document.querySelector('#onboardingSkip').click()`);
    await waitFor(`document.querySelector('#onboarding').classList.contains('hidden')`);
  }
  await pause(200);
  assert.ok(await evaluate(`document.querySelector('#marketHud')&&!document.querySelector('#marketHud').classList.contains('hidden')`));report.checks.push('market scene visible');
  await browser.screenshot(`${dir}/after-market-1366.png`);
  for(let i=0;i<8;i++){await pause(850);const file=`${dir}/animation-${String(i).padStart(2,'0')}.png`;await browser.screenshot(file);report.frames.push(file);}
  const imageStatus=await evaluate(`Promise.all(['market-meadow-v11.svg','market-surroundings-v11.svg','market-seed-v9.webp','market-buyer-v9.webp','market-orders-v9.webp'].map(async f=>({file:f,status:(await fetch('/assets/'+f)).status})))`);
  assert.ok(imageStatus.every(x=>x.status===200));report.checks.push('market and preserved stall assets load');
  await browser.viewport(390,844);await pause(400);await browser.screenshot(`${dir}/after-market-mobile.png`);report.checks.push('mobile portrait rendered');
  await browser.viewport(844,390);await pause(400);await browser.screenshot(`${dir}/after-market-mobile-landscape.png`);report.checks.push('mobile landscape rendered');
  await browser.viewport(1366,768);await command('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1.25,mobile:false});await pause(400);await browser.screenshot(`${dir}/after-market-125pct.png`);report.checks.push('125 percent pixel ratio rendered');
  await evaluate(`document.documentElement.style.zoom='125%'`);await pause(400);await browser.screenshot(`${dir}/after-market-browser-zoom-125pct.png`);await evaluate(`document.documentElement.style.zoom=''`);report.checks.push('125 percent browser layout rendered');
  await browser.viewport(1920,1080);await pause(400);await browser.screenshot(`${dir}/after-market-1920.png`);report.checks.push('desktop wide rendered');
  await browser.viewport(1366,768);
  await evaluate(`__marketQA.camera.base=1.15;__marketQA.camera.fit()`);await pause(200);await browser.screenshot(`${dir}/after-market-close.png`);
  await evaluate(`__marketQA.camera.base=.58;__marketQA.camera.fit()`);await pause(200);await browser.screenshot(`${dir}/after-market-wide.png`);
  await evaluate(`__marketQA.camera.base=.9;__marketQA.camera.fit()`);report.checks.push('close and wide camera terrain views rendered');
  await evaluate(`window.__marketPerf={frames:[],last:performance.now(),heap:[]};(function sample(t){const p=window.__marketPerf;p.frames.push(t-p.last);p.last=t;if(p.frames.length%60===0&&performance.memory)p.heap.push(performance.memory.usedJSHeapSize);requestAnimationFrame(sample)})(performance.now())`);
  const duration=Number(process.env.MARKET_QA_DURATION_MS||600000),until=Date.now()+duration;
  while(Date.now()<until)await pause(Math.min(10000,until-Date.now()));
  report.performance=await evaluate(`(()=>{const p=window.__marketPerf,a=p.frames.slice(30).sort((a,b)=>a-b);return {samples:a.length,p50Ms:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],heapStart:p.heap[0],heapEnd:p.heap.at(-1)}})()`);
  assert.ok(report.performance.samples>duration/1000*20);report.checks.push('sustained animation samples collected');
  await browser.viewport(390,844);await command('Emulation.setTouchEmulationEnabled',{enabled:true});
  const before=await evaluate(`({x:__marketQA.player.x,y:__marketQA.player.y})`);
  const touch=await evaluate(`(()=>{const r=document.querySelector('#villagePlaces button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await command('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...touch,id:1}]});
  await command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(800);
  const after=await evaluate(`({x:__marketQA.player.x,y:__marketQA.player.y})`);
  assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>2);report.checks.push('mobile touch starts market navigation');
  await command('Emulation.setTouchEmulationEnabled',{enabled:false});await browser.viewport(1366,768);
  await evaluate(`__marketQA.market.open('shop')`);await waitFor(`!!document.querySelector('[data-market-product=seed_mustard]')`);
  await evaluate(`document.querySelector('[data-market-product=seed_mustard]').click()`);await waitFor(`!!document.querySelector('[data-market-form=buy]')`);
  const balanceBefore=db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(user.id).balance;
  await command('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await evaluate(`document.querySelector('[data-market-form=buy] button[type=submit]').click()`);
  await waitFor(`!!document.querySelector('.trade-error')?.textContent`);
  await command('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  assert.equal(db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(user.id).balance,balanceBefore);report.checks.push('offline trade reports error and does not debit wallet');
  browser.errors.splice(0,browser.errors.length,...browser.errors.filter(e=>!e.includes('ERR_INTERNET_DISCONNECTED')));
  report.errors=browser.errors;assert.deepEqual(report.errors,[]);
  const reportName=duration<600000?'qa-short.json':'qa.json';writeFileSync(`${dir}/${reportName}`,JSON.stringify(report,null,2));console.log('PASS',report.checks.length,'checks',report.performance);
}finally{browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
