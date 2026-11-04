import { ITEMS } from './shared/crops.js';
import {itemArtwork} from './itemArtwork.js';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export class MarketUI {
  constructor(api,openPanel,showError,showNotice,refreshFarming) {
    this.api=api;this.openPanel=openPanel;this.showError=showError;this.showNotice=showNotice;this.refreshFarming=refreshFarming;
    this.state=null;this.current=null;this.pending=null;this.selected=null;
    document.getElementById('historyButton').onclick=()=>this.open('history');
    const panel=document.getElementById('panel');
    panel.addEventListener('submit',event=>{
      const form=event.target.closest('[data-market-form]');if(!form)return;
      event.preventDefault();const data=Object.fromEntries(new FormData(form));
      this.act({action:form.dataset.marketForm,itemId:data.itemId,quantity:Number(data.quantity),marketId:this.state.market.id},form.querySelector('button[type=submit]'));
    });
    panel.addEventListener('click',event=>{
      const button=event.target.closest('[data-order-action]');if(button)this.act({action:button.dataset.orderAction,orderId:button.dataset.orderId},button);
      const product=event.target.closest('[data-market-product]');if(product){this.selected=product.dataset.marketProduct;this.render();}
      if(event.target.closest('[data-trade-back]')){const id=this.selected;this.selected=null;this.render();document.querySelector(`[data-market-product="${id}"]`)?.focus();}
      if(event.target.closest('[data-trade-max]')){const form=panel.querySelector('[data-market-form]');form.elements.quantity.value=this.limit(form.elements.itemId.value);this.updateTotal(form);}
    });
    panel.addEventListener('input',event=>{
      const form=event.target.closest('[data-market-form]');if(form)this.updateTotal(form);
    });
    window.addEventListener('keydown',event=>{
      if(!this.selected||panel.classList.contains('hidden'))return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();this.selected=null;this.render();}
      if(event.key==='Tab'){const nodes=[...panel.querySelectorAll('.trade-dialog button:not(:disabled),.trade-dialog input:not([type=hidden])')];if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    },{capture:true});
  }
  setState(state){this.state=state;document.getElementById('balance').textContent=`${state.balance.toLocaleString('vi-VN')} Đồng Làng`;document.getElementById('marketBadge').textContent=`Chợ phiên · ${state.catalog.find(row=>row.featured)?.name||''} +15%`;}
  async open(kind){try{this.setState(await this.api('/market'));this.current=kind;this.selected=null;this.render();}catch(error){this.showError(error.message);}}
  offers(){const buy=this.current==='shop';return this.state.catalog.filter(row=>buy?row.seedItem&&row.buyPrice:row.produceItem&&row.sellPrice).map(row=>({id:buy?row.seedItem:row.produceItem,name:buy&&row.cropId?`Hạt giống ${row.name.toLowerCase()}`:row.name,price:buy?row.buyPrice:row.sellPrice,owned:this.state.inventory.find(item=>item.id===(buy?row.seedItem:row.produceItem))?.quantity||0}));}
  limit(id){const item=this.offers().find(o=>o.id===id);if(!item)return 0;return this.current==='shop'?Math.max(0,Math.min(999,(ITEMS[id]?.stackLimit||999)-item.owned,Math.floor(this.state.balance/item.price))):Math.min(999,item.owned);}
  render(){
    if(!this.state)return;
    const state=this.state,fmt=n=>n.toLocaleString('vi-VN');
    if(this.current==='shop'||this.current==='buyer'){
      const buy=this.current==='shop',offers=this.offers().filter(o=>buy||o.owned>0),selected=offers.find(o=>o.id===this.selected);
      const cards=offers.map(o=>`<button class="product-card" data-market-product="${o.id}" aria-label="${buy?'Mua':'Bán'} ${escapeHtml(o.name)}">${itemArtwork(o.id,o.name)}<strong>${escapeHtml(o.name)}</strong><span>${fmt(o.price)} Đồng / món</span><small>Đang có: ${fmt(o.owned)}</small></button>`).join('');
      const detail=selected?`<div class="trade-shade"><section class="trade-dialog" role="dialog" aria-modal="true" aria-labelledby="tradeTitle"><button class="trade-back" data-trade-back type="button" aria-label="Quay lại danh sách">← Quay lại</button>${itemArtwork(selected.id,selected.name)}<h3 id="tradeTitle">${buy?'Mua':'Bán'} ${escapeHtml(selected.name)}</h3><p>${fmt(selected.price)} Đồng / món · đang có ${fmt(selected.owned)}</p><form data-market-form="${buy?'buy':'sell'}"><input type="hidden" name="itemId" value="${selected.id}"><label>Số lượng (1–999)<input name="quantity" type="number" inputmode="numeric" min="1" max="999" step="1" value="1" required></label><button type="button" data-trade-max>Tối đa có thể ${buy?'mua':'bán'}</button><p class="market-total" role="status"></p><p class="market-guidance hint"></p><p class="trade-error" role="alert"></p><button type="submit">${buy?'Xác nhận mua':'Xác nhận bán'}</button></form></section></div>`:'';
      this.openPanel(`<div class="market-catalog" ${selected?'inert aria-hidden="true"':''}><h2>${buy?'Cửa hàng làng · Mua vật phẩm':'Kho nông sản · Bán hàng'}</h2><p>Ví: <b>${fmt(state.balance)} Đồng Làng</b></p><p class="hint">${buy?'Chọn một mặt hàng để xem giá và nhập số lượng.':'Chọn nông sản trong kho để bán cho Cô Lan. Hạt giống, thức ăn và đồ trang trí không nằm trong kho nông sản.'}</p><div class="product-grid">${cards||'<p class="empty-stock">Kho nông sản đang trống. Hãy thu hoạch cây, cá, trứng hoặc chế biến rồi quay lại.</p>'}</div></div>${detail}`);
      if(selected){const form=document.querySelector('[data-market-form]');this.updateTotal(form);requestAnimationFrame(()=>{form.elements.quantity.focus();form.elements.quantity.select();});}return;
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
    const valid=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=999;
    const total=valid&&price?price*quantity:0;
    form.querySelector('.market-total').textContent=`${form.dataset.marketForm==='buy'?'Cần trả':'Sẽ nhận'}: ${total.toLocaleString('vi-VN')} Đồng Làng`;
    const owned=this.state.inventory.find(item=>item.id===itemId)?.quantity||0;
    const buying=form.dataset.marketForm==='buy';
    const guidance=form.querySelector('.market-guidance');
    const free=Math.max(0,(ITEMS[itemId]?.stackLimit||999)-owned);
    guidance.textContent=!valid?'Nhập số nguyên từ 1 đến 999.':buying&&quantity>free?`Túi chỉ còn ${free} chỗ cho mặt hàng này. Hãy giảm số lượng.`:buying&&total>this.state.balance?'Không đủ Đồng Làng. Giảm số lượng hoặc bán nông sản trước.':!buying&&quantity>owned?'Túi đồ chưa đủ hàng. Hãy thu hoạch hoặc giảm số lượng.':buying?`Đang có ${owned} · còn ${free-quantity} chỗ · còn ${this.state.balance-total} Đồng Làng sau khi mua.`:`Đang có ${owned} · còn ${owned-quantity} sau khi bán.`;
    form.querySelector('[type=submit]').disabled=!valid||quantity>this.limit(itemId)||!!this.busy;
  }
  async act(intent,button){
    if(!this.state||button.disabled||this.busy)return;
    const fingerprint=JSON.stringify({...intent,farmId:this.state.farmId});
    if(this.pending?.fingerprint!==fingerprint)this.pending={fingerprint,requestId:crypto.randomUUID()};
    this.busy=true;button.disabled=true;const label=button.textContent;button.textContent='Đang xử lý…';
    try {
      const result=await this.api('/market/action',{method:'POST',body:JSON.stringify({...intent,farmId:this.state.farmId,requestId:this.pending.requestId})});
      this.pending=null;this.selected=null;this.setState(result.state);try{await this.refreshFarming();}catch{}this.showNotice(result.message,intent.action);this.render();
    } catch(error){const inline=document.querySelector('.trade-error');if(inline)inline.textContent=error.message;else this.showError(error.message);} finally {this.busy=false;button.disabled=false;button.textContent=label;const form=document.querySelector('[data-market-form]');if(form)this.updateTotal(form);}
  }
}
