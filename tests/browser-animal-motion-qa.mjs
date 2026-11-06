import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {addItem} from '../server/crops.js';
import {performVacAction} from '../server/vac.js';
import {animalAccess,livingLayout} from '../public/js/shared/livingLayout.js';
import {coopGeometry,chickenWalkable} from '../public/js/animalMotion.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const db=openDatabase(':memory:'),u=register(db,'motion_qa','password123'),farm=createFarm(db,u.id,'Cá và gà sống động');
db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run();for(const [id,q] of [['fingerling_tilapia',3],['fingerling_carp',3],['chick',4],['fish_feed',8],['chicken_feed',8]])addItem(db,farm.id,id,q);
const layout=livingLayout(),g=coopGeometry(layout.yard);
for(const [kind,actions] of [['pond',[['stock_fish',{fishId:'tilapia',quantity:3}],['stock_fish',{fishId:'carp',quantity:3}]]],['coop',[['add_chicken',{quantity:4}]]]]){const p=animalAccess(kind,{x:720,y:650},layout).point;db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(p.x,p.y,u.id);for(const [action,extra] of actions)performVacAction(db,u.id,{action,farmId:farm.id,requestId:randomUUID(),...extra});}
db.prepare('UPDATE coop_chickens SET added_at=added_at-10800000,ready_at=ready_at-10800000').run();db.prepare('UPDATE player_states SET x=1050,y=450 WHERE user_id=?').run(u.id);
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
let browser;const errors=[],results=[],samples=[];mkdirSync('.qa/animal-motion',{recursive:true});
async function pause(ms){await new Promise(r=>setTimeout(r,ms));}
async function until(check,ms=20000){const end=Date.now()+ms;while(Date.now()<end){if(await check())return;await pause(100);}throw Error('Animal action timed out');}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const page=await browser.newPage({viewport:{width:1366,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__animalQA={get visual(){return livingVisual},get camera(){return camera},get vac(){return vacUi},get village(){return villageUi}};'}));
 await page.goto(base);await page.locator('[name=username]').fill('motion_qa');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Đã kết nối'));
 await until(async()=>(await page.evaluate(()=>window.__animalQA?.visual.chickenMotion.size))===4);
 for(let i=0;i<50;i++){
   const birds=await page.evaluate(()=>[...__animalQA.visual.chickenMotion.entries()].map(([id,b])=>({id,sx:b.sx,sy:b.sy,mode:b.mode,moving:b.moving})));
   for(const b of birds)assert.ok(chickenWalkable(g,{x:b.sx,y:b.sy}),'all four birds and their bodies remain inside artwork');samples.push(birds);
   if([0,1,2,10,25,49].includes(i))await page.screenshot({path:`.qa/animal-motion/frame-${i}.png`});
   await pause(i<3?500:700);
 }
 console.log('PASS real browser: four chickens stay inside rails, 50 samples');
 const fishFrames=[];for(let i=0;i<3;i++){fishFrames.push(await page.evaluate(()=>__animalQA.visual.hits.filter(h=>h.kind==='pond').map(h=>({id:h.entityId,x:h.x,y:h.y}))));await page.screenshot({path:`.qa/animal-motion/fish-${i}.png`});await pause(500);}
 assert.ok(fishFrames[0].length>0&&fishFrames.some(frame=>Math.hypot(frame[0].x-fishFrames[0][0].x,frame[0].y-fishFrames[0][0].y)>.1),'fish visibly change position');
 console.log('PASS real browser: fish move across three captured frames');
 for(const [kind,action] of [['coop','feed_chicken'],['pond','feed_fish']]){
   const pos=await page.evaluate(kind=>{const h=__animalQA.visual.hits.find(h=>h.kind===kind);return __animalQA.camera.toScreen(h.x,h.y);},kind);
   await page.mouse.click(pos.x,pos.y);const selector=`[data-context-vac=${action}]`;await page.locator(selector).waitFor();const box=await page.locator(selector).boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await pause(100);const p=await page.locator(selector).boundingBox();await page.mouse.click(p.x+p.width/2,p.y+p.height/2);
   await until(async()=>page.evaluate(kind=>kind==='coop'?__animalQA.vac.state.coop.chickens.some(c=>c.status==='PRODUCING'):__animalQA.vac.state.pond.fish.some(f=>f.fedAt!==null),kind),30000);console.log('PASS direct',action);
 }
 await page.setViewportSize({width:390,height:844});await pause(500);await page.screenshot({path:'.qa/animal-motion/mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
 assert.deepEqual(errors,[]);results.push({ok:true,realBrowserSamples:samples.length,desktop:'1366x900',mobile:'390x844',directFeeding:true,noPageErrors:true});
}catch(e){console.error(e);results.push({ok:false,error:e.stack});process.exitCode=1;}
finally{writeFileSync('.qa/animal-motion/results.json',JSON.stringify({results,errors,samples},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
