import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
export const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function openEdge(label){
  const root=path.resolve('.qa',label);mkdirSync(root,{recursive:true});
  const port=9800+Math.floor(Math.random()*800),child=spawn(process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(root,'profile-'+Date.now())}`,'about:blank'],{stdio:'ignore',windowsHide:true});
  let target;for(let i=0;i<40;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(700)})).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
  if(!target){child.kill();throw Error('Edge CDP unavailable');}
  const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let seq=0;const pending=new Map(),handlers=[],errors=[];
  const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error(`CDP timeout ${method}`));},20000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
  ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);return;}
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    if(m.method==='Log.entryAdded'){const e=m.params.entry;if(e.level==='error'&&!e.url?.endsWith('/favicon.ico')&&!(e.url?.endsWith('/api/me')&&e.text.includes('401')))errors.push(e.text+' '+(e.url||''));}
    for(const h of handlers)h(m);
  });
  const evaluate=async expression=>{const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result.value;};
  const waitFor=async(expression,ms=15000)=>{const start=Date.now();while(Date.now()-start<ms){if(await evaluate(expression))return;await pause(80);}throw Error('Timeout '+expression+' errors='+JSON.stringify(errors));};
  const click=async selector=>{const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing selector');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await command('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await command('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});await command('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',buttons:0,clickCount:1});};
  await command('Page.enable');await command('Runtime.enable');await command('Log.enable');
  return {command,evaluate,waitFor,click,errors,onEvent:h=>handlers.push(h),navigate:url=>command('Page.navigate',{url}),viewport:(width,height)=>command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600}),screenshot:async file=>{const {data}=await command('Page.captureScreenshot',{format:'png'});writeFileSync(file,Buffer.from(data,'base64'));console.log(file);},close:()=>{ws.close();child.kill();}};
}
