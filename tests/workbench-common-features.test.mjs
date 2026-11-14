import test from 'node:test';
import assert from 'node:assert/strict';
import {setCommonGroup,commonValues} from '../src/workbench/project-settings.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {initializeProject,addCabinet,selectCabinet,syncProject,serializeProject,deserializeProject,projectParts} from '../src/workbench/project.js';
import {detachProjectDefaults} from '../src/workbench/drawer-setup.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
function fixture(all=true){const cabinet=enableInstallation(cabinetDefaults(),undefined,{fresh:true}),s=detachProjectDefaults(initializeProject({cabinet,globals:globalsFrom(cabinet),machine:{...machineDefaults},stock:{...stockDefaults}}));if(all){addCabinet(s);addCabinet(s,{style:'Wall'});addCabinet(s,{style:'Tall'});}selectCabinet(s,s.cabinets[0].id);return s;}
test('handle profiles update only their cabinet style and persist for future cabinets',()=>{
 const s=fixture(),oldWall=s.cabinets[2].config.handle,oldTall=s.cabinets[3].config.handle;setCommonGroup(s,'handles',{handle:'knob',handlePosition:'top_center',handleEdge:40},'Base');syncProject(s);assert(s.cabinets.slice(0,2).every(r=>r.config.handle==='knob'));assert.equal(s.cabinets[2].config.handle,oldWall);assert.equal(s.cabinets[3].config.handle,oldTall);
 setCommonGroup(s,'handles',{handle:'knob',handlePosition:'bottom_center'},'Wall');syncProject(s);assert.equal(s.cabinets[2].config.handlePosition,'bottom_center');assert.equal(s.cabinets[0].config.handlePosition,'top_center');addCabinet(s,{style:'Base'});assert.equal(s.cabinet.handle,'knob');const loaded=deserializeProject(serializeProject(s));assert.deepEqual(loaded.projectSettings.handles,s.projectSettings.handles);assert.equal(loaded.cabinet.handle,'knob');
});
test('a handle style can be prepared before that cabinet style exists',()=>{const s=fixture(false);setCommonGroup(s,'handles',{handle:'knob',handlePosition:'auto_middle'},'Tall');syncProject(s);addCabinet(s,{style:'Tall'});assert.equal(s.cabinet.handle,'knob');assert.equal(s.cabinet.handlePosition,'auto_middle');assert.throws(()=>setCommonGroup(s,'handles',{handlePosition:'top_center'},'Wall'),/valid handle/);});
test('hinges and banding share hardware while preserving build-specific counts and joinery',()=>{
 const s=fixture(),before=s.cabinets.map(r=>({count:r.config.hingeCount,width:r.config.width,groove:r.config.grooveDepth}));setCommonGroup(s,'hinges',{hinge:'hafele_31104003',plate:0,hingeEnd:90});setCommonGroup(s,'banding',{edgeBand:1,bandDoors:true,bandFronts:true});syncProject(s);
 for(const [i,r]of s.cabinets.entries()){assert.equal(r.config.hinge,'hafele_31104003');assert.equal(r.config.edgeBand,1);assert.equal(r.config.hingeCount,before[i].count);assert.equal(r.config.width,before[i].width);assert.equal(r.config.grooveDepth,before[i].groove);}
 const parts=projectParts(s);assert(parts.some(p=>p.flatOperations.some(o=>o.label==='Hinge cup'&&o.depth===12)));assert(parts.some(p=>p.edgeBand&&Object.values(p.edgeBand).includes(1)));assert.throws(()=>setCommonGroup(s,'hinges',{hinge:'hafele_31104003',plate:3}),/compatible/);
});
test('common drilling dimensions do not enable holes on cabinets that opted out',()=>{
 const s=fixture();s.cabinets[1].config.pins=false;setCommonGroup(s,'shelfDrilling',{pinDepth:10,pinFront:60,pinRear:60});setCommonGroup(s,'assemblyDrilling',{screwPilot:3,screwClearance:4.5,screwDepth:18,screwSetback:40});syncProject(s);assert(s.cabinets.every(r=>r.config.pinDepth===10&&r.config.screwPilot===3));assert.equal(s.cabinets[1].config.pins,false);assert(s.cabinets.every(r=>r.config.assembly===false));
});
test('legacy values remain independent until their common group is edited',()=>{const s=fixture();s.cabinets[1].config.handle='knob';syncProject(s);const loaded=deserializeProject(serializeProject(s));assert.equal(loaded.cabinets[0].config.handle,'horizontal');assert.equal(loaded.cabinets[1].config.handle,'knob');assert.equal(commonValues(loaded,'handles','Wall').handlePosition,'auto_bottom');});
