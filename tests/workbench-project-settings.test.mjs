import test from 'node:test';
import assert from 'node:assert/strict';
import {feetKeys,setProjectFeet,setProjectWorktop} from '../src/workbench/project-settings.js';
import {cuttingTime} from '../src/workbench/time-format.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {initializeProject,addCabinet,selectCabinet,syncProject,serializeProject,deserializeProject,projectParts} from '../src/workbench/project.js';
import {detachProjectDefaults} from '../src/workbench/drawer-setup.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
function fixture(){const cabinet=enableInstallation(cabinetDefaults(),undefined,{fresh:true});const s=detachProjectDefaults(initializeProject({cabinet,globals:globalsFrom(cabinet),machine:{...machineDefaults},stock:{...stockDefaults}}));addCabinet(s,{style:'Tall'});addCabinet(s,{style:'Wall'});selectCabinet(s,s.cabinets[0].id);return s;}
test('global feet synchronize floor cabinets, compensate height and cover future cabinets',()=>{
 const s=fixture(),before=s.cabinets.map(r=>({height:r.config.height,target:r.config.style==='Tall'?r.config.installation.wallTopHeight:r.config.installation.counterHeight}));Object.assign(s.cabinet,{feet:'single',feetCount:2,feetHeight:100,feetThrough:true,feetDiameter:3});setProjectFeet(s);syncProject(s);
 for(const r of s.cabinets.filter(r=>r.config.style!=='Wall')){for(const k of feetKeys)assert.equal(r.config[k],s.projectSettings.feet[k]);const original=before[s.cabinets.indexOf(r)];assert.equal(r.config.height,original.height+50);}
 assert.equal(s.cabinets[2].config.feet,'none');assert.equal(s.cabinets[2].config.height,before[2].height);const parts=projectParts(s);assert(parts.filter(p=>p.cabinetId===s.cabinets[0].id).flatMap(p=>p.flatOperations).some(o=>o.label==='Foot plate through hole'&&o.diameter===3));assert(!parts.filter(p=>p.cabinetId===s.cabinets[2].id).flatMap(p=>p.flatOperations).some(o=>o.label.startsWith('Foot plate')));
 addCabinet(s,{style:'Base'});assert.equal(s.cabinet.feet,'single');assert.equal(s.cabinet.feetHeight,100);assert.deepEqual(deserializeProject(serializeProject(s)).projectSettings,s.projectSettings);
});
test('global worktop changes preserve finished counter targets and wall/tall top targets',()=>{
 const s=fixture(),before=s.cabinets.map(r=>r.config.height),counter=s.cabinet.installation.counterHeight;s.cabinet.installation.worktopThickness=28;setProjectWorktop(s);syncProject(s);assert.equal(s.cabinets[0].config.height,before[0]+10);assert.equal(s.cabinet.installation.counterHeight,counter);assert.equal(s.cabinets[1].config.height,before[1]);assert.equal(s.cabinets[2].config.height,before[2]);assert(s.cabinets.every(r=>r.config.installation.worktopThickness===28));addCabinet(s,{style:'Base'});assert.equal(s.cabinet.installation.worktopThickness,28);const loaded=deserializeProject(serializeProject(s));assert.equal(loaded.projectSettings.worktopThickness,28);
});
test('legacy independent foot settings remain until a shared edit; invalid global values reject',()=>{
 const s=fixture();s.cabinets[1].config.feetHeight=120;syncProject(s);assert.equal(deserializeProject(serializeProject(s)).cabinets[1].config.feetHeight,120);s.cabinet.feetHeight=999;setProjectFeet(s);assert.throws(()=>syncProject(s),/Foot height/);const good=fixture();good.projectSettings={worktopThickness:NaN};assert.throws(()=>syncProject(good),/Worktop thickness/);
});
test('cutting time formats whole minutes with hour carry and zero padding',()=>{for(const [minutes,label]of [[0,'0:00'],[5,'0:05'],[59,'0:59'],[59.6,'1:00'],[125,'2:05'],[6001,'100:01']])assert.equal(cuttingTime(minutes),label);});
