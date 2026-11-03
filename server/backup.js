import fs from 'node:fs';
import path from 'node:path';
import { openDatabase } from './db.js';

const file=process.env.DB_FILE || path.resolve('data/farm.sqlite');
const target=path.resolve('data/backups',`farm-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`);
fs.mkdirSync(path.dirname(target),{recursive:true});
const db=openDatabase(file);
await db.backup(target);
db.close();
console.log(`Backup: ${target}`);
