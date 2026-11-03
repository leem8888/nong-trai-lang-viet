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

const migration2 = `
CREATE TABLE farm_soil_tiles (
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tile_x INTEGER NOT NULL CHECK(tile_x BETWEEN 0 AND 4),
  tile_y INTEGER NOT NULL CHECK(tile_y BETWEEN 0 AND 2),
  state TEXT NOT NULL CHECK(state IN ('TILLED','WATERED','PLANTED')),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(farm_id,tile_x,tile_y)
);
CREATE TABLE farm_crops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tile_x INTEGER NOT NULL,
  tile_y INTEGER NOT NULL,
  crop_id TEXT NOT NULL,
  planted_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL CHECK(duration_ms > 0),
  bonus_ms INTEGER NOT NULL DEFAULT 0 CHECK(bonus_ms >= 0),
  watered_at INTEGER,
  harvested_at INTEGER,
  yield_quantity INTEGER NOT NULL CHECK(yield_quantity > 0),
  FOREIGN KEY(farm_id,tile_x,tile_y) REFERENCES farm_soil_tiles(farm_id,tile_x,tile_y) ON DELETE CASCADE
);
CREATE UNIQUE INDEX one_active_crop_per_tile ON farm_crops(farm_id,tile_x,tile_y) WHERE harvested_at IS NULL;
CREATE INDEX farm_crops_farm ON farm_crops(farm_id,harvested_at);
CREATE TABLE inventory_items (
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity BETWEEN 0 AND 999),
  PRIMARY KEY(farm_id,item_id)
);
CREATE TABLE farm_seed_claims (
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  utc_day TEXT NOT NULL,
  PRIMARY KEY(farm_id,utc_day)
);
INSERT INTO inventory_items(farm_id,item_id,quantity)
SELECT f.id,s.item_id,4 FROM farms f CROSS JOIN (
  SELECT 'seed_rice' AS item_id UNION ALL SELECT 'seed_mustard' UNION ALL SELECT 'seed_tomato'
  UNION ALL SELECT 'seed_carrot' UNION ALL SELECT 'seed_corn' UNION ALL SELECT 'seed_soy'
) s;
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
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 2').get()) db.transaction(() => {
    db.exec(migration2);
    db.prepare('INSERT INTO schema_migrations VALUES (2, ?, ?)').run('phase 2 crops and inventory', Date.now());
  })();
  return db;
}
