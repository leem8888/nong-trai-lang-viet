import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const label=process.argv[2]||'before',dir=mkdtempSync(path.join(process.env.LIVING_QA_TMP||tmpdir(),'living-visual-'));
const db=openDatabase(path.join(dir,'qa.sqlite')),{server,io}=createApp(db,{worldNow:()=>1730836800000});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`,out=process.env.LIVING_QA_DIR||'.qa/living';mkdirSync(out,{recursive:true});
const results=[];let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  for(const [name,width,height] of [['wide',1920,1080],['desktop',1366,768],['mobile',390,844]].filter(([name])=>!process.env.LIVING_QA_SINGLE||process.env.LIVING_QA_SINGLE===name)){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:label==='after'&&name==='desktop'?'no-preference':'reduce'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
    const username=`living_${label}_${name}`;
    await page.locator('#registerTab').click();await page.locator('[name=username]').fill(username);await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();
    await page.locator('[name=name]').fill('Vườn Sống');await page.locator('#farmForm button').click();await page.locator('#game:not(.hidden)').waitFor();await page.locator('#onboardingSkip').click();
    const user=db.prepare('SELECT id FROM users WHERE username=?').get(username),farm=db.prepare('SELECT id FROM farms WHERE owner_id=?').get(user.id),now=Date.now();
    const capture=async(kind,state)=>{const [x,y]=kind==='pond'?[925,770]:[1010,540];db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=?').run(x,y,'farm',user.id);await page.reload();await page.locator('#game:not(.hidden)').waitFor();await page.waitForTimeout(300);await page.screenshot({path:path.join(out,`living-${label}-${name}-${kind}-${state}.png`)});};
    await capture('pond','empty');await capture('coop','empty');
    const fish=db.prepare('INSERT INTO pond_fish(farm_id,fish_id,stocked_at,ready_at,duration_ms,yield_quantity) VALUES (?,?,?,?,?,?)');
    fish.run(farm.id,'tilapia',now-300000,now+2400000,2700000,2);fish.run(farm.id,'carp',now-800000,now+1200000,2000000,2);fish.run(farm.id,'carp',now-3000000,now-1000,2999000,2);
    const chicken=db.prepare('INSERT INTO coop_chickens(farm_id,added_at,ready_at,growth_ms,egg_ms,max_eggs,feed_started_at) VALUES (?,?,?,?,?,?,?)');
    chicken.run(farm.id,now-60000,now+6000000,6060000,2700000,3,null);chicken.run(farm.id,now-12000000,now-3000000,9000000,2700000,3,now-2800000);
    await capture('pond','stocked');await capture('coop','stocked');
    if(process.env.LIVING_QA_SINGLE==='desktop')await page.screenshot({path:path.join(out,`living-${label}-${name}-coop-close.png`),clip:{x:350,y:300,width:800,height:380}});
    if(label==='after'&&name==='desktop'){
      for(let frame=0;frame<3;frame++){await page.screenshot({path:path.join(out,`living-chickens-frame-${frame}.png`)});await page.waitForTimeout(900);}
      await capture('pond','stocked');
      for(let frame=0;frame<3;frame++){await page.screenshot({path:path.join(out,`living-fish-frame-${frame}.png`)});await page.waitForTimeout(900);}
    }
    const frame=await page.evaluate(async()=>{let last=performance.now(),frames=[];for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;}frames.sort((a,b)=>a-b);return {p50Ms:frames[60],p95Ms:frames[114],heap:performance.memory?.usedJSHeapSize||null};});
    let longBench=null;
    if(process.env.LIVING_LONG_BENCH&&name==='desktop'){
      longBench=await page.evaluate(async()=>{const start=performance.now(),samples=[],frames=[];let last=start,next=start+10000;while(performance.now()-start<600000){await new Promise(requestAnimationFrame);const at=performance.now();frames.push(at-last);last=at;if(at>=next){frames.sort((a,b)=>a-b);samples.push({elapsedMs:Math.round(at-start),p50Ms:frames[Math.floor(frames.length*.5)],p95Ms:frames[Math.floor(frames.length*.95)],heap:performance.memory?.usedJSHeapSize||null});frames.length=0;next+=10000;}}return samples;});
      const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:200,downloadThroughput:50000,uploadThroughput:25000});
      const throttle=await page.evaluate(async()=>{const start=performance.now(),response=await fetch('/api/vac');return {status:response.status,elapsedMs:performance.now()-start,fish:(await response.json()).pond.fish.length};});
      await cdp.detach();longBench={samples:longBench,throttle};
    }
    results.push({name,width,height,errors,frame,longBench});await context.close();
  }
  writeFileSync(path.join(out,`living-${label}-metrics.json`),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true});}
