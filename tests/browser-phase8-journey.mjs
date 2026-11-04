import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-p8-journey-'));
const db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
mkdirSync('.qa',{recursive:true});
let browser;const events=[],errors=[];
const mark=(name,detail='')=>{events.push({at:new Date().toISOString(),name,detail});console.log('PASS',name,detail);};
const get=async(page,endpoint)=>page.evaluate(async path=>await(await fetch('/api'+path)).json(),endpoint);
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const started=Date.now();
  await page.goto(url+'/?debug');await page.screenshot({path:'.qa/phase8-journey-login.png'});
  await page.locator('#registerTab').click();await page.locator('[name=username]').fill('phase8_beginner');await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();
  await page.locator('#create:not(.hidden)').waitFor();await page.locator('[name=name]').fill('Vườn đầu tiên');await page.locator('#farmForm button').click();
  await page.locator('#status').getByText('Đã kết nối').waitFor();mark('register and enter farm');
  await page.screenshot({path:'.qa/phase8-journey-spawn.png'});
  await page.locator('#onboardingSkip').click();await page.keyboard.down('a');await page.waitForTimeout(2750);await page.keyboard.up('a');await page.keyboard.down('s');await page.waitForTimeout(520);await page.keyboard.up('s');await page.waitForTimeout(800);
  const position=(await get(page,'/farm')).player;mark('move with keyboard',`${Math.round(position.x)},${Math.round(position.y)}`);
  await page.mouse.click(126,554);await page.locator('[data-context-action=till]').click();await page.mouse.click(126,554);await page.waitForTimeout(350);
  let farm=await get(page,'/farming');assert.equal(farm.tiles.find(t=>t.x===0&&t.y===0).state,'TILLED');mark('till soil');
  await page.keyboard.press('Escape');await page.mouse.click(126,554);await page.locator('[data-context-action=plant]').click();await page.mouse.click(126,554);await page.waitForTimeout(350);
  farm=await get(page,'/farming');assert.equal(farm.tiles.find(t=>t.x===0&&t.y===0).crop.cropId,'mustard');mark('plant seed');
  await page.keyboard.press('Escape');await page.mouse.click(126,554);await page.locator('[data-context-action=water]').click();await page.mouse.click(126,554);await page.waitForTimeout(350);
  farm=await get(page,'/farming');assert.ok(farm.tiles.find(t=>t.x===0&&t.y===0).crop.wateredAt);mark('water crop');
  await page.locator('#farmUtilityButton').click();await page.locator('#inventoryButton').click();assert.ok(await page.locator('#panel').isVisible());await page.keyboard.press('Escape');mark('inspect and close inventory');
  await page.locator('#questsButton').click();await page.locator('#panel:not(.hidden)').waitFor();await page.locator('#closePanel').click();mark('inspect quests');
  await page.locator('#menuButton').click();await page.locator('#replayTutorial').click();assert.ok(await page.locator('#onboarding').isVisible());await page.locator('#onboardingSkip').click();mark('replay and skip help');
  await page.screenshot({path:'.qa/phase8-journey-farm.png'});
  await page.keyboard.down('s');await page.waitForTimeout(550);await page.keyboard.up('s');await page.keyboard.down('d');await page.waitForTimeout(2750);await page.keyboard.up('d');await page.waitForTimeout(400);
  const gatePosition=(await get(page,'/farm')).player;console.log('GATE POSITION',gatePosition);await page.keyboard.press('e');await page.locator('#marketHud:not(.hidden)').waitFor({timeout:8000});mark('walk to market');
  await page.screenshot({path:'.qa/phase8-journey-market.png'});
  await page.reload();await page.locator('#status').getByText('Đã kết nối').waitFor();assert.equal(await page.locator('#onboarding').isVisible(),false);mark('reload preserves account and tutorial choice');
  const samples=[];
  while(Date.now()-started<600000){
    await page.waitForTimeout(Math.min(60000,600000-(Date.now()-started)));
    const data=await page.evaluate(()=>({stats:window.__farmFrameStats?.(),memory:performance.memory?.usedJSHeapSize??null,scene:document.getElementById('marketHud').classList.contains('hidden')?'farm':'market'}));
    samples.push({elapsedSeconds:Math.round((Date.now()-started)/1000),...data});
    console.log('SAMPLE',JSON.stringify(samples.at(-1)));
  }
  assert.ok(Date.now()-started>=600000);assert.deepEqual(errors,[]);
  mark('ten-minute live browser session',`${Math.round((Date.now()-started)/1000)} seconds`);
  writeFileSync('.qa/phase8-journey-report.json',JSON.stringify({started:new Date(started).toISOString(),durationMs:Date.now()-started,events,samples,errors},null,2));
}finally{await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
