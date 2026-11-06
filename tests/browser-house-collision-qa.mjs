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
async function ready(){await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Đã kết nối'));await pause(150);}
async function relocate(p){await page.goto('about:blank');db.prepare("UPDATE player_states SET x=?,y=?,scene='farm' WHERE user_id=?").run(p.x,p.y,u.id);await page.goto(base);await ready();}
async function position(){return page.evaluate(()=>({x:__houseQA.player.x,y:__houseQA.player.y,moving:!!__houseQA.input.target}));}
try{browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__houseQA={get player(){return player},get camera(){return camera},get input(){return input},walkTo};'}));
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[name=username]').fill('house_browser');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await ready();
 for(const [side,dx,dy,key] of [['left',-210,0,'d'],['right',210,0,'a'],['back',0,-230,'s'],['front',0,230,'w']]){
  await relocate({x:center.x+dx,y:center.y+dy});await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.down(key);
  for(let i=0;i<28;i++){await pause(100);const p=await position();assert.equal(insidePolygon(p,HOUSE_COLLIDER.points),false,side+' never enters foundation');assert.equal(validPosition(p.x,p.y),true);}
  await page.keyboard.up(key);await pause(250);await page.screenshot({path:`.qa/house-collision/${side}.png`});results.push({side,ok:true,keyboard:true});console.log('PASS keyboard house',side);
 }
 await relocate({x:400,y:130});const goal={x:900,y:130},click=await page.evaluate(p=>__houseQA.camera.toScreen(p.x,p.y),goal);await page.mouse.click(click.x,click.y);let arrived=false;
 for(let i=0;i<200;i++){await pause(100);const p=await position();assert.equal(insidePolygon(p,HOUSE_COLLIDER.points),false);if(!p.moving&&Math.hypot(p.x-goal.x,p.y-goal.y)<25){arrived=true;break;}}
 assert.equal(arrived,true,'mouse path arrives by walking around house');console.log('PASS mouse click routes around house');results.push({mouseRoute:true,ok:true});
 await relocate(center);const rescued=await position();assert.equal(validPosition(rescued.x,rescued.y),true);assert.equal(insidePolygon(rescued,HOUSE_COLLIDER.points),false);console.log('PASS saved player inside house is moved onto safe ground');
 await page.setViewportSize({width:390,height:844});await pause(200);await page.screenshot({path:'.qa/house-collision/mobile.png'});assert.deepEqual(errors,[]);results.push({safeRecovery:true,mobile:true,ok:true});
}catch(e){console.error(e);if(page)await page.screenshot({path:'.qa/house-collision/failure.png'});results.push({ok:false,error:e.stack});process.exitCode=1;}
finally{writeFileSync('.qa/house-collision/results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
