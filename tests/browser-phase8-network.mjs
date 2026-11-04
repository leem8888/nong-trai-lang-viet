import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-p8-network-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#registerTab').click();await page.locator('[name=username]').fill('p8network');await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();await page.locator('[name=name]').fill('Vườn mạng chậm');await page.locator('#farmForm button').click();await page.locator('#status').getByText('Đã kết nối').waitFor();
  const user=db.prepare('SELECT id FROM users WHERE username=?').get('p8network');await page.goto('about:blank');db.prepare('UPDATE player_states SET x=300,y=445,scene=? WHERE user_id=?').run('market',user.id);await page.goto(url);await page.locator('#status').getByText('Đã kết nối').waitFor();await page.keyboard.press('e');await page.locator('[data-market-form=buy]').waitFor();
  await page.locator('[data-market-form=buy] select').selectOption('seed_mustard');
  await page.route('**/api/market/action',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue();});
  await page.locator('[data-market-form=buy] button').click();await page.locator('[data-market-form=buy] button:disabled').waitFor();assert.match(await page.locator('[data-market-form=buy] button').textContent(),/Đang xử lý/);
  await page.getByText('Đã mua',{exact:false}).first().waitFor({timeout:5000});let state=await page.evaluate(async()=>await(await fetch('/api/market')).json());assert.equal(state.balance,186);console.log('PASS 1.2s latency, pending state, one debit');
  await page.unroute('**/api/market/action');await context.setOffline(true);await page.locator('[data-market-form=buy] button').click();await page.locator('#error:not(.hidden)').waitFor();state=await page.evaluate(async()=>await(await fetch('/api/market')).json()).catch(()=>null);assert.equal(state,null);await context.setOffline(false);state=await page.evaluate(async()=>await(await fetch('/api/market')).json());assert.equal(state.balance,186);assert.deepEqual(errors,[]);console.log('PASS offline failure leaves wallet unchanged and can reconnect');
}finally{await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
