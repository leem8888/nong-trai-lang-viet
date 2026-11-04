import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const label = process.argv[2] || 'baseline';
const dir = mkdtempSync(path.join(tmpdir(), 'farm-p8-visual-'));
const db = openDatabase(path.join(dir, 'qa.sqlite'));
const { server, io } = createApp(db);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
mkdirSync('.qa', { recursive: true });
let browser;
try {
  browser = await chromium.launch({headless:true, executablePath:process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const results=[];
  for (const [name,width,height] of [['desktop',1366,768],['mobile',390,844],...(label==='baseline'?[]:[['wide',1920,1080],['small',360,800],['tablet',768,1024]])]) {
    const context=await browser.newContext({viewport:{width,height}, reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto(url); await page.screenshot({path:`.qa/phase8-${label}-${name}-login.png`});
    await page.locator('#registerTab').click();
    await page.locator('[name=username]').fill(`p8_${name}_${label}`);
    await page.locator('[name=password]').fill('strong-pass-123');
    await page.locator('#authSubmit').click(); await page.locator('#create:not(.hidden)').waitFor();
    await page.locator('[name=name]').fill('Vườn Tre'); await page.locator('#farmForm button').click();
    await page.locator('#game:not(.hidden)').waitFor(); await page.waitForTimeout(500);
    await page.screenshot({path:`.qa/phase8-${label}-${name}-farm.png`});
    if(label!=='baseline'){
      if(!await page.locator('#onboarding').isVisible())throw Error(`Tutorial missing at ${name}`);
      await page.locator('#onboardingSkip').click();
      await page.locator('#menuButton').click();
      await page.locator('#replayTutorial').click();
      if(!await page.locator('#onboarding').isVisible())throw Error(`Tutorial replay failed at ${name}`);
      await page.locator('#onboardingSkip').click();
      await page.locator('#menuButton').click();
      await page.locator('#audioMute').check();
      await page.locator('#audioVolume').evaluate(el=>{el.value='0.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
      await page.locator('#closePanel').click();
      await page.reload(); await page.locator('#game:not(.hidden)').waitFor();
      if(await page.locator('#onboarding').isVisible())throw Error(`Tutorial repeated at ${name}`);
      await page.locator('#menuButton').click();
      if(!await page.locator('#audioMute').isChecked() || await page.locator('#audioVolume').inputValue()!=='0.5')throw Error(`Audio preference lost at ${name}`);
      await page.locator('#closePanel').click();
      await page.evaluate(()=>document.body.style.zoom='125%');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      if(overflow>1)throw Error(`Horizontal overflow at 125% zoom: ${name}, ${overflow}px`);
    }
    const metrics=await page.evaluate(async()=>{const samples=[];let last=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();samples.push(now-last);last=now;}samples.sort((a,b)=>a-b);return {medianFrameMs:samples[60],p95FrameMs:samples[114],medianFps:1000/samples[60],width:document.documentElement.scrollWidth};});
    results.push({name,width,height,...metrics}); await context.close();
  }
  writeFileSync(`.qa/phase8-${label}-metrics.json`,JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} finally {
  await browser?.close(); await new Promise(resolve=>io.close(resolve)); if(server.listening)await new Promise(resolve=>server.close(resolve)); db.close(); rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
