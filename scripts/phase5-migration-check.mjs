import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import {openDatabase} from '../server/db.js';

const source=process.argv[2];if(!source)throw Error('Usage: node scripts/phase5-migration-check.mjs <v4.sqlite>');
const dir=mkdtempSync(path.join(tmpdir(),'farm-migrate-v5-')),copy=path.join(dir,'copy.sqlite');
const tables=['users','farms','farm_soil_tiles','farm_crops','inventory_items','wallets','player_orders','pond_fish','coop_chickens','vac_events'];
try{
  const live=new Database(source,{readonly:true});try{await live.backup(copy);}finally{live.close();}
  let db=new Database(copy,{readonly:true});const existing=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name));const before=Object.fromEntries(tables.filter(t=>existing.has(t)).map(t=>[t,db.prepare(`SELECT count(*) n FROM ${t}`).get().n]));const version=db.prepare('SELECT max(version) v FROM schema_migrations').get().v;db.close();assert.ok(version>=1&&version<=5);
  db=openDatabase(copy);const after=Object.fromEntries(Object.keys(before).map(t=>[t,db.prepare(`SELECT count(*) n FROM ${t}`).get().n]));assert.deepEqual(after,before);assert.equal(db.prepare('SELECT max(version) v FROM schema_migrations').get().v,6);assert.equal(db.pragma('integrity_check')[0].integrity_check,'ok');assert.equal(db.pragma('foreign_key_check').length,0);assert.equal(db.prepare('SELECT count(*) n FROM farm_expansions').get().n,before.farms);db.close();
  db=openDatabase(copy);assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n,6);db.close();console.log(JSON.stringify({source,versionBefore:version,versionAfter:6,before,after,integrity:'ok',foreignKeys:'ok',idempotent:true}));
}finally{try{rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}catch(error){console.warn(`Temporary copy cleanup deferred: ${error.code}`);}}
