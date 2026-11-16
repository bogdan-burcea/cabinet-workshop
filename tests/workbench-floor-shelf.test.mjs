import test from 'node:test';import assert from 'node:assert/strict';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation,resolveInstallation,floorClearance} from '../src/workbench/installation.js';
import {cabinetParts} from '../src/workbench/cabinet.js';
import {initializeProject,serializeProject,deserializeProject} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';import {stockDefaults} from '../src/workbench/production.js';
test('explicit shelf floor elevation survives support changes and save/open; legacy local heights stay unchanged',()=>{
 const c=enableInstallation({...cabinetDefaults('Tall'),split:true,splitHeight:400,lowerType:'open',upperType:'open',feetHeight:150.5},undefined,{fresh:true});
 assert.equal(c.splitHeight,400);c.splitFloorHeight=891;resolveInstallation(c);
 const centre=()=>{const r=cabinetParts(c).find(p=>p.row[0]==='Fixed shelf').row;return r[3]+r[6]/2+floorClearance(c);};
 assert.equal(centre(),891);c.feetHeight=180.3;resolveInstallation(c);assert.equal(centre(),891);c.wallMounted=true;c.wallMountingHeight=250.7;resolveInstallation(c);assert.equal(centre(),891);
 const s=initializeProject({cabinet:c,globals:globalsFrom(c),independentCabinets:true,machine:{...machineDefaults},stock:{...stockDefaults}}),restored=deserializeProject(serializeProject(s));assert.equal(restored.cabinet.splitFloorHeight,891);assert.equal(restored.cabinet.splitHeight+floorClearance(restored.cabinet),891);
});
test('wall cabinet can disable shared suspension machining without changing its installed elevation',()=>{
 const c=enableInstallation({...cabinetDefaults('Wall'),wallHanger:'blum_48n0510',wallRailNotches:true,backInset:19},undefined,{fresh:true});
 const operations=()=>cabinetParts(c).flatMap(p=>p.flatOperations).filter(o=>/wall hanger|Wall rail|Wall hanger/.test(o.label));assert(operations().length>0);const bottom=floorClearance(c),height=c.height;c.wallSuspensionEnabled=false;resolveInstallation(c);assert.equal(operations().length,0);assert.equal(floorClearance(c),bottom);assert.equal(c.height,height);c.wallSuspensionEnabled=true;assert(operations().length>0);
});
