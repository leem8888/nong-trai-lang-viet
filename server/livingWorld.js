const DEFAULT_EPOCH=Date.UTC(2026,0,1);
const WEATHER=['sunny','cloudy','rainy'];
const SEASONS=['spring','summer','autumn','winter'];
const PERIODS=[{from:5,to:11,id:'morning',name:'Sáng'},{from:11,to:17,id:'noon',name:'Trưa'},{from:17,to:19,id:'afternoon',name:'Chiều'}];

function positive(value,defaultValue,name){const n=value===undefined?defaultValue:Number(value);if(!Number.isSafeInteger(n)||n<1||n>365*86400000)throw Error(`${name} không hợp lệ.`);return n;}
export function worldConfig(env=process.env){
  const epoch=env.WORLD_EPOCH_MS===undefined?DEFAULT_EPOCH:Number(env.WORLD_EPOCH_MS);
  if(!Number.isSafeInteger(epoch)||epoch<0)throw Error('WORLD_EPOCH_MS không hợp lệ.');
  const dayMs=positive(env.WORLD_DAY_MS,24*60000,'WORLD_DAY_MS');
  const weatherMs=positive(env.WEATHER_SLOT_MS,8*60000,'WEATHER_SLOT_MS');
  const seasonMs=positive(env.SEASON_MS,7*86400000,'SEASON_MS');
  const seed=env.WEATHER_SEED??'lang-viet-v1';
  if(typeof seed!=='string'||seed.length<1||seed.length>80)throw Error('WEATHER_SEED không hợp lệ.');
  return {epoch,dayMs,weatherMs,seasonMs,seed};
}
function hash(s){let h=2166136261;for(const char of s){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function worldContext(at=Date.now(),config=worldConfig()){
  if(!Number.isSafeInteger(at)||at<0)throw Error('Thời gian không hợp lệ.');
  const elapsed=Math.max(0,at-config.epoch),minute=(elapsed%config.dayMs)/config.dayMs*1440,hour=Math.floor(minute/60);
  const period=PERIODS.find(p=>hour>=p.from&&hour<p.to)||{id:'night',name:'Tối'};
  const weatherSlot=Math.floor(elapsed/config.weatherMs),weather=WEATHER[hash(`${config.seed}:${weatherSlot}`)%WEATHER.length];
  const seasonIndex=Math.floor(elapsed/config.seasonMs)%4;
  return {serverTime:at,cycleEpoch:config.epoch,dayMs:config.dayMs,worldMinute:minute,timeOfDay:period.id,timeName:period.name,
    weather,weatherSlot,weatherNextAt:config.epoch+(weatherSlot+1)*config.weatherMs,season:SEASONS[seasonIndex],seasonIndex,
    seasonNextAt:config.epoch+(Math.floor(elapsed/config.seasonMs)+1)*config.seasonMs};
}
