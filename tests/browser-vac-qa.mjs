import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {addItem} from '../server/crops.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const executablePath=process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined);
const dir=mkdtempSync(path.join(tmpdir(),'farm-vac-browser-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;mkdirSync('.qa',{recursive:true});
let browser;const findings=[];const run=async(name,fn)=>{try{const detail=await fn();findings.push({name,ok:true,detail});console.log('PASS',name,detail||'');}catch(error){findings.push({name,ok:false,error:error.message});console.log('FAIL',name,error.message);}};
async function relocate(page,user,x,y,scene='farm'){
  await page.goto('about:blank');db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=?').run(x,y,scene,user.id);
  await page.goto(url);await page.locator('#game:not(.hidden)').waitFor();await page.locator('#status').getByText('Đã kết nối').waitFor();
}
try{
  browser=await chromium.launch({headless:true,executablePath});
  const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);
  page.on('pageerror',error=>errors.push(error.message));
  const name=`vac_qa_${Date.now()}`;
  await run('register and farm VAC initialization',async()=>{
    await page.goto(url);await page.locator('#registerTab').click();await page.locator('[name=username]').fill(name);
    await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();
    await page.locator('#create:not(.hidden)').waitFor();await page.locator('[name=name]').fill('Trại VAC');await page.locator('#farmForm button').click();
    await page.locator('#game:not(.hidden)').waitFor();const state=await page.evaluate(async()=>await(await fetch('/api/vac')).json());
    assert.equal(state.pond.capacity,6);assert.equal(state.coop.capacity,4);return 'one pond, one coop';
  });
  const user=db.prepare('SELECT id FROM users WHERE username=?').get(name),farm=db.prepare('SELECT id FROM farms WHERE owner_id=?').get(user.id);
  await run('buy fish, chick and feed from NPC shop',async()=>{
    await relocate(page,user,720,850);await page.keyboard.press('e');await page.locator('#marketHud:not(.hidden)').waitFor();
    await relocate(page,user,300,445,'market');await page.keyboard.press('e');await page.locator('[data-market-form=buy]').waitFor();
    for(const id of ['fingerling_tilapia','chick','fish_feed','chicken_feed']){
      await page.locator('[data-market-form=buy] select').selectOption(id);await page.locator('[data-market-form=buy] button').click();
      await page.getByText('Đã mua',{exact:false}).first().waitFor();await page.waitForTimeout(150);
    }
    const state=await page.evaluate(async()=>await(await fetch('/api/market')).json());assert.equal(state.balance,84);
    await page.screenshot({path:'.qa/vac-market.png'});return 'wallet 200→84';
  });
  await run('pond stock, feed, offline growth and harvest',async()=>{
    await relocate(page,user,600,690,'market');await page.keyboard.press('e');await page.locator('#farmHud:not(.hidden)').waitFor();
    addItem(db,farm.id,'soy',1);await relocate(page,user,990,780);await page.keyboard.press('e');await page.locator('[data-vac-form=stock_fish]').waitFor();
    await page.locator('[data-vac-form=convert] button').click();await page.getByText('Đã đổi',{exact:false}).first().waitFor();await page.waitForTimeout(150);
    await page.locator('[data-vac-form=stock_fish] button').click();await page.getByText('Đã thả',{exact:false}).first().waitFor();await page.waitForTimeout(150);
    await page.locator('[data-vac-action=feed_fish]').click();await page.getByText('Đã cho cá ăn',{exact:false}).first().waitFor();
    let state=await page.evaluate(async()=>await(await fetch('/api/vac')).json());assert.equal(state.pond.fish.length,1);
    await page.goto('about:blank');db.prepare('UPDATE pond_fish SET stocked_at=stocked_at-?,ready_at=ready_at-? WHERE farm_id=?').run(3*3600000,3*3600000,farm.id);
    await page.goto(url);await page.locator('#game:not(.hidden)').waitFor();await page.locator('#status').getByText('Đã kết nối').waitFor();
    await page.keyboard.press('e');await page.locator('[data-vac-action=harvest_fish]').waitFor();
    await page.screenshot({path:'.qa/vac-pond.png'});await page.locator('[data-vac-action=harvest_fish]').click();await page.getByText('Thu hoạch 2',{exact:false}).first().waitFor();
    state=await page.evaluate(async()=>await(await fetch('/api/vac')).json());assert.equal(state.inventory.find(i=>i.id==='tilapia').quantity,2);return 'tilapia ×2';
  });
  await run('coop, crop feed, offline eggs and inventory',async()=>{
    addItem(db,farm.id,'corn',1);await relocate(page,user,1010,425);await page.keyboard.press('e');await page.locator('[data-vac-form=add_chicken]').waitFor();
    await page.locator('[data-vac-form=convert] button').click();await page.getByText('Đã đổi',{exact:false}).first().waitFor();await page.waitForTimeout(150);
    await page.locator('[data-vac-form=add_chicken] button').click();await page.getByText('Đã thêm',{exact:false}).first().waitFor();
    await page.goto('about:blank');db.prepare('UPDATE coop_chickens SET added_at=added_at-?,ready_at=ready_at-? WHERE farm_id=?').run(3*3600000,3*3600000,farm.id);
    await page.goto(url);await page.locator('#game:not(.hidden)').waitFor();await page.locator('#status').getByText('Đã kết nối').waitFor();await page.keyboard.press('e');await page.locator('[data-vac-action=feed_chicken]').click();await page.getByText('Đã cho gà ăn',{exact:false}).first().waitFor();
    await page.goto('about:blank');db.prepare('UPDATE coop_chickens SET feed_started_at=feed_started_at-? WHERE farm_id=?').run(4*3600000,farm.id);
    await page.goto(url);await page.locator('#game:not(.hidden)').waitFor();await page.locator('#status').getByText('Đã kết nối').waitFor();await page.keyboard.press('e');await page.locator('[data-vac-action=collect_eggs]').click();
    await page.getByText('Đã nhặt 3',{exact:false}).first().waitFor();const state=await page.evaluate(async()=>await(await fetch('/api/vac')).json());
    assert.equal(state.inventory.find(i=>i.id==='egg').quantity,3);await page.screenshot({path:'.qa/vac-coop.png'});return 'eggs ×3';
  });
  await run('sell fish and eggs, return farm, reload and mobile layout',async()=>{
    await relocate(page,user,720,850);await page.keyboard.press('e');await page.locator('#marketHud:not(.hidden)').waitFor();
    await relocate(page,user,600,445,'market');await page.keyboard.press('e');await page.locator('[data-market-form=sell]').waitFor();
    for(const [id,quantity] of [['tilapia','2'],['egg','3']]){
      await page.locator('[data-market-form=sell] select').selectOption(id);await page.locator('[data-market-form=sell] input').fill(quantity);
      await page.locator('[data-market-form=sell] button').click();await page.getByText('Đã bán',{exact:false}).first().waitFor();await page.waitForTimeout(150);
    }
    const balance=(await page.evaluate(async()=>await(await fetch('/api/market')).json())).balance;assert.equal(balance,217);
    await relocate(page,user,600,690,'market');await page.keyboard.press('e');await page.locator('#farmHud:not(.hidden)').waitFor();
    await page.setViewportSize({width:390,height:844});const width=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.equal(width,390);await page.screenshot({path:'.qa/vac-mobile.png'});assert.deepEqual(errors,[]);return 'wallet 217, 390 px, no pageerror';
  });
}finally{if(browser)await browser.close();await new Promise(resolve=>io.close(resolve));await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true});console.log(JSON.stringify(findings));if(findings.some(x=>!x.ok))process.exitCode=1;}
