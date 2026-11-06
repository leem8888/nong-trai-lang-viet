import test from 'node:test';
import assert from 'node:assert/strict';
import { traceTiles, validSoilActions } from '../public/js/contextual.js';
import { tileCenter } from '../public/js/shared/crops.js';

test('context shows only server-valid soil actions', () => {
  const now=1_000_000;
  const crop={cropId:'mustard',plantedAt:now-1000,durationMs:60_000,bonusMs:0,wateredAt:null};
  assert.deepEqual(validSoilActions({state:'EMPTY',crop:null},[],now),['till']);
  assert.deepEqual(validSoilActions({state:'TILLED',crop:null},[],now),['plant']);
  assert.deepEqual(validSoilActions({state:'WATERED',crop:null},[],now),['plant']);
  assert.deepEqual(validSoilActions({state:'PLANTED',crop},[],now),['water']);
  assert.deepEqual(validSoilActions({state:'PLANTED',crop:{...crop,wateredAt:now}},[],now),[]);
  assert.deepEqual(validSoilActions({state:'PLANTED',crop:{...crop,plantedAt:now-60_000}},[],now),['harvest']);
});

test('rapid drag interpolates tiles and respects field bounds', () => {
  const a=tileCenter(0,0),b=tileCenter(4,0);
  assert.deepEqual(traceTiles(a,b),[0,1,2,3,4].map(x=>({x,y:0})));
  assert.deepEqual(traceTiles(a,a),[{x:0,y:0}]);
  assert.deepEqual(traceTiles({x:-100,y:750},a),[{x:0,y:0}]);
});
