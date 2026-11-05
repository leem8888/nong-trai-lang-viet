import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-tutorial-browser-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
mkdirSync('.qa',{recursive:true});let browser;const errors=[],results=[];
async function state(page){return page.evaluate(async()=>await(await fetch('/api/onboarding')).json());}
async function until(check,ms=20000){const end=Date.now()+ms;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,150));}throw Error('Timed out waiting for verified state');}
async function waitStep(page,n){await until(async()=>(await state(page)).step===n);}
async function aim(page){if(await page.locator('#panel').isVisible())await page.locator('#closePanel').click();await page.locator('#onboardingNext').click();await page.waitForFunction(()=>!document.querySelector('#onboardingNext').disabled,{timeout:30000});}
async function soil(page,action){await aim(page);await page.screenshot({path:'.qa/first5-'+action+'.png'});await page.locator(action==='plant'?'[data-context-action=plant][data-crop-id=mustard]':`[data-context-action=${action}]`).first().click({timeout:5000});}
async function register(page,name){await page.goto(base);await page.locator('#registerTab').click();await page.locator('[name=username]').fill(name);await page.locator('[name=password]').fill('test-password123');await page.locator('#authSubmit').click();await page.locator('#create:not(.hidden)').waitFor();await page.locator('[name=name]').fill('Vườn thử 5 phút');await page.locator('#farmForm button').click();await page.locator('#status').getByText('Đã kết nối').waitFor();await page.locator('#onboarding:not(.hidden)').waitFor();}
async function trade(page,id){await page.locator(`[data-market-product="${id}"]`).click();await page.locator('[data-market-form] input[name=quantity]').fill('1');await page.locator('[data-market-form] button[type=submit]').click();}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const start=Date.now();await register(page,'first5_'+Date.now());await page.screenshot({path:'.qa/first5-desktop-start.png'});
 await soil(page,'till');await waitStep(page,1);console.log('PASS tutorial till via UI');
 await soil(page,'plant');await waitStep(page,2);console.log('PASS tutorial plant via UI');
 await soil(page,'water');await waitStep(page,3);console.log('PASS tutorial water via UI');
 await page.keyboard.press('Escape');await page.reload();await page.locator('#status').getByText('Đã kết nối').waitFor();assert.equal((await state(page)).step,3);
 const tab=await context.newPage();await tab.goto(base);await tab.locator('#status').getByText('Đã kết nối').waitFor();assert.equal((await state(tab)).step,3);await tab.close();console.log('PASS reload and second tab retain tutorial');
 await until(async()=>{const s=await state(page);return s.crop.readyAt<=s.serverTime;},50000);
 await soil(page,'harvest');await waitStep(page,4);console.log('PASS real-time first harvest');
 await page.keyboard.press('Escape');await aim(page);await page.waitForFunction(()=>!document.querySelector('#marketHud').classList.contains('hidden'),{},{timeout:15000});await aim(page);await page.locator('#panel:not(.hidden)').waitFor();await trade(page,'mustard');await waitStep(page,5);console.log('PASS sell through market UI');
 await aim(page);await page.locator('[data-market-product="seed_mustard"]').waitFor();await trade(page,'seed_mustard');await waitStep(page,6);console.log('PASS buy seeds through market UI');
 await aim(page);await page.waitForFunction(()=>document.querySelector('#marketHud').classList.contains('hidden'),{},{timeout:15000});await soil(page,'plant');await waitStep(page,7);
 assert.equal((await state(page)).status,'DONE');console.log('PASS normal replant; journey seconds',Math.round((Date.now()-start)/1000));
 await page.screenshot({path:'.qa/first5-desktop-done.png'});results.push({name:'full desktop journey, real 45-second crop',ok:true,seconds:Math.round((Date.now()-start)/1000)});
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));await register(mp,'touch5_'+Date.now());await mp.screenshot({path:'.qa/first5-mobile-start.png'});
 const rects=await mp.evaluate(()=>['onboarding','joystick'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));assert.ok(rects.every(r=>r.x>=0&&r.right<=390));assert.ok(rects[0].bottom<rects[1].y);
 await soil(mp,'till');await waitStep(mp,1);const mirror=await mobile.newPage();await mirror.goto(base);await mirror.locator('#status').getByText('Đã kết nối').waitFor();await mp.locator('#onboardingSkip').click();await until(async()=>!(await mirror.locator('#onboarding').isVisible()));await mirror.close();await mp.waitForFunction(()=>document.querySelector('#onboarding').classList.contains('hidden'));assert.equal((await state(mp)).status,'SKIPPED');await mp.reload();await mp.locator('#status').getByText('Đã kết nối').waitFor();assert.equal(await mp.locator('#onboarding').isVisible(),false);console.log('PASS mobile touch, skip and reload');results.push({name:'mobile touch and persistent skip',ok:true});
 assert.deepEqual(errors,[]);console.log('PASS no browser errors');
}catch(error){results.push({name:'journey',ok:false,error:error.stack});console.error(error);process.exitCode=1;}
finally{writeFileSync('.qa/first5-results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
