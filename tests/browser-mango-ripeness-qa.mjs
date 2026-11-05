import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const db=openDatabase(':memory:'),u=register(db,'hud_browser','password123'),f=createFarm(db,u.id,'Giao diện nông trại');db.prepare("UPDATE farm_onboarding SET status='SKIPPED'").run();
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
let browser,page;const errors=[],results=[];mkdirSync('.qa/hud',{recursive:true});
async function pause(ms){await new Promise(r=>setTimeout(r,ms));}
async function ready(){await page.locator('#status').getByText('Đã kết nối').waitFor();await pause(150);}
try{browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const context=await browser.newContext({viewport:{width:1366,height:900}});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[name=username]').fill('hud_browser');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();await ready();


 const metrics=await page.evaluate(async()=>{
  const {MangoUI}=await import('/js/mango.js');const images=[];
  for(const ready of [false,true]){
   const c=document.createElement('canvas');c.width=220;c.height=230;c.id=ready?'ripe-qa':'green-qa';c.style.cssText='position:fixed;top:180px;left:'+(ready?260:20)+'px;z-index:100;background:#f7ead0';document.body.append(c);
   const g=c.getContext('2d');g.translate(110,195);g.transform(.78,.39,-.78,.39,0,0);
   const {MANGO_TREE}=await import('/js/shared/mango.js');g.translate(-MANGO_TREE.x,-MANGO_TREE.y);
   const ui=new MangoUI();ui.setState({size:170,stage:4,serverTime:Date.now(),readyAt:Date.now()+(ready?-1000:14400000)});
   let labels=0;g.fillText=()=>labels++;ui.draw(g);
   const data=g.getImageData(0,0,c.width,c.height).data;let green=0,yellow=0,painted=0;
   for(let i=0;i<data.length;i+=4)if(data[i+3]>100){painted++;if(data[i+1]>data[i]*1.1)green++;if(data[i]>data[i+1]*1.1&&data[i+1]>data[i+2]*1.3)yellow++;}
   images.push({ready,green,yellow,painted,labels});
  }return images;
 });
 assert.ok(metrics[0].green>metrics[0].yellow,'unripe fruit is green');assert.ok(metrics[1].yellow>metrics[1].green,'ripe fruit is yellow');assert.ok(metrics[1].painted>metrics[0].painted*1.5,'ripe fruit is visibly bigger');assert.equal(metrics[0].labels+metrics[1].labels,0,'no floating labels');
 await page.screenshot({path:'.qa/hud/mango-ripeness.png'});console.log('PASS ripeness colors, larger ripe fruit, no floating label',metrics);assert.deepEqual(errors,[]);
}catch(e){console.error(e);if(page)await page.screenshot({path:'.qa/hud/failure.png'});results.push({ok:false,error:e.stack});process.exitCode=1;}
finally{writeFileSync('.qa/hud/results.json',JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}
