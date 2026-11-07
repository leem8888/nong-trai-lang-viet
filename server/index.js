import { onboardingState, skipOnboarding } from './onboarding.js';
import { mangoState, harvestMango } from './mango.js';
import { bananaState, harvestBanana } from './banana.js';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import { openDatabase } from './db.js';
import { register, login, session, issueSession, clearSession } from './auth.js';
import { createFarm, farmFor, snapshot } from './farms.js';
import { inRange, validMovement } from './world.js';
import { farmingState, performFarmAction } from './crops.js';
import { marketState, performMarketAction } from './economy.js';
import { vacState, performVacAction } from './vac.js';
import { phase5State, performPhase5Action } from './phase5.js';
import {worldConfig} from './livingWorld.js';
import {villageState,performNpcInteraction} from './village.js';
import {questState,performQuestAction} from './quests.js';
import { createSocial } from './social.js';
const uuidFarm = value => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value);

export function createApp(db = openDatabase(),{worldNow=Date.now,questNow=Date.now,worldSettings=worldConfig()}={}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8kb' }));
  app.use(express.static(path.resolve('public')));
  const server = http.createServer(app);
  const io = new Server(server, { maxHttpBufferSize: 8192 });
  const social = createSocial(db, io);
  const attempts = new Map();
  const guard = (req,res,next) => {
    req.auth = session(db,req);
    if (!req.auth) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
    next();
  };
  const csrf = (req,res,next) => req.get('x-csrf-token') === req.auth.csrf ? next() : res.status(403).json({error:'CSRF token không hợp lệ.'});
  const ownerAction = (req,res,next) => social.isVisiting(req.auth.user_id) ? res.status(403).json({error:'Hãy về nông trại của bạn trước khi thao tác.'}) : next();
  const fail = (res,error) => res.status(400).json({error:error.message});
  app.get('/api/onboarding',guard,(req,res)=>res.json(onboardingState(db,req.auth.user_id)));
  app.post('/api/onboarding/skip',guard,csrf,ownerAction,(req,res)=>res.json(skipOnboarding(db,req.auth.user_id)));
  app.get('/api/mango',guard,(req,res)=>{const state=mangoState(db,req.auth.user_id);return state?res.json(state):res.status(404).json({error:'Chưa tạo nông trại.'});});
  app.post('/api/mango/action',guard,csrf,ownerAction,(req,res)=>{
    try{const result=harvestMango(db,req.auth.user_id,req.body);
      io.to(`farm:${result.state.farmId}`).emit('farm:mango',result.state);
      io.to(`farm:${result.state.farmId}`).emit('farm:farming',farmingState(db,req.auth.user_id));
      io.to(`farm:${result.state.farmId}`).emit('farm:market',marketState(db,req.auth.user_id));
      social.broadcastFarm(result.state.farmId);res.json({ok:true,...result});
    }catch(error){fail(res,error);}
  });
  app.get('/api/banana',guard,(req,res)=>{const state=bananaState(db,req.auth.user_id);return state?res.json(state):res.status(404).json({error:'Chưa tạo nông trại.'});});
  app.post('/api/banana/action',guard,csrf,ownerAction,(req,res)=>{
    try{const result=harvestBanana(db,req.auth.user_id,req.body);
      io.to(`farm:${result.state.farmId}`).emit('farm:banana',result.state);
      io.to(`farm:${result.state.farmId}`).emit('farm:farming',farmingState(db,req.auth.user_id));
      io.to(`farm:${result.state.farmId}`).emit('farm:market',marketState(db,req.auth.user_id));
      social.broadcastFarm(result.state.farmId);res.json({ok:true,...result});
    }catch(error){fail(res,error);}
  });
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
  app.get('/api/me',guard,(req,res) => res.json({user:{id:req.auth.user_id,username:req.auth.username,role:req.auth.role},csrf:req.auth.csrf,farm:farmFor(db,req.auth.user_id)}));
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
  app.get('/api/social/search',guard,(req,res)=>{try{res.json(social.search(req.auth.user_id,req.query.q,Number(req.query.page||0)));}catch(error){fail(res,error);}});
  app.get('/api/social/settings',guard,(req,res)=>{try{res.json(social.settings(req.auth.user_id));}catch(error){fail(res,error);}});
  app.post('/api/social/settings',guard,csrf,(req,res)=>{try{res.json(social.setPrivacy(req.auth.user_id,req.body?.privacy));}catch(error){fail(res,error);}});
  app.get('/api/social/requests',guard,(req,res)=>{try{res.json({requests:social.requests(req.auth.user_id)});}catch(error){fail(res,error);}});
  app.post('/api/social/requests',guard,csrf,(req,res)=>{try{res.json(social.request(req.auth.user_id,req.body?.farmId));}catch(error){fail(res,error);}});
  app.post('/api/social/requests/decide',guard,csrf,(req,res)=>{try{res.json(social.decide(req.auth.user_id,req.body?.id,req.body?.approve));}catch(error){fail(res,error);}});
  app.get('/api/social/invites',guard,(req,res)=>{try{res.json({invites:social.invites(req.auth.user_id)});}catch(error){fail(res,error);}});
  app.post('/api/social/invites',guard,csrf,(req,res)=>{try{res.json(social.invite(req.auth.user_id,req.body?.username));}catch(error){fail(res,error);}});
  app.post('/api/social/kick',guard,csrf,(req,res)=>{try{res.json(social.kick(req.auth.user_id,req.body?.visitorId));}catch(error){fail(res,error);}});
  const farmActions = new Map();
  app.get('/api/farming',guard,(req,res) => {
    const state=farmingState(db,req.auth.user_id);
    return state ? res.json(state) : res.status(404).json({error:'Chưa tạo nông trại.'});
  });
  app.post('/api/farming/action',guard,csrf,ownerAction,(req,res) => {
    const key=req.auth.user_id, current=Date.now(), previous=farmActions.get(key)||0;
    if (current-previous<120) return res.status(429).json({error:'Thao tác quá nhanh.'});
    farmActions.set(key,current);
    try {
      const result=performFarmAction(db,key,req.body);
      io.to(`farm:${result.state.farmId}`).emit('farm:farming',result.state);
      if(req.body.action==='unlock_plot')io.to(`farm:${result.state.farmId}`).emit('farm:market',marketState(db,key));
      social.broadcastFarm(result.state.farmId);
      io.to(`farm:${result.state.farmId}`).emit('farm:quests',questState(db,key));
      res.json({ok:true,...result});
    } catch(error) { fail(res,error); }
  });
  const marketActions=new Map();
  app.get('/api/market',guard,(req,res)=>{
    const state=marketState(db,req.auth.user_id);
    return state?res.json(state):res.status(404).json({error:'Chưa tạo nông trại.'});
  });
  app.post('/api/market/action',guard,csrf,ownerAction,(req,res)=>{
    const key=req.auth.user_id,current=Date.now(),previous=marketActions.get(key);
    if(previous&&current-previous.at<120&&req.body?.requestId!==previous.requestId&&!(typeof req.body?.requestId==='string'&&db.prepare('SELECT 1 FROM economy_request_receipts WHERE user_id=? AND request_key=?').get(key,req.body.requestId)))return res.status(429).json({error:'Thao tác quá nhanh.'});
    marketActions.set(key,{at:current,requestId:req.body?.requestId});
    try {
      const result=performMarketAction(db,key,req.body);
      io.to(`farm:${result.state.farmId}`).emit('farm:market',result.state);
      res.json({ok:true,...result});
    } catch(error) { fail(res,error); }
  });
  const vacActions=new Map();
  app.get('/api/vac',guard,(req,res)=>{
    const state=vacState(db,req.auth.user_id);
    return state?res.json(state):res.status(404).json({error:'Chưa tạo nông trại.'});
  });
  app.post('/api/vac/action',guard,csrf,ownerAction,(req,res)=>{
    const key=req.auth.user_id,current=Date.now(),previous=vacActions.get(key);
    if(previous&&current-previous.at<120&&req.body?.requestId!==previous.requestId&&!(typeof req.body?.requestId==='string'&&db.prepare('SELECT 1 FROM vac_request_receipts WHERE user_id=? AND request_key=?').get(key,req.body.requestId)))return res.status(429).json({error:'Thao tác quá nhanh.'});
    vacActions.set(key,{at:current,requestId:req.body?.requestId});
    try{
      const result=performVacAction(db,key,req.body);
      io.to(`farm:${result.state.farmId}`).emit('farm:vac',result.state);
      social.broadcastFarm(result.state.farmId);
      res.json({ok:true,...result});
    }catch(error){fail(res,error);}
  });
  const phase5Actions=new Map();
  app.get('/api/phase5',guard,(req,res)=>{const state=phase5State(db,req.auth.user_id);return state?res.json(state):res.status(404).json({error:'Chưa tạo nông trại.'});});
  app.post('/api/phase5/action',guard,csrf,ownerAction,(req,res)=>{
    const key=req.auth.user_id,current=Date.now(),previous=phase5Actions.get(key);
    if(previous&&current-previous.at<100&&req.body?.requestId!==previous.requestId&&!(typeof req.body?.requestId==='string'&&db.prepare('SELECT 1 FROM phase5_receipts WHERE user_id=? AND request_key=?').get(key,req.body.requestId)))return res.status(429).json({error:'Thao tác quá nhanh.'});
    phase5Actions.set(key,{at:current,requestId:req.body?.requestId});
    try{const result=performPhase5Action(db,req.auth.user_id,req.body);io.to(`farm:${result.state.farmId}`).emit('farm:phase5',result.state);social.broadcastFarm(result.state.farmId);res.json({ok:true,...result});}catch(error){fail(res,error);}
  });
  const villageActions=new Map();
  app.get('/api/village',guard,(req,res)=>{const state=villageState(db,req.auth.user_id,worldNow(),questNow(),worldSettings);return state?res.json(state):res.status(404).json({error:'Chưa tạo nông trại.'});});
  const villageLimit=(req,res,next)=>{const key=req.auth.user_id,at=Date.now(),last=villageActions.get(key)||0;
    if(at-last<100&&!(typeof req.body?.requestId==='string'&&db.prepare('SELECT 1 FROM quest_request_receipts WHERE user_id=? AND request_key=?').get(key,req.body.requestId)))return res.status(429).json({error:'Thao tác quá nhanh.'});
    villageActions.set(key,at);next();};
  app.post('/api/village/interact',guard,csrf,ownerAction,villageLimit,(req,res)=>{try{const result=performNpcInteraction(db,req.auth.user_id,req.body,worldNow(),questNow(),worldSettings);io.to(`farm:${result.state.farmId}`).emit('farm:quests',result.state.quests);res.json({ok:true,...result});}catch(error){fail(res,error);}});
  app.post('/api/village/quest',guard,csrf,ownerAction,villageLimit,(req,res)=>{try{const result=performQuestAction(db,req.auth.user_id,req.body,questNow(),worldSettings,worldNow());io.to(`farm:${result.state.farmId}`).emit('farm:quests',result.state);io.to(`farm:${result.state.farmId}`).emit('farm:market',marketState(db,req.auth.user_id));res.json({ok:true,...result});}catch(error){fail(res,error);}});
  io.use((socket,next) => {
    const auth = session(db,socket.request);
    if (!auth) return next(new Error('unauthorized'));
    socket.data.auth = auth;
    next();
  });
  io.on('connection',socket => {
    const auth = socket.data.auth;
    socket.join(`user:${auth.user_id}`);
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
      socket.data.socialRevoked = false;
      joined=farm.id; socket.join(`farm:${joined}`);
      const state=db.prepare('SELECT scene FROM player_states WHERE user_id=?').get(auth.user_id);
      if (state?.scene === 'farm') social.join(socket, farm.id, true);
      ack(cb,{ok:true,snapshot:snapshot(db,auth.user_id),presence:1});
    });
    socket.on('farm:leave',(_payload,cb) => { if (!allowed(cb)) return; social.leave(socket); if (joined) socket.leave(`farm:${joined}`); joined=null; ack(cb,{ok:true}); });
    socket.on('social:join',(payload,cb)=>{
      if (!allowed(cb)) return;
      try { if (!joined || !uuidFarm(payload?.farmId)) throw Error('Nông trại không hợp lệ.'); const result=social.join(socket,payload.farmId,false);socket.data.socialRevoked=false;ack(cb,{ok:true,...result}); }
      catch(error){ack(cb,{ok:false,error:error.message});}
    });
    socket.on('social:leave',(_payload,cb)=>{if(!session(db,socket.request)){ack(cb,{ok:false,error:'Phiên đã hết hạn.'});socket.disconnect(true);return;}social.leave(socket);socket.data.socialRevoked=false;const own=farmFor(db,auth.user_id);if(own&&db.prepare('SELECT scene FROM player_states WHERE user_id=?').get(auth.user_id)?.scene==='farm')social.join(socket,own.id,true);ack(cb,{ok:true});});
    socket.on('social:emote',(payload,cb)=>{
      if(!allowed(cb))return;
      const s=socket.data.social,at=Date.now();
      if(!s||!social.canStay(socket)){socket.data.socialRevoked=true;social.leave(socket,'revoked');return ack(cb,{ok:false,error:'Không còn quyền ở nông trại.'});}
      if(!['wave','hello','thanks','happy'].includes(payload?.emote)||at-s.lastEmote<2000)return ack(cb,{ok:false,error:'Biểu cảm không hợp lệ hoặc quá nhanh.'});
      s.lastEmote=at;io.to(`social:${s.farmId}`).emit('social:emote',{userId:auth.user_id,emote:payload.emote,at});ack(cb,{ok:true});
    });
    socket.on('player:move',(payload,cb) => {
      if (!allowed(cb)) return;
      if (!joined || !payload || typeof payload !== 'object') return ack(cb,{ok:false,error:'Chưa vào nông trại.'});
      if (socket.data.socialRevoked) return ack(cb,{ok:false,error:'Hãy về nông trại của bạn.',player:db.prepare('SELECT x,y FROM player_states WHERE user_id=?').get(auth.user_id)});
      const visit=socket.data.social;
      if(visit?.role==='visitor'){
        if(!social.canStay(socket)){socket.data.socialRevoked=true;social.leave(socket,'revoked');return ack(cb,{ok:false,error:'Không còn quyền ở nông trại.'});}
        const at=Date.now(),elapsed=visit.lastMove?at-visit.lastMove:500;
        if(!Number.isSafeInteger(payload.seq)||payload.seq<=visit.lastSeq||!['up','down','left','right'].includes(payload.direction)||!validMovement(visit,payload.x,payload.y,elapsed,'farm',db,visit.farmId))return ack(cb,{ok:false,error:'Vị trí không hợp lệ.',player:visit});
        Object.assign(visit,{x:payload.x,y:payload.y,direction:payload.direction,lastMove:at,lastSeq:payload.seq});
        socket.to(`social:${visit.farmId}`).emit('social:move',{userId:auth.user_id,x:visit.x,y:visit.y,direction:visit.direction});
        return ack(cb,{ok:true});
      }
      const state=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=?').get(auth.user_id);
      const current=Date.now(), elapsed=lastMove ? current-lastMove : 500;
      if (!['up','down','left','right'].includes(payload.direction) || !validMovement(state,payload.x,payload.y,elapsed,state.scene,db,joined)) return ack(cb,{ok:false,error:'Vị trí không hợp lệ.',player:state});
      db.prepare('UPDATE player_states SET x=?,y=?,direction=?,updated_at=? WHERE user_id=?').run(payload.x,payload.y,payload.direction,current,auth.user_id);
      lastMove=current; ack(cb,{ok:true});
      if(socket.data.social?.role==='owner'){
        Object.assign(socket.data.social,{x:payload.x,y:payload.y,direction:payload.direction});
        socket.to(`social:${joined}`).emit('social:move',{userId:auth.user_id,x:payload.x,y:payload.y,direction:payload.direction});
      }
    });
    socket.on('world:travel',(payload,cb)=>{
      if(!allowed(cb))return;
      if(!joined||socket.data.socialRevoked||socket.data.social?.role==='visitor'||!payload||typeof payload!=='object')return ack(cb,{ok:false,error:'Chưa vào nông trại.'});
      const state=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=? AND farm_id=?').get(auth.user_id,joined);
      const destination=state?.scene==='farm'?'market':'farm';
      const point=state?.scene==='farm'?'farmGate':'returnGate';
      if(!state||payload.to!==destination||!inRange(state,point))return ack(cb,{ok:false,error:'Hãy đến gần cổng để chuyển cảnh.'});
      const spawn=destination==='market'?{x:600,y:620}:{x:720,y:790};
      db.prepare('UPDATE player_states SET scene=?,x=?,y=?,direction=?,updated_at=? WHERE user_id=?').run(destination,spawn.x,spawn.y,'down',Date.now(),auth.user_id);
      lastMove=Date.now();
      if(destination==='market')social.leave(socket);else social.join(socket,joined,true);
      ack(cb,{ok:true,scene:destination,...spawn});
    });
    socket.on('farm:interact',(payload,cb) => {
      if (!allowed(cb)) return;
      if (!joined || socket.data.socialRevoked || socket.data.social?.role==='visitor' || !payload || payload.objectId !== 'lamp') return ack(cb,{ok:false,error:'Tương tác không hợp lệ.'});
      const player=db.prepare('SELECT x,y,scene FROM player_states WHERE user_id=?').get(auth.user_id);
      if (!inRange(player,'lamp')) return ack(cb,{ok:false,error:'Bạn đang ở quá xa.'});
      const state=db.transaction(() => {
        db.prepare('UPDATE farm_objects SET state=1-state WHERE farm_id=? AND object_id=?').run(joined,'lamp');
        return db.prepare('SELECT state FROM farm_objects WHERE farm_id=? AND object_id=?').get(joined,'lamp').state;
      })();
      io.to(`farm:${joined}`).emit('farm:object',{objectId:'lamp',state});
      social.broadcastFarm(joined);
      ack(cb,{ok:true,state});
    });
    socket.on('disconnect',()=>social.leave(socket,'disconnect'));
  });
  return {app,server,io,db};
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('server/index.js')) {
  const {server}=createApp();
  server.listen(Number(process.env.PORT)||3000,() => console.log(`Farm server listening on ${server.address().port}`));
}
