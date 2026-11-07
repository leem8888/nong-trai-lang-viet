import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {createApp} from '../server/index.js';
import {BANANA_HOUR_MS,BANANA_TREE,BANANA_YIELD} from '../public/js/shared/banana.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||pathToFileURL(path.resolve('.qa/browser-tools/node_modules/playwright/index.mjs')).href);
const db=openDatabase(':memory:'),user=register(db,'banana_browser','password123'),farm=createFarm(db,user.id,'Vườn chuối');
db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run();
db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(BANANA_TREE.x+60,BANANA_TREE.y+45,user.id);
const {server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`,errors=[],out='.qa/banana';mkdirSync(out,{recursive:true});
let browser,page;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  await context.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__bananaQA={get banana(){return bananaUi},get camera(){return camera},get player(){return player}};'}));
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  await page.locator('[name=username]').fill('banana_browser');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();
  await page.waitForFunction(()=>window.__bananaQA?.banana?.state);
  async function clickPlant(){
    const point=await page.evaluate(({x,y})=>{const c=__bananaQA.camera,p=c.toScreen(x,y);return {x:p.x,y:p.y-80*c.zoom};},BANANA_TREE);
    await page.mouse.click(point.x,point.y);await page.locator('[data-banana-harvest]').waitFor();
  }
  for(let phase=0;phase<=4;phase++){
    db.prepare('UPDATE farm_banana_clumps SET started_at=? WHERE farm_id=?').run(Date.now()-phase*BANANA_HOUR_MS-100,farm.id);
    await page.evaluate(()=>__bananaQA.banana.load());await clickPlant();
    assert.equal(await page.evaluate(()=>__bananaQA.banana.phase()),phase);
    assert.equal(await page.locator('[data-banana-harvest]').isDisabled(),phase!==4);
    await page.screenshot({path:`${out}/phase-${phase}.png`});
    if(phase<4)await page.keyboard.press('Escape');
  }
  await page.locator('[data-banana-harvest]').click();
  await page.waitForFunction(()=>__bananaQA.banana.harvestAt!=null);await page.waitForTimeout(1050);await page.screenshot({path:`${out}/harvest-motion.png`});
  await page.waitForFunction(()=>__bananaQA.banana.phase()===0&&!__bananaQA.banana.busy);
  assert.equal(db.prepare("SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id='banana'").get(farm.id).quantity,BANANA_YIELD);
  await page.reload();await page.waitForFunction(()=>window.__bananaQA?.banana?.state);assert.equal(await page.evaluate(()=>__bananaQA.banana.phase()),0);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await clickPlant();
  const box=await page.locator('#contextMenu').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=391);
  await page.screenshot({path:`${out}/mobile-menu.png`});
  await page.goto('about:blank');
  db.prepare("UPDATE player_states SET scene='market',x=600,y=380 WHERE user_id=?").run(user.id);
  await page.setViewportSize({width:1366,height:900});await page.goto(base);
  await page.waitForFunction(()=>window.__bananaQA?.banana?.state);
  await page.locator('#status').getByText('Đã kết nối').waitFor({state:'attached'});
  await page.waitForTimeout(300);
  await page.keyboard.press('e');await page.locator('[data-market-product=banana]').click();
  await page.locator('[data-market-form=sell] input[name=quantity]').fill('2');
  const before=db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(user.id).balance;
  await page.locator('[data-market-form=sell] button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#notice').textContent.toLowerCase().includes('bán'));
  assert.equal(db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(user.id).balance,before+16);
  await page.screenshot({path:`${out}/market-sale.png`});assert.deepEqual(errors,[]);
  console.log('PASS banana five phases, real click, harvest, reload, mobile menu, market sale and no browser errors');
}catch(error){console.error(error);if(page)await page.screenshot({path:`${out}/failure.png`});process.exitCode=1;}
finally{writeFileSync(`${out}/results.json`,JSON.stringify({errors},null,2));await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();}
