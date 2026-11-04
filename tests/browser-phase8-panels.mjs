import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(path.join(tmpdir(),'farm-p8-panels-')),db=openDatabase(path.join(dir,'qa.sqlite'));
const {server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;mkdirSync('.qa',{recursive:true});
let browser;const results=[];
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  for(const [name,width,height] of [['desktop',1366,768],['wide',1920,1080],['mobile',390,844],['small',360,800],['tablet',768,1024]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<=700,isMobile:width<=700}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.locator('#registerTab').click();await page.locator('[name=username]').fill(`p8panel_${name}`);await page.locator('[name=password]').fill('strong-pass-123');await page.locator('#authSubmit').click();await page.locator('[name=name]').fill('Vườn thử giao diện');await page.locator('#farmForm button').click();await page.locator('#status').getByText('Đã kết nối').waitFor();
    await page.locator('#onboardingSkip').click();
    const user=db.prepare('SELECT id FROM users WHERE username=?').get(`p8panel_${name}`);
    async function relocate(x,y,scene='farm'){await page.goto('about:blank');db.prepare('UPDATE player_states SET x=?,y=?,scene=? WHERE user_id=?').run(x,y,scene,user.id);await page.goto(url);await page.locator('#status').getByText('Đã kết nối').waitFor();}
    async function verify(label){await page.locator('#panel:not(.hidden)').waitFor();const bounds=await page.locator('#panel').boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1,`${name}/${label}: ${JSON.stringify(bounds)}`);assert.ok(await page.locator('#closePanel').isVisible(),`${name}/${label} close button hidden`);assert.equal(await page.evaluate(()=>document.activeElement?.id),'closePanel',`${name}/${label} focus`);if(results.length%2)await page.keyboard.press('Escape');else await page.locator('#closePanel').click();assert.equal(await page.locator('#panel').isVisible(),false);results.push({name,label,ok:true});}
    for(const [label,selector] of [['menu','#menuButton'],['inventory','#inventoryButton'],['craft','#craftButton'],['build','#buildButton'],['decor','#decorButton'],['expand','#expandButton'],['social','#socialButton']]){if(width<=700)await page.locator(selector).tap();else await page.locator(selector).click();await verify(label);}
    for(const [label,target] of [['history','historyButton'],['quests','questsButton']]){if(width<=700){await page.locator('#menuButton').click();await page.locator(`[data-menu=${target}]`).click();}else await page.locator('#'+target).click();await verify(label);}
    for(const [label,x,y] of [['pond',990,780],['coop',1010,425],['board',343,700],['door',712,520]]){await relocate(x,y);await page.keyboard.press('e');await verify(label);}
    const npc=await page.evaluate(async()=>{const state=await(await fetch('/api/village')).json();return state.npcs.find(row=>row.scene==='farm');});
    if(npc){await relocate(npc.x,npc.y);await page.keyboard.press('e');await verify('npc dialogue');}
    for(const [label,x,y] of [['shop',300,445],['buyer',600,445],['orders',900,445]]){await relocate(x,y,'market');await page.keyboard.press('e');await verify(label);}
    assert.deepEqual(errors,[],`${name}: page errors`);
    await page.screenshot({path:`.qa/phase8-panels-${name}.png`});
    console.log('PASS',name,results.filter(row=>row.name===name).length,'panels');await context.close();
  }
  writeFileSync('.qa/phase8-panels-report.json',JSON.stringify(results,null,2));
}finally{await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
