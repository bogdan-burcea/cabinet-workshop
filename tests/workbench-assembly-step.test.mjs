import test from 'node:test';
import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';
import {setOC,importSTEP,measureVolume} from 'replicad';
import {cadAssemblyStep,buildPart} from '../src/cad-core.js';
import {assemblyStepRows} from '../src/workbench/assembly-step.js';
import {assemblyRows} from '../src/workbench/assembly-model.js';
import {frontLayout} from '../src/workbench/front-plan.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {initializeProject,addCabinet,setCabinetPosition,moveCabinet} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
const nearArray=(a,b)=>{assert.equal(a.length,b.length);a.forEach((v,i)=>assert(Math.abs(v-b[i])<1e-7));};
const ready=init({print:()=>{}}).then(setOC);
function fixture(){const c=enableInstallation(cabinetDefaults('Base'),undefined,{fresh:true});return initializeProject({cabinet:c,globals:globalsFrom(c),machine:{...machineDefaults},stock:{...stockDefaults}});}
test('assembly placement uses elevation order, manual offsets and installed heights with backs at wall Y=0',()=>{
 const s=fixture();addCabinet(s,{style:'Tall'});addCabinet(s,{style:'Wall'});setCabinetPosition(s,s.activeCabinetId,1400);moveCabinet(s,s.cabinets[1].id,0);
 const rows=assemblyStepRows(s),layout=frontLayout(s.cabinets);
 assert.equal(new Set(rows.map(a=>a.component)).size,4);
 for(const record of s.cabinets){const pose=layout.items.find(a=>a.id===record.id),actual=rows.filter(a=>a.component===record.id),local=assemblyRows(record.config).filter(a=>!a.purchased&&!a.worktop);assert.equal(actual.length,local.length);
  for(const [i,p]of local.entries()){const r=actual[i];assert.deepEqual(r.row.slice(1),[p.row[1]+pose.x,p.row[2],p.row[3]+pose.bottom,...p.row.slice(4)]);for(const [j,o]of p.operations.entries()){if(o.point)assert.deepEqual(r.operations[j].point,[o.point[0]+pose.x,o.point[1],o.point[2]+pose.bottom]);if(o.box)nearArray(r.operations[j].box,[o.box[0]+pose.x,o.box[1],o.box[2]+pose.bottom,...o.box.slice(3)]);}}
  assert.equal(actual.find(a=>/Left side/.test(a.row[0])).row[2],0);
 }
 assert.equal(rows[0].component,s.cabinets[1].id);assert.equal(rows.filter(p=>!p.worktop).at(-1).component,s.cabinets[2].id);
});
test('STEP contains one assembly and one cabinet component with multiple panel bodies, retaining machined geometry',async()=>{
 await ready;const s=fixture();s.cabinet.assembly=true;addCabinet(s,{duplicate:true});setCabinetPosition(s,s.activeCabinetId,800);
 const rows=assemblyStepRows(s),text=await cadAssemblyStep(rows);
 assert.equal((text.match(/= PRODUCT\(/g)||[]).length,4);assert.equal((text.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\(/g)||[]).length,3);
 assert.equal((text.match(/MANIFOLD_SOLID_BREP\(/g)||[]).length,rows.length);assert.match(text,/CYLINDRICAL_SURFACE/);assert.match(text,/Cabinet assembly/);
 const shape=await importSTEP(new Blob([text]));let expected=0;const originals=rows.map(buildPart);
 try{for(const body of originals)expected+=measureVolume(body);assert(Math.abs(measureVolume(shape)-expected)<.1);const solids=shape.solids;try{assert.equal(solids.length,rows.length);const boxes=solids.map(s=>{const b=s.boundingBox;try{return b.bounds.flat();}finally{b.delete();}}),source=originals.map(s=>{const b=s.boundingBox;try{return b.bounds.flat();}finally{b.delete();}});const key=b=>b.map(v=>v.toFixed(3)).join(',');assert.deepEqual(boxes.map(key).sort(),source.map(key).sort());}finally{solids.forEach(s=>s.delete());}}finally{shape.delete();originals.forEach(s=>s.delete());}
});
test('assembly retains bought glass and TANDEMBOX panels as bodies without changing manufacturing rows',()=>{
 const s=fixture();s.cabinet.doorStyle='glass';s.cabinet.glassFrame=70;s.cabinet.glassThickness=4;
 const rows=assemblyStepRows(s),glass=rows.filter(p=>p.purchased);assert.equal(glass.length,2);assert(glass.every(p=>/glass$/.test(p.row[0])&&p.row[5]===4));assert(rows.every(p=>!p.row[0].includes('undefined')));
 s.cabinet.doorStyle='slab';s.cabinet.frontMode='drawers';s.cabinet.drawerSystem='tandembox_m';s.cabinet.drawerStock=16;s.cabinet.drawerBottom=16;s.cabinet.drawerCount=2;
 const metal=assemblyStepRows(s).filter(p=>p.purchased);assert.equal(metal.length,4);assert(metal.every(p=>/metal side/.test(p.row[0])));
});
