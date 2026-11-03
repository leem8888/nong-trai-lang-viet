import { createHash } from 'node:crypto';
import { FISH, CHICKEN, VAC_RECIPES } from '../public/js/shared/vac.js';
import { inventory, addItem, spendItem } from './crops.js';
import { inRange } from './world.js';
import { now } from './time.js';

const POND_CAPACITY=6, COOP_CAPACITY=4;
const farmOf=(db,userId)=>db.prepare('SELECT id FROM farms WHERE owner_id=?').get(userId)?.id;
const eggsReady=(row,at)=>row.feed_started_at===null?0:Math.min(row.max_eggs,Math.max(0,Math.floor((at-row.feed_started_at)/row.egg_ms)));
export function vacState(db,userId,at=now()) {
  const farmId=farmOf(db,userId);if(!farmId)return null;
  const fish=db.prepare('SELECT * FROM pond_fish WHERE farm_id=? AND harvested_at IS NULL ORDER BY id').all(farmId);
  const chickens=db.prepare('SELECT * FROM coop_chickens WHERE farm_id=? ORDER BY id').all(farmId);
  return {farmId,serverTime:at,inventory:inventory(db,farmId),
    pond:{capacity:POND_CAPACITY,fish:fish.map(row=>({id:row.id,fishId:row.fish_id,name:FISH[row.fish_id].name,
      readyAt:row.ready_at,fedAt:row.fed_at,progress:Math.min(1,Math.max(0,(at-row.stocked_at)/(row.ready_at-row.stocked_at||1))),
      remainingMs:Math.max(0,row.ready_at-at),yield:row.yield_quantity}))},
    coop:{capacity:COOP_CAPACITY,chickens:chickens.map(row=>{
      const ready=eggsReady(row,at),adult=at>=row.ready_at;
      return {id:row.id,readyAt:row.ready_at,remainingMs:Math.max(0,row.ready_at-at),
        status:!adult?'GROWING':row.feed_started_at===null||ready===row.max_eggs&&row.eggs_claimed===ready?'WAITING_FOR_FEED':'PRODUCING',
        eggsReady:Math.max(0,ready-row.eggs_claimed),eggsClaimed:row.eggs_claimed,maxEggs:row.max_eggs,
        nextEggAt:adult&&row.feed_started_at!==null&&ready<row.max_eggs?row.feed_started_at+(ready+1)*row.egg_ms:null};
    })}, recipes:VAC_RECIPES};
}
const fields={
  stock_fish:['action','farmId','requestId','fishId','quantity'],
  feed_fish:['action','farmId','requestId','entityId'],
  harvest_fish:['action','farmId','requestId','entityId'],
  add_chicken:['action','farmId','requestId','quantity'],
  feed_chicken:['action','farmId','requestId','entityId'],
  collect_eggs:['action','farmId','requestId'],
  convert:['action','farmId','requestId','recipeId','quantity']
};
function validate(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||!Object.hasOwn(fields,payload.action))throw new Error('Thao tác VAC không hợp lệ.');
  const allowed=fields[payload.action];
  if(allowed.some(key=>!Object.hasOwn(payload,key))||Object.keys(payload).some(key=>!allowed.includes(key)))throw new Error('Dữ liệu VAC không hợp lệ.');
  if(typeof payload.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(payload.requestId))throw new Error('Mã thao tác không hợp lệ.');
  return createHash('sha256').update(JSON.stringify(Object.fromEntries(allowed.filter(key=>key!=='requestId').map(key=>[key,payload[key]])))).digest('hex');
}
export function performVacAction(db,userId,payload,at=now()) {
  const hash=validate(payload),farmId=farmOf(db,userId);
  if(!farmId||payload.farmId!==farmId)throw new Error('Không có quyền với nông trại này.');
  if(!Number.isSafeInteger(at)||at<0)throw new Error('Thời gian không hợp lệ.');
  return db.transaction(()=>{
    const previous=db.prepare('SELECT action,payload_hash,response_json FROM vac_request_receipts WHERE user_id=? AND request_key=?').get(userId,payload.requestId);
    if(previous){
      if(previous.action!==payload.action||previous.payload_hash!==hash)throw new Error('Mã thao tác đã dùng cho yêu cầu khác.');
      return {...JSON.parse(previous.response_json),replayed:true,state:vacState(db,userId,at)};
    }
    const player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(userId,farmId);
    const point=['stock_fish','feed_fish','harvest_fish'].includes(payload.action)||payload.action==='convert'&&VAC_RECIPES[payload.recipeId]?.output==='fish_feed'?'pond':'coop';
    if(!player||player.scene!=='farm'||!inRange(player,point))throw new Error('Hãy đến gần ao hoặc chuồng gà.');
    let itemId=null,quantity=null,entityId=null,message;
    if(payload.action==='stock_fish'){
      const definition=FISH[payload.fishId];quantity=payload.quantity;
      if(!definition||!Number.isSafeInteger(quantity)||quantity<1||quantity>POND_CAPACITY)throw new Error('Cá giống hoặc số lượng không hợp lệ.');
      const count=db.prepare('SELECT count(*) n FROM pond_fish WHERE farm_id=? AND harvested_at IS NULL').get(farmId).n;
      if(count+quantity>POND_CAPACITY)throw new Error('Ao đã đầy.');
      itemId=definition.fingerling;spendItem(db,farmId,itemId,quantity);
      const insert=db.prepare('INSERT INTO pond_fish(farm_id,fish_id,stocked_at,ready_at,duration_ms,yield_quantity) VALUES (?,?,?,?,?,?)');
      for(let i=0;i<quantity;i++)insert.run(farmId,payload.fishId,at,at+definition.durationMs,definition.durationMs,definition.yield);
      message=`Đã thả ${quantity} ${definition.name.toLowerCase()}.`;
    }else if(payload.action==='feed_fish'||payload.action==='harvest_fish'){
      entityId=payload.entityId;
      if(!Number.isSafeInteger(entityId)||entityId<1)throw new Error('Cá không hợp lệ.');
      const fish=db.prepare('SELECT * FROM pond_fish WHERE id=? AND farm_id=? AND harvested_at IS NULL').get(entityId,farmId);
      if(!fish)throw new Error('Cá không tồn tại trong ao.');
      if(at<fish.stocked_at)throw new Error('Thời gian không hợp lệ.');
      if(payload.action==='feed_fish'){
        if(fish.fed_at!==null||at>=fish.ready_at)throw new Error('Cá này không cần cho ăn thêm.');
        spendItem(db,farmId,'fish_feed',1);
        db.prepare('UPDATE pond_fish SET fed_at=?,ready_at=? WHERE id=?').run(at,Math.max(at,fish.ready_at-Math.floor(fish.duration_ms*.1)),entityId);
        itemId='fish_feed';quantity=1;message='Đã cho cá ăn; thời gian còn lại giảm một lần.';
      }else{
        if(at<fish.ready_at)throw new Error('Cá chưa trưởng thành.');
        db.prepare('UPDATE pond_fish SET harvested_at=? WHERE id=? AND harvested_at IS NULL').run(at,entityId);
        itemId=FISH[fish.fish_id].produce;quantity=fish.yield_quantity;addItem(db,farmId,itemId,quantity);
        message=`Thu hoạch ${quantity} ${FISH[fish.fish_id].name.toLowerCase()}.`;
      }
    }else if(payload.action==='add_chicken'){
      quantity=payload.quantity;
      if(!Number.isSafeInteger(quantity)||quantity<1||quantity>COOP_CAPACITY)throw new Error('Số gà không hợp lệ.');
      const count=db.prepare('SELECT count(*) n FROM coop_chickens WHERE farm_id=?').get(farmId).n;
      if(count+quantity>COOP_CAPACITY)throw new Error('Chuồng gà đã đầy.');
      itemId=CHICKEN.item;spendItem(db,farmId,itemId,quantity);
      const insert=db.prepare('INSERT INTO coop_chickens(farm_id,added_at,ready_at,growth_ms,egg_ms,max_eggs) VALUES (?,?,?,?,?,?)');
      for(let i=0;i<quantity;i++)insert.run(farmId,at,at+CHICKEN.growthMs,CHICKEN.growthMs,CHICKEN.eggMs,CHICKEN.maxEggs);
      message=`Đã thêm ${quantity} gà con vào chuồng.`;
    }else if(payload.action==='feed_chicken'){
      entityId=payload.entityId;
      if(!Number.isSafeInteger(entityId)||entityId<1)throw new Error('Gà không hợp lệ.');
      const chicken=db.prepare('SELECT * FROM coop_chickens WHERE id=? AND farm_id=?').get(entityId,farmId);
      if(!chicken)throw new Error('Gà không tồn tại trong chuồng.');
      if(at<chicken.added_at)throw new Error('Thời gian không hợp lệ.');
      if(at<chicken.ready_at)throw new Error('Gà chưa trưởng thành.');
      if(chicken.feed_started_at!==null&&(eggsReady(chicken,at)<chicken.max_eggs||chicken.eggs_claimed<chicken.max_eggs))throw new Error('Gà vẫn còn chu kỳ trứng hoặc trứng chưa nhặt.');
      spendItem(db,farmId,'chicken_feed',1);
      db.prepare('UPDATE coop_chickens SET feed_started_at=?,eggs_claimed=0 WHERE id=?').run(at,entityId);
      itemId='chicken_feed';quantity=1;message='Đã cho gà ăn; bắt đầu chu kỳ đẻ tối đa 3 trứng.';
    }else if(payload.action==='collect_eggs'){
      const chickens=db.prepare('SELECT * FROM coop_chickens WHERE farm_id=?').all(farmId);
      quantity=chickens.reduce((total,row)=>total+Math.max(0,eggsReady(row,at)-row.eggs_claimed),0);
      if(!quantity)throw new Error('Chưa có trứng để nhặt.');
      itemId='egg';addItem(db,farmId,itemId,quantity);
      const update=db.prepare('UPDATE coop_chickens SET eggs_claimed=? WHERE id=?');
      for(const row of chickens)update.run(Math.max(row.eggs_claimed,eggsReady(row,at)),row.id);
      message=`Đã nhặt ${quantity} trứng gà.`;
    }else{
      const recipe=VAC_RECIPES[payload.recipeId];quantity=payload.quantity;
      if(!recipe||!Number.isSafeInteger(quantity)||quantity<1||quantity>99)throw new Error('Công thức hoặc số lượng không hợp lệ.');
      spendItem(db,farmId,recipe.input,quantity);
      itemId=recipe.output;addItem(db,farmId,itemId,quantity*recipe.yield);
      message=`Đã đổi ${quantity} nông sản thành ${quantity*recipe.yield} ${itemId==='fish_feed'?'thức ăn cá':'thức ăn gà'}.`;
    }
    db.prepare('INSERT INTO vac_events(farm_id,action,item_id,quantity,entity_id,request_key,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(farmId,payload.action,itemId,quantity,entityId,payload.requestId,at);
    const receipt={message};
    db.prepare('INSERT INTO vac_request_receipts VALUES (?,?,?,?,?,?)').run(userId,payload.requestId,payload.action,hash,JSON.stringify(receipt),at);
    return {...receipt,replayed:false,state:vacState(db,userId,at)};
  })();
}
