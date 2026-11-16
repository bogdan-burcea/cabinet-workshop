import {syncProject} from './project.js';
import {frontLayout} from './front-plan.js';
import {assemblyRows} from './assembly-model.js';
import {transformOperation} from '../machining.js';
import {glassDimensions} from './doors.js';
import {requestAssemblyStep} from './sheet-step.js';

// Cabinet-local +Y points towards the front. Keep every rear carcass face at
// wall Y=0, with +Z up and X/order taken from the same layout as the elevation.
export function assemblyStepRows(state){
 syncProject(state);
 const layout=frontLayout(state.cabinets),positions=new Map(layout.items.map(a=>[a.id,a]));
 return [...state.cabinets].sort((a,b)=>{const x=positions.get(a.id),y=positions.get(b.id);return x.x-y.x||x.bottom-y.bottom;}).flatMap(record=>{
  const c=record.config,p=positions.get(record.id),index=state.cabinets.indexOf(record)+1;
  const owner='C'+String(index).padStart(2,'0')+' '+c.name;
  const point=([x,y,z])=>[x+p.x,y,z+p.bottom];
  const parts=assemblyRows(c);
  for(const part of [...parts])if(part.glassFramePart==='left stile'){
   const [x,y,z,w,,h]=part.glassDoor.bounds,g=glassDimensions(w,h,c),inset=g.frame-g.lap+g.clearance/2;
   parts.push({row:[part.glassDoor.name+' glass',x+inset,y+g.rebateDepth-g.thickness,z+inset,g.width,g.thickness,g.height],operations:[],purchased:true});
  }
  return parts.map(part=>({...part,
   component:record.id,owner,row:[(part.code?part.code+' ':'')+part.row[0],...point(part.row.slice(1,4)),...part.row.slice(4)],
   operations:part.operations.map(o=>transformOperation(o,point,v=>v))
  }));
 });
}
export const exportAssemblyStep=(state,onProgress)=>requestAssemblyStep(assemblyStepRows(state),onProgress);
