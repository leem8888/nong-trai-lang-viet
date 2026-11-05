import {MANGO_TREE,MANGO_STAGES} from './shared/mango.js';
import {ISO_X,ISO_Y} from './core/IsoProjection.js';
export class MangoUI{
  constructor(api,notice,error,refresh){Object.assign(this,{api,notice,error,refresh});this.state=null;this.pending=null;this.busy=false;this.receivedAt=0;}
  setState(state){this.state=state;this.receivedAt=performance.now();}
  async load(){this.setState(await this.api('/mango'));}
  now(){return (this.state?.serverTime||Date.now())+performance.now()-this.receivedAt;}
  remaining(){return Math.max(0,(this.state?.readyAt||Infinity)-this.now());}
  size(){return this.state?.size||MANGO_STAGES[0].size;}
  hit(p){const dx=((p.x-MANGO_TREE.x)-(p.y-MANGO_TREE.y))*ISO_X,dy=((p.x-MANGO_TREE.x)+(p.y-MANGO_TREE.y))*ISO_Y,size=this.size();return (dx/(size*.44))**2+((dy+size*.60)/(size*.34))**2<=1||Math.hypot(dx,dy)<20;}
  render(root,owner){
    this.owner=owner;const s=this.state;root.setAttribute('aria-label','Cây xoài sân nhà');
    if(!s){root.innerHTML='<span>Đang tải cây xoài…</span>';return;}
    root.innerHTML=`<div class="mango-info"><strong>🥭 ${s.name} · Cấp ${s.stage}/4</strong><span>${s.yield} quả/vụ · 4 giờ/vụ · ${s.sellPrice} Đồng/quả</span><span data-mango-time></span><small>Đã hái ${s.harvests} lần${s.nextHarvests===null?' · Đã đạt cấp tối đa':` · Còn ${s.nextHarvests-s.harvests} lần lên cấp ${s.stage+1} (${s.nextYield} quả/vụ)`}</small><button data-mango-harvest ${!owner||this.busy||this.remaining()>0?'disabled':''}>${owner?'Thu hoạch xoài':'Chỉ chủ farm được thu hoạch'}</button></div>`;
    this.updateMenu(root);
  }
  updateMenu(root){if(!this.state)return;const label=root.querySelector('[data-mango-time]'),button=root.querySelector('[data-mango-harvest]');if(!label)return;const seconds=Math.ceil(this.remaining()/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),sec=seconds%60;
    const text=seconds?`Chín sau ${h} giờ ${String(m).padStart(2,'0')} phút ${String(sec).padStart(2,'0')} giây`:`Đã chín · Hái được ${this.state.yield} quả`;
    if(label.textContent!==text)label.textContent=text;if(button)button.disabled=!this.owner||this.busy||seconds>0;
  }
  async harvest(button){if(this.busy||button.disabled)return;this.busy=true;button.disabled=true;this.pending??=crypto.randomUUID();
    try{const result=await this.api('/mango/action',{method:'POST',body:JSON.stringify({action:'harvest',farmId:this.state.farmId,requestId:this.pending})});this.pending=null;this.setState(result.state);await this.refresh();this.notice(result.message,'mango_harvest');}
    catch(e){this.error(e.message);try{await this.load();}catch{}}
    finally{this.busy=false;}
  }
  draw(ctx){if(!this.state)return;const size=this.size(),ready=this.remaining()===0;
    ctx.save();ctx.translate(MANGO_TREE.x,MANGO_TREE.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
    // The underlying sprite has no fruit: both stages are drawn from server time here.
    const fruitScale=Math.max(.8,size/120)*(ready?1:.65);
    for(const [dx,dy] of [[-.10,-.72],[.14,-.60],[.18,-.58],[-.28,-.50],[.31,-.46]].slice(0,this.state.stage+1)){
      ctx.save();ctx.translate(dx*size,dy*size);ctx.rotate(.18);ctx.scale(fruitScale,fruitScale);
      ctx.strokeStyle='#65713a';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(1,-9);ctx.stroke();
      const skin=ctx.createLinearGradient(-3,-5,4,6);skin.addColorStop(0,ready?'#fff09a':'#b0cc64');skin.addColorStop(.42,ready?'#f4c13c':'#739d3c');skin.addColorStop(1,ready?'#cf8e20':'#3f702f');
      ctx.fillStyle=skin;ctx.strokeStyle=ready?'#a97827':'#41672f';ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(0,-6);ctx.bezierCurveTo(6,-6,6,2,1,7);ctx.bezierCurveTo(-2,9,-5,3,-4,-1);ctx.bezierCurveTo(-4,-4,-2,-6,0,-6);ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }
}
