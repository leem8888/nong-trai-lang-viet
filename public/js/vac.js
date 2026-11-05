import { FISH, VAC_RECIPES } from './shared/vac.js';

export class VacUI {
  constructor(api,openPanel,showError,showNotice,refreshInventory,onSuccess=()=>{}){
    this.api=api;this.openPanel=openPanel;this.showError=showError;this.showNotice=showNotice;this.refreshInventory=refreshInventory;this.onSuccess=onSuccess;
    this.state=null;this.current=null;this.pending=null;this.flashUntil=0;
    const panel=document.getElementById('panel');
    panel.addEventListener('submit',event=>{
      const form=event.target.closest('[data-vac-form]');if(!form)return;
      event.preventDefault();const fields=Object.fromEntries(new FormData(form));
      this.act({action:form.dataset.vacForm,quantity:Number(fields.quantity),...(fields.fishId?{fishId:fields.fishId}:{}),...(fields.recipeId?{recipeId:fields.recipeId}:{})},form.querySelector('button[type=submit]'));
    });
    panel.addEventListener('click',event=>{
      const button=event.target.closest('[data-vac-action]');if(!button)return;
      this.act({action:button.dataset.vacAction,...(button.dataset.entityId?{entityId:Number(button.dataset.entityId)}:{})},button);
    });
  }
  setState(state){this.state=state;const fish=state.pond.fish.filter(row=>row.remainingMs===0).length;
    const eggs=state.coop.chickens.reduce((n,row)=>n+row.eggsReady,0);
    document.getElementById('vacStatus').textContent=`🐟 ${fish} cá sẵn sàng · 🥚 ${eggs} trứng có thể nhặt`;
  }
  count(id){return this.state.inventory.find(item=>item.id===id)?.quantity||0;}
  async open(kind){try{this.setState(await this.api('/vac'));this.current=kind;this.render();}catch(error){this.showError(error.message);}}
  render(){if(!this.state)return;
    const {pond,coop}=this.state;
    if(this.current==='pond'){
      const fish=pond.fish.map(row=>`<li><b>${row.name} #${row.id}</b><small>${row.remainingMs?`Còn khoảng ${Math.ceil(row.remainingMs/60000)} phút`:'Sẵn sàng thu hoạch'} · ${Math.round(row.progress*100)}% · ${row.fedAt===null?'chưa cho ăn':'đã cho ăn'}</small>
        <div class="vac-actions">${row.remainingMs&&row.fedAt===null?`<button data-vac-action="feed_fish" data-entity-id="${row.id}">Cho ăn</button>`:''}${!row.remainingMs?`<button data-vac-action="harvest_fish" data-entity-id="${row.id}">Thu hoạch</button>`:''}</div></li>`).join('');
      this.openPanel(`<h2>Ao cá · ${pond.fish.length}/${pond.capacity}</h2><p>Còn ${pond.capacity-pond.fish.length} chỗ · thức ăn cá: ${this.count('fish_feed')}. ${this.count('fish_feed')?'Cho cá ăn để rút ngắn thời gian chờ.':'Hết thức ăn: mua tại chợ hoặc đổi từ đậu nành.'}</p>
        <form class="vac-form" data-vac-form="stock_fish"><label>Cá giống<select name="fishId">${Object.entries(FISH).map(([id,row])=>`<option value="${id}">${row.name} · có ${this.count(row.fingerling)}</option>`).join('')}</select></label>
        <label>Số lượng<input name="quantity" type="number" min="1" max="6" value="1" required></label><button type="submit">Thả cá</button></form>
        <ul class="vac-list">${fish||'<li>Ao đang trống. Mua cá giống ở chợ rồi thả vào ao.</li>'}</ul>${this.recipeForm('pond')}`);
    }else{
      const chickens=coop.chickens.map(row=>`<li><b>Gà #${row.id}</b><small>${row.status==='GROWING'?`Còn ${Math.ceil(row.remainingMs/60000)} phút để trưởng thành`:row.status==='PRODUCING'?'Đang trong chu kỳ trứng':'Chờ thức ăn'} · trứng chờ: ${row.eggsReady}/${row.maxEggs}</small>
        ${row.status==='WAITING_FOR_FEED'?`<button data-vac-action="feed_chicken" data-entity-id="${row.id}">Cho gà ăn</button>`:''}</li>`).join('');
      this.openPanel(`<h2>Chuồng gà · ${coop.chickens.length}/${coop.capacity}</h2><p>Còn ${coop.capacity-coop.chickens.length} chỗ · gà con: ${this.count('chick')} · thức ăn gà: ${this.count('chicken_feed')}. Gà lớn kể cả khi bạn offline.</p>
        <form class="vac-form" data-vac-form="add_chicken"><label>Thêm gà con<input name="quantity" type="number" min="1" max="4" value="1" required></label><button type="submit">Thêm gà</button></form>
        <ul class="vac-list">${chickens||'<li>Chuồng đang trống. Mua gà con ở chợ để bắt đầu.</li>'}</ul><button data-vac-action="collect_eggs" ${coop.chickens.some(row=>row.eggsReady)?'':'disabled'}>Nhặt trứng (${coop.chickens.reduce((n,row)=>n+row.eggsReady,0)})</button>${this.recipeForm('coop')}`);
    }
  }
  recipeForm(kind){const recipes=Object.entries(VAC_RECIPES).filter(([,row])=>kind==='pond'?row.output==='fish_feed':row.output==='chicken_feed');
    return `<h3>Đổi nông sản thành thức ăn</h3><form class="vac-form" data-vac-form="convert"><label>Công thức<select name="recipeId">${recipes.map(([id,row])=>`<option value="${id}">${row.name} · có ${this.count(row.input)} · nhận ${row.yield} thức ăn</option>`).join('')}</select></label>
      <label>Số lượng<input name="quantity" type="number" min="1" max="99" value="1" required></label><button type="submit">Đổi thức ăn</button></form>`;
  }
  async act(intent,button){if(!this.state||button.disabled)return;
    const panelWasOpen=!document.getElementById('panel').classList.contains('hidden');
    const fingerprint=JSON.stringify({...intent,farmId:this.state.farmId});
    if(this.pending?.fingerprint!==fingerprint)this.pending={fingerprint,requestId:crypto.randomUUID()};
    button.disabled=true;const label=button.textContent;button.textContent='Đang xử lý…';
    try{const before=this.state,result=await this.api('/vac/action',{method:'POST',body:JSON.stringify({...intent,farmId:this.state.farmId,requestId:this.pending.requestId})});
      this.pending=null;this.setState(result.state);this.onSuccess(intent,result,before);this.flashUntil=performance.now()+600;
      try{await this.refreshInventory();}catch{}this.showNotice(result.message,intent.action);if(panelWasOpen)this.render();
    }catch(error){this.showError(error.message);}finally{button.disabled=false;button.textContent=label;}
  }
  draw(ctx){const t=document.body.classList.contains('low-effects')?0:performance.now()/1000;
    ctx.fillStyle='#927246';ctx.fillRect(1004,704,292,157);ctx.fillStyle='#467d81';ctx.fillRect(1015,715,270,135);
    for(let i=0;i<8;i++){const x=1040+(i*47)%225,y=735+(i*31)%105,r=4+(t*7+i*3)%16;
      ctx.strokeStyle='#a9d5be';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
    for(const [index,row] of (this.state?.pond.fish||[]).entries()){
      const x=1050+(index%3)*75+Math.sin(t*1.4+index)*12,y=748+Math.floor(index/3)*55+Math.cos(t+index)*8;
      ctx.fillStyle=FISH[row.fishId].color;ctx.beginPath();ctx.ellipse(x,y,14,7,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x-22,y-7);ctx.lineTo(x-22,y+7);ctx.fill();
    }
    ctx.fillStyle='#f0d69a';ctx.font='bold 18px system-ui';ctx.fillText('AO CÁ',1090,700);
    ctx.fillStyle='#b59a69';ctx.fillRect(1045,354,240,142);ctx.fillStyle='#78533b';ctx.fillRect(1055,395,220,89);
    ctx.fillStyle='#ad654a';ctx.beginPath();ctx.moveTo(1035,397);ctx.lineTo(1165,330);ctx.lineTo(1295,397);ctx.fill();
    ctx.strokeStyle='#e3c388';for(let x=1060;x<1280;x+=22){ctx.beginPath();ctx.moveTo(x,435);ctx.lineTo(x,495);ctx.stroke();}
    ctx.fillStyle='#7b5435';ctx.fillRect(1075,445,48,18);ctx.fillStyle='#ead09a';ctx.fillRect(1080,446,38,5);
    for(const [index,row] of (this.state?.coop.chickens||[]).entries()){
      const x=1140+(index%2)*80+Math.sin(t*1.2+index)*8,y=425+Math.floor(index/2)*35+Math.cos(t+index)*3;
      ctx.fillStyle=row.status==='GROWING'?'#f1d493':'#f2e0af';ctx.beginPath();ctx.arc(x,y,row.status==='GROWING'?8:12,0,7);ctx.fill();
      ctx.fillStyle='#cc6b42';ctx.fillRect(x+8,y-4,5,4);
      if(row.eggsReady){ctx.fillStyle='#fff0c9';ctx.beginPath();ctx.ellipse(x+18,y+12,5,7,0,0,7);ctx.fill();}
    }
    ctx.fillStyle='#f0d69a';ctx.fillText('CHUỒNG GÀ',1095,323);
    if(performance.now()<this.flashUntil){ctx.fillStyle='#fff5bd88';ctx.fillRect(this.current==='pond'?1015:1055,this.current==='pond'?715:395,this.current==='pond'?270:220,this.current==='pond'?135:89);}
  }
}
