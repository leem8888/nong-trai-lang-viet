import { ITEMS } from './shared/crops.js';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export class MarketUI {
  constructor(api,openPanel,showError,showNotice,refreshFarming) {
    this.api=api;this.openPanel=openPanel;this.showError=showError;this.showNotice=showNotice;this.refreshFarming=refreshFarming;
    this.state=null;this.current=null;this.pending=null;
    document.getElementById('historyButton').onclick=()=>this.open('history');
    const panel=document.getElementById('panel');
    panel.addEventListener('submit',event=>{
      const form=event.target.closest('[data-market-form]');if(!form)return;
      event.preventDefault();const data=Object.fromEntries(new FormData(form));
      this.act({action:form.dataset.marketForm,itemId:data.itemId,quantity:Number(data.quantity),marketId:this.state.market.id},form.querySelector('button[type=submit]'));
    });
    panel.addEventListener('click',event=>{
      const button=event.target.closest('[data-order-action]');if(button)this.act({action:button.dataset.orderAction,orderId:button.dataset.orderId},button);
    });
    panel.addEventListener('input',event=>{
      const form=event.target.closest('[data-market-form]');if(form)this.updateTotal(form);
    });
  }
  setState(state){this.state=state;document.getElementById('balance').textContent=`${state.balance.toLocaleString('vi-VN')} Đồng Làng`;document.getElementById('marketBadge').textContent=`Chợ phiên · ${state.catalog.find(row=>row.featured)?.name||''} +15%`;}
  async open(kind){try{this.setState(await this.api('/market'));this.current=kind;this.render();}catch(error){this.showError(error.message);}}
  render(){
    if(!this.state)return;
    const state=this.state,fmt=n=>n.toLocaleString('vi-VN');
    if(this.current==='shop'||this.current==='buyer'){
      const buy=this.current==='shop',offers=state.catalog.filter(row=>buy?row.seedItem&&row.buyPrice:row.produceItem&&row.sellPrice).map(row=>({id:buy?row.seedItem:row.produceItem,name:row.name,price:buy?row.buyPrice:row.sellPrice,
        owned:state.inventory.find(item=>item.id===(buy?row.seedItem:row.produceItem))?.quantity||0}));
      const options=offers.map(row=>`<option value="${row.id}">${escapeHtml(row.name)} · ${fmt(row.price)} Đồng · đang có ${row.owned}</option>`).join('');
      this.openPanel(`<h2>${buy?'Cô Mai · giống và thức ăn':'Cô Lan · thu mua'}</h2><p>Ví: <b>${fmt(state.balance)} Đồng Làng</b></p>
        <form data-market-form="${buy?'buy':'sell'}"><label>${buy?'Mặt hàng':'Nông sản'}<select name="itemId">${options}</select></label>
        <label>Số lượng<input name="quantity" type="number" min="1" max="99" value="1" required></label><p class="market-total" role="status">Tổng: 0 Đồng</p><p class="market-guidance hint"></p>
        <button type="submit">${buy?'Mua hàng':'Bán nông sản'}</button></form><p class="hint">Giá được máy chủ xác nhận khi giao dịch.</p>`);
      this.updateTotal(document.querySelector('[data-market-form]'));return;
    }
    if(this.current==='orders'){
      const rows=state.orders.map(order=>{
        const needs=Object.entries(order.items).map(([id,quantity])=>{
          const name=state.catalog.find(row=>row.produceItem===id)?.name||id;
          return `${escapeHtml(name)} ${order.owned[id]}/${quantity}`;
        }).join(' · ');
        const action=order.status==='AVAILABLE'?`<button data-order-action="accept_order" data-order-id="${order.id}">Nhận đơn</button>`:
          order.status==='ACCEPTED'?`<button data-order-action="complete_order" data-order-id="${order.id}">Giao hàng</button>`:'<span>Đã hoàn thành</span>';
        return `<li><b>${escapeHtml(order.title)}</b> · ${escapeHtml(order.npc)}<small>${needs} · thưởng ${fmt(order.reward)} Đồng</small>${action}</li>`;
      }).join('');
      this.openPanel(`<h2>Bảng đơn hàng làng</h2><p>Mỗi đơn chỉ hoàn thành một lần. Hãy trồng đủ nông sản rồi quay lại giao.</p><ul class="order-list">${rows||'<li>Chưa có đơn hàng.</li>'}</ul>`);return;
    }
    const rows=state.history.map(entry=>`<li><b>${entry.delta>0?'+':''}${fmt(entry.delta)} Đồng</b> · ${escapeHtml(entry.kind)}
      ${entry.itemId?`· ${escapeHtml(entry.itemId)}`:''}${entry.quantity?` × ${entry.quantity}`:''}
      <small>${new Date(entry.createdAt).toLocaleString('vi-VN')} · số dư ${fmt(entry.balanceAfter)}</small></li>`).join('');
    this.openPanel(`<h2>Lịch sử Đồng Làng</h2><ul class="order-list">${rows||'<li>Chưa có giao dịch.</li>'}</ul>`);
  }
  updateTotal(form){if(!form||!this.state)return;const itemId=form.elements.itemId.value,quantity=Number(form.elements.quantity.value);
    const offer=this.state.catalog.find(row=>row.seedItem===itemId||row.produceItem===itemId);
    const price=form.dataset.marketForm==='buy'?offer?.buyPrice:offer?.sellPrice;
    const total=Number.isSafeInteger(quantity)&&quantity>0&&price?price*quantity:0;
    form.querySelector('.market-total').textContent=`${form.dataset.marketForm==='buy'?'Cần trả':'Sẽ nhận'}: ${total.toLocaleString('vi-VN')} Đồng Làng`;
    const owned=this.state.inventory.find(item=>item.id===itemId)?.quantity||0;
    const buying=form.dataset.marketForm==='buy';
    const guidance=form.querySelector('.market-guidance');
    const free=Math.max(0,(ITEMS[itemId]?.stackLimit||999)-owned);
    guidance.textContent=!total?'Chọn số lượng từ 1 đến 99.':buying&&quantity>free?`Túi chỉ còn ${free} chỗ cho mặt hàng này. Hãy giảm số lượng.`:buying&&total>this.state.balance?'Không đủ Đồng Làng. Giảm số lượng hoặc bán nông sản trước.':!buying&&quantity>owned?'Túi đồ chưa đủ hàng. Hãy thu hoạch hoặc giảm số lượng.':buying?`Đang có ${owned} · còn ${free-quantity} chỗ · còn ${this.state.balance-total} Đồng Làng sau khi mua.`:`Đang có ${owned} · còn ${owned-quantity} sau khi bán.`;
  }
  async act(intent,button){
    if(!this.state||button.disabled)return;
    const fingerprint=JSON.stringify({...intent,farmId:this.state.farmId});
    if(this.pending?.fingerprint!==fingerprint)this.pending={fingerprint,requestId:crypto.randomUUID()};
    button.disabled=true;const label=button.textContent;button.textContent='Đang xử lý…';
    try {
      const result=await this.api('/market/action',{method:'POST',body:JSON.stringify({...intent,farmId:this.state.farmId,requestId:this.pending.requestId})});
      this.pending=null;this.setState(result.state);try{await this.refreshFarming();}catch{}this.showNotice(result.message,intent.action);this.render();
    } catch(error){this.showError(error.message);} finally {button.disabled=false;button.textContent=label;}
  }
}
