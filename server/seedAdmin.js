import { randomUUID } from 'node:crypto';
import { passwordHash, verifyPassword } from './auth.js';
import { createWallet, credit, balance } from './economy.js';
import { createFarm } from './farms.js';
import { START_BALANCE } from './marketConfig.js';

const ADMIN_BALANCE = 999_999_999;

export function seedAdmin(db, env = process.env) {
  const local = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
  if (!local && env.NODE_ENV !== 'production') return null;
  const production = !local;
  const username = production ? env.ADMIN_USERNAME : 'admin';
  const password = production ? env.ADMIN_PASSWORD : 'admin';
  if (production && (!/^[a-zA-Z0-9_]{3,24}$/.test(username || '') ||
      typeof password !== 'string' || password.length < 12 || password.toLowerCase() === 'admin')) {
    throw new Error('Production requires ADMIN_USERNAME and a strong ADMIN_PASSWORD (at least 12 characters).');
  }
  return db.transaction(() => {
    if (production && username !== 'admin') {
      const old = db.prepare("SELECT password_hash FROM users WHERE username='admin' AND role='ADMIN'").get();
      if (old && verifyPassword('admin',old.password_hash)) throw new Error('Rotate the existing development admin password before production startup.');
    }
    let user = db.prepare('SELECT id,role,password_hash FROM users WHERE username=?').get(username);
    if (user && user.role !== 'ADMIN') throw new Error('Admin username already belongs to a regular account.');
    if (!user) {
      const id = randomUUID(), at = Date.now();
      db.prepare('INSERT INTO users(id,username,password_hash,created_at,role) VALUES (?,?,?,?,?)')
        .run(id,username,passwordHash(password),at,'ADMIN');
      user = { id, role: 'ADMIN' };
    } else if (production && verifyPassword('admin',user.password_hash)) {
      const at = Date.now();
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(passwordHash(password),user.id);
      db.prepare('INSERT INTO admin_audit_log(user_id,action,amount,created_at) VALUES (?,?,0,?)')
        .run(user.id,'DEFAULT_PASSWORD_ROTATED',at);
    }
    const farm = createFarm(db,user.id,'Nông trại Admin');
    if (createWallet(db,user.id)) {
      const at = Date.now(), amount = ADMIN_BALANCE - START_BALANCE;
      const after = credit(db,user.id,amount,at);
      const transactionId = db.prepare(`INSERT INTO economy_transactions
        (user_id,farm_id,kind,delta,balance_after,request_key,created_at)
        VALUES (?,?,'starter',?,?,?,?)`).run(user.id,farm.id,amount,after,'admin-seed-v1',at).lastInsertRowid;
      db.prepare('INSERT INTO admin_audit_log(user_id,action,amount,transaction_id,created_at) VALUES (?,?,?,?,?)')
        .run(user.id,'INITIAL_GRANT',amount,transactionId,at);
    }
    return { id:user.id, balance:balance(db,user.id) };
  })();
}
