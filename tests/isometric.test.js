import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera } from '../public/js/core/Camera.js';
import { project, unproject } from '../public/js/core/IsoProjection.js';

test('isometric projection round trips server world and screen coordinates', () => {
  const world={width:1440,height:1024};
  const camera=new Camera(world);
  camera.isometric=true;
  camera.resize(800,600);
  camera.snap(180,810);
  for(const point of [{x:0,y:0},{x:1440,y:1024},{x:140,y:750},{x:1150,y:785}]){
    const iso=project(point.x,point.y,world.height);
    const inverse=unproject(iso.x,iso.y,world.height);
    assert.ok(Math.abs(inverse.x-point.x)<1e-9);
    assert.ok(Math.abs(inverse.y-point.y)<1e-9);
    const screen=camera.toScreen(point.x,point.y);
    const roundTrip=camera.toWorld(screen.x,screen.y);
    assert.ok(Math.abs(roundTrip.x-point.x)<1e-9);
    assert.ok(Math.abs(roundTrip.y-point.y)<1e-9);
  }
});

test('100 isometric grid points survive camera pan, viewport and zoom', () => {
  const world={width:1440,height:1024};
  for(const [width,height] of [[360,800],[390,844],[768,1024],[1366,768],[1920,1080]]){
    const camera=new Camera(world);camera.isometric=true;camera.resize(width,height);
    for(const zoom of [.75,1,1.25,1.5]){
      camera.focus=zoom;camera.fit();camera.snap(720,650);
      for(let row=0;row<10;row++)for(let col=0;col<10;col++){
        const point={x:95+col*120,y:100+row*88};
        const screen=camera.toScreen(point.x,point.y),back=camera.toWorld(screen.x,screen.y);
        assert.ok(Math.abs(back.x-point.x)<1e-8,`${width} zoom ${zoom} x ${col},${row}`);
        assert.ok(Math.abs(back.y-point.y)<1e-8,`${width} zoom ${zoom} y ${col},${row}`);
      }
    }
  }
});
