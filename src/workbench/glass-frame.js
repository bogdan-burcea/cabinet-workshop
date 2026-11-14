import {glassDimensions} from './doors.js';
import {validateOperations} from '../machining.js';

// Coordinates follow the cabinet's local frame: X across, Y thickness, Z up.
export function frameDoorParts(row,operations,c){
 const [name,x,y,z,w,t,h]=row,g=glassDimensions(w,h,c),f=g.frame;
 if(g.rebateDepth>t-3)throw Error(name+': glass rebate must leave at least 3 mm of wood.');
 const diameter=Math.min(6,t-g.rebateDepth-4),depth=15;
 if(diameter<3)throw Error(name+': stock is too thin for the glass rebate and frame dowels.');
 const roles=[['left stile',x,z,f,h],['right stile',x+w-f,z,f,h],['bottom rail',x+f,z,w-2*f,f],['top rail',x+f,z+h-f,w-2*f,f]];
 const pieces=roles.map(([role,px,pz,pw,ph])=>({row:[name+' · '+role,px,y,pz,pw,t,ph],operations:[],glassFramePart:role,glassDoor:{name,width:w,height:h,bounds:[...row.slice(1)]},frameDowel:{diameter,depth,length:30}}));
 const contains=(p,o)=>{const a=p.row.slice(1);return [0,1,2].every(k=>{const lo=o.point[k]- (k===o.axis?0:o.diameter/2),hi=o.point[k]+(k===o.axis?0:o.diameter/2),end=o.point[k]+(k===o.axis?o.sign*o.depth:0);return Math.min(lo,end)>=a[k]-1e-6&&Math.max(hi,end)<=a[k]+a[k+3]+1e-6;});};
 for(const o of operations){const matches=pieces.filter(p=>contains(p,o));if(matches.length!==1)throw Error(name+': '+o.label+' crosses a frame joint or the glass opening. Move the handle/hinge fixing onto one stile or rail, or increase frame width.');matches[0].operations.push({...o,part:matches[0].row[0]});}
 const rebate=[x+f-g.lap,y+t-g.rebateDepth,z+f-g.lap,g.openingWidth+2*g.lap,g.rebateDepth,g.openingHeight+2*g.lap];
 for(const p of pieces){const a=p.row.slice(1),lo=a.slice(0,3).map((v,k)=>Math.max(v,rebate[k])),hi=a.slice(0,3).map((v,k)=>Math.min(v+a[k+3],rebate[k]+rebate[k+3]));p.operations.push({type:'pocket',part:p.row[0],label:'Glass rebate',axis:1,sign:-1,box:[...lo,...hi.map((v,k)=>v-lo[k])],maxToolDiameter:6});}
 for(const [railIndex,rz]of [[2,z],[3,z+h-f]])for(const dz of [f/3,2*f/3])for(const left of [true,false]){
  const rail=pieces[railIndex],stile=pieces[left?0:1],px=left?x+f:x+w-f,py=y+(t-g.rebateDepth)/2;
  for(const [p,sign]of [[rail,left?1:-1],[stile,left?-1:1]])p.operations.push({type:'bore',part:p.row[0],label:'Frame dowel',axis:0,point:[px,py,rz+dz],sign,diameter,depth});
 }
 for(const p of pieces)validateOperations({[p.row[0]]:p.row.slice(1)},p.operations,e=>{throw Error(e);});
 return pieces;
}
