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
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[name=username]').fill('hud_browser');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await ready();

 for(const [name,width,height] of [['desktop',1920,1080],['tablet',900,800],['mobile',390,844],['small',320,740]]){
  await page.setViewportSize({width,height});await pause(200);
  await page.evaluate(()=>{document.getElementById('balance').textContent='999.627.960 Đồng Làng';document.getElementById('farmName').textContent='Nông trại Làng Việt';});
  const boxes=await page.evaluate(()=>['hud','worldHud','farmHud'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  for(const box of boxes){assert.ok(box.x>=0&&box.right<=width+1&&box.bottom<=height,JSON.stringify(box));}
  const hudBottom=await page.locator('#hud').evaluate(e=>e.getBoundingClientRect().bottom);
  assert.ok(boxes.find(b=>b.id==='worldHud').y>=hudBottom+2,'world status clears header');
  await page.locator('#farmUtilityButton').click();await page.locator('#farmUtilityMenu').waitFor({state:'visible'});assert.equal(await page.locator('#farmUtilityButton').getAttribute('aria-expanded'),'true');await page.locator('#farmUtilityButton').click();
  await page.locator('#quickInventory').click();await page.locator('#panel').waitFor({state:'visible'});await page.locator('#closePanel').click();
  await page.locator('#quickQuests').click();await page.locator('#panel').waitFor({state:'visible'});await page.locator('#closePanel').click();
  await page.screenshot({path:'.qa/hud/hud-'+name+'.png'});console.log('PASS HUD',name);results.push({viewport:name,ok:true});
 }
 assert.deepEqual(errors,[]);
}catch(e){console.error(e);if(page)await page.screenshot({path:'.qa/hud/failure.png'});results.push({ok:false,error:e.stack});process.exitCode=1;}
finally{writeFileSync('.qa/hud/results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
