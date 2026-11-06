import {HOUSE_DOOR} from './shared/house.js';
// Visual-only farm ground. Its cache is built once from the authored texture atlas.
const hash=(x,y,s=0)=>{let n=(x*374761393+y*668265263+s*1274126177)|0;n=(n^(n>>>13))*1274126177;return (n^(n>>>16))>>>0;};
const cell=(image,col,row)=>({x:Math.round(col*image.naturalWidth/4),y:Math.round(row*image.naturalHeight/4),w:Math.round(image.naturalWidth/4),h:Math.round(image.naturalHeight/4)});
const swatch=(image,col,row,size=160)=>{const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),r=cell(image,col,row);g.drawImage(image,r.x,r.y,r.w,r.h,0,0,size,size);return c;};
export class FarmTerrain {
  constructor(){this.source=null;this.canvas=null;this.surroundings=null;}
  drawSurroundings(ctx,image,camera){
    if(!image?.naturalWidth)return false;
    if(this.surroundingsSource!==image||!this.surroundingsPattern){
      const tile=swatch(image,0,0,192),out=document.createElement('canvas');out.width=out.height=384;
      const g=out.getContext('2d');
      for(let row=0;row<2;row++)for(let col=0;col<2;col++){g.save();g.translate(col?384:0,row?384:0);g.scale(col?-1:1,row?-1:1);g.drawImage(tile,0,0);g.restore();}
      this.surroundingsPattern=ctx.createPattern(out,'repeat');this.surroundingsSource=image;
    }
    const corners=camera?[[0,0],[camera.width,0],[0,camera.height],[camera.width,camera.height]].map(([x,y])=>camera.toWorld(x,y)):[{x:-2000,y:-2000},{x:5000,y:5000}];
    const left=Math.floor(Math.min(...corners.map(p=>p.x)))-64,top=Math.floor(Math.min(...corners.map(p=>p.y)))-64;
    const right=Math.ceil(Math.max(...corners.map(p=>p.x)))+64,bottom=Math.ceil(Math.max(...corners.map(p=>p.y)))+64;
    ctx.save();ctx.fillStyle=this.surroundingsPattern;ctx.fillRect(left,top,right-left,bottom-top);ctx.restore();return true;
  }
  draw(ctx,image){if(!image?.naturalWidth)return false;if(this.source!==image||!this.canvas)this.build(image);ctx.drawImage(this.canvas,0,-300);return true;}
  build(image){this.source=image;const out=document.createElement('canvas');out.width=1740;out.height=1324;const g=out.getContext('2d');g.translate(0,300);
    const earth=document.createElement('canvas');earth.width=earth.height=128;const soil=earth.getContext('2d');soil.fillStyle='#b58e5e';soil.fillRect(0,0,128,128);for(let i=0;i<2200;i++){const n=hash(i,31);soil.fillStyle=i%3?'#dcc19a66':'#76563355';soil.fillRect(n%128,(n>>>8)%128,1+n%3,1);}const pattern=g.createPattern(earth,'repeat');
    const trail=(points,width)=>{g.save();g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.strokeStyle=pattern;g.lineWidth=width+20;g.globalAlpha=.18;g.stroke();g.lineWidth=width+10;g.globalAlpha=.36;g.stroke();g.globalAlpha=.92;g.lineWidth=width;g.stroke();g.restore();};
    // Narrow curved footpaths connect the real porch and gate without a large crossroads.
    const curvedTrail=(draw,width)=>{g.save();g.lineCap='round';g.lineJoin='round';g.beginPath();draw(g);g.strokeStyle=pattern;for(const [extra,alpha] of [[16,.12],[8,.3],[0,.97]]){g.lineWidth=width+extra;g.globalAlpha=alpha;g.stroke();}g.globalAlpha=.8;g.lineWidth=width-6;for(let i=0;i<1100;i++){const n=hash(i,width),x=n%1740,y=((n>>>11)%1324)-300;if(!g.isPointInStroke(x,y))continue;g.fillStyle=i%4?'#765333':'#e4cba2';g.beginPath();g.ellipse(x,y,1+i%3*.5,.5+i%2*.4,n%6,0,Math.PI*2);g.fill();}g.restore();};
    curvedTrail(p=>{p.moveTo(HOUSE_DOOR.x-12,HOUSE_DOOR.y-18);p.quadraticCurveTo(720,360,700,470);p.quadraticCurveTo(685,590,720,740);p.lineTo(720,905);},44);
    curvedTrail(p=>{p.moveTo(703,610);p.quadraticCurveTo(660,610,615,625);},30);
    curvedTrail(p=>{p.moveTo(713,705);p.quadraticCurveTo(815,675,945,690);},30);
    curvedTrail(p=>{p.moveTo(697,500);p.bezierCurveTo(810,480,945,390,1040,285);},28);
    // Keep the junction the same dirt surface as the connecting paths.
    // Fade only the property edge into the older village surroundings.
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';let mask=g.createLinearGradient(0,0,out.width,0);mask.addColorStop(0,'#fff0');mask.addColorStop(.05,'#fff');mask.addColorStop(.95,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);mask=g.createLinearGradient(0,0,0,out.height);mask.addColorStop(0,'#fff0');mask.addColorStop(.06,'#fff');mask.addColorStop(.94,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);g.globalCompositeOperation='source-over';
    this.canvas=out;
  }
}
