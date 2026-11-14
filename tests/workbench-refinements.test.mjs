import test from 'node:test';
import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';
import {setOC,makeBox,measureVolume} from 'replicad';
import {buildPart} from '../src/cad-core.js';
import {cabinetRows} from '../src/workbench/cabinet.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {setCommonGroup,commonValues,commonGroupForKey} from '../src/workbench/project-settings.js';
import {initializeProject,addCabinet,selectCabinet,syncProject,serializeProject,deserializeProject,projectLayout} from '../src/workbench/project.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
import {frontLayout,frontHandleHoles} from '../src/workbench/front-plan.js';
import {nestedPartLocation} from '../src/workbench/nested-selection.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
function state(){const cabinet=enableInstallation(cabinetDefaults(),undefined,{fresh:true});return initializeProject({cabinet,independentCabinets:true,globals:globalsFrom(cabinet),machine:{...machineDefaults},stock:{...stockDefaults}});}
test('captured-back side grooves stop at the mating back bottom and retain the joint clearance',()=>{
 for(const style of ['Base','Wall','Tall'])for(const bottomDado of [true,false])for(const clearance of [.2,.4]){
  const c={...cabinetDefaults(style),bottomDado,clearance},parts=cabinetRows(c),back=parts.find(p=>p.row[0]==='Back');
  for(const p of parts.filter(p=>/^(Left side|Right side)$/.test(p.row[0]))){const groove=p.operations.find(o=>o.label==='Captured back groove');assert(groove.box[2]>0);near(groove.box[2],back.row[3]-clearance/2);near(groove.box[2]+groove.box[5],p.row[3]+p.row[6]);near(groove.box[4],c.back+clearance);}
 }
});
test('machined CAD side solids keep the bottom lip intact under the stopped groove',async()=>{
 setOC(await init({print:()=>{}}));for(const style of ['Base','Wall','Tall'])for(const bottomDado of [true,false]){
  const c={...cabinetDefaults(style),bottomDado};for(const p of cabinetRows(c).filter(p=>/^(Left side|Right side)$/.test(p.row[0]))){const solid=buildPart(p),a=p.row.slice(1),clip=makeBox(a.slice(0,3),[a[0]+a[3],a[1]+a[4],a[2]+2]),lip=solid.intersect(clip);try{near(measureVolume(lip),a[3]*a[4]*2);}finally{lip.delete();clip.delete();solid.delete();}}
 }
});
test('joinery profiles update their style, preserve counter height, and persist for future cabinets',()=>{
 const s=state();addCabinet(s);addCabinet(s,{style:'Wall'});selectCabinet(s,s.cabinets[0].id);const height=s.cabinet.height,wall=s.cabinets[2].config.bottomLift;
 setCommonGroup(s,'joinery',{bottomLift:40,assembly:true,screwPilot:3,screwClearance:4.5,screwDepth:18},'Base');syncProject(s);
 assert(s.cabinets.slice(0,2).every(r=>r.config.bottomLift===40&&r.config.assembly));near(s.cabinet.height,height+10);assert.equal(s.cabinets[2].config.bottomLift,wall);
 setCommonGroup(s,'joinery',{assembly:true,grooveDepth:5},'Tall');addCabinet(s,{style:'Tall'});assert(s.cabinet.assembly);assert.equal(s.cabinet.grooveDepth,5);
 const loaded=deserializeProject(serializeProject(s));assert.deepEqual(loaded.projectSettings.joinery,s.projectSettings.joinery);assert.equal(commonGroupForKey('screwPilot'),'joinery');
});
test('back thickness is common across styles and new cabinets, independently of joinery profiles',()=>{
 const s=state();addCabinet(s,{style:'Wall'});setCommonGroup(s,'backPanel',{back:9});syncProject(s);addCabinet(s,{style:'Tall'});assert(s.cabinets.every(r=>r.config.back===9));assert.equal(commonValues(s,'backPanel').back,9);assert.throws(()=>setCommonGroup(s,'backPanel',{back:-1}),/back/);
});
test('elevation handle holes follow actual edited core positions, glass members and floor references',()=>{
 for(const style of ['Base','Wall','Tall']){const c=enableInstallation({...cabinetDefaults(style),handle:'knob',edgeBand:1},undefined,{fresh:true}),holes=frontHandleHoles(c);assert.equal(holes.length,c.doors);const item=frontLayout([{id:'c',x:150,config:c}]).items[0];assert.deepEqual(item.handleHoles,holes);for(const h of holes){assert(h.x>0&&h.x<c.width);assert(h.z>0&&h.z<c.height);}}
 const c=enableInstallation({...cabinetDefaults(),handle:'knob',handleAlignment:'floor',handleHeight:800},undefined,{fresh:true}),item=frontLayout([{id:'c',config:c}]).items[0];for(const h of item.handleHoles)near(item.bottom+h.z,800);
 assert.equal(frontHandleHoles({...c,frontMode:'open'}).length,0);assert.equal(frontHandleHoles({...c,doorStyle:'glass',handleAlignment:'top'}).length,2);
});
test('assembly part lookup finds the correct project sheet and distinguishes unplaced parts',()=>{
 const s=state();addCabinet(s);const layout=projectLayout(s);for(const [i,sheet]of layout.sheets.entries())for(const p of sheet.parts){const found=nestedPartLocation(layout,p.cabinetId,p.sourceCode);assert.equal(found.sheetIndex,i);assert.equal(found.part.code,p.code);}
 const sample=layout.parts[0],found=nestedPartLocation({sheets:[],unplaced:[sample]},sample.cabinetId,sample.sourceCode);assert.equal(found.sheetIndex,-1);assert.equal(found.part,sample);
});
