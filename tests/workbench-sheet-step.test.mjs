import test from 'node:test';
import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';
import {setOC,measureVolume,importSTEP} from 'replicad';
import {buildPart,cadStep} from '../src/cad-core.js';
import {sheetStepRows,sheetStepManifest,sheetStepFilename,stepSetupGuide} from '../src/workbench/sheet-step.js';
import {cabinetParts} from '../src/workbench/cabinet.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {initializeProject,projectLayout} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
const ready=init({print:()=>{}}).then(setOC);
const near=(a,b,tol=1e-5)=>assert(Math.abs(a-b)<tol,a+' != '+b);
function fixture(){const cabinet=enableInstallation({...cabinetDefaults(),doorStyle:'glass',glassFrame:70,edgeBand:1,feet:'single',feetThrough:false,feetDepth:8,assembly:true},undefined,{fresh:true});return initializeProject({cabinet,globals:globalsFrom(cabinet),machine:{...machineDefaults},stock:{...stockDefaults,rotate:true}});}
test('rotated and mirrored secondary features retain the actual machining coordinate frame',()=>{
 const sheet={number:2,material:'Board',thickness:18,settings:{width:600,height:600},parts:[{singleSide:true,code:'C01-P001',owner:'Base',row:['Panel'],width:100,height:200,thickness:18,w:200,h:100,x:30,y:40,rotated:true,originalFace:'B',flatHoles:[{x:10,y:20,width:15,height:25}],flatOperations:[{type:'bore',axis:2,sign:-1,diameter:5,depth:12,point:[25,70,18]},{type:'bore',axis:0,sign:1,diameter:3,depth:15,point:[0,100,9]}],secondaryOperations:[{type:'bore',axis:2,sign:1,diameter:2.5,depth:8,point:[20,30,0]}]}]};
 const rows=sheetStepRows(sheet),r=rows[0];assert.deepEqual(r.row,['C01-P001 Panel',30,40,-18,200,100,18]);assert.deepEqual(r.operations[0].point,[160,65,0]);assert.deepEqual(r.operations[1].point,[130,40,-9]);assert.equal(r.operations[1].axis,1);assert.deepEqual(r.operations[2].point,[200,120,0]);assert.equal(r.operations[2].sign,-1);assert.deepEqual(r.holes,[{x:185,y:50,width:25,depth:15}]);assert.equal(sheetStepManifest(sheet).parts[0].edgeOperations,1);assert.equal(sheetStepFilename(sheet),'Sheet_02_18mm.step');assert.match(stepSetupGuide([sheetStepManifest(sheet)],{unplaced:2}),/2 parts are unplaced/);
 const bad=structuredClone(sheet);bad.parts[0].singleSide=false;assert.throws(()=>sheetStepRows(bad),/machining-face-up/);bad.parts[0].singleSide=true;bad.parts[0].x=599;assert.throws(()=>sheetStepRows(bad),/placement/);
});
test('a full nested glass-door sheet preserves raw part volumes, bores, dados, bands and secondary machining',async()=>{
 await ready;const s=fixture(),layout=projectLayout(s);assert.equal(layout.unplaced.length,0);const raw=new Map(cabinetParts(s.cabinet).map(p=>[p.code,p]));let checked=0,secondary=0;
 for(const sheet of layout.sheets)for(const [i,row]of sheetStepRows(sheet).entries()){
  const placed=sheet.parts[i],source=raw.get(placed.sourceCode),original=buildPart({row:['Original',0,0,0,source.width,source.height,source.thickness],operations:source.flatOperations,holes:source.flatHoles.map(h=>({x:h.x,y:h.y,width:h.width,depth:h.height}))}),solid=buildPart(row);
  try{near(measureVolume(solid),measureVolume(original),.001);const box=solid.boundingBox;try{near(box.bounds[0][2],-sheet.thickness,.0001);near(box.bounds[1][2],0,.0001);near(box.width,placed.w,.0001);near(box.height,placed.h,.0001);}finally{box.delete();}}finally{solid.delete();original.delete();}secondary+=(placed.secondaryOperations||[]).length;checked++;
 }
 assert.equal(checked,layout.parts.length);assert(secondary>0);
});
test('nested sheet STEP round-trips as separate named solids with unchanged volume and placement',async()=>{
 await ready;const layout=projectLayout(fixture()),sheet=layout.sheets.find(s=>s.parts.some(p=>p.row[0].startsWith('Door')))||layout.sheets[0],rows=sheetStepRows(sheet);let volume=0;for(const r of rows){const solid=buildPart(r);volume+=measureVolume(solid);solid.delete();}
 const text=await cadStep(rows);assert.match(text,/ISO-10303-21/);assert.match(text,/CYLINDRICAL_SURFACE/);assert.equal((text.match(/MANIFOLD_SOLID_BREP\(/g)||[]).length,rows.length);assert(text.includes(sheet.parts[0].code));const imported=await importSTEP(new Blob([text]));try{near(measureVolume(imported),volume,.01);const solids=imported.solids;try{assert.equal(solids.length,rows.length);}finally{solids.forEach(s=>s.delete());}const box=imported.boundingBox;try{near(box.bounds[0][2],-sheet.thickness,.0001);near(box.bounds[1][2],0,.0001);}finally{box.delete();}}finally{imported.delete();}
});
