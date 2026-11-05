import path from 'node:path';
import { mkdirSync } from 'node:fs';
import Database from 'better-sqlite3';
import { createFarm } from '../server/farms.js';
import { createWallet, credit, balance } from '../server/economy.js';

const username = process.argv[2];
if (!username) throw new Error('Usage: node scripts/promote-admin.mjs <username>');
const file = process.env.DB_FILE || path.resolve('data/farm.sqlite');
const db = new Database(file, { fileMustExist: true });
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
try {
  const user = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (!user) throw new Error('Account does not exist.');
  mkdirSync('data/backups', { recursive: true });
  const backup = path.resolve('data/backups', `before-admin-promotion-${Date.now()}.sqlite`);
  await db.backup(backup);
  const result = db.transaction(() => {
    const at = Date.now();
    const changed = db.prepare("UPDATE users SET role='ADMIN' WHERE id=? AND role<>'ADMIN'").run(user.id).changes;
    if (changed) db.prepare('INSERT INTO admin_audit_log(user_id,action,amount,created_at) VALUES (?,?,0,?)')
      .run(user.id, 'MANUAL_PROMOTION', at);
    const farm = createFarm(db, user.id, 'Nông trại Admin');
    createWallet(db, user.id);
    const granted = db.prepare("SELECT 1 FROM admin_audit_log WHERE user_id=? AND action='INITIAL_GRANT'").get(user.id);
    if (!granted) {
      const amount = Math.max(0, 999_999_999 - balance(db, user.id));
      const after = amount ? credit(db, user.id, amount, at) : balance(db, user.id);
      const transaction = db.prepare(`INSERT INTO economy_transactions
        (user_id,farm_id,kind,delta,balance_after,request_key,created_at)
        VALUES (?,?,'starter',?,?,?,?)`).run(user.id, farm.id, amount, after, 'admin-seed-v1', at);
      db.prepare('INSERT INTO admin_audit_log(user_id,action,amount,transaction_id,created_at) VALUES (?,?,?,?,?)')
        .run(user.id, 'INITIAL_GRANT', amount, transaction.lastInsertRowid, at);
    }
    return { username, role: 'ADMIN', balance: balance(db, user.id), alreadyGranted: Boolean(granted) };
  }).immediate();
  console.log(JSON.stringify({ ...result, backup }));
} finally {
  db.close();
}
