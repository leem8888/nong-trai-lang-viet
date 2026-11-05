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
    const earth=document.createElement('canvas');earth.width=earth.height=128;const soil=earth.getContext('2d');soil.fillStyle='#b99d70';soil.fillRect(0,0,128,128);for(let i=0;i<1800;i++){const n=hash(i,31);soil.fillStyle=i%2?'#d4bd9445':'#80684228';soil.fillRect(n%128,(n>>>8)%128,1+n%3,1);}const pattern=g.createPattern(earth,'repeat');
    const trail=(points,width)=>{g.save();g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.strokeStyle=pattern;g.lineWidth=width+20;g.globalAlpha=.18;g.stroke();g.lineWidth=width+10;g.globalAlpha=.36;g.stroke();g.globalAlpha=.92;g.lineWidth=width;g.stroke();g.restore();};
    // The routes follow the same world-space approaches to the house, field, pond and gate.
    trail([[710,230],[710,400],[710,525],[720,700],[720,905]],74);
    trail([[720,640],[660,625],[625,620]],58);
    trail([[720,695],[860,680],[950,690]],58);
    trail([[710,525],[925,390],[1040,285]],45);
    // Keep the junction the same dirt surface as the connecting paths.
    // Fade only the property edge into the older village surroundings.
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';let mask=g.createLinearGradient(0,0,out.width,0);mask.addColorStop(0,'#fff0');mask.addColorStop(.05,'#fff');mask.addColorStop(.95,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);mask=g.createLinearGradient(0,0,0,out.height);mask.addColorStop(0,'#fff0');mask.addColorStop(.06,'#fff');mask.addColorStop(.94,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);g.globalCompositeOperation='source-over';
    this.canvas=out;
  }
}
