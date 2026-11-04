// Asset packaging helper for re-generated PNG sources. Set ISO_ASSET_SOURCE_DIR to the folder
// containing the named PNGs, then inspect the WebP output before updating the game.
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public/assets');
const sourceRoot=process.env.ISO_ASSET_SOURCE_DIR||root;
const names=['village-welcome','farmhouse','lotus-pond','chicken-coop','mango-tree','seed-stall','village-npcs','rice-stages','mature-crops','soy-crop','production-buildings','farm-animals','farmer-walk','farmer-actions'];
for(const name of names)if(!existsSync(path.join(sourceRoot,name+'.png')))throw Error(`Missing PNG source ${name}. Set ISO_ASSET_SOURCE_DIR to the generated PNG source folder.`);
const server=createServer((req,res)=>{const name=decodeURIComponent((req.url||'').slice(1));if(!names.includes(name)){res.writeHead(404);res.end();return;}res.setHeader('content-type','image/png');res.end(readFileSync(path.join(sourceRoot,name+'.png')));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage();const base=`http://127.0.0.1:${server.address().port}`;await page.goto(base+'/farmhouse');
  for(const name of names){const data=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/webp',.88).split(',')[1];},base+'/'+name);const output=Buffer.from(data,'base64');writeFileSync(path.join(root,name+'.webp'),output);console.log(name,readFileSync(path.join(sourceRoot,name+'.png')).byteLength,output.byteLength);}
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
