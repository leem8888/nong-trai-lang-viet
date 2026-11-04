const steps = [
  ['Chào mừng về vườn', 'Đi bằng WASD, phím mũi tên hoặc nút tròn trên điện thoại. Hãy nhìn khu ruộng bên trái sân.'],
  ['Cuốc đất', 'Chọn Cuốc rồi chạm một ô ruộng. Ô sẽ đổi thành đất đã cuốc.'],
  ['Gieo hạt', 'Chọn Gieo, chọn hạt giống rồi chạm ô vừa cuốc. Nếu hết hạt, bấm Nhận hạt.'],
  ['Tưới và chờ lớn', 'Chọn Tưới rồi chạm ô đã gieo. Chạm ô ruộng để xem thời gian còn lại; cây lớn cả khi bạn rời game.'],
  ['Thu hoạch và đi chợ', 'Khi cây chín, chọn Gặt. Mở Túi đồ để xem thành quả; đi tới bảng Chợ Quê dưới sân để mua bán.']
];

export function createOnboarding(userId) {
  const key = `farm-tutorial-v1-${userId}`;
  const root = document.getElementById('onboarding');
  let index = 0;
  function show() {
    root.classList.remove('hidden');
    document.getElementById('onboardingStep').textContent = `${index + 1}/${steps.length}`;
    document.getElementById('onboardingTitle').textContent = steps[index][0];
    document.getElementById('onboardingText').textContent = steps[index][1];
    document.getElementById('onboardingNext').textContent = index === steps.length - 1 ? 'Hoàn tất' : 'Tiếp';
  }
  function close() { root.classList.add('hidden'); localStorage.setItem(key, 'done'); }
  document.getElementById('onboardingNext').onclick = () => { if (++index >= steps.length) close(); else show(); };
  document.getElementById('onboardingSkip').onclick = close;
  return { start(force = false) { index = 0; if (force || localStorage.getItem(key) !== 'done') show(); }, close };
}
