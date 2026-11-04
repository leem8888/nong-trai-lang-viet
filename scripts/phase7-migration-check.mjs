import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { openDatabase } from '../server/db.js';

const source = process.argv[2]; if (!source) throw Error('Usage: node scripts/phase7-migration-check.mjs <v6.sqlite>');
const dir = mkdtempSync(path.join(tmpdir(), 'farm-v7-migrate-')), copy = path.join(dir, 'copy.sqlite');
const tables = ['users', 'auth_sessions', 'farms', 'player_states', 'farm_soil_tiles', 'farm_crops', 'inventory_items', 'wallets', 'player_orders', 'pond_fish', 'coop_chickens', 'farm_buildings', 'farm_decorations', 'crafting_jobs', 'player_quests'];
const rows = db => Object.fromEntries(tables.map(name => [name, db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]));
try {
  const live = new Database(source, { readonly: true }); try { await live.backup(copy); } finally { live.close(); }
  let db = new Database(copy, { readonly: true });
  assert.equal(db.prepare('SELECT max(version) v FROM schema_migrations').get().v, 6);
  const before = rows(db); db.close();
  db = openDatabase(copy);
  assert.equal(db.prepare('SELECT max(version) v FROM schema_migrations').get().v, 7);
  assert.deepEqual(rows(db), before);
  assert.equal(db.prepare("SELECT count(*) n FROM farms WHERE visibility!='private'").get().n, 0);
  assert.equal(db.pragma('integrity_check', { simple: true }), 'ok');
  assert.equal(db.pragma('foreign_key_check').length, 0); db.close();
  db = openDatabase(copy); assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n, 7); assert.deepEqual(rows(db), before); db.close();
  console.log(JSON.stringify({ beforeVersion: 6, afterVersion: 7, users: before.users.length, farms: before.farms.length, preserved: true, integrity: 'ok', foreignKeys: 0, idempotent: true }));
} finally { rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); }
