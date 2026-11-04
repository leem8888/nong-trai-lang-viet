export const FARM_GATE = Object.freeze({ x: 720, y: 855 });
export const MARKET_POINTS = Object.freeze({
  seedShop: { x: 300, y: 380, label: 'Cô Mai · cửa hàng hạt' },
  buyer: { x: 600, y: 380, label: 'Cô Lan · thu mua' },
  orderBoard: { x: 900, y: 380, label: 'Bảng đơn làng' },
  returnGate: { x: 600, y: 690, label: 'Về nông trại' }
});
export const MARKET_WORLD = Object.freeze({
  width: 2000, height: 1500,
  margin: { left: 0, right: 0, top: 0, bottom: 0 },
  obstacles: [
    { x: 55, y: 65, w: 1890, h: 15 }, { x: 55, y: 1445, w: 1890, h: 15 },
    { x: 55, y: 65, w: 15, h: 1395 }, { x: 1930, y: 65, w: 15, h: 1395 },
    { x: 180, y: 225, w: 240, h: 115 }, { x: 480, y: 225, w: 240, h: 115 },
    { x: 780, y: 225, w: 240, h: 115 },
    { x: 95, y: 450, w: 45, h: 35 }, { x: 1060, y: 455, w: 45, h: 35 },
    { x: 1380, y: 320, w: 140, h: 90 },
    { x: 1135, y: 860, w: 90, h: 80 },
    { x: 1530, y: 930, w: 280, h: 130 },
    { x: 230, y: 1010, w: 250, h: 130 }, { x: 690, y: 1150, w: 250, h: 130 },
    { x: 1560, y: 1230, w: 250, h: 130 }
  ]
});
export const VILLAGE_PLACES=Object.freeze({
  market:{x:600,y:480,label:'Chợ quê'},banyan:{x:1450,y:510,label:'Sân cây đa'},
  well:{x:1180,y:1010,label:'Giếng làng'},pavilion:{x:1640,y:1140,label:'Đình làng'},
  homes:{x:600,y:1110,label:'Xóm nhỏ'}
});
