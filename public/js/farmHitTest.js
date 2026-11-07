import {ISO_X,ISO_Y} from './core/IsoProjection.js';
import {FARM_HOUSE,HOUSE_SHEAR} from './shared/house.js';
import {insidePolygon} from './systems/geometry.js';
export function avatarHit(point,avatar){
 const x=((point.x-avatar.x)-(point.y-avatar.y))*ISO_X,y=((point.x-avatar.x)+(point.y-avatar.y))*ISO_Y;
 return Math.abs(x)<=22&&y>=-84&&y<=5;
}
export function farmFixtureAt(point){
 const sx=((point.x-FARM_HOUSE.x)-(point.y-FARM_HOUSE.y))*ISO_X,sy=((point.x-FARM_HOUSE.x)+(point.y-FARM_HOUSE.y))*ISO_Y;
 const u=sx/FARM_HOUSE.width+.5,v=(sy-sx*HOUSE_SHEAR)/FARM_HOUSE.height+1;
 if(insidePolygon({x:u,y:v},[{x:.29,y:.56},{x:.45,y:.66},{x:.45,y:.84},{x:.29,y:.74}]))return 'door';
 const signX=((point.x-570)-(point.y-430))*ISO_X,signY=((point.x-570)+(point.y-430))*ISO_Y;
 if(Math.abs(signX)<36&&signY>-65&&signY<-7)return 'board';
 const gateX=((point.x-720)-(point.y-905))*ISO_X,gateY=((point.x-720)+(point.y-905))*ISO_Y;
 if(Math.abs(gateX)<76&&gateY>-132&&gateY<-12)return 'farmGate';
 return null;
}
