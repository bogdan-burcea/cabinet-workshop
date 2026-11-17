import test from 'node:test';import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';import {setOC,measureVolume,importSTEP} from 'replicad';
import {cabinetDefaults,switchCabinetStyle} from '../src/workbench/styles.js';import {cabinetParts} from '../src/workbench/cabinet.js';
import {assemblyRows} from '../src/workbench/assembly-model.js';import {buildPart,cadStep} from '../src/cad-core.js';
import {manufacturingParts} from '../src/workbench/single-side.js';import {packParts,placedOperations} from '../src/nesting.js';
import {sheetStepRows} from '../src/workbench/sheet-step.js';import {transformOperation} from '../src/machining.js';
import {partLabelUrl,readPartLabel} from '../src/workbench/part-labels.js';import {snapshotPart} from '../src/workbench/part-thumbnail.js';
import {sectionConfigs} from '../src/workbench/sections.js';import {makePartJobs} from '../src/workbench/cam.js';
const ready=init({print:()=>{}}).then(setOC);const near=(a,b)=>assert(Math.abs(a-b)<.01,`${a} != ${b}`);
test('flat dovetails have matched rail/stile groups, cutter-sized reliefs, no edge pilots and faithful QR profiles',()=>{
 for(const glassFrame of [50,70,100]){const c={...cabinetDefaults(),doorStyle:'glass',doors:1,glassFrame},parts=manufacturingParts(cabinetParts(c)).filter(p=>p.glassFramePart);
 assert.equal(parts.length,4);for(const p of parts){assert(p.flatOperations.every(o=>o.axis===2&&o.sign===-1));assert(!p.flatOperations.some(o=>o.label==='Frame dowel'));assert(!p.flatOperations.some(o=>o.dovetailGroup&&o.type==='bore'));assert(p.frameJoint.radius>=4);
 const polygons=p.flatOperations.filter(o=>o.cutPolygon);assert(polygons.length);assert(polygons.every(o=>o.maxToolDiameter===8));const a=readPartLabel(new URL(partLabelUrl({...p,owner:'Test'})).hash),restored=snapshotPart(a);assert.deepEqual(restored.flatOperations.filter(o=>o.cutPolygon).map(o=>o.cutPolygon),polygons.map(o=>o.cutPolygon.map(pt=>pt.map(v=>Number(v.toFixed(2))))));assert.throws(()=>makePartJobs(p),/STEP export/);
 }}
});
test('actual dovetail members remain single solids and assemble without intersections for narrow/wide frames and banded stock',async()=>{
 await ready;for(const [glassFrame,edgeBand,doorThickness]of [[50,0,16],[70,1,18],[100,0,24]]){
 const c={...cabinetDefaults(),doorStyle:'glass',doors:1,glassFrame,edgeBand,doorThickness},rows=assemblyRows(c).filter(p=>p.glassFramePart),solids=rows.map(buildPart);
 try{for(const s of solids){assert(measureVolume(s)>0);const bodies=s.solids;try{assert.equal(bodies.length,1);}finally{bodies.forEach(b=>b.delete());}}for(let i=0;i<solids.length;i++)for(let j=0;j<i;j++){const overlap=solids[i].intersect(solids[j]);try{near(measureVolume(overlap),0);}finally{overlap.delete();}}const source=rows[0],noRelief=buildPart({...source,operations:source.operations.filter(o=>o.label!=='Glass rebate corner relief')});try{assert(measureVolume(noRelief)>measureVolume(solids[0])+1);}finally{noRelief.delete();}}
 finally{solids.forEach(s=>s.delete());}
 }
});
test('polygon machining survives mirrored/rotated nesting and machined STEP roundtrip',async()=>{
 await ready;const p=manufacturingParts(cabinetParts({...cabinetDefaults(),doorStyle:'glass',doors:1,edgeBand:1})).find(p=>p.glassFramePart==='top rail');
 const transformed=transformOperation(p.flatOperations.find(o=>o.cutPolygon),([x,y,z])=>[400-y,20+x,z],([x,y,z])=>[-y,x,z]);assert(transformed.cutPolygon.length>20);
 const sheet={number:1,thickness:p.thickness,settings:{width:1200,height:1200},parts:[{...p,x:20,y:30,w:p.height,h:p.width,rotated:true}]},rows=sheetStepRows(sheet),raw=buildPart({row:['Raw',0,0,0,p.width,p.height,p.thickness],operations:p.flatOperations}),solid=buildPart(rows[0]);try{near(measureVolume(raw),measureVolume(solid));const text=await cadStep(rows),imported=await importSTEP(new Blob([text]));try{near(measureVolume(imported),measureVolume(solid));assert.match(text,/CYLINDRICAL_SURFACE/);}finally{imported.delete();}}finally{raw.delete();solid.delete();}
});
test('section hinge counts remain editable and Tall plinths return when switching from Wall',()=>{
 const c={...cabinetDefaults(),sections:{splitHeight:400,lowerType:'open',upperType:'doors',lowerShelves:0,upperShelves:0,lowerDrawers:1,upperDrawers:1,hingeCount:3,hingeEnd:80},machining:{}};assert(sectionConfigs(c).every(p=>p.child.machining.hingeCount===3));const tall=switchCabinetStyle(cabinetDefaults('Wall'),'Tall');assert.equal(tall.plinth,true);assert(cabinetParts(tall).some(p=>p.row[0]==='Plinth'));
});
