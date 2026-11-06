const fs = require('node:fs');
let seed = 246813579;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const f = n => Number(n.toFixed(1));
const patches = (width, height, count) => Array.from({length:count}, () => {
  const x=f(random()*width), y=f(random()*height), rx=f(15+random()*75), ry=f(8+random()*43);
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${random()>.48?'#3e7845':'#c8d995'}" opacity="${f(.035+random()*.09)}"/>`;
}).join('');
const grass = (width,height,count) => Array.from({length:count},()=>{
  const x=f(random()*width),y=f(random()*height),h=f(2+random()*5);
  return `<path d="M${x} ${y}l-1 -${h}m1 ${h}l2 -${f(h*.8)}" fill="none" stroke="${random()>.4?'#426e3c':'#e1d98c'}" stroke-width=".8" opacity=".38"/>`;
}).join('');
const defs='<defs><linearGradient id="meadow" x2=".7" y2="1"><stop stop-color="#8bad68"/><stop offset=".5" stop-color="#80a65e"/><stop offset="1" stop-color="#719954"/></linearGradient><linearGradient id="soil" x2=".3" y2="1"><stop stop-color="#d9bc86"/><stop offset="1" stop-color="#b99b6d"/></linearGradient></defs>';
const ground=`<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1500" viewBox="0 0 2000 1500">${defs}<rect width="2000" height="1500" fill="url(#meadow)"/>${patches(2000,1500,340)}`;
const routes=[
  ['M600 1450Q610 1260 610 1100T600 690Q585 550 600 490',72],
  ['M170 500Q400 485 600 490T900 490Q1120 500 1450 500',84],
  ['M600 690Q815 700 995 760T1180 1000Q1380 1080 1640 1140',60],
  ['M610 1100Q900 1040 1180 1000',46],
  ['M1450 500Q1480 740 1640 1140',50],
  ['M600 1100Q460 1120 355 1140',42]
];
let paths='';
for(const [d,w] of routes){paths+=`<path d="${d}" fill="none" stroke="#a28658" stroke-width="${w+20}" opacity=".18" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="url(#soil)" stroke-width="${w}" opacity=".88" stroke-linecap="round" stroke-linejoin="round"/>`;}
const yard='<path d="M175 390Q260 360 450 375L940 365Q1060 385 1060 490Q1080 590 970 660Q820 750 675 710Q545 700 430 640Q240 605 170 535Q140 465 175 390Z" fill="url(#soil)" opacity=".87"/>';
const dust=Array.from({length:2200},()=>{const x=f(random()*2000),y=f(random()*1500),r=f(.4+random()*1.6);return `<circle cx="${x}" cy="${y}" r="${r}" fill="${random()>.5?'#e1d29a':'#477e43'}" opacity=".27"/>`;}).join('');
fs.writeFileSync('public/assets/market-meadow-v11.svg',ground+paths+yard+dust+grass(2000,1500,1900)+'</svg>');
fs.writeFileSync('public/assets/market-surroundings-v11.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="4300" height="3600" viewBox="0 0 4300 3600">${defs}<rect width="4300" height="3600" fill="url(#meadow)"/>${patches(4300,3600,900)}${grass(4300,3600,5200)}</svg>`);
