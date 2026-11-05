import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FarmTerrain} from '../public/js/terrain.js';
import {Camera} from '../public/js/core/Camera.js';

test('grass covers the whole viewport while moving or resizing without a fixed backdrop edge',()=>{
  const image={naturalWidth:1024},terrain=new FarmTerrain();
  terrain.surroundingsSource=image;terrain.surroundingsPattern={};
  const camera=new Camera({width:1740,height:1024,minY:-300});camera.isometric=true;
  for(const [width,height] of [[1920,1080],[2560,1440],[390,844]]){
    camera.resize(width,height);
    for(const [x,y] of [[100,-180],[1600,150],[1500,880],[160,800],[700,450]]){
      camera.snap(x,y);let bounds;
      terrain.drawSurroundings({save(){},restore(){},fillRect(...args){bounds=args;}},image,camera);
      const [left,top,w,h]=bounds;
      for(const [sx,sy] of [[0,0],[width,0],[0,height],[width,height]]){
        const p=camera.toWorld(sx,sy);
        assert.ok(p.x>left&&p.x<left+w&&p.y>top&&p.y<top+h);
      }
    }
  }
});
