// All progress is advanced inside the transaction of the verified gameplay action.
export const TUTORIAL_DURATION_MS = 45_000;
export function onboardingState(db,userId) {
  const row=db.prepare('SELECT o.* FROM farm_onboarding o JOIN farms f ON f.id=o.farm_id WHERE f.owner_id=?').get(userId);
  if(!row)return {eligible:false,status:'LEGACY',step:7};
  const crop=row.fast_crop_id?db.prepare('SELECT tile_x AS x,tile_y AS y,planted_at+duration_ms-bonus_ms AS readyAt,harvested_at AS harvestedAt FROM farm_crops WHERE id=?').get(row.fast_crop_id):null;
  return {eligible:true,status:row.status,step:row.step,crop:crop||null,serverTime:Date.now()};
}
export function onboardingEvent(db,farmId,event,at) {
  const expected={till:0,plant:1,water:2,harvest:3,sell:4,buy:5,replant:6};
  if(!(event in expected))return;
  db.prepare(`UPDATE farm_onboarding SET step=step+1,status=CASE WHEN step=6 THEN 'DONE' ELSE status END,updated_at=?
    WHERE farm_id=? AND status='ACTIVE' AND step=?`).run(at,farmId,expected[event]);
}
export function skipOnboarding(db,userId) {
  db.prepare(`UPDATE farm_onboarding SET status='SKIPPED',updated_at=? WHERE farm_id=(SELECT id FROM farms WHERE owner_id=?) AND status='ACTIVE'`).run(Date.now(),userId);
  return onboardingState(db,userId);
}
