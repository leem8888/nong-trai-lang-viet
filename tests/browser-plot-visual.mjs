import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
import {Camera} from '../public/js/core/Camera.js';
import {FIELD} from '../public/js/shared/crops.js';
import {FARM_WORLD} from '../public/js/shared/farmWorld.js';
import {openEdge,pause} from './edge-driver.mjs';

const stage=process.argv[2]||'after',output=path.resolve('.qa/plots'),temp=mkdtempSync(path.join(tmpdir(),'plot-visual-'));
mkdirSync(output,{recursive:true});
const db=openDatabase(path.join(temp,'farm.sqlite'));
const {server,io}=createApp(db,{worldNow:()=>Date.UTC(2026,0,2,12)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let edge;
try{
  edge=await openEdge(`plots-${stage}`);
  await edge.viewport(1000,700);
  const url=`http://127.0.0.1:${server.address().port}`;
  await edge.navigate(url);
  await edge.waitFor("document.querySelector('#registerTab') && !document.querySelector('#welcome').classList.contains('hidden')");
  await edge.click('#registerTab');
  await edge.evaluate("document.querySelector('[name=username]').value='plot_visual';document.querySelector('[name=password]').value='strong-pass-123'");
  await edge.click('#authSubmit');
  await edge.waitFor("!document.querySelector('#create').classList.contains('hidden')");
  await edge.evaluate("document.querySelector('[name=name]').value='Vườn thử'");
  await edge.click('#farmForm button');
  await edge.waitFor("!document.querySelector('#game').classList.contains('hidden')");
  await edge.evaluate("document.querySelector('#onboardingSkip')?.click()");
  const user=db.prepare("SELECT id FROM users WHERE username='plot_visual'").get(),farm=db.prepare('SELECT id FROM farms WHERE owner_id=?').get(user.id);
  db.prepare('UPDATE farm_plot_expansions SET unlocked_count=21,purchased_count=16 WHERE farm_id=?').run(farm.id);
  if(stage==='raised-beds')for(let x=0;x<6;x++)db.prepare('INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?)').run(farm.id,x,0,x===5?'WATERED':'TILLED',Date.now());
  db.prepare("UPDATE player_states SET x=300,y=740,scene='farm' WHERE user_id=?").run(user.id);
  db.prepare('UPDATE wallets SET balance=10000 WHERE user_id=?').run(user.id);
  if(stage==='crop-centered'){
    const now=Date.now();
    for(const [x,id,age] of [[0,'mustard',1.1],[1,'carrot',1.1],[2,'rice',.5],[3,'rice',.12]]){
      db.prepare("INSERT INTO farm_soil_tiles VALUES (?,?,?,'PLANTED',?)").run(farm.id,x,0,now);
      db.prepare('INSERT INTO farm_crops(farm_id,tile_x,tile_y,crop_id,planted_at,duration_ms,bonus_ms,watered_at,yield_quantity) VALUES (?,?,?,?,?,?,0,NULL,3)').run(farm.id,x,0,id,now-age*600000,600000);
    }
  }
  await edge.navigate(url);
  await edge.waitFor("!document.querySelector('#game').classList.contains('hidden')");
  await pause(800);
  const camera=new Camera(FARM_WORLD);camera.isometric=true;camera.resize(1000,700);camera.snap(300,740);
  const point=camera.toScreen(FIELD.x+5*FIELD.stepX+FIELD.width/2,FIELD.y+2*FIELD.stepY+FIELD.height/2);
  await edge.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:900,y:50,button:'none'});
  await edge.screenshot(path.join(output,`${stage}-idle.png`));
  if(stage==='crop-centered'){assert.deepEqual(edge.errors,[]);console.log('Crop alignment visual captured without browser errors');}else{
  await edge.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y,button:'none'});
  await pause(150);
  await edge.screenshot(path.join(output,`${stage}-hover.png`));
  await edge.command('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',buttons:1,clickCount:1});
  await edge.command('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',buttons:0,clickCount:1});
  await edge.waitFor("!document.querySelector('#contextMenu').classList.contains('hidden')");
  assert.equal(await edge.evaluate("Boolean(document.querySelector('#contextMenu [data-context-open=plots]'))"),true);
  await edge.screenshot(path.join(output,`${stage}-click.png`));
  await edge.evaluate("document.querySelector('#contextCancel').click()");
  await edge.waitFor("document.querySelector('#contextMenu').classList.contains('hidden')");
  await edge.screenshot(path.join(output,`${stage}-closed.png`));
  await edge.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y,button:'none'});
  await edge.command('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',buttons:1,clickCount:1});
  await edge.command('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',buttons:0,clickCount:1});
  await edge.waitFor("!document.querySelector('#contextMenu').classList.contains('hidden')");
  await edge.click('[data-context-open="plots"]');
  await edge.waitFor("document.querySelector('[data-unlock-plot]')");
  await edge.click('[data-unlock-plot]');
  await edge.waitFor("document.querySelector('#plotsButton').textContent.includes('22/32')");
  assert.equal(db.prepare('SELECT unlocked_count FROM farm_plot_expansions WHERE farm_id=?').get(farm.id).unlocked_count,22);
  await edge.click('#closePanel');
  await edge.command('Input.dispatchMouseEvent',{type:'mouseMoved',x:900,y:50,button:'none'});
  await pause(150);
  await edge.screenshot(path.join(output,`${stage}-bought.png`));
  const now=Date.now();
  db.prepare('INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(farm_id,tile_x,tile_y) DO UPDATE SET state=excluded.state').run(farm.id,0,0,'TILLED',now);
  db.prepare('INSERT INTO farm_soil_tiles(farm_id,tile_x,tile_y,state,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(farm_id,tile_x,tile_y) DO UPDATE SET state=excluded.state').run(farm.id,1,0,'PLANTED',now);
  db.prepare('INSERT INTO farm_crops(farm_id,tile_x,tile_y,crop_id,planted_at,duration_ms,bonus_ms,watered_at,yield_quantity) VALUES (?,?,?,?,?,?,?,?,?)').run(farm.id,1,0,'tomato',now-50*60000,45*60000,0,null,3);
  await edge.navigate(url);
  await edge.waitFor("!document.querySelector('#game').classList.contains('hidden')");
  await edge.viewport(1920,1080);await pause(500);
  await edge.screenshot(path.join(output,`${stage}-near.png`));
  await edge.viewport(800,600);await pause(500);
  await edge.screenshot(path.join(output,`${stage}-far.png`));
  assert.deepEqual(edge.errors,[]);
  console.log(`Plot browser QA ${stage}: hover, click, purchase passed`);
  }
}finally{
  edge?.close();
  await new Promise(resolve=>io.close(resolve));
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  db.close();rmSync(temp,{recursive:true,force:true});
}
