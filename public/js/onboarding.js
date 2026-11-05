const STEPS = [
  ['Cuốc luống rau đầu tiên','Chạm ô được đánh dấu, chọn Cuốc đất. Bạn cũng có thể dùng nút Đi tới.'],
  ['Gieo rau cải','Chọn hạt Rau cải rồi gieo vào ô đã cuốc. Vụ rau hướng dẫn đầu tiên chỉ mất 45 giây.'],
  ['Tưới luống rau','Chạm cây vừa gieo và chọn Tưới để giảm thời gian chờ.'],
  ['Thu hoạch rau đầu tiên','Trong lúc chờ, mở Túi đồ để xem hạt còn lại. Khi rau chín, chạm ô và chọn Thu hoạch.'],
  ['Bán rau ở chợ','Ra cổng Chợ quê, tới quầy thu mua và bán Rau cải. Số dư sẽ tăng khi giao dịch thành công.'],
  ['Mua hạt cho vụ tiếp','Tới quầy hạt, chọn một gói hạt giống và mua 1. Nếu hết tiền, bán nông sản đang có.'],
  ['Về farm gieo vụ thường','Về farm, cuốc ô nếu cần rồi gieo hạt. Vụ thường có thời gian riêng và vẫn lớn khi bạn offline.'],
  ['Bạn đã sẵn sàng!','Tiếp theo: tiết kiệm mở ô ruộng đầu tiên (100 Đồng), hoặc mua cá giống tại chợ để bắt đầu nuôi cá.']
];
export function createOnboarding({api,aim,target,error,enabled=()=>true}) {
  const root=document.getElementById('onboarding'),button=document.getElementById('onboardingNext');
  let state=null,visible=false,replay=false,busy=false,polling=false,completedShown=false;
  function render(){
    root.classList.toggle('hidden',!visible||!enabled());if(!state)return;
    const index=replay?7:state.step,[title,text]=STEPS[index]||STEPS[7];
    document.getElementById('onboardingStep').textContent=index<7?`${index+1}/7`:'Hoàn tất';
    document.getElementById('onboardingTitle').textContent=title;
    let detail=text;
    if(index===3&&state.crop){const remaining=Math.max(0,Math.ceil((state.crop.readyAt-state.serverTime)/1000));detail=remaining?`Rau còn khoảng ${remaining} giây. Mở Túi đồ xem hạt trong lúc chờ.`:'Rau đã chín! Chạm ô được đánh dấu rồi chọn Thu hoạch.';}
    if(index===7&&!state.eligible)detail='Farm hiện có giữ nguyên tiến độ. Chạm ô đất → Cuốc → Gieo → Tưới → Thu hoạch; ra chợ bán nông sản và mua hạt. Cây lớn cả khi offline.';
    document.getElementById('onboardingText').textContent=detail;
    button.textContent=index===7?'Đóng':busy?'Đang đi…':'Đi tới';button.disabled=busy;
    document.getElementById('onboardingSkip').textContent=index===7?'Đóng':'Bỏ qua';
  }
  async function refresh(){if(polling)return;polling=true;try{state=await api('/onboarding');if(state.status==='SKIPPED'&&!replay)visible=false;if(state.status==='DONE'&&!completedShown){visible=true;completedShown=true;}render();}catch{}finally{polling=false;}}
  async function close(){try{if(!replay&&state?.status==='ACTIVE')await api('/onboarding/skip',{method:'POST',body:'{}'});visible=false;render();}catch(e){error(e.message);}}
  button.onclick=async()=>{if(replay||state?.step===7)return close();busy=true;render();try{await refresh();await aim(state);}catch(e){error(e.message);}finally{busy=false;await refresh();}};
  document.getElementById('onboardingSkip').onclick=close;
  return {
    async start(force=false){await refresh();replay=force&&state?.status!=='ACTIVE';visible=force||state?.status==='ACTIVE';render();},
    refresh,close,
    draw(ctx){if(!visible||replay||!state||!enabled())return;const p=target(state);if(!p)return;ctx.save();ctx.strokeStyle='#fff0a0';ctx.lineWidth=4;ctx.setLineDash([7,4]);ctx.beginPath();ctx.ellipse(p.x,p.y,30,30,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff0a0';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText('↓',p.x,p.y-38);ctx.restore();}
  };
}
