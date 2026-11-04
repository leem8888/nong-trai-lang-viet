import { test } from 'node:test';
import assert from 'node:assert/strict';
import { io as client } from 'socket.io-client';
import { createApp } from '../server/index.js';
import { openDatabase } from '../server/db.js';

const emit = (socket, event, payload) => new Promise(resolve => socket.emit(event, payload, resolve));
const connect = (base, cookie) => new Promise((resolve, reject) => {
  const socket = client(base, { extraHeaders: { cookie }, transports: ['websocket'], reconnection: false });
  socket.once('connect', () => resolve(socket)); socket.once('connect_error', reject);
});

test('Phase 7 privacy, visit, presence, kick and owner data isolation', async () => {
  const db = openDatabase(':memory:'), { server } = createApp(db);
  await new Promise(resolve => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`, sockets = [];
  const request = async (path, method = 'GET', body, auth) => {
    const response = await fetch(base + '/api' + path, { method, headers: { 'content-type': 'application/json', cookie: auth?.cookie || '', 'x-csrf-token': auth?.csrf || '' }, body: body && JSON.stringify(body) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    const a = await request('/register', 'POST', { username: 'phase7_a', password: 'strong-pass-123' });
    const b = await request('/register', 'POST', { username: 'phase7_b', password: 'strong-pass-123' });
    const c = await request('/register', 'POST', { username: 'phase7_c', password: 'strong-pass-123' });
    const A = { cookie: a.cookie, csrf: a.data.csrf }, B = { cookie: b.cookie, csrf: b.data.csrf }, C = { cookie: c.cookie, csrf: c.data.csrf };
    const fa = (await request('/farms', 'POST', { name: 'Ruộng của A' }, A)).data.farm;
    const fb = (await request('/farms', 'POST', { name: 'Ruộng của B' }, B)).data.farm;
    const fc = (await request('/farms', 'POST', { name: 'Ruộng của C' }, C)).data.farm;
    assert.equal(fa.visibility, 'private');
    assert.deepEqual((await request('/social/search?q=Ru%E1%BB%99ng', 'GET', null, B)).data.farms, []);
    const sa = await connect(base, A.cookie), sb = await connect(base, B.cookie), sc = await connect(base, C.cookie); sockets.push(sa, sb, sc);
    assert.equal((await emit(sa, 'farm:join', { farmId: fa.id })).ok, true);
    assert.equal((await emit(sb, 'farm:join', { farmId: fb.id })).ok, true);
    assert.equal((await emit(sc, 'farm:join', { farmId: fa.id })).ok, false);
    assert.equal((await emit(sc, 'farm:join', { farmId: fc.id })).ok, true);
    assert.equal((await emit(sb, 'social:join', { farmId: fa.id, role: 'owner' })).ok, false);
    assert.equal((await request('/social/settings', 'POST', { privacy: 'request' }, B)).status, 200);
    assert.equal((await request('/social/settings', 'POST', { privacy: 'request' }, A)).data.privacy, 'request');
    const found = await request('/social/search?q=Ru%E1%BB%99ng', 'GET', null, B);
    assert.equal(found.status, 200, JSON.stringify(found.data));
    assert.equal(found.data.farms.some(f => f.id === fa.id), true);
    assert.equal((await emit(sb, 'social:join', { farmId: fa.id })).ok, false);
    const ask = await request('/social/requests', 'POST', { farmId: fa.id }, B); assert.equal(ask.status, 200);
    assert.equal((await request('/social/requests', 'GET', null, A)).data.requests[0].visitorName, 'phase7_b');
    assert.equal((await request('/social/requests/decide', 'POST', { id: ask.data.id, approve: true }, B)).status, 400);
    assert.equal((await request('/social/requests/decide', 'POST', { id: ask.data.id, approve: true }, A)).data.status, 'approved');
    assert.equal((await request('/social/requests/decide', 'POST', { id: ask.data.id, approve: true }, A)).data.replayed, true);
    const visit = await emit(sb, 'social:join', { farmId: fa.id }); assert.equal(visit.ok, true);
    assert.equal(visit.members.filter(m => m.userId === b.data.user.id).length, 1);
    assert.equal(JSON.stringify(visit).includes('inventory'), false);
    assert.equal(JSON.stringify(visit).includes('balance'), false);
    const before = db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(b.data.user.id);
    assert.equal((await emit(sb, 'player:move', { x: 900, y: 650, direction: 'right', seq: 1 })).ok, false);
    assert.equal((await emit(sb, 'player:move', { x: 730, y: 650, direction: 'right', seq: 1 })).ok, true);
    assert.equal((await emit(sb, 'player:move', { x: 731, y: 650, direction: 'right', seq: 1 })).ok, false);
    assert.deepEqual(db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(b.data.user.id), before);
    const sharedEmote = new Promise(resolve => sa.once('social:emote', resolve));
    assert.equal((await emit(sb, 'social:emote', { emote: 'wave' })).ok, true);
    assert.equal((await sharedEmote).userId, b.data.user.id);
    assert.equal((await emit(sb, 'social:emote', { emote: 'wave' })).ok, false);
    assert.equal((await request('/farms/' + fa.id, 'GET', null, B)).status, 403);
    for (const route of ['/farming/action', '/market/action', '/vac/action', '/phase5/action', '/village/quest']) assert.equal((await request(route, 'POST', { farmId: fa.id, action: 'claim_seeds' }, B)).status, 403, route);
    assert.equal((await request('/social/kick', 'POST', { visitorId: b.data.user.id }, A)).data.ok, true);
    assert.equal((await emit(sb, 'social:join', { farmId: fa.id })).ok, false);
    assert.equal((await emit(sb, 'player:move', { x: 740, y: 650, direction: 'right' })).ok, false);
    assert.equal((await emit(sb, 'world:travel', { to: 'market' })).ok, false);
    assert.equal((await emit(sb, 'farm:interact', { objectId: 'lamp' })).ok, false);
    assert.equal((await request('/social/settings', 'POST', { privacy: 'public' }, A)).data.privacy, 'public');
    assert.equal((await emit(sc, 'social:join', { farmId: fa.id })).ok, true);
    assert.equal((await request('/social/settings', 'POST', { privacy: 'private' }, A)).data.privacy, 'private');
    assert.equal((await emit(sc, 'social:join', { farmId: fa.id })).ok, false);
    assert.equal((await emit(sb, 'social:join', { farmId: fa.id })).ok, false);
    assert.equal((await emit(sc, 'player:move', { x: 730, y: 650, direction: 'right' })).ok, false);
    const invitation = await request('/social/invites', 'POST', { username: 'phase7_c' }, A);
    assert.equal(invitation.status, 200);
    assert.equal((await request('/social/invites', 'POST', { username: 'phase7_c' }, A)).data.id, invitation.data.id);
    assert.equal((await request('/social/invites', 'GET', null, C)).data.invites[0].farmId, fa.id);
    assert.equal((await emit(sc, 'social:join', { farmId: fa.id })).ok, true);
    const secondTab = await connect(base, C.cookie); sockets.push(secondTab);
    assert.equal((await emit(secondTab, 'farm:join', { farmId: fc.id })).ok, true);
    assert.equal((await emit(secondTab, 'social:join', { farmId: fa.id })).ok, true);
    assert.equal((await request('/social/settings', 'GET', null, A)).data.members.filter(m => m.userId === c.data.user.id).length, 1);
    assert.equal((await emit(sc, 'social:emote', { emote: 'wave' })).ok, false);
    secondTab.disconnect();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal((await request('/social/settings', 'GET', null, A)).data.members.some(m => m.userId === c.data.user.id), false);
    const resumed = await connect(base, C.cookie); sockets.push(resumed);
    assert.equal((await emit(resumed, 'farm:join', { farmId: fc.id })).ok, true);
    assert.equal((await emit(resumed, 'social:join', { farmId: fa.id })).ok, true);
    db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(c.data.user.id);
    assert.equal((await emit(resumed, 'social:emote', { emote: 'wave' })).ok, false);
    assert.equal(db.pragma('foreign_key_check').length, 0);
  } finally { for (const socket of sockets) socket.disconnect(); await new Promise(resolve => server.close(resolve)); db.close(); }
});

test('Phase 7 caps visitors at eight and releases a slot on disconnect', async () => {
  const db = openDatabase(':memory:'), { server } = createApp(db), sockets = [];
  await new Promise(resolve => server.listen(0, resolve)); const base = `http://127.0.0.1:${server.address().port}`;
  const account = async n => {
    const response = await fetch(base + '/api/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `visitor_${n}`, password: 'strong-pass-123' }) });
    const data = await response.json(), cookie = response.headers.get('set-cookie').split(';')[0];
    const farmResponse = await fetch(base + '/api/farms', { method: 'POST', headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': data.csrf }, body: JSON.stringify({ name: `Vườn ${n}` }) });
    const farm = (await farmResponse.json()).farm, socket = await connect(base, cookie); sockets.push(socket);
    assert.equal((await emit(socket, 'farm:join', { farmId: farm.id })).ok, true);
    return { data, farm, socket };
  };
  try {
    const owner = await account(0);
    db.prepare("UPDATE farms SET visibility='public' WHERE id=?").run(owner.farm.id);
    const visitors = [];
    for (let i = 1; i <= 9; i++) visitors.push(await account(i));
    for (const visitor of visitors.slice(0, 8)) assert.equal((await emit(visitor.socket, 'social:join', { farmId: owner.farm.id })).ok, true);
    assert.match((await emit(visitors[8].socket, 'social:join', { farmId: owner.farm.id })).error, /đủ khách/);
    visitors[0].socket.disconnect(); await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal((await emit(visitors[8].socket, 'social:join', { farmId: owner.farm.id })).ok, true);
  } finally { for (const socket of sockets) socket.disconnect(); await new Promise(resolve => server.close(resolve)); db.close(); }
});
