import test from 'node:test';import assert from 'node:assert/strict';
import {cabinetDefaults} from '../src/workbench/styles.js';import {enableInstallation} from '../src/workbench/installation.js';import {initializeProject,addCabinet,syncProject,serializeProject,deserializeProject,projectParts} from '../src/workbench/project.js';import {commonValues,setCommonGroup,commonGroupForKey} from '../src/workbench/project-settings.js';import {globalsFrom} from '../src/workbench/globals.js';import {machineDefaults} from '../src/workbench/cam.js';import {cabinetParts} from '../src/workbench/cabinet.js';
const config=(style='Base',extra={})=>enableInstallation({...cabinetDefaults(style),...extra},undefined,{fresh:true});
const state=cabinet=>initializeProject({cabinet,globals:globalsFrom(cabinet),independentCabinets:true,machine:machineDefaults});
test('global wall suspension applies to existing and future Walls only, including back preparation',()=>{
 const s=state(config());const base=s.cabinet;addCabinet(s,{style:'Wall'});s.cabinet.backInset=40;addCabinet(s,{style:'Wall'});s.cabinet.backGroove=false;addCabinet(s,{style:'Tall'});const tall=structuredClone(s.cabinet);setCommonGroup(s,'wallSuspension',{wallHanger:'blum_48n0510'});syncProject(s);
 assert.deepEqual(s.cabinet,tall);assert.equal(base.wallHanger,'none');for(const r of s.cabinets.filter(r=>r.config.style==='Wall')){assert.equal(r.config.wallHanger,'blum_48n0510');assert.equal(r.config.backGroove,true);assert(r.config.backInset>=19&&r.config.backInset<=31);assert.equal(cabinetParts(r.config).flatMap(p=>p.flatOperations).filter(o=>o.label==='Blum wall hanger pilot').length,4);}
 addCabinet(s,{style:'Wall'});assert.equal(s.cabinet.wallHanger,'blum_48n0510');assert.equal(s.cabinet.backInset,19);assert.equal(commonGroupForKey('wallHanger'),'wallSuspension');assert.deepEqual(projectParts(deserializeProject(serializeProject(s))),projectParts(s));
 setCommonGroup(s,'wallSuspension',{wallHanger:'none'});syncProject(s);assert(s.cabinets.filter(r=>r.config.style==='Wall').every(r=>r.config.wallHanger==='none'));
});
test('legacy independent hanger settings are retained until shared suspension is changed',()=>{
 const s=state(config('Wall',{wallHanger:'blum_48n0510',backInset:25}));addCabinet(s,{style:'Wall'});assert.equal(s.cabinet.wallHanger,'none');const restored=deserializeProject(serializeProject(s));assert.deepEqual(restored.cabinets.map(r=>r.config.wallHanger),['blum_48n0510','none']);assert.equal(restored.projectSettings?.wallSuspension,undefined);
});
test('shared suspension reserves compatible Wall joinery without modifying other style profiles',()=>{
 const s=state(config('Wall'));setCommonGroup(s,'joinery',{backInset:10,backGroove:false},'Wall');setCommonGroup(s,'joinery',{backInset:12},'Base');const baseProfile=structuredClone(s.projectSettings.joinery.Base);setCommonGroup(s,'wallSuspension',{wallHanger:'blum_48n0510'});syncProject(s);
 assert.equal(commonValues(s,'joinery','Wall').backInset,19);assert.equal(commonValues(s,'joinery','Wall').backGroove,true);assert.deepEqual(s.projectSettings.joinery.Base,baseProfile);
 assert.throws(()=>setCommonGroup(s,'joinery',{backInset:10},'Wall'),/19–31/);assert.throws(()=>setCommonGroup(s,'joinery',{backGroove:false},'Wall'),/19–31/);assert.throws(()=>setCommonGroup(s,'wallSuspension',{wallHanger:'bad'}),/Choose no wall hanger/);
});
test('global suspension keeps hardware stock validation',()=>{
 const s=state(config('Wall',{thickness:15,pinDepth:10,hinge:'none',doors:0,frontMode:'open'}));setCommonGroup(s,'wallSuspension',{wallHanger:'blum_48n0510'});assert.throws(()=>syncProject(s),/at least 16 mm/);
});
