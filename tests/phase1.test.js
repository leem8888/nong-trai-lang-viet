import { test } from 'node:test';
import assert from 'node:assert/strict';
import { io as client } from 'socket.io-client';
import { createApp } from '../server/index.js';
import { openDatabase } from '../server/db.js';
import { elapsedSeconds } from '../server/time.js';
import { validPosition, validMovement, inRange } from '../server/world.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

async function fixture() {
  const db=openDatabase(':memory:'), {server}=createApp(db);
  await new Promise(resolve=>server.listen(0,resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  return {db,base,close:()=>new Promise(resolve=>server.close(()=>{db.close();resolve();}))};
}
async function request(base,path,body,cookie='',csrf='') {
  const response=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',cookie,'x-csrf-token':csrf},body:body?JSON.stringify(body):undefined});
  return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};
}
const emit=(socket,event,payload)=>new Promise(resolve=>socket.emit(event,payload,resolve));
const connect=(base,cookie)=>new Promise((resolve,reject)=>{const socket=client(base,{extraHeaders:{cookie},transports:['websocket'],reconnection:false});socket.once('connect',()=>resolve(socket));socket.once('connect_error',reject);});

test('database, auth, ownership, persistence and socket access',async()=>{
  const f=await fixture();
  try {
    assert.equal(f.db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n,13);
    assert.equal((await request(f.base,'/health')).status,200);
    assert.equal((await request(f.base,'/farm')).status,401);
    const a=await request(f.base,'/register',{username:'farmer_a',password:'strong-pass-123'});
    const b=await request(f.base,'/register',{username:'farmer_b',password:'strong-pass-456'});
    assert.equal(a.status,200);assert.equal(b.status,200);
    assert.equal((await request(f.base,'/farms',{name:'Trại A'},a.cookie)).status,403);
    const fa=await request(f.base,'/farms',{name:'Trại A'},a.cookie,a.data.csrf);
    const fb=await request(f.base,'/farms',{name:'Trại B'},b.cookie,b.data.csrf);
    assert.equal(fa.status,200,JSON.stringify(fa.data));
    assert.equal(fb.status,200,JSON.stringify(fb.data));
    assert.notEqual(fa.data.farm.id,fb.data.farm.id);
    assert.equal((await request(f.base,'/farms',{name:'Another'},a.cookie,a.data.csrf)).data.farm.id,fa.data.farm.id);
    assert.equal((await request(f.base,'/farms/'+fb.data.farm.id,undefined,a.cookie)).status,403);
    assert.equal((await request(f.base,'/farm',undefined,a.cookie)).data.farm.id,fa.data.farm.id);
    assert.equal((await request(f.base,'/login',{username:'farmer_a',password:'wrong'})).status,400);
    const sa=await connect(f.base,a.cookie), sb=await connect(f.base,b.cookie);
    try {
      assert.equal((await emit(sa,'farm:join',{farmId:fb.data.farm.id})).ok,false);
      assert.equal((await emit(sa,'farm:join',{farmId:fa.data.farm.id})).ok,true);
      assert.equal((await emit(sb,'farm:join',{farmId:fb.data.farm.id})).ok,true);
      f.db.prepare('UPDATE player_states SET x=900,y=340 WHERE user_id=?').run(a.data.user.id);
      assert.equal((await emit(sa,'farm:interact',{objectId:'lamp'})).ok,false);
      f.db.prepare('UPDATE player_states SET x=720,y=650 WHERE user_id=?').run(a.data.user.id);
      assert.equal((await emit(sa,'player:move',{x:1000,y:1000,direction:'down'})).ok,false);
      assert.equal((await emit(sa,'player:move',{x:730,y:650,direction:'right'})).ok,true);
      f.db.prepare('UPDATE player_states SET x=744,y=650 WHERE user_id=?').run(a.data.user.id);
      assert.equal((await emit(sa,'farm:interact',{objectId:'lamp'})).state,1);
      assert.equal((await request(f.base,'/farm',undefined,a.cookie)).data.objects[0].state,1);
      assert.equal((await emit(sa,'farm:leave',{})).ok,true);
    } finally {sa.disconnect();sb.disconnect();}
    const resumed=await connect(f.base,a.cookie);
    try {
      const joined=await emit(resumed,'farm:join',{farmId:fa.data.farm.id});
      assert.equal(joined.ok,true);
      assert.equal(joined.snapshot.objects[0].state,1);
    } finally {resumed.disconnect();}
    assert.equal((await request(f.base,'/logout',{},a.cookie,a.data.csrf)).status,200);
    assert.equal((await request(f.base,'/me',undefined,a.cookie)).status,401);
    assert.equal(f.db.prepare('SELECT x FROM player_states WHERE user_id=?').get(a.data.user.id).x,744);
    assert.equal(f.db.prepare('SELECT count(*) AS n FROM farms').get().n,2);
  } finally {await f.close();}
});

test('movement, collision, range and time rules',()=>{
  assert.equal(validPosition(720,650),true);
  assert.equal(validPosition(700,190),false);
  assert.equal(validPosition(650,100),false);
  assert.equal(validPosition(400,-130),true);
  assert.equal(validPosition(700,-230),false);
  assert.equal(validMovement({x:720,y:650},730,650,200),true);
  assert.equal(validMovement({x:720,y:650},900,650,200),false);
  assert.equal(inRange({x:720,y:650},'lamp'),true);
  assert.equal(inRange({x:900,y:340},'lamp'),false);
  assert.equal(elapsedSeconds(1000,3500),2.5);
  assert.throws(()=>elapsedSeconds(4000,3500));
});

test('SQLite survives reopen and migration is idempotent',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-phase1-')), file=path.join(dir,'test.sqlite');
  let db;
  try {
    db=openDatabase(file);
    db.prepare('INSERT INTO users(id,username,password_hash,created_at) VALUES (?,?,?,?)').run('u','test_user','hash',1000);
    db.close(); db=null;
    db=openDatabase(file);
    assert.equal(db.prepare('SELECT username FROM users WHERE id=?').get('u').username,'test_user');
    assert.equal(db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n,13);
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});

test('unauthenticated socket is rejected',async()=>{
  const f=await fixture();
  try {
    await assert.rejects(connect(f.base,''),/unauthorized/);
  } finally {await f.close();}
});
