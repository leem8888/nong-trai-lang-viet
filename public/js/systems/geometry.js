// Pure world-space geometry shared by movement and construction validation.
export function insidePolygon(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
 const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
}return inside;}
export function distanceToSegmentSquared(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;}
export function circleOverlapsPolygon(p,radius,points){return insidePolygon(p,points)||points.some((a,i)=>distanceToSegmentSquared(p,a,points[(i+1)%points.length])<=radius*radius);}
function segmentsCross(a,b,c,d){const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);return ab1*ab2<=0&&cd1*cd2<=0&&Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.max(c.x,d.x)>=Math.min(a.x,b.x)&&Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&Math.max(c.y,d.y)>=Math.min(a.y,b.y);}
export function rectangleOverlapsObstacle(r,o){
 if(o.shape!=='polygon')return r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y;
 const corners=[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x+r.w,y:r.y+r.h},{x:r.x,y:r.y+r.h}];
 return corners.some(p=>insidePolygon(p,o.points))||o.points.some(p=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)||corners.some((a,i)=>o.points.some((c,j)=>segmentsCross(a,corners[(i+1)%4],c,o.points[(j+1)%o.points.length])));
}
