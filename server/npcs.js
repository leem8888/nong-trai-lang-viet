import {NPCS,NPC_IDS} from '../public/js/shared/npcs.js';
import {validPosition} from './world.js';

export function npcPosition(db,farmId,id,context){
  const n=NPCS[id];if(!n)throw Error('Người làng không tồn tại.');
  const points=[n.waypoints[context.timeOfDay],n.fallback];
  for(const [x,y] of points)if(validPosition(x,y,n.scene,db,farmId))return {x,y};
  throw Error('Không có chỗ đứng an toàn cho người làng.');
}
export function npcState(db,farmId,context){return NPC_IDS.map(id=>({id,name:NPCS[id].name,role:NPCS[id].role,scene:NPCS[id].scene,color:NPCS[id].color,icon:NPCS[id].icon,...npcPosition(db,farmId,id,context)}));}
export function npcDialogue(id,questStatus,season){
  const n=NPCS[id];if(!n)throw Error('Người làng không tồn tại.');
  const seasonLine={spring:'Xuân này lúa xanh đẹp quá.',summer:'Hạ về, nhớ nghỉ dưới bóng tre.',autumn:'Thu vàng, cả làng cùng vui mùa gặt.',winter:'Đông se lạnh, bếp quê thêm ấm.'}[season];
  const lines={
    tu:{intro:'Chào cháu! Ta là Bác Tư. Ghé thăm ruộng rồi thử gặt một vụ nhé.',active:'Cháu thử thu hoạch một cây đã chín. Lúa hay rau đều được.',done:'Vụ gặt đầu tiên tốt lắm! Cứ giữ nhịp làm vườn của mình.'},
    lan:{intro:'Cô Lan thu mua nông sản ở chợ. Cứ mang hàng đến nhé.',active:'Cô đang chờ một phần nông sản cho bữa cơm làng.',done:'Cảm ơn cháu đã giúp chợ làng thêm đủ đầy.'},
    ba:{intro:'Ông Ba thích kể chuyện bên sân gạch. Khi rảnh ghé ông nhé.',active:'Chuyện làng bắt đầu từ những người chịu giúp nhau.',done:'Cháu đã thành người quen của xóm rồi đấy.'},
    na:{intro:'Em là Na! Em thích nhìn nông trại thay đổi mỗi ngày.',active:'Giúp em kể cho làng nghe một điều vui hôm nay nhé!',done:'Cảm ơn anh chị! Ngày mai em lại ghé chơi.'}
  };
  return {name:n.name,text:`${lines[id][questStatus]} ${seasonLine}`,branch:questStatus};
}
