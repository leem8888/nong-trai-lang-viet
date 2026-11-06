import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const db=openDatabase(':memory:'),u=register(db,'hud_browser','password123'),f=createFarm(db,u.id,'Giao diện nông trại');db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run();
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
let browser,page;const errors=[],results=[];mkdirSync('.qa/hud',{recursive:true});
async function pause(ms){await new Promise(r=>setTimeout(r,ms));}
async function ready(){await page.locator('#status').getByText('Đã kết nối').waitFor();await pause(150);}
try{browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__cropQA={get farming(){return farming},get camera(){return camera},get contextual(){return contextual}};'}));
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[name=username]').fill('hud_browser');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await ready();


 await page.evaluate(()=>{
  const f=__cropQA.farming,t=f.state.tiles.find(t=>!t.locked);t.state='TILLED';t.crop={cropId:'mustard',plantedAt:Math.floor(f.serverNow()),durationMs:4500,bonusMs:0,wateredAt:null};window.__testTile={x:t.x,y:t.y};
 });
 const click=await page.evaluate(async()=>{const {tileCenter}=await import('/js/shared/crops.js');const p=tileCenter(__testTile.x,__testTile.y);return __cropQA.camera.toScreen(p.x,p.y);});
 await page.mouse.click(click.x,click.y);await page.locator('.crop-caption').waitFor();assert.ok(await page.locator('.crop-caption strong').textContent());assert.equal(await page.locator('.crop-caption img').evaluate(e=>e.complete&&e.naturalWidth>0),true);assert.match(await page.locator('[data-crop-time]').textContent(),/Thu hoạch sau/);
 assert.match(await page.locator('[data-crop-status]').textContent(),/Cần tưới nước/);
 const initial=await page.locator('[data-crop-time]').textContent();await pause(1200);assert.notEqual(await page.locator('[data-crop-time]').textContent(),initial);
 await page.screenshot({path:'.qa/hud/crop-growing.png'});
 await page.locator('[data-crop-time]').filter({hasText:'Có thể thu hoạch'}).waitFor({timeout:10000});await page.locator('[data-context-action=harvest]').waitFor();assert.match(await page.locator('[data-crop-status]').textContent(),/Đã tưới nước/);assert.equal(await page.locator('[data-context-action=water]').count(),0);console.log('PASS real soil click shows watering need, live countdown and ripe default');
 await page.setViewportSize({width:390,height:844});await pause(250);const box=await page.locator('#contextMenu').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=391);await page.screenshot({path:'.qa/hud/crop-ripe-mobile.png'});assert.deepEqual(errors,[]);
}catch(e){console.error(e);if(page)await page.screenshot({path:'.qa/hud/failure.png'});results.push({ok:false,error:e.stack});process.exitCode=1;}
finally{writeFileSync('.qa/hud/results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
