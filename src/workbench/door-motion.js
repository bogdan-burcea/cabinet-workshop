import {isInset} from './doors.js';
// Display pose only: the hinge's four-bar motion is not simulated.
export function doorOpeningPose(part,cabinet){
 const name=part.glassDoor?.name||part.row[0],right=name.endsWith(' right')||(!name.endsWith(' left')&&cabinet.hand==='Right'),b=part.glassDoor?.bounds||part.row.slice(1);
 return {x:b[0]+(right?b[3]:0),y:b[1]+(isInset(cabinet)?b[4]:0),angle:(right?-1:1)*Math.PI*(cabinet.hinge==='blum_71b7550'?155/180:cabinet.style==='Pantry'?.61:.42)};
}
export function openDoorPoint([x,y,z],part,cabinet){const p=doorOpeningPose(part,cabinet),dx=x-p.x,dy=y-p.y;return [p.x+dx*Math.cos(p.angle)-dy*Math.sin(p.angle),p.y+dx*Math.sin(p.angle)+dy*Math.cos(p.angle),z];}
