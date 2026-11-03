import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import { openDatabase } from './db.js';
import { register, login, session, issueSession, clearSession } from './auth.js';
import { createFarm, farmFor, snapshot } from './farms.js';
import { inRange, validMovement } from './world.js';

export function createApp(db = openDatabase()) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8kb' }));
  app.use(express.static(path.resolve('public')));
  const server = http.createServer(app);
  const io = new Server(server, { maxHttpBufferSize: 8192 });
  const attempts = new Map();
  const guard = (req,res,next) => {
    req.auth = session(db,req);
    if (!req.auth) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
    next();
  };
  const csrf = (req,res,next) => req.get('x-csrf-token') === req.auth.csrf ? next() : res.status(403).json({error:'CSRF token không hợp lệ.'});
  const fail = (res,error) => res.status(400).json({error:error.message});
  app.get('/api/health',(_req,res) => res.json({ok:true}));
  for (const route of ['register','login']) app.post(`/api/${route}`,(req,res) => {
    const ip = req.ip, entry = attempts.get(ip) || { count: 0, until: 0 };
    if (entry.until > Date.now()) return res.status(429).json({error:'Thử lại sau ít phút.'});
    try {
      const user = route === 'register' ? register(db,req.body?.username,req.body?.password) : login(db,req.body?.username,req.body?.password);
      attempts.delete(ip);
      res.json({user,csrf:issueSession(db,res,user),farm:farmFor(db,user.id)});
    } catch (error) {
      entry.count++; entry.until = entry.count >= 6 ? Date.now()+60000 : 0; attempts.set(ip,entry);
      fail(res,error);
    }
  });
  app.get('/api/me',guard,(req,res) => res.json({user:{id:req.auth.user_id,username:req.auth.username},csrf:req.auth.csrf,farm:farmFor(db,req.auth.user_id)}));
  app.post('/api/logout',guard,csrf,(req,res) => { clearSession(db,req,res); res.json({ok:true}); });
  app.post('/api/farms',guard,csrf,(req,res) => {
    try { res.json({farm:createFarm(db,req.auth.user_id,req.body?.name)}); } catch(error) { fail(res,error); }
  });
  app.get('/api/farm',guard,(req,res) => {
    const state = snapshot(db,req.auth.user_id);
    return state ? res.json(state) : res.status(404).json({error:'Chưa tạo nông trại.'});
  });
  app.get('/api/farms/:id',guard,(req,res) => {
    const state = snapshot(db,req.auth.user_id);
    return state?.farm.id === req.params.id ? res.json(state) : res.status(403).json({error:'Không có quyền truy cập.'});
  });
  io.use((socket,next) => {
    const auth = session(db,socket.request);
    if (!auth) return next(new Error('unauthorized'));
    socket.data.auth = auth;
    next();
  });
  io.on('connection',socket => {
    const auth = socket.data.auth;
    let joined = null, lastMove = 0, tokens = 30, lastRefill = Date.now();
    const ack = (cb,result) => { if (typeof cb === 'function') cb(result); };
    const allowed = cb => {
      if (!session(db,socket.request)) { ack(cb,{ok:false,error:'Phiên đã hết hạn.'}); socket.disconnect(true); return false; }
      const time=Date.now(); tokens=Math.min(30,tokens+(time-lastRefill)*.01); lastRefill=time;
      if (tokens<1) { ack(cb,{ok:false,error:'Thao tác quá nhanh.'}); return false; }
      tokens--; return true;
    };
    socket.on('farm:join',(payload,cb) => {
      if (!allowed(cb)) return;
      const farm=farmFor(db,auth.user_id);
      if (!farm || typeof payload !== 'object' || payload?.farmId !== farm.id) return ack(cb,{ok:false,error:'Không có quyền vào nông trại.'});
      if (joined) socket.leave(`farm:${joined}`);
      joined=farm.id; socket.join(`farm:${joined}`);
      ack(cb,{ok:true,snapshot:snapshot(db,auth.user_id),presence:1});
    });
    socket.on('farm:leave',(_payload,cb) => { if (!allowed(cb)) return; if (joined) socket.leave(`farm:${joined}`); joined=null; ack(cb,{ok:true}); });
    socket.on('player:move',(payload,cb) => {
      if (!allowed(cb)) return;
      if (!joined || !payload || typeof payload !== 'object') return ack(cb,{ok:false,error:'Chưa vào nông trại.'});
      const state=db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(auth.user_id);
      const current=Date.now(), elapsed=lastMove ? current-lastMove : 500;
      if (!['up','down','left','right'].includes(payload.direction) || !validMovement(state,payload.x,payload.y,elapsed)) return ack(cb,{ok:false,error:'Vị trí không hợp lệ.',player:state});
      db.prepare('UPDATE player_states SET x=?,y=?,direction=?,updated_at=? WHERE user_id=?').run(payload.x,payload.y,payload.direction,current,auth.user_id);
      lastMove=current; ack(cb,{ok:true});
    });
    socket.on('farm:interact',(payload,cb) => {
      if (!allowed(cb)) return;
      if (!joined || !payload || payload.objectId !== 'lamp') return ack(cb,{ok:false,error:'Tương tác không hợp lệ.'});
      const player=db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(auth.user_id);
      if (!inRange(player,'lamp')) return ack(cb,{ok:false,error:'Bạn đang ở quá xa.'});
      const state=db.transaction(() => {
        db.prepare('UPDATE farm_objects SET state=1-state WHERE farm_id=? AND object_id=?').run(joined,'lamp');
        return db.prepare('SELECT state FROM farm_objects WHERE farm_id=? AND object_id=?').get(joined,'lamp').state;
      })();
      io.to(`farm:${joined}`).emit('farm:object',{objectId:'lamp',state});
      ack(cb,{ok:true,state});
    });
  });
  return {app,server,io,db};
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('server/index.js')) {
  const {server}=createApp();
  server.listen(Number(process.env.PORT)||3000,() => console.log(`Farm server listening on ${server.address().port}`));
}
