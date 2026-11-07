import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {addItem} from '../server/crops.js';
import {Camera} from '../public/js/core/Camera.js';
import {FARM_WORLD} from '../public/js/shared/farmWorld.js';
import {livingLayout,pondObstacles} from '../public/js/shared/livingLayout.js';
import {coopGeometry,coopToWorld} from '../public/js/animalMotion.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'vac-fixed-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
mkdirSync('.qa',{recursive:true});let browser;const results=[],errors=[];let page,user,farm;
async function until(check){const end=Date.now()+25000;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,150));}throw Error('Timed out waiting for VAC state');}
async function state(){return page.evaluate(async()=>await(await fetch('/api/vac')).json());}
async function clickFishAction(action){const button=page.locator(`[data-context-vac=${action}]`);let box=await button.boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(150);box=await button.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);}
async function openChicken(){await page.waitForTimeout(200);const p=await page.evaluate(()=>{const q=window.__vacQA,h=q.visual.hits.find(h=>h.kind==='coop');if(!h)throw Error('No chicken hit target');return q.camera.toScreen(h.x,h.y);});await page.mouse.click(p.x,p.y);}
async function openFish(){await page.waitForTimeout(200);const point=await page.evaluate(()=>{const q=window.__vacQA,h=q.visual.hits.find(h=>h.kind==='pond');if(!h)throw Error('No fish hit target');return q.camera.toScreen(h.x,h.y);});await page.mouse.click(point.x,point.y);}
async function ready(){await page.locator('#status').getByText('Đã kết nối').waitFor();await page.waitForTimeout(300);}
async function relocate(x,y){await page.goto('about:blank');db.prepare("UPDATE player_states SET x=?,y=?,scene='farm' WHERE user_id=?").run(x,y,user.id);await page.goto(base);await ready();}
async function open(kind){const pos=db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(user.id),cam=new Camera(FARM_WORLD);cam.isometric=true;cam.resize(1366,768);cam.snap(pos.x,pos.y);const layout=livingLayout(),p=kind==='pond'?pondObstacles(layout.pond)[0]:coopToWorld(coopGeometry(layout.yard),{x:510*.55,y:321*.7});const screen=cam.toScreen(p.x,p.y);await page.mouse.click(screen.x,screen.y);}
try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__vacQA={get visual(){return livingVisual},get camera(){return camera}};'}));
 await page.goto(base);await page.locator('#registerTab').click();await page.locator('[name=username]').fill('vacfix'+Date.now());await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await page.locator('#create:not(.hidden)').waitFor();await page.locator('[name=name]').fill('VAC fixed');await page.locator('#farmForm button').click();await ready();await page.locator('#onboardingSkip').click();
 user=db.prepare('SELECT id FROM users').get();farm=db.prepare('SELECT id FROM farms WHERE owner_id=?').get(user.id);for(const [id,q] of [['fingerling_tilapia',1],['chick',1],['fish_feed',2],['chicken_feed',2],['soy',1],['corn',1]])addItem(db,farm.id,id,q);
 await relocate(950,690);await open('pond');await page.locator('[data-context-vac=stock_fish][data-fish-id=tilapia]').click();await until(async()=>(await state()).pond.fish.length===1);console.log('PASS stock fish with automatic bank approach');
 await openFish();await clickFishAction('feed_fish');await until(async()=>(await state()).pond.fish[0].fedAt!==null);console.log('PASS feed fish after server movement confirmation');
 await page.goto('about:blank');db.prepare('UPDATE pond_fish SET stocked_at=stocked_at-10800000,ready_at=ready_at-10800000').run();await page.goto(base);await ready();await openFish();await clickFishAction('harvest_fish');await until(async()=>(await state()).inventory.find(i=>i.id==='tilapia').quantity===2);console.log('PASS harvest fish');await page.screenshot({path:'.qa/vac-fixed-pond.png'});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:200,downloadThroughput:-1,uploadThroughput:-1});
 await relocate(1100,450);await open('coop');await page.locator('[data-context-vac=add_chicken]').click();await until(async()=>(await state()).coop.chickens.length===1);console.log('PASS add chicken with automatic yard approach');
 await page.goto('about:blank');db.prepare('UPDATE coop_chickens SET added_at=added_at-10800000,ready_at=ready_at-10800000').run();await page.goto(base);await ready();await openChicken();await clickFishAction('feed_chicken');await until(async()=>(await state()).coop.chickens[0].status==='PRODUCING');console.log('PASS feed chicken');
 await page.goto('about:blank');db.prepare('UPDATE coop_chickens SET feed_started_at=feed_started_at-14400000').run();await page.goto(base);await ready();await page.screenshot({path:'.qa/vac-ready-eggs-in-nest.png'});await openChicken();await clickFishAction('collect_eggs');await until(async()=>(await state()).inventory.find(i=>i.id==='egg').quantity===3);console.log('PASS collect eggs');await page.screenshot({path:'.qa/vac-fixed-coop.png'});
 const conversion=await page.evaluate(async()=>{const me=await(await fetch('/api/me')).json(),vac=await(await fetch('/api/vac')).json();const r=await fetch('/api/vac/action',{method:'POST',headers:{'content-type':'application/json','x-csrf-token':me.csrf},body:JSON.stringify({action:'convert',farmId:vac.farmId,requestId:crypto.randomUUID(),recipeId:'corn_feed',quantity:1})});return r.status;});assert.equal(conversion,200);await until(async()=>(await state()).inventory.find(i=>i.id==='corn').quantity===0);console.log('PASS convert feed');
 assert.deepEqual(errors,[]);results.push({name:'VAC UI stock/feed/harvest fish, add/feed chicken, collect eggs, convert',ok:true});
}catch(e){console.error(e);results.push({ok:false,error:e.stack});process.exitCode=1;}
finally{writeFileSync('.qa/vac-fixed-results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}

