// Visual-only farm ground. Its cache is built once from the authored texture atlas.
const hash=(x,y,s=0)=>{let n=(x*374761393+y*668265263+s*1274126177)|0;n=(n^(n>>>13))*1274126177;return (n^(n>>>16))>>>0;};
const cell=(image,col,row)=>({x:Math.round(col*image.naturalWidth/4),y:Math.round(row*image.naturalHeight/4),w:Math.round(image.naturalWidth/4),h:Math.round(image.naturalHeight/4)});
const swatch=(image,col,row,size=160)=>{const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),r=cell(image,col,row);g.drawImage(image,r.x,r.y,r.w,r.h,0,0,size,size);return c;};
export class FarmTerrain {
  constructor(){this.source=null;this.canvas=null;this.surroundings=null;}
  drawSurroundings(ctx,image){if(!image?.naturalWidth)return false;if(this.source!==image||!this.surroundings){const out=document.createElement('canvas');out.width=2150;out.height=1800;const g=out.getContext('2d'),grass=swatch(image,0,0,192),meadow=swatch(image,2,1,192);g.fillStyle=g.createPattern(grass,'repeat');g.fillRect(0,0,out.width,out.height);for(let y=-96;y<out.height;y+=174)for(let x=-96;x<out.width;x+=174){const h=hash(x,y,17);if(h%3===0){g.globalAlpha=.38;g.drawImage(meadow,x+(h%47)-23,y+((h>>>8)%47)-23,220,220);}}g.globalAlpha=1;this.surroundings=out;}ctx.drawImage(this.surroundings,-1100,-1000,4300,3600);return true;}
  draw(ctx,image){if(!image?.naturalWidth)return false;if(this.source!==image||!this.canvas)this.build(image);ctx.drawImage(this.canvas,0,0);return true;}
  build(image){this.source=image;const out=document.createElement('canvas');out.width=1440;out.height=1024;const g=out.getContext('2d');g.fillStyle='#6d9d58';g.fillRect(0,0,out.width,out.height);
    const grass=Array.from({length:8},(_,i)=>{const c=swatch(image,i%4,Math.floor(i/4));const t=c.getContext('2d');t.globalCompositeOperation='destination-in';const mask=t.createRadialGradient(80,80,23,80,80,80);mask.addColorStop(0,'#fff');mask.addColorStop(.62,'#fffe');mask.addColorStop(1,'#fff0');t.fillStyle=mask;t.fillRect(0,0,160,160);return c;});
    for(let y=-100;y<out.height+100;y+=82)for(let x=-100;x<out.width+100;x+=82){const h=hash(x,y),sprite=grass[h%grass.length];g.drawImage(sprite,x+(h%31)-15,y+((h>>>8)%31)-15,178,178);}
    const earth=swatch(image,1,2,128);const pattern=g.createPattern(earth,'repeat');
    const trail=(points,width)=>{g.save();g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.strokeStyle=pattern;g.lineWidth=width+20;g.globalAlpha=.18;g.stroke();g.lineWidth=width+10;g.globalAlpha=.36;g.stroke();g.globalAlpha=.92;g.lineWidth=width;g.stroke();g.restore();};
    // The routes follow the same world-space approaches to the house, field, pond and gate.
    trail([[710,390],[710,525],[720,700],[720,905]],74);
    trail([[720,680],[545,700],[405,755],[280,795]],58);
    trail([[720,695],[790,725],[850,770]],58);
    trail([[710,525],[905,510],[1010,540]],45);
    const yard=g.createPattern(swatch(image,2,2,128),'repeat');g.save();g.fillStyle=yard;g.beginPath();g.ellipse(710,575,112,86,0,0,Math.PI*2);g.fill();g.restore();
    // Fade only the property edge into the older village surroundings.
    g.globalCompositeOperation='destination-in';let mask=g.createLinearGradient(0,0,out.width,0);mask.addColorStop(0,'#fff0');mask.addColorStop(.05,'#fff');mask.addColorStop(.95,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);mask=g.createLinearGradient(0,0,0,out.height);mask.addColorStop(0,'#fff0');mask.addColorStop(.06,'#fff');mask.addColorStop(.94,'#fff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,out.width,out.height);g.globalCompositeOperation='source-over';
    this.canvas=out;
  }
}
