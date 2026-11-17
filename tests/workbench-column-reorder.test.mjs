import test from 'node:test';import assert from 'node:assert/strict';
import {cabinetDefaults} from '../src/workbench/styles.js';import {enableInstallation} from '../src/workbench/installation.js';
import {initializeProject,moveCabinetInElevation,serializeProject,deserializeProject} from '../src/workbench/project.js';
import {frontLayout} from '../src/workbench/front-plan.js';import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';import {stockDefaults} from '../src/workbench/production.js';
function fixture(xs=[0,600,1800,600,1200],widths=[600,600,600,600,600]){const records=['Tall','Base','Tall','Wall','Wall'].map((style,i)=>({id:'c'+i,x:xs[i],positionMode:'manual',config:enableInstallation({...cabinetDefaults(style),width:widths[i]},undefined,{fresh:true})})),c=records[0].config;return initializeProject({cabinet:c,cabinets:records,activeCabinetId:'c0',independentCabinets:true,globals:globalsFrom(c),machine:{...machineDefaults},stock:{...stockDefaults}});}
const positions=s=>Object.fromEntries(frontLayout(s.cabinets).items.map(a=>[a.id,a.x]));
test('left Tall moves after the Base/Wall stack shown in the screenshot without collision',()=>{
 const s=fixture(),before=structuredClone(s),configs=structuredClone(s.cabinets.map(r=>r.config));assert.equal(frontLayout(s.cabinets).overlaps.length,0);assert(moveCabinetInElevation(s,'c0',2));assert.deepEqual(positions(s),{c1:0,c0:600,c2:1800,c3:0,c4:1200});assert.equal(frontLayout(s.cabinets).overlaps.length,0);assert.deepEqual(s.cabinets.map(r=>r.config),configs);assert.equal(s.activeCabinetId,'c0');
 const restored=deserializeProject(serializeProject(s));assert.deepEqual(positions(restored),positions(s));assert.deepEqual(positions(before),{c0:0,c1:600,c2:1800,c3:600,c4:1200});
});
test('different cabinet widths and explicit horizontal gaps survive column reordering',()=>{
 const s=fixture([100,800,2100,800,1500],[600,500,700,600,400]);assert(moveCabinetInElevation(s,'c0',2));assert.deepEqual(positions(s),{c1:100,c0:800,c2:2100,c3:100,c4:1500});assert.equal(frontLayout(s.cabinets).overlaps.length,0);assert.equal(frontLayout(s.cabinets).width,2800);
});
test('pulling a cabinet out of a stack keeps its peer and creates a safe new column',()=>{
 const s=fixture();assert(moveCabinetInElevation(s,'c1',4));assert.deepEqual(positions(s),{c0:0,c2:1800,c1:2400,c3:600,c4:1200});assert.equal(frontLayout(s.cabinets).overlaps.length,0);assert.equal(frontLayout(s.cabinets).width,3000);
});
test('dropping within the same stack is a no-op; invalid destinations do not change the project',()=>{
 const s=fixture(),before=serializeProject(s);assert.equal(moveCabinetInElevation(s,'c1',2),false);assert.deepEqual(serializeProject(s),before);assert.throws(()=>moveCabinetInElevation(s,'c0',99),/Choose a position/);assert.deepEqual(serializeProject(s),before);
});
