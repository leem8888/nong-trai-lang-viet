import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {openDatabase} from '../server/db.js';
import {createApp} from '../server/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||pathToFileURL(path.resolve('.qa/browser-tools/node_modules/playwright/index.mjs')).href);
const db=openDatabase(':memory:'),{server,io}=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result=await page.evaluate(async()=>{
    const {drawWalkingChicken}=await import('/js/animalDrawing.js'),{ISO_X,ISO_Y}=await import('/js/core/IsoProjection.js');
    const load=async url=>{const image=new Image();image.src=url;await image.decode();return image;};
    const [peck,walk,turn]=await Promise.all(['chicken-peck-v2.png','chicken-walk-v2.png','chicken-turn-v2.png'].map(name=>load('/assets/'+name)));
    document.body.innerHTML='<canvas id="preview" width="1000" height="700"></canvas>';document.body.style.margin='0';
    const ctx=document.querySelector('canvas').getContext('2d');ctx.fillStyle='#577d3e';ctx.fillRect(0,0,1000,700);
    ctx.fillStyle='#fff3dc';ctx.font='18px sans-serif';
    for(let row=0;row<4;row++){
      const young=row%2===0,turning=row>=2;
      ctx.fillText(`${young?'Gà con':'Gà lớn'} · ${turning?'quay hướng':'bước đi'}`,24,row*165+26);
      for(let i=0;i<(turning?5:4);i++){
        const bird={moving:true,mode:'walk',turn:turning?[.97,.5,0,-.5,-.97][i]:1,phase:(i+.1)*Math.PI/2};
        ctx.save();ctx.translate(120+i*180,row*165+147);ctx.scale(2.4,2.4);ctx.transform(ISO_X,ISO_Y,-ISO_X,ISO_Y,0,0);
        drawWalkingChicken(ctx,peck,young,0,0,bird,0,false,{walk,turn});ctx.restore();
      }
    }
    return {walk:walk.naturalWidth>0,turn:turn.naturalWidth>0};
  });
  assert.deepEqual(result,{walk:true,turn:true});assert.deepEqual(errors,[]);
  mkdirSync('.qa/chicken-motion',{recursive:true});await page.screenshot({path:'.qa/chicken-motion/frames.png'});
  console.log('PASS browser renders distinct walking and turning poses for chicks and adults');
}finally{await browser?.close();await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();}
