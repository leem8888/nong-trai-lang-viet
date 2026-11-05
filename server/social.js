import { mangoStateForFarm } from './mango.js';
import { randomUUID } from 'node:crypto';
import {plotState,farmingState} from './crops.js';

const REQUEST_MS = 10 * 60_000;
const GRANT_MS = 60 * 60_000;
const INVITE_MS = 60 * 60_000;
const KICK_MS = 60_000;
const MODES = new Set(['private', 'request', 'public']);
const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value);
const farmRow = (db, id) => db.prepare('SELECT f.id,f.owner_id,f.name,f.visibility,u.username AS owner_name FROM farms f JOIN users u ON u.id=f.owner_id WHERE f.id=?').get(id);
const ownFarm = (db, userId) => db.prepare('SELECT id,visibility FROM farms WHERE owner_id=?').get(userId);

export function searchFarms(db, userId, query, page = 0) {
  const term = String(query ?? '').trim().slice(0, 40);
  if (term.length < 2 || !Number.isInteger(page) || page < 0 || page > 100) throw Error('Tìm kiếm cần ít nhất 2 ký tự.');
  const rows = db.prepare(`SELECT f.id,f.name,f.visibility,u.username AS ownerName FROM farms f JOIN users u ON u.id=f.owner_id
    WHERE f.owner_id!=? AND f.visibility IN ('public','request') AND (f.name LIKE ? ESCAPE '!' OR u.username LIKE ? ESCAPE '!')
    ORDER BY f.updated_at DESC,f.id LIMIT 11 OFFSET ?`).all(userId, ...Array(2).fill(`%${term.replace(/[!%_]/g, '!$&')}%`), page * 10);
  return { farms: rows.slice(0, 10).map(row => ({ ...row, canVisit: socialAccess(db, userId, row.id) })), hasMore: rows.length > 10, page };
}

export function socialAccess(db, userId, farmId, at = Date.now(), kickedUntil = 0) {
  const farm = farmRow(db, farmId);
  if (!farm || kickedUntil > at) return false;
  if (farm.owner_id === userId || farm.visibility === 'public') return true;
  if (db.prepare("SELECT 1 FROM farm_invites WHERE farm_id=? AND visitor_id=? AND expires_at>? LIMIT 1").get(farmId, userId, at)) return true;
  return farm.visibility === 'request' && !!db.prepare("SELECT 1 FROM farm_visit_requests WHERE farm_id=? AND visitor_id=? AND status='approved' AND expires_at>? LIMIT 1").get(farmId, userId, at);
}

export function visitorSnapshot(db, farmId) {
  const farm = farmRow(db, farmId);
  if (!farm) throw Error('Không tìm thấy nông trại.');
  return {
    farm: { id: farm.id, name: farm.name, ownerName: farm.owner_name },
    mango:mangoStateForFarm(db,farmId),
    objects: db.prepare('SELECT object_id AS objectId,state FROM farm_objects WHERE farm_id=?').all(farmId),
    plots:plotState(db,farmId),
    tiles:farmingState(db,farm.owner_id).tiles.map(t=>({x:t.x,y:t.y,locked:t.locked,state:t.state,cropId:t.crop?.cropId??null,plantedAt:t.crop?.plantedAt,durationMs:t.crop?.durationMs,bonusMs:t.crop?.bonusMs,wateredAt:t.crop?.wateredAt})),
    buildings: db.prepare('SELECT id,definition_id AS definitionId,tile_x AS x,tile_y AS y,rotation FROM farm_buildings WHERE farm_id=?').all(farmId),
    decorations: db.prepare('SELECT id,definition_id AS definitionId,tile_x AS x,tile_y AS y,rotation FROM farm_decorations WHERE farm_id=?').all(farmId),
    pond: { fish: db.prepare('SELECT fish_id AS fishId FROM pond_fish WHERE farm_id=? AND harvested_at IS NULL').all(farmId) },
    coop: { chickens: db.prepare("SELECT CASE WHEN ready_at>? THEN 'GROWING' ELSE 'WAITING_FOR_FEED' END AS status FROM coop_chickens WHERE farm_id=?").all(Date.now(), farmId) },
    level: db.prepare('SELECT level FROM farm_expansions WHERE farm_id=?').get(farmId)?.level || 0,
  };
}

