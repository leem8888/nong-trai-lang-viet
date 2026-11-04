import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-iso-perf-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
mkdirSync('.qa',{recursive:true});let browser;const samples=[],errors=[];const started=Date.now();
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:2}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.locator('#registerTab').click();await page.locator('[name=username]').fill('iso_perf');await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();await page.locator('[name=name]').fill('Vườn hiệu năng');await page.locator('#farmForm button').click();await page.locator('#game:not(.hidden)').waitFor();await page.locator('#onboardingSkip').click();
  const farmId=db.prepare('SELECT id FROM farms WHERE name=?').get('Vườn hiệu năng').id,insert=db.prepare('INSERT INTO farm_decorations(farm_id,definition_id,tile_x,tile_y,rotation,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  for(let y=6;y<16;y++)for(let x=12;x<22;x++)insert.run(farmId,'brick_path',x,y,0,Date.now(),Date.now());await page.reload();await page.locator('#game:not(.hidden)').waitFor();
  while(Date.now()-started<600000){
    const metric=await page.evaluate(async()=>{const frames=[];let last=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;}frames.sort((a,b)=>a-b);return {p50FrameMs:frames[60],p95FrameMs:frames[114],fps:1000/frames[60],heapBytes:performance.memory?.usedJSHeapSize??null,resourceCount:performance.getEntriesByType('resource').length};});
    samples.push({seconds:Math.round((Date.now()-started)/1000),...metric});console.log('SAMPLE',JSON.stringify(samples.at(-1)));
    const remaining=600000-(Date.now()-started);if(remaining>0)await page.waitForTimeout(Math.min(48000,remaining));
  }
  assert.ok(Date.now()-started>=600000);assert.deepEqual(errors,[]);console.log('PASS ten-minute DPR2 benchmark',samples.length,'samples');
}finally{
  writeFileSync('.qa/isometric-performance-report.json',JSON.stringify({started:new Date(started).toISOString(),durationMs:Date.now()-started,viewport:'1366x768',dpr:2,decorations:100,samples,errors},null,2));
  await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
