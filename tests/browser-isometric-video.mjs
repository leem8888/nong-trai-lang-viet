import { mkdtempSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';
import { Camera } from '../public/js/core/Camera.js';

const { chromium }=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-iso-video-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;mkdirSync('.qa/video-temp',{recursive:true});
let browser,context,page,video;const errors=[];
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:'.qa/video-temp',size:{width:1280,height:800}}});
  page=await context.newPage();video=page.video();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.waitForTimeout(1800);
  const name=`isovid_${Date.now()}`;await page.locator('#registerTab').click();await page.locator('[name=username]').fill(name);await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();
  await page.locator('#create:not(.hidden)').waitFor();await page.waitForTimeout(2000);await page.locator('[name=name]').fill('Vườn Tre');await page.locator('#farmForm button').click();await page.locator('#game:not(.hidden)').waitFor();await page.locator('#onboardingSkip').click();await page.waitForTimeout(2500);
  await page.keyboard.down('a');await page.waitForTimeout(1800);await page.keyboard.up('a');await page.waitForTimeout(600);
  await page.goto('about:blank');db.prepare('UPDATE player_states SET x=180,y=810 WHERE user_id=(SELECT id FROM users WHERE username=?)').run(name);await page.goto(url);await page.locator('#farmUtilityButton').waitFor();await page.locator('#status').getByText('Đã kết nối').waitFor();
  const player=(await page.evaluate(async()=>await(await fetch('/api/farm')).json())).player;const camera=new Camera({width:1440,height:1024});camera.isometric=true;camera.resize(1280,800);camera.snap(player.x,player.y);const tile=camera.toScreen(140,750);
  await page.mouse.click(tile.x,tile.y);await page.waitForTimeout(1100);await page.locator('[data-context-action=till]').click();await page.mouse.click(tile.x,tile.y);await page.waitForTimeout(1300);
  await page.keyboard.press('Escape');await page.mouse.click(tile.x,tile.y);await page.waitForTimeout(700);await page.locator('[data-context-action=plant]').click();await page.mouse.click(tile.x,tile.y);await page.waitForTimeout(1500);
  await page.keyboard.press('Escape');await page.mouse.click(tile.x,tile.y);await page.locator('[data-context-action=water]').click();await page.mouse.click(tile.x,tile.y);await page.waitForTimeout(1400);
  await page.locator('#quickInventory').click();await page.waitForTimeout(2500);await page.locator('#closePanel').click();await page.locator('#quickQuests').click();await page.waitForTimeout(2500);await page.locator('#closePanel').click();
  await page.keyboard.down('d');await page.waitForTimeout(2800);await page.keyboard.up('d');await page.waitForTimeout(1200);
  await page.waitForTimeout(8500);
  if(errors.length)throw Error(errors.join('; '));
}finally{
  await context?.close();if(video)copyFileSync(await video.path(),'.qa/isometric-qa.webm');await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
console.log('Saved .qa/isometric-qa.webm');
