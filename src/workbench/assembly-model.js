import {cabinetParts} from './cabinet.js';
import {transformOperation} from '../machining.js';

// Invert flattening after local feature edits and band deductions. The original
// row.operations are deliberately not used: they predate those edits.
export function assemblyRows(cabinet){return cabinetParts(cabinet).map(p=>{
 const axis=p.thicknessAxis??p.row.slice(4).indexOf(p.thickness),order=[...[0,1,2].filter(k=>k!==axis),axis];
 const point=v=>{const out=p.row.slice(1,4);order.forEach((k,i)=>out[k]+=v[i]);return out;};
 const vector=v=>{const out=[0,0,0];order.forEach((k,i)=>out[k]=v[i]);return out;};
 const holes=(p.flatHoles||[]).map(h=>({type:'pocket',axis:2,sign:-1,label:'Panel aperture',box:[h.x,h.y,0,h.width,h.height,p.thickness]}));
 return {...p,operations:[...p.flatOperations,...holes].map(o=>transformOperation(o,point,vector)),holes:[]};
});}

export function assemblyPoint(point,part,cabinet,{open=true,exploded=false}={}){
 let [x,y,z]=point;const name=part.row[0],door=name.startsWith('Door');
 if(/^Drawer /.test(name)&&open)y+=Math.min(250,cabinet.depth*.45);
 if(door&&open){const doorName=part.glassDoor?.name||name,right=doorName==='Door right'||(doorName==='Door'&&cabinet.hand==='Right'),b=part.glassDoor?.bounds||part.row.slice(1),hx=b[0]+(right?b[3]:0),hy=b[1],a=(right?-1:1)*Math.PI*.42,dx=x-hx,dy=y-hy;x=hx+dx*Math.cos(a)-dy*Math.sin(a);y=hy+dx*Math.sin(a)+dy*Math.cos(a);}
 if(exploded){x+=name==='Left side'?-70:name==='Right side'?70:0;y+=door?90:name==='Back'?-70:0;z+=name==='Bottom'?-60:name.includes('rail')||name==='Top'?60:0;}
 return [x,z,y];
}
