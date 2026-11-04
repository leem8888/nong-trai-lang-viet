export const LIFE_IDS=['banyan','well','bamboo','shade','flame','cottage','pavilion','ducks','pets'];
export function drawLife(ctx,x,y,id,w,h,art,upright){const index=LIFE_IDS.indexOf(id);if(index<0)return;upright(ctx,x,y,art.villageLife,w,h,[index*384,0,384,384]);}
export function villageScenery(scene,art,upright,reduced,placed=[]){
  const layers=[],t=reduced?0:performance.now()/2000;
  const add=(x,y,id,w,h,sway=0)=>{
    if(placed.some(r=>x>r.x-65&&x<r.x+r.w+65&&y>r.y-65&&y<r.y+r.h+65))return;
    layers.push({y:x+y,draw:ctx=>drawLife(ctx,x+Math.sin(t+x)*sway,y,id,w,h,art,upright)});
  };
  if(scene==='farm'){
    for(const [x,y,id,w,h] of [[180,180,'bamboo',170,220],[355,160,'flame',210,210],[1240,175,'shade',245,245],[180,440,'bamboo',125,175],[1330,570,'shade',185,185],[560,910,'flame',140,145]])add(x,y,id,w,h,1);
    for(const [x,y] of [[260,-150],[1020,-170],[-160,380],[1620,550],[1560,1190],[650,1290],[-120,1110]])add(x,y,'cottage',340,260);
    add(-180,820,'bamboo',190,240);add(1750,1050,'shade',240,240);
  }else{
    add(1450,400,'banyan',380,340);add(1180,930,'well',175,185);add(1670,1060,'pavilion',350,245);
    for(const [x,y] of [[355,1140],[815,1280],[1685,1360]])add(x,y,'cottage',330,245);
    for(const [x,y,id,w,h] of [[100,170,'shade',220,220],[1070,160,'bamboo',190,230],[105,700,'flame',190,190],[1060,690,'shade',180,180],[1750,300,'bamboo',200,255],[1820,800,'flame',230,230],[950,1020,'shade',170,170],[540,1350,'bamboo',150,205],[1780,1160,'shade',180,180],[1250,1300,'flame',200,195],[270,850,'bamboo',145,195]])add(x,y,id,w,h,1);
    for(const [x,y] of [[390,-170],[1280,-180],[-150,690],[2210,610],[1020,1740],[2170,1430]])add(x,y,'cottage',340,255);
    add(1260+Math.sin(t*.6)*10,1020+Math.cos(t*.6)*6,'ducks',78,65);
    add(560+Math.sin(t*.35)*5,1110,'pets',62,62);
  }
  return layers;
}
