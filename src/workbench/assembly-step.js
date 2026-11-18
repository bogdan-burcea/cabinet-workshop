import {projectWorktopRows} from './worktop-runs.js';
import {syncProject,projectParts} from './project.js';
import {frontLayout} from './front-plan.js';
import {assemblyRows} from './assembly-model.js';
import {transformOperation} from '../machining.js';
import {glassDimensions} from './doors.js';
import {requestAssemblyStep} from './sheet-step.js';

// Cabinet-local +Y points towards the front. Keep every rear carcass face at
// wall Y=0, with +Z up and X/order taken from the same layout as the elevation.
export function assemblyStepRows(state){
 syncProject(state);
 const sharedPlinths=projectParts(state,{singleSide:false}).filter(p=>p.row[0]==='Plinth');
 const layout=frontLayout(state.cabinets),positions=new Map(layout.items.map(a=>[a.id,a]));
 return [...state.cabinets].sort((a,b)=>{const x=positions.get(a.id),y=positions.get(b.id);return x.x-y.x||x.bottom-y.bottom;}).flatMap(record=>{
  const c=record.config,p=positions.get(record.id),index=state.cabinets.indexOf(record)+1;
  const owner='C'+String(index).padStart(2,'0')+' '+c.name;
  const point=([x,y,z])=>[x+p.x,y,z+p.bottom];
  const parts=assemblyRows(c).filter(part=>part.row[0]!=='Plinth'&&!part.worktop);
  for(const plinth of sharedPlinths.filter(part=>part.cabinetId===record.id)){const axis=plinth.thicknessAxis??1,order=[...[0,1,2].filter(k=>k!==axis),axis],origin=plinth.row.slice(1,4),toPoint=v=>{const p=[...origin];order.forEach((k,i)=>p[k]+=v[i]);return p;},toVector=v=>{const p=[0,0,0];order.forEach((k,i)=>p[k]=v[i]);return p;};parts.push({...plinth,operations:plinth.flatOperations.map(o=>transformOperation(o,toPoint,toVector)),holes:[]});}
  for(const part of [...parts])if(part.frameStyle==='glass'&&part.glassFramePart==='left stile'){
   const [x,y,z,w,,h]=part.glassDoor.bounds,g=glassDimensions(w,h,c),inset=g.frame-g.lap+g.clearance/2;
   parts.push({row:[part.glassDoor.name+' glass',x+inset,y+g.rebateDepth-g.thickness,z+inset,g.width,g.thickness,g.height],operations:[],purchased:true});
  }
  return parts.map(part=>({...part,
   component:record.id,owner,row:[(part.code?part.code+' ':'')+part.row[0],...point(part.row.slice(1,4)),...part.row.slice(4)],
   operations:part.operations.map(o=>transformOperation(o,point,v=>v))
  }));
 }).concat(projectWorktopRows(state));
}
export const exportAssemblyStep=(state,onProgress)=>requestAssemblyStep(assemblyStepRows(state),onProgress);

export const exportWorktopStep=(state,onProgress)=>{syncProject(state);const rows=projectWorktopRows(state);if(!rows.length)throw Error('This project has no enabled worktop.');return requestAssemblyStep(rows,onProgress);};
