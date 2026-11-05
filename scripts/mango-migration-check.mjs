import Database from 'better-sqlite3';
import {openDatabase} from '../server/db.js';
import {mkdtempSync,rmSync,readdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const name=readdirSync('data/backups').filter(n=>n.startsWith('farm-pre-mango-')&&n.endsWith('.sqlite')).sort().at(-1),sourceFile=process.argv[2]||(name?path.join('data/backups',name):null);
if(!sourceFile)throw Error('Pass a pre-v11 backup path.');
const source=new Database(sourceFile,{readonly:true});assert.ok(source.prepare('SELECT max(version) v FROM schema_migrations').get().v<11,'Use a pre-v11 backup');
const tables=source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='schema_migrations'").all().map(r=>r.name);
const snapshot=db=>Object.fromEntries(tables.map(n=>[n,db.prepare(`SELECT * FROM "${n}" ORDER BY rowid`).all()]));
const before=snapshot(source),dir=mkdtempSync(path.join(tmpdir(),'mango-migration-')),file=path.join(dir,'copy.sqlite');await source.backup(file);source.close();
try{let db=openDatabase(file);assert.deepEqual(snapshot(db),before);const farms=db.prepare('SELECT count(*) n FROM farms').get().n;assert.equal(db.prepare('SELECT count(*) n FROM farm_mango_trees').get().n,farms);assert.equal(db.pragma('foreign_key_check').length,0);assert.equal(db.pragma('integrity_check')[0].integrity_check,'ok');db.close();db=openDatabase(file);assert.deepEqual(snapshot(db),before);assert.equal(db.prepare('SELECT count(*) n FROM farm_mango_trees').get().n,farms);db.close();const report={ok:true,source:path.basename(sourceFile),tablesCompared:tables.length,allOriginalRowsUnchanged:true,trees:farms,integrity:'ok',reopen:'ok'};writeFileSync('.qa/mango-migration.json',JSON.stringify(report,null,2));console.log(report);}finally{rmSync(dir,{recursive:true,force:true});}
