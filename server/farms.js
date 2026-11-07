import { randomUUID } from 'node:crypto';
import { MANGO_CYCLE_MS } from '../public/js/shared/mango.js';
import { now } from './time.js';
import { seedFarmInventory } from './crops.js';
import { validPosition } from './world.js';

export function farmFor(db, userId) {
  return db.prepare('SELECT f.*, u.username AS owner_name FROM farms f JOIN users u ON u.id=f.owner_id WHERE f.owner_id=?').get(userId);
}
export function snapshot(db, userId) {
  const farm = farmFor(db, userId);
  if (!farm) return null;
  const player=db.prepare('SELECT x,y,direction,scene FROM player_states WHERE user_id=?').get(userId);
  if(player?.scene==='farm'&&!validPosition(player.x,player.y,'farm',db,farm.id)){
    let safe=null;
    for(let radius=24;radius<=240&&!safe;radius+=24)for(let i=0;i<16;i++){
      const angle=i*Math.PI/8,x=player.x+Math.cos(angle)*radius,y=player.y+Math.sin(angle)*radius;
      if(validPosition(x,y,'farm',db,farm.id)){safe={x,y};break;}
    }
    if(safe){db.prepare('UPDATE player_states SET x=?,y=?,updated_at=? WHERE user_id=?').run(safe.x,safe.y,now(),userId);player.x=safe.x;player.y=safe.y;}
  }
  return { farm, player, objects: db.prepare('SELECT object_id,state FROM farm_objects WHERE farm_id=?').all(farm.id) };
}
export function createFarm(db, userId, name) {
  const existing = farmFor(db, userId);
  if (existing) return existing;
  const clean = String(name ?? '').trim();
  if (clean.length < 2 || clean.length > 40) throw new Error('Tên nông trại cần từ 2 đến 40 ký tự.');
  return db.transaction(() => {
    const current = farmFor(db, userId);
    if (current) return current;
    const id = randomUUID(), time = now();
    db.prepare('INSERT INTO farms(id,owner_id,name,created_at,updated_at) VALUES (?,?,?,?,?)').run(id,userId,clean,time,time);
    db.prepare('INSERT INTO player_states(user_id,farm_id,x,y,direction,updated_at) VALUES (?,?,?,?,?,?)').run(userId,id,720,650,'down',time);
    db.prepare('INSERT INTO farm_objects VALUES (?,?,0)').run(id,'lamp');
    seedFarmInventory(db,id);
    db.prepare('INSERT INTO farm_banana_clumps(farm_id,started_at,updated_at) VALUES (?,?,?)').run(id,time,time);
    db.prepare('INSERT INTO farm_mango_trees(farm_id,ready_at,updated_at) VALUES (?,?,?)').run(id,time+MANGO_CYCLE_MS,time);
    db.prepare('INSERT INTO farm_onboarding(farm_id,updated_at) VALUES (?,?)').run(id,time);
    db.prepare('INSERT INTO farm_ponds VALUES (?)').run(id);
    db.prepare('INSERT INTO farm_coops VALUES (?)').run(id);
    db.prepare('INSERT INTO farm_expansions(farm_id,level,updated_at) VALUES (?,?,?)').run(id,0,time);
    return farmFor(db,userId);
  })();
}
