export const FARM_GATE = Object.freeze({ x: 720, y: 855 });
export const MARKET_POINTS = Object.freeze({
  seedShop: { x: 300, y: 380, label: 'Cô Mai · cửa hàng hạt' },
  buyer: { x: 600, y: 380, label: 'Cô Lan · thu mua' },
  orderBoard: { x: 900, y: 380, label: 'Bảng đơn làng' },
  returnGate: { x: 600, y: 690, label: 'Về nông trại' }
});
export const MARKET_WORLD = Object.freeze({
  width: 1200, height: 800,
  margin: { left: 0, right: 0, top: 0, bottom: 0 },
  obstacles: [
    { x: 55, y: 65, w: 1090, h: 15 }, { x: 55, y: 745, w: 1090, h: 15 },
    { x: 55, y: 65, w: 15, h: 695 }, { x: 1130, y: 65, w: 15, h: 695 },
    { x: 180, y: 225, w: 240, h: 115 }, { x: 480, y: 225, w: 240, h: 115 },
    { x: 780, y: 225, w: 240, h: 115 },
    { x: 95, y: 450, w: 45, h: 35 }, { x: 1060, y: 455, w: 45, h: 35 }
  ]
});
