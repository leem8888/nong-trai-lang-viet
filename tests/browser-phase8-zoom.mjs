import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-p8-zoom-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;let browser;
try{
  browser=await chromium.launch({headless:process.env.PHASE8_HEADED!=='1',executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
  await page.goto(url);await page.locator('#registerTab').click();await page.locator('[name=username]').fill('p8zoom');await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();await page.locator('[name=name]').fill('Vườn phóng to');await page.locator('#farmForm button').click();await page.locator('#status').getByText('Đã kết nối').waitFor();await page.locator('#onboardingSkip').click();
  const metrics=()=>page.evaluate(()=>({innerWidth,devicePixelRatio,scale:visualViewport.scale,scrollWidth:document.documentElement.scrollWidth}));
  const before=await metrics();for(let i=0;i<2;i++)await page.keyboard.press('Control+Equal');await page.waitForTimeout(400);const after=await metrics();
  console.log(JSON.stringify({before,after}));
  if(after.innerWidth===before.innerWidth&&after.devicePixelRatio===before.devicePixelRatio)throw Error('Edge headless did not apply browser zoom shortcut');
  assert.ok(after.scrollWidth<=after.innerWidth+1);
  await page.locator('#menuButton').click();assert.ok(await page.locator('#closePanel').isVisible());await page.locator('#closePanel').click();
  await page.locator('#farmUtilityButton').click();await page.locator('#inventoryButton').click();assert.ok(await page.locator('#closePanel').isVisible());await page.locator('#closePanel').click();
  console.log('PASS browser zoom and core panels');
}finally{await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
