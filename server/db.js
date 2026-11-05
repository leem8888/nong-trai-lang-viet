import { MANGO_CYCLE_MS } from '../public/js/shared/mango.js';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { seedAdmin } from './seedAdmin.js';

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

const migration3 = `
ALTER TABLE player_states ADD COLUMN scene TEXT NOT NULL DEFAULT 'farm' CHECK(scene IN ('farm','market'));
CREATE TABLE wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL CHECK(balance BETWEEN 0 AND 9000000000000),
  updated_at INTEGER NOT NULL
);
CREATE TABLE economy_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id TEXT REFERENCES farms(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK(kind IN ('starter','buy','sell','order')),
  item_id TEXT,
  quantity INTEGER,
  unit_price INTEGER,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  request_key TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX economy_transactions_user_time ON economy_transactions(user_id,created_at DESC,id DESC);
CREATE TABLE economy_request_receipts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_key TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,request_key)
);
CREATE TABLE player_orders (
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ACCEPTED','COMPLETED')),
  accepted_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY(farm_id,template_id)
);
INSERT INTO wallets(user_id,balance,updated_at) SELECT id,200,strftime('%s','now')*1000 FROM users;
INSERT INTO economy_transactions(user_id,kind,delta,balance_after,created_at)
SELECT id,'starter',200,200,strftime('%s','now')*1000 FROM users;
`;

const migration4 = `
CREATE TABLE farm_ponds (farm_id TEXT PRIMARY KEY REFERENCES farms(id) ON DELETE CASCADE);
CREATE TABLE farm_coops (farm_id TEXT PRIMARY KEY REFERENCES farms(id) ON DELETE CASCADE);
CREATE TABLE pond_fish (
  id INTEGER PRIMARY KEY AUTOINCREMENT, farm_id TEXT NOT NULL REFERENCES farm_ponds(farm_id) ON DELETE CASCADE,
  fish_id TEXT NOT NULL CHECK(fish_id IN ('tilapia','carp')),
  stocked_at INTEGER NOT NULL, ready_at INTEGER NOT NULL, duration_ms INTEGER NOT NULL CHECK(duration_ms>0),
  yield_quantity INTEGER NOT NULL CHECK(yield_quantity>0), fed_at INTEGER, harvested_at INTEGER
);
CREATE INDEX pond_fish_active ON pond_fish(farm_id,harvested_at);
CREATE TABLE coop_chickens (
  id INTEGER PRIMARY KEY AUTOINCREMENT, farm_id TEXT NOT NULL REFERENCES farm_coops(farm_id) ON DELETE CASCADE,
  added_at INTEGER NOT NULL, ready_at INTEGER NOT NULL, growth_ms INTEGER NOT NULL CHECK(growth_ms>0),
  egg_ms INTEGER NOT NULL CHECK(egg_ms>0), max_eggs INTEGER NOT NULL CHECK(max_eggs BETWEEN 1 AND 9),
  feed_started_at INTEGER, eggs_claimed INTEGER NOT NULL DEFAULT 0 CHECK(eggs_claimed>=0)
);
CREATE INDEX coop_chickens_farm ON coop_chickens(farm_id);
CREATE TABLE vac_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  action TEXT NOT NULL, item_id TEXT, quantity INTEGER, entity_id INTEGER, request_key TEXT NOT NULL,
  created_at INTEGER NOT NULL, UNIQUE(farm_id,request_key)
);
CREATE TABLE vac_request_receipts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_key TEXT NOT NULL, action TEXT NOT NULL, payload_hash TEXT NOT NULL,
  response_json TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(user_id,request_key)
);
INSERT INTO farm_ponds SELECT id FROM farms;
INSERT INTO farm_coops SELECT id FROM farms;
UPDATE player_states SET x=990,y=780 WHERE scene='farm' AND x BETWEEN 996 AND 1304 AND y BETWEEN 696 AND 869;
UPDATE player_states SET x=1010,y=425 WHERE scene='farm' AND x BETWEEN 1036 AND 1294 AND y BETWEEN 346 AND 504;
`;

