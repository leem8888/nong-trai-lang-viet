import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {worldConfig,worldContext} from '../server/livingWorld.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const staticRoot=process.env.PHASE8_STATIC_ROOT||root;
const label=process.argv[2]||'after';
process.chdir(staticRoot);
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-p8-scenes-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const cfg=worldConfig({WORLD_EPOCH_MS:'0',WORLD_DAY_MS:'1440000',WEATHER_SLOT_MS:'480000',SEASON_MS:String(7*86400000),WEATHER_SEED:'browser'});
let worldAt=cfg.dayMs*7/24;
const {server,io}=createApp(db,{worldNow:()=>worldAt,worldSettings:cfg});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;mkdirSync(path.join(root,'.qa'),{recursive:true});let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'}),page=await context.newPage();
  await page.goto(url);await page.locator('#registerTab').click();await page.locator('[name=username]').fill('p8scene');await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();await page.locator('[name=name]').fill('Vườn Tre');await page.locator('#farmForm button').click();await page.locator('#status').getByText('Đã kết nối').waitFor();await page.locator('#onboardingSkip').click();
  const rainySlot=Array.from({length:90},(_,i)=>i).find(i=>worldContext(i*cfg.weatherMs,cfg).weather==='rainy');assert.notEqual(rainySlot,undefined);
  const scenes=[['morning',cfg.dayMs*7/24],['night',cfg.dayMs*20/24],['rain',rainySlot*cfg.weatherMs+1000],...['spring','summer','autumn','winter'].map((season,i)=>[season,i*cfg.seasonMs+cfg.dayMs*7/24])];
  for(const [name,at] of scenes){worldAt=at;await page.reload();await page.locator('#status').getByText('Đã kết nối').waitFor();await page.waitForTimeout(200);await page.screenshot({path:path.join(root,'.qa',`phase8-${label}-desktop-${name}.png`)});const contextState=await page.evaluate(async()=>await(await fetch('/api/village')).json());console.log(label,name,contextState.context.timeOfDay,contextState.context.weather,contextState.context.season);}
  await page.setViewportSize({width:390,height:844});worldAt=cfg.dayMs*7/24;await page.reload();await page.locator('#status').getByText('Đã kết nối').waitFor();await page.screenshot({path:path.join(root,'.qa',`phase8-${label}-mobile-morning.png`)});
}finally{await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});process.chdir(root);}
