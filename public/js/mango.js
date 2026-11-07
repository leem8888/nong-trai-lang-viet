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
    root.innerHTML=`<div class="tree-caption"><img src="/assets/items-v11/mango.svg" alt=""><div><strong>Cây xoài</strong><span data-mango-time></span><progress class="tree-level-progress" data-mango-level-progress max="1" value="0"></progress><small data-mango-level></small></div></div><button class="tree-harvest" data-mango-harvest title="Thu hoạch" aria-label="Thu hoạch xoài" disabled><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 17 15 7M31 17 25 7" fill="none" stroke="#79542e" stroke-width="3" stroke-linecap="round"/><path d="M6 17h28l-4 17H10Z" fill="#d9aa5b" stroke="#79542e" stroke-width="2"/><path d="M14 20l2 11m10-11-2 11M8 24h24M10 29h20" stroke="#9a7037" stroke-width="1.5"/><path d="M6 17h28" stroke="#f2d298" stroke-width="4" stroke-linecap="round"/></svg></button>`;

    this.updateMenu(root);
  }
  updateMenu(root){if(!this.state)return;const label=root.querySelector('[data-mango-time]'),button=root.querySelector('[data-mango-harvest]');if(!label)return;const seconds=Math.ceil(this.remaining()/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),sec=seconds%60;
    label.hidden=seconds===0;const text=seconds?`${h?`${h}h `:''}${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`:'';
    const state=this.state,current=MANGO_STAGES.find(row=>row.level===state.stage)||MANGO_STAGES[0];
    const progress=root.querySelector('[data-mango-level-progress]'),level=root.querySelector('[data-mango-level]');
    const maxed=state.nextHarvests===null,total=maxed?1:state.nextHarvests-current.harvests,done=maxed?1:Math.max(0,Math.min(total,state.harvests-current.harvests));
    if(progress){progress.max=total;progress.value=done;progress.setAttribute('aria-label',maxed?'Đã đạt cấp tối đa':`Tiến độ lên cấp ${state.stage+1}`);}
    if(level)level.textContent=maxed?'Cấp 4 · Tối đa':`Cấp ${state.stage} · Còn ${total-done} lần hái lên cấp ${state.stage+1}`;
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
    const positions=[[-.10,-.72],[.14,-.60],[.22,-.68],[-.28,-.50],[.31,-.46],[-.24,-.65],[.02,-.52],[-.12,-.44],[.25,-.54],[.05,-.77],[-.32,-.58],[.13,-.43],[.34,-.61],[-.03,-.63]];
    const picked=this.harvestAt==null?0:Math.max(0,Math.min(3,Math.floor(((performance.now()-this.harvestAt)/1000-.24)/.5)+1));
    for(const [dx,dy] of positions.slice(picked,ready?6+this.state.stage*2:this.state.stage+1)){
      ctx.save();ctx.translate(dx*size,dy*size);ctx.rotate(.18);ctx.scale(fruitScale,fruitScale);
      ctx.strokeStyle='#65713a';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(1,-9);ctx.stroke();
      const skin=ctx.createLinearGradient(-3,-5,4,6);skin.addColorStop(0,ready?'#fff195':'#b0cc64');skin.addColorStop(.42,ready?'#ffd044':'#739d3c');skin.addColorStop(1,ready?'#d99020':'#3f702f');
      ctx.fillStyle=skin;ctx.strokeStyle=ready?'#a97827':'#41672f';ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(0,-6);ctx.bezierCurveTo(6,-6,6,2,1,7);ctx.bezierCurveTo(-2,9,-5,3,-4,-1);ctx.bezierCurveTo(-4,-4,-2,-6,0,-6);ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }
}
