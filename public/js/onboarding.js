const steps = [
  ['Chào mừng về vườn', 'Đi bằng WASD, phím mũi tên hoặc nút tròn trên điện thoại. Hãy nhìn khu ruộng bên trái sân.'],
  ['Cuốc đất', 'Chạm ô đất trống, chọn Cuốc đất. Chạm thêm một ô để làm ngay, hoặc giữ và kéo qua nhiều ô.'],
  ['Gieo hạt', 'Chạm ô đã cuốc, chọn loại hạt rồi chọn Gieo hạt. Mở ☰ Nông trại để nhận hạt khi hết.'],
  ['Tưới và chờ lớn', 'Chạm ô đã gieo để chọn Tưới và xem thời gian còn lại. Cây lớn cả khi bạn rời game.'],
  ['Thu hoạch và đi chợ', 'Khi cây chín, chạm ô và chọn Thu hoạch. Mở ☰ Nông trại để xem Túi đồ; đi tới Chợ Quê dưới sân để mua bán.']
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
