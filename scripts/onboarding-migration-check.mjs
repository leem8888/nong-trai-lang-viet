import Database from 'better-sqlite3';
import {openDatabase} from '../server/db.js';
import {mkdtempSync,rmSync,readdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const backup=readdirSync('data/backups').filter(n=>n.startsWith('farm-pre-onboarding-')&&n.endsWith('.sqlite')).sort().at(-1);
const sourceFile=process.argv[2]|| (backup?path.join('data/backups',backup):null);
if(!sourceFile)throw Error('Pass a pre-v10 SQLite backup path as the first argument.');
const source=new Database(sourceFile,{readonly:true});
assert.equal(source.prepare('SELECT max(version) v FROM schema_migrations').get().v,9,'Use a schema-v9 backup for this migration check');
const tables=source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='schema_migrations'").all().map(r=>r.name);
const snapshot=db=>Object.fromEntries(tables.map(name=>[name,db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()]));
assert.ok(tables.length>0);
const before=snapshot(source),dir=mkdtempSync(path.join(tmpdir(),'farm-v10-migration-')),file=path.join(dir,'copy.sqlite');
await source.backup(file);source.close();
try{let db=openDatabase(file);assert.deepEqual(snapshot(db),before);assert.equal(db.prepare('SELECT count(*) n FROM farm_onboarding').get().n,0);assert.equal(db.pragma('foreign_key_check').length,0);assert.equal(db.pragma('integrity_check')[0].integrity_check,'ok');db.close();db=openDatabase(file);assert.deepEqual(snapshot(db),before);assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n,11);db.close();const report={ok:true,source:path.basename(sourceFile),tablesCompared:tables.length,allOriginalRowsUnchanged:true,legacyEnrollment:0,integrity:'ok',foreignKeys:'ok',reopen:'ok'};writeFileSync('.qa/onboarding-migration.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}finally{rmSync(dir,{recursive:true,force:true});}
