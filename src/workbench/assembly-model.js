import {drawerFrontGeometry} from './drawer-fronts.js';
import {golaPurchasedRows} from './gola.js';
import {openDoorPoint} from './door-motion.js';
import {isPantry,pantryConfig,pantrySideSpacer} from './pantry.js';
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
});const configs=isPantry(cabinet)?[{...pantryConfig(cabinet),previewOffsetX:pantrySideSpacer(cabinet),previewSetback:cabinet.pantrySetback??60}]:cabinet.split?sectionDrawerConfigs(cabinet):cabinet.frontMode==='drawers'?[cabinet]:[];let index=0;for(const c of configs){if(!isTandembox(c)){index+=c.drawerCount;continue;}const plan=tandemboxPlan(c),offset=c.sectionOffset||0,ox=c.previewOffsetX||0,setback=(c.previewSetback||0)+drawerFrontGeometry(c).setback;for(const a of plan.boxes){index++;for(const left of [true,false]){const x=(left?c.thickness+6:c.width-c.thickness-10)+ox;result.push({row:['Drawer '+index+' '+(left?'left':'right')+' metal side',x,cabinet.depth-setback-plan.length,a.reference+11.9+offset,4,plan.length,83.6],operations:[],holes:[],purchased:true});}if(plan.innerDrawer){const x=ox+c.thickness+66,y=cabinet.depth-setback+18,z=a.reference+offset;for(const [suffix,px,width]of [['inner aluminium front',x,plan.frontCutLength],['left inner front cap',ox+c.thickness+6,60],['right inner front cap',x+plan.frontCutLength,60]])result.push({row:['Drawer '+index+' '+suffix,px,y,z,width,2,97.9],operations:[],holes:[],purchased:true});}}}result.push(...golaPurchasedRows(cabinet,result));return result;}

export function assemblyPoint(point,part,cabinet,{open=true,exploded=false}={}){
 let [x,y,z]=point;const name=part.row[0],door=name.startsWith('Door');
 if(/^Drawer /.test(name)&&open)y+=Math.min(250,cabinet.depth*.45);
 if(door&&open)[x,y,z]=openDoorPoint([x,y,z],part,cabinet);
 if(exploded){const shift=explodedOffset(name,cabinet);x+=shift[0];y+=shift[1];z+=shift[2];}
 return [x,z,y];
}
