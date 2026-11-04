// Original, deterministic supplementary scenery. World geometry stays server-authoritative.
import {writeFileSync} from 'node:fs';
const out=(name,w,h,body)=>writeFileSync(`public/assets/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
let state=901;const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
const defs=`<defs><radialGradient id="grass"><stop stop-color="#a6c87a"/><stop offset=".65" stop-color="#83b565"/><stop offset="1" stop-color="#659854"/></radialGradient><linearGradient id="path" x2=".3" y2="1"><stop stop-color="#e8cf99"/><stop offset="1" stop-color="#c8a471"/></linearGradient><pattern id="brick" width="48" height="28" patternUnits="userSpaceOnUse"><rect width="48" height="28" fill="#c38865"/><path d="M0 0H48M0 14H48M24 0V14M0 14V28M48 14V28" stroke="#e2ae84" stroke-width="2"/></pattern></defs>`;
function ground(name,w,h,market){
  let b=defs+`<rect width="${w}" height="${h}" fill="url(#grass)"/>`;
  for(let i=0;i<170;i++){const x=random()*w,y=random()*h;b+=`<ellipse cx="${x}" cy="${y}" rx="${20+random()*90}" ry="${15+random()*65}" fill="${i%3?'#c0d995':'#4c8c54'}" opacity=".07"/>`;}
  const paths=market?'M600 770Q580 640 600 510M130 480Q440 420 620 470T1080 500':'M720 925Q705 760 718 610L718 490M100 675Q380 650 700 665Q850 675 1010 785M760 620Q930 530 1030 430';
  b+=`<path d="${paths}" fill="none" stroke="#769c55" stroke-width="108" stroke-linecap="round"/><path d="${paths}" fill="none" stroke="url(#path)" stroke-width="85" stroke-linecap="round"/>`;
  b+=market?'<path d="M170 350Q620 335 1030 365L1090 590Q620 625 140 560Z" fill="url(#path)"/>':'<path d="M560 475L877 475L900 601Q740 646 560 602Z" fill="url(#brick)" stroke="#a76f51" stroke-width="7"/>';
  for(let i=0;i<1700;i++){const x=random()*w,y=random()*h;b+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(random()*6-3).toFixed(1)} -${(2+random()*5).toFixed(1)}" stroke="${i%3?'#417e42':'#e1e8a3'}" stroke-opacity=".23" stroke-width="1.5" stroke-linecap="round"/>`;}
  // Continuous boundary; entry gap agrees with the existing gate.
  b+=`<path d="M${w/2-65} ${h-100}H60V83H${w-60}V${h-100}H${w/2+65}" fill="none" stroke="#557645" stroke-width="20" opacity=".22"/><path d="M${w/2-65} ${h-106}H60V77H${w-60}V${h-106}H${w/2+65}" fill="none" stroke="#9f824e" stroke-width="10"/><path d="M${w/2-65} ${h-120}H60V63H${w-60}V${h-120}H${w/2+65}" fill="none" stroke="#e3c481" stroke-width="7"/>`;
  for(let x=70;x<w-65;x+=36)for(const y of [68,h-113]){if(y>100&&Math.abs(x-w/2)<65)continue;b+=`<path d="M${x} ${y-12}v35" stroke="#795e39" stroke-width="6" stroke-linecap="round"/><path d="M${x-1} ${y-12}v31" stroke="#eed293" stroke-width="2"/>`;}
  if(market)b+='<path d="M190 163Q580 250 1020 170" fill="none" stroke="#856a43" stroke-width="3"/>'+Array.from({length:17},(_,i)=>{const x=205+i*48,y=169+Math.sin(i/16*Math.PI)*42;return `<path d="M${x} ${y}l15 27 15 -24Z" fill="${['#d7684c','#efc55d','#6f9b81'][i%3]}"/>`;}).join('');
  out(name,w,h,b);
}
ground('farm-ground-v9',1440,1024,false);ground('market-ground-v9',1200,800,true);
out('butterfly-v9',48,40,'<path d="M24 22C-2 -8 -1 29 22 25C4 42 29 43 24 24C45 44 48 26 27 24C53 8 28 -8 24 22" fill="#f3c46b" stroke="#ac7542" stroke-width="2"/><path d="M24 17v14" stroke="#654c3b" stroke-width="3"/>');
out('bird-v9',64,42,'<path d="M32 27Q9 -2 2 12L25 32Q32 39 41 30L62 8Q44 6 32 27Z" fill="#f7edcf" stroke="#b4ba99" stroke-width="2"/><path d="M31 29L40 33L46 31L39 29" fill="#ca9f58"/>');
console.log('Generated deterministic original Phase 9 supplementary SVG scenery.');
