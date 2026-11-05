import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {register} from '../server/auth.js';
import {createFarm} from '../server/farms.js';
import {addItem} from '../server/crops.js';
import {performVacAction} from '../server/vac.js';
import {openEdge,pause} from './edge-driver.mjs';

const db=openDatabase(':memory:'),user=register(db,'animal_qa','12345'),farm=createFarm(db,user.id,'Animal QA');
for(const [item,n] of [['fingerling_tilapia',2],['fish_feed',2],['chick',1],['chicken_feed',2]])addItem(db,farm.id,item,n);
const move=(x,y)=>db.prepare('UPDATE player_states SET x=?,y=? WHERE user_id=?').run(x,y,user.id);
move(850,770);
performVacAction(db,user.id,{action:'stock_fish',fishId:'tilapia',quantity:1,farmId:farm.id,requestId:randomUUID()});
move(1040,255);
performVacAction(db,user.id,{action:'add_chicken',quantity:1,farmId:farm.id,requestId:randomUUID()});
db.prepare('UPDATE coop_chickens SET ready_at=? WHERE farm_id=?').run(Date.now()-1000,farm.id);
move(600,620);
const {server,io}=createApp(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));
let b;
try{
  b=await openEdge('animal-interaction');await b.viewport(1366,900);
  b.onEvent(m=>{if(m.method!=='Fetch.requestPaused')return;
    const code=readFileSync('public/js/main.js','utf8').replace('await returnHome(false);','await returnHome(false);window.__animalReady=true;')+'\nwindow.__animalQA={walkTo,get farming(){return farming},get visual(){return livingVisual},get context(){return contextual},get player(){return player},get camera(){return camera},get vac(){return vacUi}};';
    b.command('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'content-type',value:'text/javascript'}],body:Buffer.from(code).toString('base64')}).catch(()=>{});
  });
  await b.command('Fetch.enable',{patterns:[{urlPattern:'*/js/main.js'}]});
  const url=`http://127.0.0.1:${server.address().port}`;await b.navigate(url);
  await b.waitFor("document.querySelector('#welcome:not(.hidden)')");
  await b.evaluate(`fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'animal_qa',password:'12345'})})`);
  await b.navigate(url);await b.waitFor('window.__animalReady && window.__animalQA?.context && __animalQA.visual.hits.length===2');
  await b.evaluate("document.querySelector('#onboardingSkip')?.click()");
  for(const kind of ['pond','coop']){
    // Resolve the live animation hit target, then use the same contextual entry point as a tap.
    await b.evaluate(`(()=>{const q=__animalQA,a=q.visual.hits.find(h=>h.kind==='${kind}');q.context.open(q.context.objectAt(a));})()`);
    await b.waitFor("document.querySelector('#contextMenu:not(.hidden) button')");
    const text=await b.evaluate("document.querySelector('#contextMenu').textContent");
    if(kind==='coop'){
      assert.ok(await b.evaluate("document.querySelector('#contextMenu').getAttribute('aria-label').includes('#1')"));
      await pause(300);await b.click('[data-context-vac=feed_chicken]');
      try{await b.waitFor("__animalQA.vac.state.coop.chickens[0].status==='PRODUCING'",30000);}catch(e){console.log(await b.evaluate("({p:{x:__animalQA.player.x,y:__animalQA.player.y},pending:__animalQA.vac.pending,error:document.querySelector('#error').textContent})"));throw e;}
    }
    else assert.equal(await b.evaluate("document.querySelectorAll('#contextMenu button').length"),1);
    if(kind==='pond'){
      assert.ok(await b.evaluate("Boolean(document.querySelector('[data-context-vac=feed_fish]:not(:disabled)'))"),text);
      const before=await b.evaluate('({x:__animalQA.player.x,y:__animalQA.player.y})');
      mkdirSync('.qa/animals',{recursive:true});await pause(400);await b.screenshot('.qa/animals/menu.png');await b.click('[data-context-vac=feed_fish]');
      try{await b.waitFor('__animalQA.vac.state.pond.fish[0].fedAt!==null',25000);}catch(e){console.log(await b.evaluate("({p:{x:__animalQA.player.x,y:__animalQA.player.y},pending:__animalQA.vac.pending,error:document.querySelector('#error').textContent})"));throw e;}
      const after=await b.evaluate('({x:__animalQA.player.x,y:__animalQA.player.y})');
      assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>50,'feeding must walk from a distant position first');
      assert.ok(db.prepare('SELECT fed_at FROM pond_fish WHERE farm_id=?').get(farm.id).fed_at);
    }
    mkdirSync('.qa/animals',{recursive:true});await b.screenshot(`.qa/animals/${kind}.png`);
    await b.evaluate('__animalQA.context.cancel()');
  }
  await b.evaluate("__animalQA.walkTo({x:600,y:620})");
  await b.waitFor("Math.hypot(__animalQA.player.x-600,__animalQA.player.y-620)<8");
  await b.evaluate("__animalQA.context.open({kind:'pond',point:{x:970,y:630}})");
  await b.waitFor("document.querySelector('#contextMenu.pond-tray:not(.hidden)')");
  assert.equal(await b.evaluate("document.querySelectorAll('.pond-fingerlings button').length"),2);
  await pause(300);await b.screenshot('.qa/animals/fingerlings.png');
  await b.click('[data-context-vac=stock_fish][data-fish-id=tilapia]');
  await b.waitFor('__animalQA.vac.state.pond.fish.length===2',30000);
  assert.equal(db.prepare('SELECT count(*) n FROM pond_fish WHERE farm_id=?').get(farm.id).n,2);
  await b.viewport(390,844);
  await b.evaluate("__animalQA.context.open({kind:'pond',point:{x:970,y:630}})");
  await pause(300);
  assert.ok(await b.evaluate("(()=>{const r=document.querySelector('#contextMenu').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()"));
  await b.screenshot('.qa/animals/fingerlings-mobile.png');
  await b.viewport(1000,800);await b.evaluate('__animalQA.context.cancel();__animalQA.farming.showInventory()');await pause(300);await b.screenshot('.qa/animals/inventory-desktop.png');
  assert.ok(await b.evaluate("[...document.querySelectorAll('.bag-slot')].every(e=>e.querySelector('.bag-quantity'))"));
  await b.viewport(390,844);await pause(200);await b.screenshot('.qa/animals/inventory-mobile.png');
  await b.click('#closePanel');await b.viewport(1000,800);
  await b.evaluate("(async()=>{const {tileCenter}=await import('/js/shared/crops.js');window.__soilCenter=tileCenter})()");
  await b.evaluate("__animalQA.context.open({kind:'soil',tile:{x:0,y:0},point:__soilCenter(0,0)})");
  await b.click('[data-context-action=till]');
  await b.waitFor("__animalQA.farming.tile(0,0).state==='TILLED'");
  await b.evaluate("__animalQA.context.open({kind:'soil',tile:{x:1,y:0},point:__soilCenter(1,0)})");
  const start=await b.evaluate("(()=>{const r=document.querySelector('[data-context-action=till]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await b.command('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',buttons:1,clickCount:1});
  let end=start;for(const x of [0,1,2]){
    const p=await b.evaluate(`(()=>{const p=__soilCenter(${x},0);return __animalQA.camera.toScreen(p.x,p.y)})()`);
    await b.command('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});
    end=p;
  }
  await b.command('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',buttons:0});
  await b.waitFor("__animalQA.farming.tile(1,0).state==='TILLED'&&__animalQA.farming.tile(2,0).state==='TILLED'");
  assert.equal(await b.evaluate("__animalQA.farming.tile(0,0).state"),'TILLED');
  await b.evaluate("__animalQA.context.open({kind:'soil',tile:{x:0,y:0},point:__soilCenter(0,0)})");
  assert.equal(await b.evaluate("document.querySelectorAll('[data-context-action=plant]').length"),6);
  await b.screenshot('.qa/animals/soil-tools.png');
  const plotsBefore=await b.evaluate('__animalQA.farming.state.plots.unlocked');
  await b.evaluate('__animalQA.context.cancel();__animalQA.farming.showPlots()');
  await b.evaluate("(()=>{const b=document.querySelector('[data-unlock-plot]');b.click();b.click();})()");
  await b.waitFor(`__animalQA.farming.state.plots.unlocked===${plotsBefore+1}&&document.querySelector('#panel').classList.contains('hidden')`);
  await pause(300);assert.equal(await b.evaluate('__animalQA.farming.state.plots.unlocked'),plotsBefore+1);
  assert.deepEqual(b.errors,[]);console.log('PASS: fish icons, feed bag, auto-walk feeding/stocking and mobile tray bounds; no browser errors');
}finally{b?.close();await new Promise(r=>io.close(r));if(server.listening)await new Promise(r=>server.close(r));db.close();}

