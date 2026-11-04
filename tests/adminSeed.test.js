import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/db.js';
import { login } from '../server/auth.js';
import { balance, debit } from '../server/economy.js';
import { createApp } from '../server/index.js';

function database(file, nodeEnv, username, password) {
  const before = [process.env.NODE_ENV,process.env.ADMIN_USERNAME,process.env.ADMIN_PASSWORD];
  try {
    process.env.NODE_ENV=nodeEnv;
    if (username === undefined) delete process.env.ADMIN_USERNAME; else process.env.ADMIN_USERNAME=username;
    if (password === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD=password;
    return openDatabase(file);
  } finally {
    for (const [key,value] of [['NODE_ENV',before[0]],['ADMIN_USERNAME',before[1]],['ADMIN_PASSWORD',before[2]]]) {
      if (value === undefined) delete process.env[key]; else process.env[key]=value;
    }
  }
}

test('development admin has a playable farm and auditable initial grant; restart preserves balance',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-admin-')),file=path.join(dir,'farm.sqlite');let db;
  try {
    db=database(file,'test');const admin=login(db,'admin','admin');
    assert.equal(admin.role,'ADMIN');
    assert.equal(balance(db,admin.id),999_999_999);
    const farm=db.prepare('SELECT id FROM farms WHERE owner_id=?').get(admin.id);
    assert.ok(farm);
    assert.ok(db.prepare('SELECT 1 FROM player_states WHERE user_id=?').get(admin.id));
    assert.ok(db.prepare('SELECT 1 FROM farm_ponds WHERE farm_id=?').get(farm.id));
    assert.ok(db.prepare('SELECT 1 FROM farm_coops WHERE farm_id=?').get(farm.id));
    assert.ok(db.prepare('SELECT 1 FROM inventory_items WHERE farm_id=?').get(farm.id));
    const grants=db.prepare('SELECT id,delta,balance_after FROM economy_transactions WHERE user_id=? ORDER BY id').all(admin.id);
    assert.deepEqual(grants.map(row=>row.delta),[200,999_999_799]);
    assert.equal(grants[1].balance_after,999_999_999);
    assert.equal(db.prepare('SELECT transaction_id FROM admin_audit_log WHERE user_id=? AND action=?').get(admin.id,'INITIAL_GRANT').transaction_id,grants[1].id);
    debit(db,admin.id,123);
    db.close();db=database(file,'test');
    assert.equal(db.prepare("SELECT count(*) n FROM users WHERE username='admin'").get().n,1);
    assert.equal(db.prepare('SELECT count(*) n FROM farms WHERE owner_id=?').get(admin.id).n,1);
    assert.equal(db.prepare('SELECT count(*) n FROM admin_audit_log WHERE user_id=?').get(admin.id).n,1);
    assert.equal(db.prepare('SELECT count(*) n FROM economy_transactions WHERE user_id=?').get(admin.id).n,2);
    assert.equal(balance(db,admin.id),999_999_876);
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});

test('regular registration cannot assign ADMIN role or grant money',async()=>{
  const db=openDatabase(':memory:'),{server,io}=createApp(db);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    const response=await fetch(base+'/api/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'normal_farmer',password:'strong-pass-123',role:'ADMIN',balance:999999999})});
    assert.equal(response.status,200);
    const data=await response.json(),cookie=response.headers.get('set-cookie').split(';')[0];
    const user=db.prepare('SELECT role FROM users WHERE id=?').get(data.user.id);
    assert.equal(data.user.role,'USER');assert.equal(user.role,'USER');assert.equal(balance(db,data.user.id),200);
    const me=await fetch(base+'/api/me',{headers:{cookie}}).then(result=>result.json());
    assert.equal(me.user.role,'USER');
    const forged=await fetch(base+'/api/market/action',{method:'POST',headers:{'content-type':'application/json',cookie,'x-csrf-token':data.csrf},body:JSON.stringify({action:'grant',amount:999999999,role:'ADMIN'})});
    assert.notEqual(forged.status,200);assert.equal(balance(db,data.user.id),200);
  } finally {await new Promise(resolve=>io.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));db.close();}
});

test('production rejects default credentials and requires a configured strong admin',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-admin-prod-')),file=path.join(dir,'farm.sqlite');let db;
  try {
    assert.throws(()=>database(file,'production'),/ADMIN_USERNAME/);
    db=database(file,'production','operator','long-unique-production-secret');
    assert.equal(db.prepare("SELECT count(*) n FROM users WHERE username='admin'").get().n,0);
    assert.equal(login(db,'operator','long-unique-production-secret').role,'ADMIN');
    assert.throws(()=>login(db,'admin','admin'));
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});

test('production rotates an existing development default password without resetting money',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'farm-admin-rotate-')),file=path.join(dir,'farm.sqlite');let db;
  try {
    db=database(file,'development');const id=login(db,'admin','admin').id;debit(db,id,5);db.close();
    db=database(file,'production','admin','long-unique-production-secret');
    assert.throws(()=>login(db,'admin','admin'));
    assert.equal(login(db,'admin','long-unique-production-secret').role,'ADMIN');
    assert.equal(balance(db,id),999_999_994);
    assert.equal(db.prepare("SELECT count(*) n FROM admin_audit_log WHERE user_id=? AND action='DEFAULT_PASSWORD_ROTATED'").get(id).n,1);
  } finally {db?.close();rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
