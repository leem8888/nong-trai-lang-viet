import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const label=process.argv[2]||'before',dir=mkdtempSync(path.join(process.env.TERRAIN_QA_TMP||tmpdir(),'terrain-visual-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const WORLD_FIXTURE_AT=1730836800000;
const {server,io}=createApp(db,{worldNow:()=>WORLD_FIXTURE_AT});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`,output=process.env.TERRAIN_QA_DIR||'.qa';mkdirSync(output,{recursive:true});let browser;
const results=[];
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  for(const [name,width,height] of [['wide',1920,1080],['desktop',1366,768],['mobile',390,844]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
    const username=`terrain_${label}_${name}`;await page.locator('#registerTab').click();await page.locator('[name=username]').fill(username);await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();
    await page.locator('[name=name]').fill('Vườn Tre');await page.locator('#farmForm button').click();await page.locator('#game:not(.hidden)').waitFor({timeout:8000}).catch(async e=>{console.log('BOOT ERRORS',errors,'UI',await page.locator('#error').textContent(),await page.locator('#loadingMessage').textContent());throw e;});
    await page.locator('#onboardingSkip').click();await page.waitForTimeout(300);
    await page.screenshot({path:path.join(output,`terrain-${label}-${name}-farm.png`)});
    const user=db.prepare('SELECT id FROM users WHERE username=?').get(username),farm=db.prepare('SELECT id FROM farms WHERE owner_id=?').get(user.id),now=Date.now();
    db.prepare('UPDATE farm_plot_expansions SET unlocked_count=16,purchased_count=11,updated_at=? WHERE farm_id=?').run(now,farm.id);
    db.prepare("INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?)").run(farm.id,0,0,'TILLED',now);
    db.prepare("INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?)").run(farm.id,1,0,'PLANTED',now);
    db.prepare("INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?)").run(farm.id,2,0,'WATERED',now);
    db.prepare("INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?)").run(farm.id,3,0,'PLANTED',now);
    db.prepare('INSERT INTO farm_crops(farm_id,tile_x,tile_y,crop_id,planted_at,duration_ms,bonus_ms,watered_at,yield_quantity) VALUES (?,?,?,?,?,?,?,?,?)').run(farm.id,1,0,'mustard',now-2*60000,15*60000,0,null,2);
    db.prepare('INSERT INTO farm_crops(farm_id,tile_x,tile_y,crop_id,planted_at,duration_ms,bonus_ms,watered_at,yield_quantity) VALUES (?,?,?,?,?,?,?,?,?)').run(farm.id,3,0,'tomato',now-50*60000,45*60000,0,now-40*60000,3);
    db.prepare("INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?)").run(farm.id,4,0,'PLANTED',now);
    db.prepare('INSERT INTO farm_crops(farm_id,tile_x,tile_y,crop_id,planted_at,duration_ms,bonus_ms,watered_at,yield_quantity) VALUES (?,?,?,?,?,?,?,?,?)').run(farm.id,4,0,'corn',now-40*60000,60*60000,0,null,2);
    await page.reload();await page.locator('#game:not(.hidden)').waitFor();await page.waitForTimeout(300);
    await page.screenshot({path:path.join(output,`terrain-${label}-${name}-field.png`)});
    db.prepare('UPDATE player_states SET x=300,y=780 WHERE user_id=?').run(user.id);
    await page.reload();await page.locator('#game:not(.hidden)').waitFor();await page.waitForTimeout(300);
    await page.screenshot({path:path.join(output,`terrain-${label}-${name}-field-closeup.png`)});
    db.prepare("UPDATE player_states SET scene='market',x=600,y=450 WHERE user_id=?").run(user.id);
    await page.reload();await page.locator('#game:not(.hidden)').waitFor();await page.waitForTimeout(300);
    await page.screenshot({path:path.join(output,`terrain-${label}-${name}-market.png`)});
    const frame=await page.evaluate(async()=>{let last=performance.now(),frames=[];for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;}frames.sort((a,b)=>a-b);return {p50Ms:frames[60],p95Ms:frames[114],heap:performance.memory?.usedJSHeapSize||null};});
    results.push({name,width,height,errors,frame});await context.close();
  }
  writeFileSync(path.join(output,`terrain-${label}-metrics.json`),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();rmSync(dir,{recursive:true,force:true});}