const migration5 = `
CREATE TABLE farm_buildings (id INTEGER PRIMARY KEY AUTOINCREMENT, farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE, definition_id TEXT NOT NULL, tile_x INTEGER NOT NULL, tile_y INTEGER NOT NULL, rotation INTEGER NOT NULL CHECK(rotation IN (0,1,2,3)), state TEXT NOT NULL DEFAULT 'PLACED' CHECK(state='PLACED'), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX farm_buildings_farm ON farm_buildings(farm_id);
CREATE TABLE farm_decorations (id INTEGER PRIMARY KEY AUTOINCREMENT, farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE, definition_id TEXT NOT NULL, tile_x INTEGER NOT NULL, tile_y INTEGER NOT NULL, rotation INTEGER NOT NULL CHECK(rotation IN (0,1,2,3)), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX farm_decorations_farm ON farm_decorations(farm_id);
CREATE TABLE farm_expansions (farm_id TEXT PRIMARY KEY REFERENCES farms(id) ON DELETE CASCADE, level INTEGER NOT NULL DEFAULT 0 CHECK(level BETWEEN 0 AND 2), updated_at INTEGER NOT NULL);
INSERT INTO farm_expansions(farm_id,level,updated_at) SELECT id,0,strftime('%s','now')*1000 FROM farms;
CREATE TABLE crafting_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE, building_id INTEGER NOT NULL REFERENCES farm_buildings(id) ON DELETE RESTRICT, recipe_id TEXT NOT NULL, recipe_version INTEGER NOT NULL, output_item TEXT NOT NULL, output_quantity INTEGER NOT NULL CHECK(output_quantity BETWEEN 1 AND 999), quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 20), started_at INTEGER NOT NULL, duration_ms INTEGER NOT NULL CHECK(duration_ms>0), status TEXT NOT NULL CHECK(status IN ('PROCESSING','READY','CLAIMED')), claimed_at INTEGER);
CREATE INDEX crafting_jobs_building ON crafting_jobs(building_id,status);
CREATE TABLE phase5_receipts (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, request_key TEXT NOT NULL, action TEXT NOT NULL, payload_hash TEXT NOT NULL, response_json TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(user_id,request_key));
`;

const migration6 = `
CREATE TABLE player_quests (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','COMPLETED','CLAIMED')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  updated_at INTEGER NOT NULL,
  claimed_at INTEGER,
  PRIMARY KEY(user_id,quest_id,day_key)
);
CREATE INDEX player_quests_user_status ON player_quests(user_id,status);
CREATE TABLE quest_request_receipts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_key TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,request_key)
);
CREATE TABLE quest_reward_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount>0),
  balance_after INTEGER NOT NULL,
  request_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id,quest_id,day_key)
);
`;

const migration7 = `
CREATE TABLE farm_visit_requests (
  id TEXT PRIMARY KEY, farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','approved','denied')),
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, decided_at INTEGER
);
CREATE INDEX farm_visit_requests_farm ON farm_visit_requests(farm_id,status,expires_at);
CREATE INDEX farm_visit_requests_visitor ON farm_visit_requests(visitor_id,expires_at);
CREATE TABLE farm_invites (
  id TEXT PRIMARY KEY, farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX farm_invites_visitor ON farm_invites(visitor_id,expires_at);
`;

