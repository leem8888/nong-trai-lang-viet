import { randomUUID } from 'node:crypto';
import { now } from './time.js';
import { seedFarmInventory } from './crops.js';

export function farmFor(db, userId) {
  return db.prepare('SELECT f.*, u.username AS owner_name FROM farms f JOIN users u ON u.id=f.owner_id WHERE f.owner_id=?').get(userId);
}
export function snapshot(db, userId) {
  const farm = farmFor(db, userId);
  if (!farm) return null;
  return { farm, player: db.prepare('SELECT x,y,direction,scene FROM player_states WHERE user_id=?').get(userId), objects: db.prepare('SELECT object_id,state FROM farm_objects WHERE farm_id=?').all(farm.id) };
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
    return farmFor(db,userId);
  })();
}
