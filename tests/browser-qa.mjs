import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';
import { Camera } from '../public/js/core/Camera.js';
import { addItem } from '../server/crops.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const executablePath=process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined);
mkdirSync('.qa',{recursive:true});

const dir=mkdtempSync(path.join(tmpdir(),'farm-browser-'));
const db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
let browser;
const findings=[];
const run=async(name,fn)=>{try{const detail=await fn();findings.push({name,ok:true,detail});console.log('PASS',name,detail||'');}catch(error){findings.push({name,ok:false,error:error.message});console.log('FAIL',name,error.message);}};
const username=n=>`qa_${n}_${Date.now()}`;
async function createUser(context,name){
  const page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  assert.equal(await page.locator('#loginTab').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#registerTab').getAttribute('aria-selected'),'false');
  await page.locator('#registerTab').click();
  assert.equal(await page.locator('#registerTab').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#loginTab').getAttribute('aria-selected'),'false');
  await page.locator('[name=username]').fill(name);await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();
  await page.locator('#create:not(.hidden)').waitFor();
  await page.locator('[name=name]').fill(`Farm ${name}`);await page.locator('#farmForm button').click();
  await page.locator('#game:not(.hidden)').waitFor();await page.locator('#status').getByText('Đã kết nối').waitFor();
  if(await page.locator('#onboarding').isVisible())await page.locator('#onboardingSkip').click();
  return {page,errors};
}
async function position(page,name,x,y,scene='farm'){
  await page.goto('about:blank');
  db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=(SELECT id FROM users WHERE username=?)').run(x,y,scene,name);
  await page.goto(url);await page.locator('#game:not(.hidden)').waitFor();await page.locator('#status').getByText('Đã kết nối').waitFor();
}
async function clickSoil(page){const camera=new Camera({width:1440,height:1024});camera.isometric=true;camera.resize(800,600);camera.snap(180,810);const point=camera.toScreen(140,750);await page.mouse.click(point.x,point.y);}
try{
  browser=await chromium.launch({headless:true,executablePath});
  const a=await browser.newContext({viewport:{width:1280,height:800}}), b=await browser.newContext({viewport:{width:1280,height:800}});
  const ua=username('a'), ub=username('b');let pa,pb;
  await run('register two accounts and independent farms',async()=>{pa=await createUser(a,ua);pb=await createUser(b,ub);assert.notEqual(await pa.page.locator('#farmName').textContent(),await pb.page.locator('#farmName').textContent());return `${ua}, ${ub}`;});
  if(pa&&pb){
    await run('keyboard movement and collision',async()=>{const user=db.prepare('SELECT id FROM users WHERE username=?').get(ua);const before=db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(user.id);await pa.page.locator('#canvas').click({position:{x:640,y:400}});await pa.page.keyboard.down('a');await pa.page.waitForTimeout(500);await pa.page.keyboard.up('a');await pa.page.waitForTimeout(400);const after=db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(user.id);assert.ok(after.x<before.x-20,`${JSON.stringify({before,after})}`);return JSON.stringify({before,after});});
    await run('house collision and farm interactions',async()=>{
      await position(pa.page,ua,510,250);await pa.page.keyboard.down('d');await pa.page.waitForTimeout(400);await pa.page.keyboard.up('d');await pa.page.waitForTimeout(250);
      const user=db.prepare('SELECT id FROM users WHERE username=?').get(ua),x=db.prepare('SELECT x FROM player_states WHERE user_id=?').get(user.id).x;assert.ok(x<540,`x=${x}`);
      await position(pa.page,ua,343,700);await pa.page.keyboard.press('e');await pa.page.locator('#panel h2').getByText(`Farm ${ua}`).waitFor();await pa.page.locator('#closePanel').click();
      await position(pa.page,ua,712,385);await pa.page.keyboard.press('e');await pa.page.locator('#panel h2').getByText('Ngôi nhà mái ngói').waitFor();await pa.page.locator('#closePanel').click();
      await position(pa.page,ua,935,586);const old=db.prepare("SELECT state FROM farm_objects WHERE farm_id=(SELECT id FROM farms WHERE owner_id=?) AND object_id='lamp'").get(user.id).state;await pa.page.keyboard.press('e');await pa.page.waitForTimeout(200);const next=db.prepare("SELECT state FROM farm_objects WHERE farm_id=(SELECT id FROM farms WHERE owner_id=?) AND object_id='lamp'").get(user.id).state;assert.notEqual(next,old);return `house stop x=${x}, lamp ${old}->${next}`;
    });
    await run('browser console',async()=>{assert.deepEqual(pa.errors,[]);assert.deepEqual(pb.errors,[]);});
    await run('two tabs same account',async()=>{const tab=await a.newPage();await tab.goto(url);await tab.locator('#game:not(.hidden)').waitFor();assert.equal(await tab.locator('#farmName').textContent(),await pa.page.locator('#farmName').textContent());await tab.close();});
    await run('planting by mouse, inventory, offline growth and harvest',async()=>{
      await pa.page.setViewportSize({width:800,height:600});await position(pa.page,ua,180,810);
      await clickSoil(pa.page);await pa.page.locator('[data-context-action=till]').click();await clickSoil(pa.page);await pa.page.waitForTimeout(250);
      let state=await pa.page.evaluate(async()=>await(await fetch('/api/farming')).json());assert.equal(state.tiles.find(t=>t.x===0&&t.y===0).state,'TILLED');
      await pa.page.keyboard.press('Escape');await clickSoil(pa.page);await pa.page.locator('[data-context-action=plant]').click();await clickSoil(pa.page);await pa.page.waitForTimeout(250);
      state=await pa.page.evaluate(async()=>await(await fetch('/api/farming')).json());assert.equal(state.tiles.find(t=>t.x===0&&t.y===0).crop.cropId,'mustard');
      await pa.page.keyboard.press('Escape');await clickSoil(pa.page);await pa.page.locator('[data-context-action=water]').click();await clickSoil(pa.page);await pa.page.waitForTimeout(250);
      state=await pa.page.evaluate(async()=>await(await fetch('/api/farming')).json());assert.ok(state.tiles.find(t=>t.x===0&&t.y===0).crop.wateredAt);
      await pa.page.locator('#farmUtilityButton').click();await pa.page.locator('#inventoryButton').click();assert.match(await pa.page.locator('#panel').textContent(),/Hạt rau cải/);await pa.page.locator('#closePanel').click();
      await pa.page.goto('about:blank');db.prepare('UPDATE farm_crops SET planted_at=planted_at-? WHERE farm_id=(SELECT id FROM farms WHERE owner_id=(SELECT id FROM users WHERE username=?)) AND tile_x=0 AND tile_y=0').run(20*60000,ua);
      await pa.page.goto(url);await pa.page.locator('#farmUtilityButton').waitFor();await clickSoil(pa.page);await pa.page.locator('[data-context-action=harvest]').click();await clickSoil(pa.page);await pa.page.waitForTimeout(300);
      state=await pa.page.evaluate(async()=>await(await fetch('/api/farming')).json());assert.equal(state.inventory.find(i=>i.id==='mustard').quantity,2);return 'tile (0,0), mustard ×2';
    });
    await run('farm to market and buy seeds',async()=>{
      await position(pa.page,ua,720,850);await pa.page.keyboard.press('e');await pa.page.locator('#marketHud:not(.hidden)').waitFor();await pa.page.screenshot({path:'.qa/isometric-market-world.png'});
      await position(pa.page,ua,300,445,'market');await pa.page.keyboard.press('e');await pa.page.locator('[data-market-product=seed_mustard]').click();await pa.page.locator('[data-market-form=buy]').waitFor();
      await pa.page.screenshot({path:'.qa/market.png'});
      await pa.page.locator('[data-market-form=buy] [type=submit]').click();
      await pa.page.getByText('Đã mua', {exact:false}).first().waitFor();const state=await pa.page.evaluate(async()=>await(await fetch('/api/market')).json());assert.equal(state.balance,186);return `balance ${state.balance}`;
    });
    await run('same account two tabs, duplicate request and live balance',async()=>{
      await position(pa.page,ua,300,445,'market');const tab=await a.newPage();await tab.goto(url);await tab.locator('#game:not(.hidden)').waitFor();
      const state=await pa.page.evaluate(async()=>await(await fetch('/api/market')).json());const intent={action:'buy',farmId:state.farmId,itemId:'seed_mustard',quantity:1,marketId:state.market.id,requestId:crypto.randomUUID()};
      const post=async page=>page.evaluate(async body=>{const me=await(await fetch('/api/me')).json();const r=await fetch('/api/market/action',{method:'POST',headers:{'content-type':'application/json','x-csrf-token':me.csrf},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};},intent);
      const [one,two]=await Promise.all([post(pa.page),post(tab)]);assert.equal(one.status,200);assert.equal(two.status,200);assert.equal([one.data.replayed,two.data.replayed].filter(Boolean).length,1);
      await tab.locator('#balance').getByText('172 Đồng Làng').waitFor();assert.equal((await pa.page.evaluate(async()=>await(await fetch('/api/market')).json())).balance,172);await tab.close();return 'one debit, one replay, tab balance 172';
    });
    await run('shop error leaves balance unchanged',async()=>{
      await pa.page.keyboard.press('e');await pa.page.locator('[data-market-product=seed_rice]').click();await pa.page.locator('[data-market-form=buy] input[name=quantity]').fill('99');assert.ok(await pa.page.locator('[data-market-form=buy] [type=submit]').isDisabled());
      assert.equal((await pa.page.evaluate(async()=>await(await fetch('/api/market')).json())).balance,172);return 'insufficient funds rejected';
    });
    await run('sell produce and market history',async()=>{
      await position(pa.page,ua,600,445,'market');await pa.page.keyboard.press('e');await pa.page.locator('[data-market-product=mustard]').click();await pa.page.locator('[data-market-form=sell] input[name=quantity]').fill('2');await pa.page.locator('[data-market-form=sell] [type=submit]').click();
      await pa.page.getByText('Đã bán', {exact:false}).first().waitFor();const state=await pa.page.evaluate(async()=>await(await fetch('/api/market')).json());assert.ok(state.balance>186);await pa.page.locator('#closePanel').click();await pa.page.locator('#historyButton').click();await pa.page.getByText('Lịch sử Đồng Làng').waitFor();assert.match(await pa.page.locator('#panel').textContent(),/starter|buy|sell/);return `balance ${state.balance}`;
    });
    await run('accept and complete one NPC order',async()=>{
      const user=db.prepare('SELECT id FROM users WHERE username=?').get(ua),farm=db.prepare('SELECT id FROM farms WHERE owner_id=?').get(user.id);
      await position(pa.page,ua,900,445,'market');await pa.page.keyboard.press('e');await pa.page.locator('[data-order-action=accept_order]').first().click();
      await pa.page.locator('[data-order-action=complete_order]').first().waitFor();const state=await pa.page.evaluate(async()=>await(await fetch('/api/market')).json());
      const order=state.orders.find(o=>o.status==='ACCEPTED');for(const [id,n] of Object.entries(order.items))addItem(db,farm.id,id,n);
      await pa.page.waitForTimeout(160);await pa.page.locator('[data-order-action=complete_order]').first().click();await pa.page.getByText('Đã giao đơn',{exact:false}).first().waitFor();
      const after=await pa.page.evaluate(async()=>await(await fetch('/api/market')).json());assert.equal(after.orders.find(o=>o.id===order.id).status,'COMPLETED');return order.id;
    });
    await run('market to farm and mobile layout',async()=>{await position(pa.page,ua,600,690,'market');await pa.page.keyboard.press('e');await pa.page.locator('#farmHud:not(.hidden)').waitFor();await pa.page.setViewportSize({width:390,height:844});assert.equal(await pa.page.locator('#joystick').isVisible(),true);const layout=await pa.page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,hud:document.querySelector('#hud').getBoundingClientRect().width}));assert.ok(layout.scrollWidth<=layout.width,JSON.stringify(layout));await pa.page.screenshot({path:'.qa/mobile.png'});assert.deepEqual(pa.errors,[]);return JSON.stringify(layout);});
    await run('account isolation and browser console',async()=>{const stateA=await pa.page.evaluate(async()=>await(await fetch('/api/market')).json());const stateB=await pb.page.evaluate(async()=>await(await fetch('/api/market')).json());assert.notEqual(stateA.farmId,stateB.farmId);assert.equal(stateB.balance,200);assert.deepEqual(pa.errors,[]);assert.deepEqual(pb.errors,[]);});
    await run('CSRF, authorization and logout/login',async()=>{
      const stateA=await pa.page.evaluate(async()=>await(await fetch('/api/market')).json());
      const forbidden=await pb.page.evaluate(async farmId=>{const me=await(await fetch('/api/me')).json();return (await fetch(`/api/farms/${farmId}`,{headers:{'x-csrf-token':me.csrf}})).status;},stateA.farmId);assert.equal(forbidden,403);
      const csrfStatus=await pa.page.evaluate(async farmId=>(await fetch('/api/market/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'accept_order',farmId,orderId:'summer',requestId:crypto.randomUUID()})})).status,stateA.farmId);assert.equal(csrfStatus,403);
      await pa.page.locator('#menuButton').click();await pa.page.locator('#logout').click();await pa.page.locator('#welcome:not(.hidden)').waitFor();
      await pa.page.locator('[name=username]').fill(ua);await pa.page.locator('[name=password]').fill('strong-pass-123');await pa.page.locator('#authSubmit').click();await pa.page.locator('#game:not(.hidden)').waitFor();
      assert.equal(await pa.page.locator('#farmName').textContent(),`Farm ${ua}`);return `foreign farm ${forbidden}, CSRF ${csrfStatus}`;
    });
  }
}finally{if(browser)await browser.close();await new Promise(resolve=>io.close(resolve));await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true});console.log(JSON.stringify(findings));if(findings.some(x=>!x.ok))process.exitCode=1;}