export function openDatabase(file = process.env.DB_FILE || path.resolve('data/farm.sqlite')) {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const starter = path.resolve('data/starter.sqlite');
    if (!fs.existsSync(file) && fs.existsSync(starter) && path.resolve(file) !== starter) fs.copyFileSync(starter,file,fs.constants.COPYFILE_EXCL);
  }
  const db = new Database(file);
  try {
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
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 3').get()) db.transaction(() => {
    db.exec(migration3);
    db.prepare('INSERT INTO schema_migrations VALUES (3, ?, ?)').run('phase 3 market and economy', Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 4').get()) db.transaction(() => {
    db.exec(migration4);
    db.prepare('INSERT INTO schema_migrations VALUES (4, ?, ?)').run('phase 4 VAC', Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 5').get()) db.transaction(() => {
    db.exec(migration5);
    db.prepare('INSERT INTO schema_migrations VALUES (5, ?, ?)').run('phase 5 crafting and construction', Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 6').get()) db.transaction(() => {
    db.exec(migration6);
    db.prepare('INSERT INTO schema_migrations VALUES (6, ?, ?)').run('phase 6 living village', Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 7').get()) db.transaction(() => {
    db.exec(migration7);
    db.prepare('INSERT INTO schema_migrations VALUES (7, ?, ?)').run('phase 7 social farms', Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 8').get()) db.transaction(() => {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER' CHECK(role IN ('USER','ADMIN'));\nCREATE TABLE admin_audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, action TEXT NOT NULL, amount INTEGER NOT NULL, transaction_id INTEGER REFERENCES economy_transactions(id), created_at INTEGER NOT NULL);");
    db.prepare('INSERT INTO schema_migrations VALUES (8, ?, ?)').run('admin role and seed audit', Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 9').get()) db.transaction(() => {
    db.exec(`CREATE TABLE farm_soil_tiles_v9 (
      farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      tile_x INTEGER NOT NULL CHECK(tile_x BETWEEN 0 AND 7),tile_y INTEGER NOT NULL CHECK(tile_y BETWEEN 0 AND 3),
      state TEXT NOT NULL CHECK(state IN ('TILLED','WATERED','PLANTED')),updated_at INTEGER NOT NULL,PRIMARY KEY(farm_id,tile_x,tile_y));
      CREATE TABLE farm_crops_v9 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
        tile_x INTEGER NOT NULL,tile_y INTEGER NOT NULL,crop_id TEXT NOT NULL,planted_at INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL CHECK(duration_ms>0),bonus_ms INTEGER NOT NULL DEFAULT 0 CHECK(bonus_ms>=0),
        watered_at INTEGER,harvested_at INTEGER,yield_quantity INTEGER NOT NULL CHECK(yield_quantity>0),
        FOREIGN KEY(farm_id,tile_x,tile_y) REFERENCES farm_soil_tiles_v9(farm_id,tile_x,tile_y) ON DELETE CASCADE);
      INSERT INTO farm_soil_tiles_v9 SELECT * FROM farm_soil_tiles;
      INSERT INTO farm_crops_v9 SELECT * FROM farm_crops;
      UPDATE sqlite_sequence SET seq=MAX(seq,COALESCE((SELECT seq FROM sqlite_sequence WHERE name='farm_crops'),0)) WHERE name='farm_crops_v9';
      DROP TABLE farm_crops;DROP TABLE farm_soil_tiles;
      ALTER TABLE farm_soil_tiles_v9 RENAME TO farm_soil_tiles;
      ALTER TABLE farm_crops_v9 RENAME TO farm_crops;
      CREATE UNIQUE INDEX one_active_crop_per_tile ON farm_crops(farm_id,tile_x,tile_y) WHERE harvested_at IS NULL;
      CREATE INDEX farm_crops_farm ON farm_crops(farm_id,harvested_at);
      CREATE TABLE farm_plot_expansions (
      farm_id TEXT PRIMARY KEY REFERENCES farms(id) ON DELETE CASCADE,
      unlocked_count INTEGER NOT NULL DEFAULT 5 CHECK(unlocked_count BETWEEN 5 AND 32),
      purchased_count INTEGER NOT NULL DEFAULT 0 CHECK(purchased_count>=0),updated_at INTEGER NOT NULL);
      CREATE TABLE farm_plot_receipts (
        farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,request_key TEXT NOT NULL,
        plot_count INTEGER NOT NULL,amount INTEGER NOT NULL,transaction_id INTEGER NOT NULL REFERENCES economy_transactions(id),
        created_at INTEGER NOT NULL,PRIMARY KEY(farm_id,request_key));
      INSERT INTO farm_plot_expansions(farm_id,unlocked_count,purchased_count,updated_at)
      SELECT f.id,MAX(5,COALESCE((SELECT MAX(tile_y*8+tile_x+1) FROM farm_soil_tiles WHERE farm_id=f.id),0),
        COALESCE((SELECT MAX(tile_y*8+tile_x+1) FROM farm_crops WHERE farm_id=f.id),0)),0,strftime('%s','now')*1000 FROM farms f;`);
    db.prepare('INSERT INTO schema_migrations VALUES (9, ?, ?)').run('square field and paid plot unlocks',Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 10').get()) db.transaction(() => {
    db.exec(`CREATE TABLE farm_onboarding (
      farm_id TEXT PRIMARY KEY REFERENCES farms(id) ON DELETE CASCADE,
      step INTEGER NOT NULL DEFAULT 0 CHECK(step BETWEEN 0 AND 7),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SKIPPED','DONE')),
      fast_crop_id INTEGER REFERENCES farm_crops(id),updated_at INTEGER NOT NULL);`);
    db.prepare('INSERT INTO schema_migrations VALUES (10, ?, ?)').run('persistent first harvest tutorial',Date.now());
  })();
  if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version = 11').get()) db.transaction(() => {
    db.exec(`CREATE TABLE farm_mango_trees (
      farm_id TEXT PRIMARY KEY REFERENCES farms(id) ON DELETE CASCADE,
      harvest_count INTEGER NOT NULL DEFAULT 0 CHECK(harvest_count>=0),
      ready_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
      CREATE TABLE mango_receipts (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      request_key TEXT NOT NULL,farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK(quantity>0),created_at INTEGER NOT NULL,
      PRIMARY KEY(user_id,request_key));`);
    const at=Date.now();
    db.prepare('INSERT INTO farm_mango_trees(farm_id,ready_at,updated_at) SELECT id,?,? FROM farms').run(at+MANGO_CYCLE_MS,at);
    db.prepare('INSERT INTO schema_migrations VALUES (11, ?, ?)').run('four-hour mango tree growth and harvests',at);
  })();
  if (file !== ':memory:' && path.resolve(file) !== path.resolve('data/starter.sqlite') &&
      db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='farm_objects'").get()) seedAdmin(db);
  return db;
  } catch (error) { db.close(); throw error; }
}
