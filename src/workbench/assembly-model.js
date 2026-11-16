import {isTandembox,tandemboxPlan} from './tandembox.js';
import {sectionDrawerConfigs} from './sections.js';
import {explodedOffset} from './explode.js';
import {cabinetParts} from './cabinet.js';
import {transformOperation} from '../machining.js';

// Invert flattening after local feature edits and band deductions. The original
// row.operations are deliberately not used: they predate those edits.
export function assemblyRows(cabinet){const result=cabinetParts(cabinet).map(p=>{
 const axis=p.thicknessAxis??p.row.slice(4).indexOf(p.thickness),order=[...[0,1,2].filter(k=>k!==axis),axis];
 const point=v=>{const out=p.row.slice(1,4);order.forEach((k,i)=>out[k]+=v[i]);return out;};
 const vector=v=>{const out=[0,0,0];order.forEach((k,i)=>out[k]=v[i]);return out;};
 const holes=(p.flatHoles||[]).map(h=>({type:'pocket',axis:2,sign:-1,label:'Panel aperture',box:[h.x,h.y,0,h.width,h.height,p.thickness]}));
 return {...p,operations:[...p.flatOperations,...holes].map(o=>transformOperation(o,point,vector)),holes:[]};
});const configs=cabinet.split?sectionDrawerConfigs(cabinet):cabinet.frontMode==='drawers'?[cabinet]:[];let index=0;for(const c of configs){if(!isTandembox(c)){index+=c.drawerCount;continue;}const plan=tandemboxPlan(c),offset=c.sectionOffset||0;for(const a of plan.boxes){index++;for(const left of [true,false]){const x=left?cabinet.thickness+6:cabinet.width-cabinet.thickness-10;result.push({row:['Drawer '+index+' '+(left?'left':'right')+' metal side',x,cabinet.depth-plan.length,a.sideZ+offset,4,plan.length,83.6],operations:[],holes:[],purchased:true});}}}return result;}

export function assemblyPoint(point,part,cabinet,{open=true,exploded=false}={}){
 let [x,y,z]=point;const name=part.row[0],door=name.startsWith('Door');
 if(/^Drawer /.test(name)&&open)y+=Math.min(250,cabinet.depth*.45);
 if(door&&open){const doorName=part.glassDoor?.name||name,right=doorName.endsWith(' right')||(!doorName.endsWith(' left')&&cabinet.hand==='Right'),b=part.glassDoor?.bounds||part.row.slice(1),hx=b[0]+(right?b[3]:0),hy=b[1],a=(right?-1:1)*Math.PI*(cabinet.hinge==='blum_71b7550'?155/180:cabinet.style==='Pantry'?.61:.42),dx=x-hx,dy=y-hy;x=hx+dx*Math.cos(a)-dy*Math.sin(a);y=hy+dx*Math.sin(a)+dy*Math.cos(a);}
 if(exploded){const shift=explodedOffset(name,cabinet);x+=shift[0];y+=shift[1];z+=shift[2];}
 return [x,z,y];
}
