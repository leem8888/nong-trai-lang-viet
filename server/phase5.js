import { createHash } from 'node:crypto';
import { RECIPES, BUILDINGS, DECORATIONS, EXPANSIONS, TILE_SIZE, footprint, unlockedTile } from '../public/js/shared/phase5.js';
import { inventory, addItem, spendItem } from './crops.js';
import { balance, debit } from './economy.js';
import { world, validPosition } from './world.js';
import {livingLayout} from '../public/js/shared/livingLayout.js';

const reqId=/^[a-f0-9-]{36}$/;
const exact={start:['action','farmId','requestId','buildingId','recipeId','quantity'],claim:['action','farmId','requestId','jobId'],place_building:['action','farmId','requestId','definitionId','x','y','rotation'],move_building:['action','farmId','requestId','id','x','y','rotation'],store_building:['action','farmId','requestId','id'],place_decoration:['action','farmId','requestId','definitionId','x','y','rotation'],move_decoration:['action','farmId','requestId','id','x','y','rotation'],store_decoration:['action','farmId','requestId','id'],unlock:['action','farmId','requestId','level']};
function validate(p){
  if(!p||typeof p!=='object'||Array.isArray(p)||!exact[p.action]||!reqId.test(p.requestId||'')||Object.keys(p).length!==exact[p.action].length||exact[p.action].some(k=>!Object.hasOwn(p,k)))throw Error('Yêu cầu không hợp lệ.');
  return createHash('sha256').update(JSON.stringify(exact[p.action].filter(k=>k!=='requestId').map(k=>p[k]))).digest('hex');
}
function farmOf(db,userId){return db.prepare('SELECT id FROM farms WHERE owner_id=?').get(userId)?.id;}
function playerOf(db,userId,farmId){return db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farmId);}
function requireFarm(player){if(!player||player.scene!=='farm')throw Error('Hãy về nông trại.');}
function near(player,x,y,max=180){requireFarm(player);if(Math.hypot(player.x-x,player.y-y)>max)throw Error('Hãy đến gần vị trí thao tác.');}
function placed(db,farmId){return {buildings:db.prepare('SELECT id,definition_id AS definitionId,tile_x AS x,tile_y AS y,rotation,created_at AS createdAt FROM farm_buildings WHERE farm_id=?').all(farmId),decorations:db.prepare('SELECT id,definition_id AS definitionId,tile_x AS x,tile_y AS y,rotation,created_at AS createdAt FROM farm_decorations WHERE farm_id=?').all(farmId)};}
function jobView(row,at){const ready=row.status==='PROCESSING'&&at>=row.started_at+row.duration_ms;return {...row,status:ready?'READY':row.status,remainingMs:ready?0:Math.max(0,row.started_at+row.duration_ms-at)};}
export function phase5State(db,userId,at=Date.now()){
  const farmId=farmOf(db,userId);if(!farmId)return null;
  const objects=placed(db,farmId);
  return {farmId,serverTime:at,level:db.prepare('SELECT level FROM farm_expansions WHERE farm_id=?').get(farmId)?.level||0,balance:balance(db,userId),inventory:inventory(db,farmId),...objects,
    jobs:db.prepare(`SELECT id,building_id AS buildingId,recipe_id AS recipeId,recipe_version AS recipeVersion,output_item AS outputItem,output_quantity AS outputQuantity,quantity,started_at AS startedAt,duration_ms AS durationMs,status FROM crafting_jobs WHERE farm_id=? AND status!='CLAIMED' ORDER BY id DESC LIMIT 100`).all(farmId).map(j=>({ ...j,status:j.status==='PROCESSING'&&at>=j.startedAt+j.durationMs?'READY':j.status,remainingMs:Math.max(0,j.startedAt+j.durationMs-at)})),
    recipes:RECIPES,buildingCatalog:BUILDINGS,decorationCatalog:DECORATIONS,expansions:EXPANSIONS};
}
function rect(x,y,w,h){return {x:x*TILE_SIZE,y:y*TILE_SIZE,w:w*TILE_SIZE,h:h*TILE_SIZE};}
function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function solidObjects(db,farmId,skipType,skipId){const o=placed(db,farmId);return [...o.buildings.filter(v=>skipType!=='building'||v.id!==skipId).map(v=>{const d=footprint(BUILDINGS[v.definitionId],v.rotation);return rect(v.x,v.y,d.w,d.h)}),...o.decorations.filter(v=>(skipType!=='decoration'||v.id!==skipId)&&DECORATIONS[v.definitionId]?.blocking).map(v=>rect(v.x,v.y,1,1))];}
function routeOpen(solids){
  const key=(x,y)=>`${x}:${y}`,targets=[[15,17],[7,14],[20,16],[21,8]],start=[15,13],seen=new Set([key(...start)]),queue=[start];
  const free=(x,y)=>x>=1&&x<=28&&y>=2&&y<=19&&validPosition((x+.5)*TILE_SIZE,(y+.5)*TILE_SIZE)&&!solids.some(r=>overlaps(rect(x,y,1,1),r));
  if(!free(...start))return false;
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=key(a,b);if(!seen.has(k)&&free(a,b)){seen.add(k);queue.push([a,b]);}}}
  return targets.every(p=>seen.has(key(...p)));
}
function validPlace(db,farmId,definitionId,x,y,rotation,kind,skipType,skipId){
  const def=(kind==='building'?BUILDINGS:DECORATIONS)[definitionId];
  if(!def||!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(rotation)||rotation<0||rotation>3)throw Error('Vật thể hoặc vị trí không hợp lệ.');
  const size=footprint(def,rotation),area=rect(x,y,size.w,size.h),level=db.prepare('SELECT level FROM farm_expansions WHERE farm_id=?').get(farmId).level;
  for(let dx=0;dx<size.w;dx++)for(let dy=0;dy<size.h;dy++)if(!unlockedTile(x+dx,y+dy,level))throw Error('Khu đất chưa mở khóa.');
  // A central 3-tile route keeps the house, entrance and market gate reachable.
  const route=rect(14,10,4,9),field=rect(2,15,9,4);
  if(overlaps(area,route)||overlaps(area,field))throw Error('Vị trí chặn lối đi hoặc ruộng.');
  for(const obstacle of world.obstacles)if(overlaps(area,obstacle))throw Error('Vị trí có vật cản.');
  // A new placement may occupy only the pond/yard extension. Recompute the
  // layout with that placement so old buildable tiles retain their use.
  const objects=placed(db,farmId);
  const proposed={definitionId,x,y,rotation};
  const buildings=objects.buildings.filter(v=>skipType!=='building'||v.id!==skipId);
  const decorations=objects.decorations.filter(v=>skipType!=='decoration'||v.id!==skipId);
  (kind==='building'?buildings:decorations).push(proposed);
  const layout=livingLayout(buildings,decorations);
  if(overlaps(area,layout.pond)||layout.yard&&overlaps(area,layout.yard))throw Error('Vị trí dành cho ao cá hoặc sân gà.');
  const solids=solidObjects(db,farmId,skipType,skipId);
  for(const other of solids)if(overlaps(area,other))throw Error('Vị trí đã có vật thể.');
  if(kind==='building')for(const o of placed(db,farmId).decorations)if(overlaps(area,rect(o.x,o.y,1,1)))throw Error('Vị trí đã có vật trang trí.');
  for(const p of db.prepare("SELECT x,y FROM player_states WHERE farm_id=? AND scene='farm'").all(farmId))if(p.x>=area.x-14&&p.x<=area.x+area.w+14&&p.y>=area.y-14&&p.y<=area.y+area.h+14)throw Error('Người chơi đang đứng trên vị trí này.');
  // Non-blocking paths/flowers may share walkable tiles but not another decoration's tile.
  if(kind==='decoration')for(const o of placed(db,farmId).decorations)if(o.id!==skipId&&o.x===x&&o.y===y)throw Error('Ô đã có vật trang trí.');
  if((kind==='building'||def.blocking)&&!routeOpen([...solids,area]))throw Error('Vị trí chặn đường đi thiết yếu.');
  return area;
}
function target(db,table,farmId,id){if(!Number.isSafeInteger(id)||id<1)throw Error('ID không hợp lệ.');const o=db.prepare(`SELECT * FROM ${table} WHERE id=? AND farm_id=?`).get(id,farmId);if(!o)throw Error('Vật thể không tồn tại.');return o;}
function ledger(db,userId,farmId,amount,kind,itemId,requestId,at){db.prepare(`INSERT INTO economy_transactions(user_id,farm_id,kind,item_id,quantity,unit_price,delta,balance_after,request_key,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(userId,farmId,kind,itemId,1,amount,-amount,balance(db,userId),requestId,at);}
export function performPhase5Action(db,userId,p,at=Date.now()){
  const hash=validate(p),farmId=farmOf(db,userId);if(!farmId||p.farmId!==farmId)throw Error('Không có quyền với nông trại này.');
  return db.transaction(()=>{
    const old=db.prepare('SELECT * FROM phase5_receipts WHERE user_id=? AND request_key=?').get(userId,p.requestId);
    if(old){if(old.payload_hash!==hash||old.action!==p.action)throw Error('Mã yêu cầu đã dùng cho thao tác khác.');return {...JSON.parse(old.response_json),replayed:true,state:phase5State(db,userId,at)};}
    const player=playerOf(db,userId,farmId);requireFarm(player);let message='';
    if(p.action==='start'){
      const b=target(db,'farm_buildings',farmId,p.buildingId),recipe=RECIPES[p.recipeId];
      if(!recipe||recipe.building!==b.definition_id||!Number.isInteger(p.quantity)||p.quantity<1||p.quantity>20)throw Error('Công thức hoặc số lượng không hợp lệ.');
      if(db.prepare('SELECT level FROM farm_expansions WHERE farm_id=?').get(farmId).level<recipe.unlockLevel)throw Error('Công thức chưa mở khóa.');
      near(player,(b.tile_x+1)*TILE_SIZE,(b.tile_y+1)*TILE_SIZE,145);
      const used=db.prepare(`SELECT COUNT(*) AS n FROM crafting_jobs WHERE building_id=? AND status!='CLAIMED'`).get(b.id).n;
      if(used>=BUILDINGS[b.definition_id].slots)throw Error('Công trình đã đầy hàng đợi.');
      for(const [id,n] of Object.entries(recipe.ingredients))spendItem(db,farmId,id,n*p.quantity);
      db.prepare(`INSERT INTO crafting_jobs(farm_id,building_id,recipe_id,recipe_version,output_item,output_quantity,quantity,started_at,duration_ms,status) VALUES (?,?,?,?,?,?,?,?,?,'PROCESSING')`).run(farmId,b.id,p.recipeId,recipe.version,recipe.output,recipe.yield*p.quantity,p.quantity,at,recipe.durationMs*p.quantity);
      message=`Đã bắt đầu ${recipe.name}.`;
    }else if(p.action==='claim'){
      const j=target(db,'crafting_jobs',farmId,p.jobId),b=target(db,'farm_buildings',farmId,j.building_id);
      near(player,(b.tile_x+1)*TILE_SIZE,(b.tile_y+1)*TILE_SIZE,145);
      if(j.status==='CLAIMED')throw Error('Đã nhận thành phẩm.');
      if(at<j.started_at+j.duration_ms)throw Error('Chưa chế biến xong.');
      addItem(db,farmId,j.output_item,j.output_quantity);
      db.prepare(`UPDATE crafting_jobs SET status='CLAIMED',claimed_at=? WHERE id=?`).run(at,j.id);
      message=`Đã nhận ${j.output_quantity} ${j.output_item}.`;
    }else if(p.action==='place_building'||p.action==='place_decoration'){
      const building=p.action==='place_building',def=(building?BUILDINGS:DECORATIONS)[p.definitionId];if(!def)throw Error('Vật thể không hợp lệ.');
      const area=validPlace(db,farmId,p.definitionId,p.x,p.y,p.rotation,building?'building':'decoration');near(player,area.x+area.w/2,area.y+area.h/2);
      if(building){if(db.prepare('SELECT quantity FROM inventory_items WHERE farm_id=? AND item_id=?').get(farmId,`building_${p.definitionId}`)?.quantity>0)spendItem(db,farmId,`building_${p.definitionId}`,1);else{debit(db,userId,def.cost,at);ledger(db,userId,farmId,def.cost,'buy',p.definitionId,p.requestId,at);}
        db.prepare('INSERT INTO farm_buildings(farm_id,definition_id,tile_x,tile_y,rotation,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(farmId,p.definitionId,p.x,p.y,p.rotation,at,at);
      }else{spendItem(db,farmId,`decor_${p.definitionId}`,1);
        db.prepare('INSERT INTO farm_decorations(farm_id,definition_id,tile_x,tile_y,rotation,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(farmId,p.definitionId,p.x,p.y,p.rotation,at,at);}
      message=`Đã đặt ${def.name}.`;
    }else if(p.action.startsWith('move_')||p.action.startsWith('store_')){
      const building=p.action.endsWith('building'),table=building?'farm_buildings':'farm_decorations',o=target(db,table,farmId,p.id),def=(building?BUILDINGS:DECORATIONS)[o.definition_id];
      near(player,(o.tile_x+.5)*TILE_SIZE,(o.tile_y+.5)*TILE_SIZE);
      if(building&&db.prepare(`SELECT 1 FROM crafting_jobs WHERE building_id=? AND status!='CLAIMED'`).get(o.id))throw Error('Hãy nhận hết thành phẩm trước khi di chuyển hoặc cất.');
      if(p.action.startsWith('move_')){const area=validPlace(db,farmId,o.definition_id,p.x,p.y,p.rotation,building?'building':'decoration',building?'building':'decoration',o.id);near(player,area.x+area.w/2,area.y+area.h/2);
        db.prepare(`UPDATE ${table} SET tile_x=?,tile_y=?,rotation=?,updated_at=? WHERE id=?`).run(p.x,p.y,p.rotation,at,o.id);message=`Đã di chuyển ${def.name}.`;
      }else{if(!building)addItem(db,farmId,`decor_${o.definition_id}`,1);else{addItem(db,farmId,`building_${o.definition_id}`,1);db.prepare(`DELETE FROM crafting_jobs WHERE building_id=? AND status='CLAIMED'`).run(o.id);}db.prepare(`DELETE FROM ${table} WHERE id=?`).run(o.id);message=`Đã cất ${def.name}.`;}
    }else if(p.action==='unlock'){
      const level=db.prepare('SELECT level FROM farm_expansions WHERE farm_id=?').get(farmId).level,exp=EXPANSIONS.find(e=>e.level===p.level);
      if(!exp||p.level!==level+1)throw Error('Cần mở đất đúng thứ tự.');
      debit(db,userId,exp.cost,at);ledger(db,userId,farmId,exp.cost,'buy',`expansion_${p.level}`,p.requestId,at);
      db.prepare('UPDATE farm_expansions SET level=?,updated_at=? WHERE farm_id=?').run(p.level,at,farmId);message=`Đã mở ${exp.name}.`;
    }
    const receipt={message};db.prepare('INSERT INTO phase5_receipts VALUES (?,?,?,?,?,?)').run(userId,p.requestId,p.action,hash,JSON.stringify(receipt),at);
    return {...receipt,replayed:false,state:phase5State(db,userId,at)};
  })();
}
