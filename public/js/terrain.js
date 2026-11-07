import {HOUSE_DOOR,houseToWorld} from './shared/house.js';
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
    const earth=document.createElement('canvas');earth.width=earth.height=128;const soil=earth.getContext('2d');soil.fillStyle='#c4a471';soil.fillRect(0,0,128,128);for(let i=0;i<1600;i++){const n=hash(i,31);soil.fillStyle=i%3?'#eddbb333':'#80613d26';soil.fillRect(n%128,(n>>>8)%128,1+n%2,1);}const pattern=g.createPattern(earth,'repeat');
    // Narrow curved footpaths connect the real porch and gate without a large crossroads.
    const paths=[];
    const curvedTrail=(draw,width)=>{const path=new Path2D();draw(path);paths.push({path,width});};
    // The gate-to-porch lane is the spine. Branches depart at separate points,
    // with tangent curves instead of a star-shaped junction in the middle.
    const steps=houseToWorld(.27,.9);
    curvedTrail(p=>{p.moveTo(steps.x,steps.y);p.bezierCurveTo(HOUSE_DOOR.x+8,HOUSE_DOOR.y+75,697,418,694,495);p.bezierCurveTo(687,640,735,757,720,905);},36);
    // Reach the actual eastern edge of the beds, not a dead end in the lawn.
    curvedTrail(p=>{p.moveTo(701,646);p.bezierCurveTo(670,650,622,651,568,650);},24);
    // A short approach to the near bank avoids the long diagonal across the lawn.
    curvedTrail(p=>{p.moveTo(727,812);p.bezierCurveTo(754,783,830,748,915,736);},23);
    curvedTrail(p=>{p.moveTo(695,476);p.bezierCurveTo(768,475,920,375,1065,240);},24);
    // Draw all soft shoulders first so branch edges never stripe across the main path.
    g.save();g.lineCap='round';g.lineJoin='round';g.strokeStyle=pattern;
    for(const [extra,alpha] of [[12,.1],[6,.24],[0,1]]){
      g.globalAlpha=alpha;for(const {path,width} of paths){g.lineWidth=width+extra;g.stroke(path);}
    }
    // One continuous, gently flared approach. Its end merges into the village
    // road's light center instead of leaving a rounded dark cap on top of it.
    const junction=new Path2D();junction.moveTo(702,884);junction.lineTo(702,936);junction.bezierCurveTo(702,959,695,978,679,990);junction.quadraticCurveTo(720,1000,761,990);junction.bezierCurveTo(745,978,738,959,738,936);junction.lineTo(738,884);junction.closePath();
    const gateBlend=g.createLinearGradient(0,850,0,1000);gateBlend.addColorStop(0,'#c4a47100');gateBlend.addColorStop(.3,'#c4a471');gateBlend.addColorStop(.7,'#d7ba8b');gateBlend.addColorStop(1,'#e0c494');
    g.globalAlpha=1;g.fillStyle=gateBlend;g.fill(junction);
    for(let i=0;i<28000;i++){
      const n=hash(i,44),x=n%1740,y=((n>>>11)%1324)-300;
      if(!paths.some(({path,width})=>{g.lineWidth=width-8;return g.isPointInStroke(path,x,y);}))continue;
      g.fillStyle=i%4?'#7653333d':'#fff0ce70';g.beginPath();g.ellipse(x,y,.8+i%3*.45,.4+i%2*.3,n%6,0,Math.PI*2);g.fill();
    }
    g.restore();
    // Keep the junction the same dirt surface as the connecting paths.
    // Fade only the property edge into the older village surroundings.
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';let mask=g.createLinearGradient(0,0,out.width,0);mask.addColorStop(0,'#fff0');mask.addColorStop(.05,'#fff');mask.addColorStop(.95,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);mask=g.createLinearGradient(0,0,0,out.height);mask.addColorStop(0,'#fff0');mask.addColorStop(.06,'#fff');mask.addColorStop(.94,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);g.globalCompositeOperation='source-over';
    this.canvas=out;
  }
}
