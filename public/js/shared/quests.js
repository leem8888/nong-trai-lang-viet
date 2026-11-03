export const QUESTS=Object.freeze([
  {id:'meet_tu',kind:'main',title:'Gặp Bác Tư',description:'Làm quen người nông dân cạnh ruộng.',event:'npc:tu',target:1,reward:15},
  {id:'first_harvest',kind:'main',title:'Vụ gặt đầu',description:'Thu hoạch một cây bất kỳ đã chín.',event:'harvest',target:1,reward:20},
  {id:'help_lan',kind:'main',title:'Giúp chợ làng',description:'Đem một nông sản bất kỳ giao cho Cô Lan ở chợ.',event:'deliver',target:1,reward:25},
  {id:'hear_ba',kind:'main',title:'Chuyện bên sân',description:'Trò chuyện với Ông Ba.',event:'npc:ba',target:1,reward:20},
  {id:'help_na',kind:'main',title:'Một ngày ở làng',description:'Gặp Bé Na và chia sẻ niềm vui.',event:'npc:na',target:1,reward:25},
  {id:'daily_harvest',kind:'side',title:'Giỏ rau hôm nay',description:'Thu hoạch hai lần trong ngày UTC.',event:'harvest',target:2,reward:12},
  {id:'daily_lan',kind:'side',title:'Chào cô Lan',description:'Ghé trò chuyện với Cô Lan một lần trong ngày UTC.',event:'npc:lan',target:1,reward:8}
]);
export const QUEST_BY_ID=Object.freeze(Object.fromEntries(QUESTS.map(q=>[q.id,q])));
