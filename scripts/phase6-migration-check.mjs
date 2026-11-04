import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import {openDatabase} from '../server/db.js';

const source=process.argv[2];
if(!source)throw Error('Usage: node scripts/phase6-migration-check.mjs <v5.sqlite>');
const dir=mkdtempSync(path.join(tmpdir(),'farm-migrate-v6-')),copy=path.join(dir,'copy.sqlite');
const tables=['users','farms','farm_soil_tiles','farm_crops','inventory_items','wallets','player_orders','pond_fish','coop_chickens','vac_events','farm_buildings','farm_decorations','crafting_jobs','farm_expansions'];
function snapshot(db){const existing=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name));return Object.fromEntries(tables.filter(name=>existing.has(name)).map(name=>[name,db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]));}
try{
  const live=new Database(source,{readonly:true});
  try{await live.backup(copy);}finally{live.close();}
  let db=new Database(copy,{readonly:true});
  const versionBefore=db.prepare('SELECT max(version) v FROM schema_migrations').get().v;
  assert.equal(versionBefore,5,'Source must be Phase 5 schema');
  const before=snapshot(db);db.close();
  db=openDatabase(copy);
  assert.equal(db.prepare('SELECT max(version) v FROM schema_migrations').get().v,7);
  assert.deepEqual(snapshot(db),before,'Existing player data changed');
  assert.equal(db.pragma('integrity_check')[0].integrity_check,'ok');
  assert.equal(db.pragma('foreign_key_check').length,0);
  db.close();
  db=openDatabase(copy);
  assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n,7);
  assert.deepEqual(snapshot(db),before,'Second startup changed player data');
  db.close();
  console.log(JSON.stringify({source,versionBefore,versionAfter:7,rows:Object.fromEntries(Object.entries(before).map(([name,rows])=>[name,rows.length])),integrity:'ok',foreignKeys:'ok',idempotent:true}));
}finally{try{rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}catch(error){console.warn(`Temporary copy cleanup deferred: ${error.code}`);}}
