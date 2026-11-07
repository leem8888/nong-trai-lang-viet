import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
const {chromium}=await import(pathToFileURL(path.resolve('.qa/browser-tools/node_modules/playwright/index.mjs')).href);
const db=openDatabase(':memory:'),{server,io}=createApp(db);
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('public/js/main.js','utf8')+'\nwindow.__gardenQA={hitPreview(point){player.place(point.x,point.y);camera.snap(point.x,point.y);contextual.cancel();input.clear();closePanel();draw(document.querySelector("canvas").getContext("2d"))},get children(){return villageChildren},get input(){return input},behindHousePreview(){villageChildren.clock=4;villageChildren.people=[{kind:"kite",id:0,x:1770,y:324,from:{x:1770,y:0},to:{x:1770,y:1000},phase:1,delay:0,done:false,mirror:false}];camera.snap(1920,450);actionEffect=null},childrenPreview(kind){villageChildren.clock=4;villageChildren.people=Array.from({length:kind==="bike"?3:1},(_,id)=>({kind,id,x:850+id*95,y:1000,from:{x:600,y:1000},to:{x:1700,y:1000},phase:1,delay:0,done:false,mirror:false}));camera.snap(1000,900);actionEffect=null},hoePreview(point,age,kind="till"){actionEffect={kind,at:performance.now()-age,point};player.place(point.x+15,point.y-20);camera.snap(point.x,point.y);contextual.cancel()},fishHarvest(){livingVisual.onAction({action:"harvest_fish",entityId:1},{state:{}},{pond:{fish:[{id:1,fishId:"tilapia"}]}},player,livingVisual.layout(phase5Ui.state));livingVisual.event.at=performance.now()-2400;actionEffect={kind:"harvest_fish",at:livingVisual.event.at}},feed(){livingVisual.onAction({action:"feed_chicken",entityId:1},{state:{}},null,player,livingVisual.layout(phase5Ui.state));showNotice("Feed chicken","feed_chicken")},stop(){loop.stop()},render(){draw(document.querySelector("canvas").getContext("2d"))},get player(){return player},get camera(){return camera},get context(){return contextual},get farming(){return farming},get mango(){return mangoUi},get banana(){return bananaUi}};'}));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#registerTab').click();await page.locator('[name=username]').fill('garden_visual');await page.locator('[name=password]').fill('password123');await page.locator('#authSubmit').click();
 await page.locator('#create:not(.hidden)').waitFor();await page.locator('[name=name]').fill('Garden visual');await page.locator('#farmForm button').click();await page.locator('#game:not(.hidden)').waitFor();await page.locator('#onboardingSkip').click();
 await page.waitForTimeout(1500);
 const facing=await page.evaluate(async()=>{
  const {movementFacing}=await import('/js/entities/Player.js');
  const q=window.__gardenQA;q.mango.state.readyAt=q.mango.now()-1000;q.banana.state.startedAt=q.banana.now()-4*3600000;
  return movementFacing(-1,1,'up');
 });assert.equal(facing,'left');
 mkdirSync('.qa',{recursive:true});await page.screenshot({path:'.qa/garden-visual-wide.png'});
 await page.evaluate(()=>{const q=window.__gardenQA;q.stop();q.camera.focus=q.camera.focusTarget=1.5;q.camera.fit();q.camera.snap(1300,350);q.player.place(1424.0353191759684,-6.4121071407262775);q.render();});
 await page.waitForTimeout(300);await page.screenshot({path:'.qa/garden-visual-coop.png'});
 await page.evaluate(()=>{const q=window.__gardenQA;q.player.place(1150,320);q.feed();});
 await page.waitForTimeout(600);await page.evaluate(()=>window.__gardenQA.render());await page.screenshot({path:'.qa/garden-feed-chicken.png'});
 await page.evaluate(()=>{const q=window.__gardenQA;q.player.place(950,760);q.camera.snap(1100,700);q.fishHarvest();q.render();});await page.screenshot({path:'.qa/garden-fishing-net.png'});
 await page.evaluate(async()=>{const q=window.__gardenQA;const {tileCenter}=await import('/js/shared/crops.js');const p=tileCenter(0,0);q.camera.snap(p.x,p.y);q.render();await q.context.open({kind:'soil',point:p,tile:{x:0,y:0}});});
 await page.screenshot({path:'.qa/garden-hoe-tool.png'});
 await page.evaluate(async()=>{const q=window.__gardenQA,t=q.farming.tile(0,0);t.state='PLANTED';t.crop={cropId:'mustard',plantedAt:0,durationMs:1000,bonusMs:0,wateredAt:1};q.context.renderMenu();q.context.placeMenu();});
 await page.screenshot({path:'.qa/garden-harvest-tool.png'});
 for(const [name,age] of [['raise',340],['impact',610],['pull',820]]){await page.evaluate(async age=>{const q=window.__gardenQA,{tileCenter}=await import('/js/shared/crops.js');q.hoePreview(tileCenter(0,0),age);q.render();},age);await page.screenshot({path:'.qa/garden-hoe-'+name+'.png'});}
 for(const [kind,age] of [['plant',720],['water',840],['harvest',690]]){await page.evaluate(async({kind,age})=>{const q=window.__gardenQA,{tileCenter}=await import('/js/shared/crops.js');q.hoePreview(tileCenter(0,0),age,kind);q.render();},{kind,age});await page.screenshot({path:'.qa/garden-soil-'+kind+'.png'});}
 await page.evaluate(()=>{const q=window.__gardenQA;q.farming.state.inventory.find(i=>i.id==='seed_mustard').quantity=1;q.farming.state.tiles.find(t=>!t.locked).state='TILLED';q.context.seed='mustard';q.context.arm('plant');q.farming.state.inventory.find(i=>i.id==='seed_mustard').quantity=0;q.render();});
 assert.equal(await page.locator('#contextStatus').isVisible(),true);await page.waitForTimeout(3200);assert.equal(await page.locator('#contextStatus').isVisible(),false);
 for(const kind of ['bike','kite']){await page.evaluate(kind=>{window.__gardenQA.childrenPreview(kind);window.__gardenQA.render();},kind);await page.screenshot({path:'.qa/garden-children-'+kind+'.png'});}
 const spots=await page.evaluate(async()=>{const {HOUSE_DOOR}=await import('/js/shared/house.js'),{tileCenter}=await import('/js/shared/crops.js');return [{x:HOUSE_DOOR.x+40,y:HOUSE_DOOR.y+40},tileCenter(0,0),{x:950,y:760}];});
 for(const spot of spots){for(const height of [0,40,72]){const screen=await page.evaluate(({spot,height})=>{const q=window.__gardenQA;q.hitPreview(spot);const p=q.camera.toScreen(spot.x,spot.y);return {x:p.x,y:p.y-height*q.camera.zoom};},{spot,height});await page.mouse.click(screen.x,screen.y);assert.equal(await page.locator('#panel').isVisible(),false);assert.equal(await page.locator('#contextMenu').isVisible(),false);assert.equal(await page.evaluate(()=>window.__gardenQA.input.target),null);}}
 await page.evaluate(()=>{window.__gardenQA.behindHousePreview();window.__gardenQA.render();});assert.equal(await page.evaluate(()=>window.__gardenQA.children.people[0].occluded),true);await page.screenshot({path:'.qa/garden-child-behind-house.png'});
 await page.evaluate(()=>{const q=window.__gardenQA;q.camera.snap(720,680);q.input.setPath([{x:720,y:740}]);q.render();});
 await page.screenshot({path:'.qa/garden-move-destination.png'});
 await page.evaluate(()=>window.__gardenQA.input.cancelPath());
 for(const [name,x,y] of [['east',1980,550],['north',600,-450],['west',-340,650]]){
  await page.evaluate(({x,y})=>{const q=window.__gardenQA;q.camera.focus=q.camera.focusTarget=1;q.camera.fit();q.camera.snap(x,y);q.render();},{x,y});
  await page.screenshot({path:`.qa/garden-neighbors-${name}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS garden render, neighboring yards, ripe fruit, projected facing, and no browser errors');
}finally{await browser?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}

