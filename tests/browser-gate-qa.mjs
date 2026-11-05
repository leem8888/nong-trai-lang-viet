import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {HOUSE_COLLIDER,houseToWorld} from '../public/js/shared/house.js';
import {insidePolygon} from '../public/js/systems/geometry.js';
import {validPosition} from '../server/world.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const db=openDatabase(':memory:'),u=register(db,'house_browser','password123'),f=createFarm(db,u.id,'Nhà không đi xuyên');db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run();
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
let browser,page;const errors=[],results=[];mkdirSync('.qa/house-collision',{recursive:true});const center=houseToWorld(.5,.77);
async function pause(ms){await new Promise(r=>setTimeout(r,ms));}
async function ready(){await page.locator('#status').getByText('Đã kết nối').waitFor();await pause(150);}
async function relocate(p){await page.goto('about:blank');db.prepare("UPDATE player_states SET x=?,y=?,scene='farm' WHERE user_id=?").run(p.x,p.y,u.id);await page.goto(base);await ready();}
async function position(){return page.evaluate(()=>({x:__houseQA.player.x,y:__houseQA.player.y,moving:!!__houseQA.input.target}));}
try{browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__houseQA={get player(){return player},get camera(){return camera},get input(){return input},walkTo};'}));
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[name=username]').fill('house_browser');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await ready();
 await relocate({x:720,y:740});await pause(250);await page.screenshot({path:'.qa/house-collision/gate-aligned.png'});
 const gate=await page.evaluate(()=>__houseQA.camera.toScreen(720,855));await page.mouse.click(gate.x,gate.y);
 await page.waitForFunction(()=>document.getElementById('marketHud').classList.contains('hidden')===false,{timeout:15000});
 assert.deepEqual(errors,[]);console.log('PASS gate click walks through entrance and enters market');
}catch(e){console.error(e);if(page)await page.screenshot({path:'.qa/house-collision/failure.png'});results.push({ok:false,error:e.stack});process.exitCode=1;}
finally{writeFileSync('.qa/house-collision/results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
