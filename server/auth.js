import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { now } from './time.js';
import { createWallet } from './economy.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const cookieName = 'farm_session';
export function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [salt, digest] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function register(db, username, password) {
  const clean = String(username ?? '').trim();
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(clean) || typeof password !== 'string' || password.length < 10 || password.length > 128) throw new Error('Tên tài khoản 3–24 ký tự; mật khẩu ít nhất 10 ký tự.');
  const id = randomUUID();
  db.transaction(()=>{
    db.prepare('INSERT INTO users(id,username,password_hash,created_at) VALUES (?,?,?,?)').run(id,clean,passwordHash(password),now());
    createWallet(db,id);
  })();
  return { id, username: clean, role: 'USER' };
}
export function login(db, username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(String(username ?? '').trim());
  if (!user || typeof password !== 'string' || !verifyPassword(password,user.password_hash)) throw new Error('Tên tài khoản hoặc mật khẩu không đúng.');
  return { id: user.id, username: user.username, role: user.role };
}
export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(x => x.trim().split('=').slice(0,2)).filter(x => x.length === 2));
}
export function session(db, request) {
  const token = parseCookies(request.headers.cookie)[cookieName];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare('SELECT s.*, u.username, u.role FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hash(token),now()) || null;
}
export function issueSession(db,res,user) {
  const token = randomBytes(32).toString('hex'), csrf = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO auth_sessions VALUES (?,?,?,?)').run(hash(token),user.id,csrf,now()+7*86400000);
  res.cookie(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',maxAge:7*86400000,path:'/'});
  return csrf;
}
export function clearSession(db,req,res) {
  const token = parseCookies(req.headers.cookie)[cookieName];
  if (token) db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(hash(token));
  res.clearCookie(cookieName,{path:'/'});
}
