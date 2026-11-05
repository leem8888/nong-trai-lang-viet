import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {DECORATIONS} from './shared/phase5.js';
const index=Object.keys(DECORATIONS).indexOf('farm_sign');
const layouts=new Map();
function fitName(ctx,name){
  if(layouts.has(name))return layouts.get(name);
  const words=name.trim().split(/\s+/u),limit=89;
  let result;
  for(let size=12;size>=7.5;size-=.5){
    ctx.font=`600 ${size}px "Segoe UI",system-ui,sans-serif`;
    const lines=[];let line='';
    // Break long words by grapheme so Vietnamese accents and emoji remain intact.
    const parts=[];for(const word of words){if(ctx.measureText(word).width<=limit)parts.push(word);else{let chunk='';for(const {segment} of new Intl.Segmenter('vi',{granularity:'grapheme'}).segment(word)){if(chunk&&ctx.measureText(chunk+segment).width>limit){parts.push(chunk);chunk='';}chunk+=segment;}if(chunk)parts.push(chunk);}}
    for(const word of parts){const next=line?`${line} ${word}`:word;if(line&&ctx.measureText(next).width>limit){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
    if(lines.length<=3||(size<=9&&lines.length<=4)){result={size,lines};break;}
  }
  result||={size:7.5,lines:[name]};
  if(layouts.size>=64)layouts.delete(layouts.keys().next().value);layouts.set(name,result);return result;
}
export function drawFarmSign(ctx,image,upright,name){
  const x=570,y=430,width=105.4,height=89.9;
  upright(ctx,x,y,image,width,height,[index*128,0,128,128]);
  if(!image?.naturalWidth||image.failed)return;
  ctx.save();ctx.translate(x,y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
  ctx.scale(.62,.62);
  // Follow the sloped face of the original wooden plank, keeping the two posts clear.
  ctx.translate(10,-71);ctx.transform(1,-.15,0,1,0,0);
  ctx.beginPath();ctx.rect(-46,-24,92,48);ctx.clip();
  const layout=fitName(ctx,String(name||'Nông trại'));
  ctx.font=`600 ${layout.size}px "Segoe UI",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  const step=layout.size+3,start=-(layout.lines.length-1)*step/2;
  for(const [i,line] of layout.lines.entries()){
    const baseline=start+i*step;
    // A light lower edge and dark inset suggest letters carved into the timber.
    ctx.fillStyle='#f9d7a69c';ctx.fillText(line,0,baseline+.9,89);
    ctx.fillStyle='#4b2b16';ctx.fillText(line,0,baseline,89);
  }
  ctx.restore();
}
