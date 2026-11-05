import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {addItem} from '../server/crops.js';
import {performVacAction} from '../server/vac.js';
import {randomUUID} from 'node:crypto';
import {animalAccess,livingLayout,pondObstacles} from '../public/js/shared/livingLayout.js';
import {ISO_X,ISO_Y} from '../public/js/core/IsoProjection.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const db=openDatabase(':memory:'),u=register(db,'pond_rim_qa','password123'),farm=createFarm(db,u.id,'Đi vòng quanh bờ ao');
db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run();addItem(db,farm.id,'fingerling_tilapia',6);
const bank=animalAccess('pond',{x:720,y:650},livingLayout()).point;
db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(bank.x,bank.y,u.id);
performVacAction(db,u.id,{action:'stock_fish',farmId:farm.id,requestId:randomUUID(),fishId:'tilapia',quantity:6});
db.prepare('UPDATE player_states SET x=720,y=650 WHERE user_id=?').run(u.id);
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
let browser;const errors=[],results=[];mkdirSync('.qa/pond-rim',{recursive:true});
async function until(check,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,100));}throw Error('Pond route timed out');}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__pondQA={walkTo,approach,get player(){return player},get input(){return input},get camera(){return camera},get collision(){return collision},get phase5(){return phase5Ui}};'}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[name=username]').fill('pond_rim_qa');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await page.locator('#status').getByText('Đã kết nối').waitFor();
 for(const size of ['large','small']){
   if(size==='small'){await page.goto('about:blank');db.prepare('INSERT INTO farm_buildings(farm_id,definition_id,tile_x,tile_y,rotation,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(farm.id,'mill',20,12,0,Date.now(),Date.now());db.prepare('UPDATE player_states SET x=720,y=650 WHERE user_id=?').run(u.id);await page.goto(base);await page.locator('#status').getByText('Đã kết nối').waitFor();}
   const rows=size==='large'?[]:[{definitionId:'mill',x:20,y:12,rotation:0}],layout=livingLayout(rows),[o]=pondObstacles(layout.pond);
   let samples=0;
   for(const [side,a] of [['left',Math.PI],['front',Math.PI/2],['right',0],['back',-Math.PI/2]]){
     const sx=Math.cos(a)*(o.rx+36),sy=Math.sin(a)*(o.ry+28),goal={x:o.x+(sx/ISO_X+sy/ISO_Y)/2,y:o.y+(sy/ISO_Y-sx/ISO_X)/2};
     await page.evaluate(p=>window.__pondQA.walkTo(p),goal);
     await until(async()=>{const p=await page.evaluate(()=>({x:__pondQA.player.x,y:__pondQA.player.y,moving:!!__pondQA.input.target}));const dx=((p.x-o.x)-(p.y-o.y))*ISO_X,dy=((p.x-o.x)+(p.y-o.y))*ISO_Y;assert.ok((dx/o.rx)**2+(dy/o.ry)**2>=1,'walking feet never enter water');samples++;return !p.moving;});
     const pos=await page.evaluate(()=>({x:__pondQA.player.x,y:__pondQA.player.y}));assert.ok(Math.hypot(pos.x-goal.x,pos.y-goal.y)<35,'reached chosen bank');
     await page.screenshot({path:`.qa/pond-rim/${size}-${side}.png`});console.log('PASS',size,side,'walked outside water');
   }
   await page.evaluate(()=>__pondQA.approach({x:720,y:650},60));
   const p=await page.evaluate(()=>({x:__pondQA.player.x,y:__pondQA.player.y}));const click=await page.evaluate(p=>__pondQA.camera.toScreen(p.x,p.y),o);await page.mouse.click(click.x,click.y);await page.locator('#contextMenu:not(.hidden)').waitFor();assert.equal(await page.locator('[data-context-open=pond]').count(),0);await page.keyboard.press('Escape');
   results.push({size,ok:true,samples,noPondDetailsButton:true});
 }
 assert.deepEqual(errors,[]);console.log('PASS both pond sizes, no detail button, no pageerror');
}catch(e){results.push({ok:false,error:e.stack});console.error(e);process.exitCode=1;}
finally{writeFileSync('.qa/pond-rim/results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
