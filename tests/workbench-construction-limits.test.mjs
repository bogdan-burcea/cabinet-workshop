import test from 'node:test';import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';import {setOC,measureVolume,importSTEP} from 'replicad';
import {cabinetDefaults} from '../src/workbench/styles.js';import {cabinetParts,cabinetRows} from '../src/workbench/cabinet.js';
import {enableInstallation,floorClearance,cabinetInstallationNote,checkedInstallation} from '../src/workbench/installation.js';
import {initializeProject,addCabinet,syncProject,serializeProject,deserializeProject,projectParts,projectLayout} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';import {machineDefaults} from '../src/workbench/cam.js';import {stockDefaults} from '../src/workbench/production.js';
import {setCommonGroup} from '../src/workbench/project-settings.js';import {plinthAvailable} from '../src/workbench/plinth.js';import {frontLayout} from '../src/workbench/front-plan.js';
import {assemblyRows} from '../src/workbench/assembly-model.js';import {buildPart,cadStep} from '../src/cad-core.js';
const config=(style='Base',extra={})=>enableInstallation({...cabinetDefaults(style),...extra},undefined,{fresh:true}),state=c=>initializeProject({cabinet:c,globals:globalsFrom(c),independentCabinets:true,machine:{...machineDefaults},stock:{...stockDefaults,width:2440,height:1220,rotate:true}});
const near=(a,b)=>assert(Math.abs(a-b)<.02,`${a} != ${b}`),ready=init({print:()=>{}}).then(setOC);
test('zero worktop allowance reaches the finished counter target and persists across cabinets and save/open',()=>{
 const s=state(config());addCabinet(s,{style:'Wall'});addCabinet(s,{style:'Tall'});const old=s.cabinets.map(r=>r.config.height);setCommonGroup(s,'worktop',{worktopThickness:0});syncProject(s);assert.equal(s.cabinets[0].config.height,old[0]+38);assert.equal(s.cabinets[1].config.height,old[1]);assert.equal(s.cabinets[2].config.height,old[2]);assert.equal(s.cabinets[0].config.height+floorClearance(s.cabinets[0].config),900);assert.match(cabinetInstallationNote(s.cabinets[0].config),/no worktop/);assert.doesNotThrow(()=>checkedInstallation({...s.cabinet.installation,worktopThickness:0}));assert.throws(()=>checkedInstallation({...s.cabinet.installation,worktopThickness:-1}));const restored=deserializeProject(serializeProject(s));assert(restored.cabinets.every(r=>r.config.installation.worktopThickness===0));
});
test('one-millimetre shared feet reconcile incompatible raised bottoms without moving counter/top targets',()=>{
 const s=state(config('Base',{feet:'rectangle'}));addCabinet(s,{style:'Tall'});addCabinet(s,{style:'Pantry'});addCabinet(s,{style:'Wall'});const wall=s.cabinet.height;setCommonGroup(s,'feet',{feetHeight:1});syncProject(s);
 for(const r of s.cabinets.filter(r=>r.config.style!=='Wall')){assert.equal(r.config.feetHeight,1);assert.equal(r.config.bottomDado,false);assert.equal(floorClearance(r.config),1);assert.equal(r.config.height+1,r.config.style==='Base'?862:2200);assert(!cabinetParts(r.config).some(p=>p.row[0]==='Plinth'));}
 assert.equal(s.cabinet.height,wall);addCabinet(s,{style:'Base'});assert.equal(s.cabinet.feetHeight,1);assert.equal(s.cabinet.bottomDado,false);const restored=deserializeProject(serializeProject(s));assert.equal(restored.cabinet.feetHeight,1);assert.equal(restored.cabinet.bottomDado,false);assert.throws(()=>setCommonGroup(s,'feet',{feetHeight:0}),/feetHeight/);
});
test('plinth preference is retained while geometry and elevation are suppressed below 40 mm actual clearance',()=>{
 const s=state(config());setCommonGroup(s,'feet',{feetHeight:50});syncProject(s);assert.equal(floorClearance(s.cabinet),20);assert(!plinthAvailable(s.cabinet));assert(!cabinetParts(s.cabinet).some(p=>p.row[0]==='Plinth'));assert.equal(frontLayout(s.cabinets).items[0].plinth,null);
 setCommonGroup(s,'feet',{feetHeight:1});syncProject(s);setCommonGroup(s,'feet',{feetHeight:39});syncProject(s);assert(s.cabinet.plinth);assert(!plinthAvailable(s.cabinet));setCommonGroup(s,'feet',{feetHeight:40});syncProject(s);assert(plinthAvailable(s.cabinet));const part=cabinetParts(s.cabinet).find(p=>p.row[0]==='Plinth');assert.equal(part.height,37);assert.equal(frontLayout(s.cabinets).items[0].plinth.height,37);
});
test('back connectors include one centred top/back-rail and bottom fixing and stay 50 mm below wall notches',()=>{
 for(const style of ['Base','Wall','Tall','Pantry'])for(const wallRailHeight of [30,70]){const c=config(style,{back:3,backInset:19,wallMounted:true,wallHanger:'blum_48n0510',wallRailNotches:true,wallRailHeight,backConnector:'hafele_26009765',backConnectorsPerSide:3}),rows=cabinetRows(c),ops=rows.flatMap(p=>p.operations),fixings=ops.filter(o=>o.rpcConnector),notches=ops.filter(o=>/Wall hanger access notch|Wall rail clearance notch/.test(o.label));assert.equal(fixings.length,8);
 const upperLimit=Math.min(...notches.map(o=>o.box[2]))-50;for(const side of ['Left side','Right side']){const upper=fixings.filter(o=>o.part===side).sort((a,b)=>b.point[2]-a.point[2])[0];assert(upper.point[2]+7.5<=upperLimit+1e-6);}
 for(const name of ['Bottom',style==='Base'?'Rear rail':'Top']){const a=fixings.filter(o=>o.part===name);assert.equal(a.length,1);assert.equal(a[0].point[0],c.width/2);assert.equal(a[0].axis,2);assert.equal(a[0].depth,12.5);}
 }
 const narrow=config('Wall',{width:170,frontMode:'open',doors:0,shelves:0,hinge:'none',handle:'none',back:3,backInset:19,wallHanger:'blum_48n0510',backConnector:'hafele_26009765'});assert.throws(()=>cabinetParts(narrow),/50 mm clearance/);
});
test('the added top and bottom bores retain exact machined volume through STEP',async()=>{
 await ready;const c=config('Base',{back:3,backInset:19,wallMounted:true,wallHanger:'blum_48n0510',wallRailNotches:true,backConnector:'hafele_26009765'}),rows=assemblyRows(c).filter(p=>['Bottom','Rear rail'].includes(p.row[0]));let total=0;
 for(const row of rows){const shape=buildPart(row),plain=buildPart({...row,operations:row.operations.filter(o=>!o.rpcConnector)});try{const r=7.5,h=(c.back+c.clearance)/2,stripe=2*(h*Math.sqrt(r*r-h*h)+r*r*Math.asin(h/r));near(measureVolume(plain)-measureVolume(shape),Math.PI*r*r*12.5-stripe*c.grooveDepth);total+=measureVolume(shape);}finally{shape.delete();plain.delete();}}
 const shape=await importSTEP(new Blob([await cadStep(rows)]));try{near(measureVolume(shape),total);}finally{shape.delete();}
});
