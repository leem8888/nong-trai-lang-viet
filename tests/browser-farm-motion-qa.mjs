import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';

const dir=mkdtempSync(path.join(tmpdir(),'farm-motion-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:2});
  await page.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__motionQA={get player(){return {x:player.x,y:player.y}},get camera(){return {x:camera.x,y:camera.y}},corrections:0};const originalPlace=player.place.bind(player);player.place=(...args)=>{window.__motionQA.corrections++;return originalPlace(...args);};'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/?debug`);
  await page.locator('#registerTab').click();await page.locator('[name=username]').fill('motion_probe');await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();
  await page.locator('[name=name]').fill('Vườn đo chuyển động');await page.locator('#farmForm button').click();await page.locator('#game:not(.hidden)').waitFor();await page.locator('#onboardingSkip').click();
  await page.waitForTimeout(3000);const idle=await page.evaluate(()=>window.__farmFrameStats());
  await page.keyboard.down('d');await page.waitForTimeout(3000);await page.keyboard.up('d');
  const moving=await page.evaluate(()=>window.__farmFrameStats()),motion=await page.evaluate(()=>window.__motionQA);
  const pixels=await page.locator('#canvas').evaluate(canvas=>canvas.width*canvas.height);
  assert.ok(pixels<=2502000,'desktop canvas stays inside the pixel budget');
  assert.equal(motion.corrections,0,'server does not snap the player back during open-ground movement');
  assert.ok(moving.p95FrameMs<34,'movement stays above 30 FPS at DPR 2');
  console.log(JSON.stringify({idle,moving,motion,pixels},null,2));
}finally{await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();rmSync(dir,{recursive:true,force:true});}