export function createSocial(db, io) {
  const active = new Map(); // one social avatar per account
  const kicked = new Map();
  const throttle = new Map();
  let cleanedAt = 0;
  const room = id => `social:${id}`;
  const cleanup = at => {
    if (at - cleanedAt < 10 * 60_000) return;
    cleanedAt = at;
    db.prepare('DELETE FROM farm_visit_requests WHERE expires_at<=?').run(at);
    db.prepare('DELETE FROM farm_invites WHERE expires_at<=?').run(at);
    for (const [key, until] of kicked) if (until <= at) kicked.delete(key);
    for (const [key, last] of throttle) if (last < at - 60_000) throttle.delete(key);
  };
  const rate = (userId, action, ms) => {
    const key = `${userId}:${action}`, at = Date.now(); cleanup(at);
    if (at - (throttle.get(key) || 0) < ms) throw Error('Thao tác quá nhanh.');
    throttle.set(key, at);
  };
  const occupant = socket => ({ userId: socket.data.auth.user_id, name: socket.data.auth.username,
    x: socket.data.social.x, y: socket.data.social.y, direction: socket.data.social.direction, role: socket.data.social.role });
  const members = farmId => [...active.values()].filter(s => s.data.social?.farmId === farmId).map(occupant);
  const leave = (socket, reason = 'left') => {
    const state = socket.data.social;
    if (!state) return;
    if (active.get(socket.data.auth.user_id) === socket) active.delete(socket.data.auth.user_id);
    socket.leave(room(state.farmId)); socket.data.social = null;
    io.to(room(state.farmId)).emit('social:leave', { userId: socket.data.auth.user_id, reason });
    io.to(room(state.farmId)).emit('social:members', members(state.farmId));
  };
  const join = (socket, farmId, owner = false) => {
    const userId = socket.data.auth.user_id, farm = farmRow(db, farmId), at = Date.now();
    if (!farm || !socialAccess(db, userId, farmId, at, kicked.get(`${userId}:${farmId}`) || 0)) throw Error('Bạn chưa được phép vào nông trại này.');
    if (owner !== (farm.owner_id === userId)) throw Error('Chế độ vào nông trại không hợp lệ.');
    if (!owner && members(farmId).filter(p => p.role === 'visitor' && p.userId !== userId).length >= 8) throw Error('Nông trại đã đủ khách.');
    const previous = active.get(userId);
    if (previous && previous !== socket) { previous.emit('social:replaced'); leave(previous, 'replaced'); }
    if (socket.data.social) leave(socket);
    const saved = owner ? db.prepare('SELECT x,y,direction FROM player_states WHERE user_id=?').get(userId) : null;
    socket.data.social = { farmId, role: owner ? 'owner' : 'visitor', x: saved?.x ?? 720, y: saved?.y ?? 650, direction: saved?.direction ?? 'down', lastMove: 0, lastSeq: 0, lastEmote: 0 };
    active.set(userId, socket); socket.join(room(farmId));
    const result = { farm: { id: farm.id, name: farm.name, ownerName: farm.owner_name }, player: occupant(socket), members: members(farmId), snapshot: visitorSnapshot(db, farmId) };
    io.to(room(farmId)).emit('social:members', result.members);
    return result;
  };
  const revoke = (farmId, visitorId, reason) => {
    const targets = visitorId ? [active.get(visitorId)].filter(Boolean) : [...active.values()];
    for (const socket of targets) if (socket.data.social?.farmId === farmId && socket.data.social.role === 'visitor') {
      socket.data.socialRevoked = true; socket.emit('social:revoked', { reason }); leave(socket, reason);
    }
  };
  return {
    members, leave, join, revoke, active,
    isVisiting(userId) { return active.get(userId)?.data.social?.role === 'visitor'; },
    search: (userId, query, page) => searchFarms(db, userId, query, page),
    settings(userId) { const farm = ownFarm(db, userId); if (!farm) throw Error('Chưa tạo nông trại.'); return { farmId: farm.id, privacy: farm.visibility, members: members(farm.id) }; },
    setPrivacy(userId, mode) {
      if (!MODES.has(mode)) throw Error('Quyền riêng tư không hợp lệ.');
      const farm = ownFarm(db, userId); if (!farm) throw Error('Chưa tạo nông trại.');
      if (farm.visibility === mode) return this.settings(userId);
      db.prepare('UPDATE farms SET visibility=?,updated_at=? WHERE id=?').run(mode, Date.now(), farm.id);
      if (mode === 'private') revoke(farm.id, null, 'Chủ nông trại đã đóng quyền thăm.');
      if (mode === 'request') for (const p of members(farm.id)) if (p.role === 'visitor' && !socialAccess(db, p.userId, farm.id)) revoke(farm.id, p.userId, 'Quyền thăm đã thay đổi.');
      return this.settings(userId);
    },
    request(userId, farmId) {
      const farm = farmRow(db, farmId), at = Date.now();
      if (!farm || farm.owner_id === userId || farm.visibility !== 'request') throw Error('Không thể xin vào nông trại này.');
      let row = db.prepare("SELECT id,expires_at AS expiresAt FROM farm_visit_requests WHERE farm_id=? AND visitor_id=? AND status='pending' AND expires_at>? LIMIT 1").get(farmId, userId, at);
      if (!row) { rate(userId, 'request', 1000); row = { id: randomUUID(), expiresAt: at + REQUEST_MS }; db.prepare('INSERT INTO farm_visit_requests(id,farm_id,visitor_id,status,created_at,expires_at) VALUES (?,?,?,?,?,?)').run(row.id, farmId, userId, 'pending', at, row.expiresAt); io.to(`user:${farm.owner_id}`).emit('social:notice', 'Có khách xin thăm nông trại.'); }
      return { id: row.id, status: 'pending', expiresAt: row.expiresAt };
    },
    requests(userId) { const farm = ownFarm(db, userId); if (!farm) throw Error('Chưa tạo nông trại.'); return db.prepare("SELECT r.id,u.username AS visitorName,r.created_at AS createdAt,r.expires_at AS expiresAt FROM farm_visit_requests r JOIN users u ON u.id=r.visitor_id WHERE r.farm_id=? AND r.status='pending' AND r.expires_at>? ORDER BY r.created_at DESC LIMIT 30").all(farm.id, Date.now()); },
    decide(userId, id, approve) {
      if (!uuid(id) || typeof approve !== 'boolean') throw Error('Yêu cầu không hợp lệ.');
      const farm = ownFarm(db, userId), at = Date.now(); if (!farm) throw Error('Chưa tạo nông trại.');
      if (approve && farm.visibility !== 'request') throw Error('Nông trại không ở chế độ duyệt khách.');
      const row = db.prepare('SELECT * FROM farm_visit_requests WHERE id=? AND farm_id=?').get(id, farm.id);
      if (!row || row.expires_at <= at) throw Error('Yêu cầu đã hết hạn.');
      if (row.status !== 'pending') return { status: row.status, replayed: true };
      db.prepare('UPDATE farm_visit_requests SET status=?,decided_at=?,expires_at=? WHERE id=?').run(approve ? 'approved' : 'denied', at, at + GRANT_MS, id);
      io.to(`user:${row.visitor_id}`).emit('social:notice', approve ? 'Chủ nông trại đã đồng ý. Bạn có thể ghé thăm.' : 'Chủ nông trại chưa thể đón khách.');
      return { status: approve ? 'approved' : 'denied' };
    },
    invite(userId, username) {
      const farm = ownFarm(db, userId), target = db.prepare('SELECT id FROM users WHERE username=?').get(String(username ?? '').trim());
      if (!farm || !target || target.id === userId) throw Error('Không tìm thấy người chơi để mời.');
      const at = Date.now(); let row = db.prepare('SELECT id,expires_at AS expiresAt FROM farm_invites WHERE farm_id=? AND visitor_id=? AND expires_at>? LIMIT 1').get(farm.id, target.id, at);
      if (!row) { rate(userId, 'invite', 1000); row = { id: randomUUID(), expiresAt: at + INVITE_MS }; db.prepare('INSERT INTO farm_invites VALUES (?,?,?,?,?)').run(row.id, farm.id, target.id, at, row.expiresAt); io.to(`user:${target.id}`).emit('social:notice', 'Bạn có lời mời thăm nông trại.'); }
      return { id: row.id, expiresAt: row.expiresAt };
    },
    invites(userId) { return db.prepare('SELECT i.id,f.id AS farmId,f.name,u.username AS ownerName,i.expires_at AS expiresAt FROM farm_invites i JOIN farms f ON f.id=i.farm_id JOIN users u ON u.id=f.owner_id WHERE i.visitor_id=? AND i.expires_at>? ORDER BY i.created_at DESC LIMIT 30').all(userId, Date.now()); },
    kick(userId, visitorId) {
      const farm = ownFarm(db, userId), socket = active.get(visitorId);
      if (!farm || !socket || socket.data.social?.farmId !== farm.id || socket.data.social.role !== 'visitor') throw Error('Khách không còn ở nông trại.');
      rate(userId, 'kick', 300); const at = Date.now(); cleanup(at);
      kicked.set(`${visitorId}:${farm.id}`, at + KICK_MS);
      revoke(farm.id, visitorId, 'Chủ nông trại đã mời bạn rời đi.');
      return { ok: true };
    },
    canStay(socket) { const s = socket.data.social; return !!s && socialAccess(db, socket.data.auth.user_id, s.farmId, Date.now(), kicked.get(`${socket.data.auth.user_id}:${s.farmId}`) || 0); },
    broadcastFarm(farmId) { if (members(farmId).length) io.to(room(farmId)).emit('social:farm', visitorSnapshot(db, farmId)); },
  };
}
