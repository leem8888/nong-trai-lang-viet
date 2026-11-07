import {BANANA_TREE,BANANA_PHASES,BANANA_HOUR_MS,bananaPhase} from './shared/banana.js';
import {ISO_X,ISO_Y} from './core/IsoProjection.js';
export class BananaUI{
  constructor(api,notice,error,refresh){Object.assign(this,{api,notice,error,refresh});this.state=null;this.receivedAt=0;this.busy=false;this.pending=null;}
  setState(state){this.state=state;this.receivedAt=performance.now();}
  async load(){this.setState(await this.api('/banana'));}
  now(){return (this.state?.serverTime||Date.now())+performance.now()-this.receivedAt;}
  phase(){return this.state?bananaPhase(this.state.startedAt,this.now()):0;}
  hit(p){const dx=((p.x-BANANA_TREE.x)-(p.y-BANANA_TREE.y))*ISO_X,dy=((p.x-BANANA_TREE.x)+(p.y-BANANA_TREE.y))*ISO_Y;return (dx/66)**2+((dy+93)/82)**2<=1||Math.hypot(dx,dy)<20;}
  render(root,owner){
    this.owner=owner;root.setAttribute('aria-label','Khóm chuối góc vườn');
    if(!this.state){root.innerHTML='<span>Đang tải khóm chuối…</span>';return;}
    root.innerHTML=`<div class="tree-caption"><img src="/assets/items-v11/banana.svg" alt=""><div><strong>Khóm chuối</strong><span data-banana-time></span></div></div><button class="tree-harvest" data-banana-harvest title="Thu hoạch" aria-label="Thu hoạch chuối" disabled><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 17 15 7M31 17 25 7" fill="none" stroke="#79542e" stroke-width="3" stroke-linecap="round"/><path d="M6 17h28l-4 17H10Z" fill="#d9aa5b" stroke="#79542e" stroke-width="2"/><path d="M14 20l2 11m10-11-2 11M8 24h24M10 29h20" stroke="#9a7037" stroke-width="1.5"/><path d="M6 17h28" stroke="#f2d298" stroke-width="4" stroke-linecap="round"/></svg></button>`;

    this.updateMenu(root);
  }
  updateMenu(root){
    if(!this.state)return;
    const phase=this.phase(),name=root.querySelector('[data-banana-phase]'),label=root.querySelector('[data-banana-time]'),button=root.querySelector('[data-banana-harvest]');
    if(name)name.textContent=BANANA_PHASES[phase];
    const until=Math.max(0,this.state.startedAt+4*BANANA_HOUR_MS-this.now());
    const seconds=Math.ceil(until/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
    if(label){label.hidden=phase===4;label.textContent=phase===4?'':`${h?`${h}h `:''}${m}m ${String(s).padStart(2,'0')}s`;}
    if(button)button.disabled=!this.owner||this.busy||phase!==4;
  }
  async harvest(button){
    if(this.busy||button.disabled)return;
    this.busy=true;button.disabled=true;this.pending??=crypto.randomUUID();
    try{const result=await this.api('/banana/action',{method:'POST',body:JSON.stringify({action:'harvest',farmId:this.state.farmId,requestId:this.pending})});this.pending=null;this.setState(result.state);await this.refresh();this.notice(result.message,'banana_harvest');}
    catch(error){this.error(error.message);try{await this.load();}catch{}}
    finally{this.busy=false;}
  }
  draw(ctx,art={}){
    const phase=this.phase();if(!phase)return;
    ctx.save();ctx.translate(BANANA_TREE.x,BANANA_TREE.y);ctx.transform(1/(2*ISO_X),-1/(2*ISO_X),1/(2*ISO_Y),1/(2*ISO_Y),0,0);
    // Seat the bunch against the main stalk; its painted stem joins the curve.
    const bunchX=14;
    let stemX=bunchX+3,stemY=-103;
    if(phase>=2&&!(this.harvestAt!=null&&performance.now()-this.harvestAt>900)){
      const image=phase===4?art.bananaBunchRipe:art.bananaBunchGreen;
      if(image?.naturalWidth){
        const scale=phase===2?.62:1,w=38*scale,h=56*scale;
        // Conceal the cut end of the isolated sprite; join below it so the
        // living stalk never has a tan cut surface suspended in the middle.
        stemX=bunchX+w*.10;stemY=-106+h*.065;
        ctx.save();ctx.beginPath();ctx.rect(bunchX-w*.5,-106+h*.06,w,h);ctx.clip();
        ctx.drawImage(image.bitmap||image,bunchX-w*.5,-106,w,h);
        ctx.restore();
      }
    }
    const stalk=ctx.createLinearGradient(0,-121,stemX,stemY);
    stalk.addColorStop(0,'#778639');stalk.addColorStop(.5,'#899344');stalk.addColorStop(1,'#84903e');
    ctx.strokeStyle=stalk;ctx.lineWidth=3.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-1,-121);ctx.bezierCurveTo(12,-123,stemX+1,-116,stemX,stemY+2);ctx.stroke();
    if(phase<4){
      ctx.save();ctx.translate(bunchX-29,0);
      const y=phase===1?-90:phase===2?-73:-50;
      const blossom=ctx.createLinearGradient(24,y,34,y+18);blossom.addColorStop(0,'#9c4165');blossom.addColorStop(1,'#512038');ctx.fillStyle=blossom;
      ctx.beginPath();ctx.moveTo(29,y+19);ctx.bezierCurveTo(15,y+5,22,y-2,29,y);ctx.bezierCurveTo(39,y-2,42,y+5,29,y+19);ctx.fill();
      ctx.strokeStyle='#c66b85';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(27,y+2);ctx.quadraticCurveTo(23,y+10,29,y+16);ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}
