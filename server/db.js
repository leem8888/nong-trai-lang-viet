import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const migration = `
CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX auth_sessions_expiry ON auth_sessions(expires_at);
CREATE TABLE farms (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, map_id TEXT NOT NULL DEFAULT 'starter', visibility TEXT NOT NULL DEFAULT 'private', version INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE farm_objects (farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE, object_id TEXT NOT NULL, state INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(farm_id, object_id));
CREATE TABLE player_states (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE, x REAL NOT NULL, y REAL NOT NULL, direction TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE farm_permissions (farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, permission TEXT NOT NULL, PRIMARY KEY(farm_id,user_id,permission));
CREATE INDEX farm_permissions_user ON farm_permissions(user_id);
`;

export function openDatabase(file = process.env.DB_FILE || path.resolve('data/farm.sqlite')) {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const starter = path.resolve('data/starter.sqlite');
    if (!fs.existsSync(file) && fs.existsSync(starter) && path.resolve(file) !== starter) fs.copyFileSync(starter,file,fs.constants.COPYFILE_EXCL);
  }
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 3000');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)');
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 1').get()) db.transaction(() => {
    db.exec(migration);
    db.prepare('INSERT INTO schema_migrations VALUES (1, ?, ?)').run('phase 1', Date.now());
  })();
  return db;
}
