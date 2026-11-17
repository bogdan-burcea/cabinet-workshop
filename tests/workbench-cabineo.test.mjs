import test from 'node:test';
import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';
import {setOC,measureVolume,importSTEP} from 'replicad';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {cabinetParts,loadProject,saveProject} from '../src/workbench/cabinet.js';
import {manufacturingParts} from '../src/workbench/single-side.js';
import {cabineoOperations,cabineoVariants} from '../src/workbench/cabineo.js';
import {initializeProject,projectParts,projectLayout,serializeProject,deserializeProject,addCabinet,syncProject} from '../src/workbench/project.js';
import {commonValues,setCommonGroup} from '../src/workbench/project-settings.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
import {costRows} from '../src/workbench/costs.js';
import {sheetStepRows} from '../src/workbench/sheet-step.js';
import {buildPart,cadStep} from '../src/cad-core.js';
import {assemblyRows} from '../src/workbench/assembly-model.js';
const ready=init({print:()=>{}}).then(setOC);
const config=(style='Base',extra={})=>enableInstallation({...cabinetDefaults(style),...extra},undefined,{fresh:true});
const state=c=>initializeProject({cabinet:c,globals:globalsFrom(c),independentCabinets:true,machine:{...machineDefaults},stock:{...stockDefaults,width:2440,height:1220,rotate:true}});
const near=(a,b,eps=.001)=>assert(Math.abs(a-b)<eps,`${a} != ${b}`);
test('legacy cabinets and style profiles keep screw joinery and load without new fields',()=>{
 const c=config('Base',{assembly:true}),legacy=structuredClone(c);delete legacy.assemblyConnector;delete legacy.cabineoSetback;
 assert.deepEqual(cabinetParts(c),cabinetParts(legacy));
 const s=state(c);setCommonGroup(s,'joinery',{assembly:true});const saved=serializeProject(s);delete saved.projectSettings.joinery.Base.assemblyConnector;delete saved.projectSettings.joinery.Base.cabineoSetback;
 const restored=deserializeProject(saved);assert.equal(restored.cabinet.assemblyConnector,'screws');assert.deepEqual(projectParts(restored),projectParts(s));
});
test('Cabineo 8 and 12 use the manufacturer face pattern on all four cabinet styles',()=>{
 for(const style of ['Base','Wall','Tall','Pantry'])for(const assemblyConnector of Object.keys(cabineoVariants)){
 const c=config(style,{assembly:true,bottomDado:false,assemblyConnector,edgeBand:1}),parts=manufacturingParts(cabinetParts(c)),ops=parts.flatMap(p=>p.flatOperations),housing=ops.filter(o=>o.cabineoGroup),fixing=ops.filter(o=>o.label.endsWith(' fixing')&&o.label.startsWith('Lamello Cabineo'));
 assert(fixing.length>0);assert.equal(housing.length,fixing.length*3);assert(housing.every(o=>o.axis===2&&o.sign===-1&&o.diameter===15&&o.depth===11));assert(fixing.every(o=>o.axis===2&&o.sign===-1&&o.diameter===5&&o.depth===cabineoVariants[assemblyConnector].length));assert(!ops.some(o=>/^Assembly (clearance|pilot)$/.test(o.label)));
 for(const group of new Set(housing.map(o=>o.cabineoGroup))){const triple=housing.filter(o=>o.cabineoGroup===group);near(Math.hypot(triple[1].point[0]-triple[0].point[0],triple[1].point[1]-triple[0].point[1]),11.2);near(Math.hypot(triple[2].point[0]-triple[0].point[0],triple[2].point[1]-triple[0].point[1]),22.4);assert.equal(triple.filter(o=>o.edgeOpening).length,1);}
 assert(assemblyRows(c).some(p=>p.operations.some(o=>o.cabineoGroup)));
 }
});
test('Cabineo connector spacing covers long joints and fixed shelves without exceeding 300 mm',()=>{
 const c=config('Tall',{assembly:true,assemblyConnector:'cabineo8',bottomDado:false,split:true,lowerType:'open',upperType:'open',lowerShelves:0,upperShelves:0,depth:1000});
 const parts=cabinetParts(c);assert(parts.find(p=>p.row[0]==='Fixed shelf').flatOperations.some(o=>o.cabineoGroup));
 const rows=[['Bottom',18,0,0,564,1000,18]],ops=cabineoOperations({...c,backGroove:false},rows),ys=ops.filter(o=>o.part==='Left side').map(o=>o.point[1]);
 assert(ys.length>=4);for(let i=1;i<ys.length;i++)assert(ys[i]-ys[i-1]<=300);assert.equal(ys[0],50);assert.equal(ys.at(-1),944);
 const small=cabineoOperations({...c,depth:106,back:6,backGroove:false},[['Front rail',18,0,100,564,100,18]]);assert.equal(small.filter(o=>o.part==='Left side').length,2);
});
test('Cabineo rejects unsuitable joints, stock, gaps, edge bands and hardware conflicts',()=>{
 const c=config('Base',{assembly:true,bottomDado:false,assemblyConnector:'cabineo12'});
 assert.throws(()=>cabinetParts({...c,bottomDado:true}),/Cabineo requires butt joints/);
 assert.throws(()=>cabinetParts({...c,thickness:12,pins:false,frontMode:'open',doors:0}),/side panel at least 13/);
 assert.throws(()=>cabinetParts({...c,assemblyConnector:'unknown'}),/Choose screws/);
 assert.throws(()=>cabinetParts({...c,cabineoSetback:19}),/20–300/);
 assert.throws(()=>cabinetParts({...c,split:true,shelfThickness:10}),/at least 12 mm/);
 assert.throws(()=>cabinetParts({...c,width:100,frontMode:'open',doors:0}),/overlaps|crosses/);
 assert.throws(()=>cabinetParts({...c,cabineoSetback:20,edgeBand:20}),/band.*hardware|crosses/);
 const bottom=cabinetParts(c).find(p=>p.row[0]==='Bottom'),o=bottom.flatOperations.find(o=>o.cabineoGroup);
 assert.throws(()=>cabinetParts({...c,featureEdits:{operations:{[o.featureId]:{depth:10}},bands:{}}}),/matched Cabineo/);
 const off=cabinetParts({...c,assembly:false});assert(!off.some(p=>p.flatOperations.some(o=>o.cabineoGroup)));
});
test('Cabineo sharing, saved projects and hardware counts follow the chosen style and exact fittings',()=>{
 const s=state(config('Base',{bottomDado:false}));setCommonGroup(s,'joinery',{assembly:true,assemblyConnector:'cabineo8',bottomDado:false});syncProject(s);addCabinet(s,{style:'Base'});assert(s.cabinets.every(r=>r.config.assemblyConnector==='cabineo8'));
 addCabinet(s,{style:'Wall'});assert.equal(s.cabinet.assemblyConnector,'screws');const restored=deserializeProject(serializeProject(s));assert.deepEqual(projectParts(restored),projectParts(s));assert.equal(commonValues(restored,'joinery','Base').assemblyConnector,'cabineo8');
 const layout=projectLayout(s),parts=projectParts(s),cost=costRows(s.cabinets,parts,layout),quantity=parts.flatMap(p=>p.flatOperations).filter(o=>o.label==='Lamello Cabineo 8 fixing').length;
 assert.equal(cost.rows.find(r=>r.label.includes('267.91.251')).quantity,quantity);
 assert(!cost.rows.some(r=>r.label.includes('267.91.252')));assert.equal(layout.unplaced.length,0);assert(layout.sheets.flatMap(sheetStepRows).some(r=>r.operations.some(o=>o.cabineoGroup)));
});
test('Cabineo solid cuts equal the analytic triple-circle pocket and roundtrip as machined STEP bodies',async()=>{
 await ready;const c=config('Base',{assembly:true,assemblyConnector:'cabineo12',bottomDado:false,backGroove:false,frontMode:'open',doors:0,shelves:0,feet:'none',topConstruction:'full'}),parts=manufacturingParts(cabinetParts(c)),bottom=parts.find(p=>p.row[0]==='Bottom');
 const r=7.5,d=11.2,intersection=2*r*r*Math.acos(d/(2*r))-.5*d*Math.sqrt(4*r*r-d*d),outside=r*r*Math.acos(3.6/r)-3.6*Math.sqrt(r*r-3.6*3.6),area=3*Math.PI*r*r-2*intersection-outside,connectorCount=bottom.flatOperations.filter(o=>o.edgeOpening).length;
 const solid=buildPart({row:['Bottom',0,0,0,bottom.width,bottom.height,bottom.thickness],operations:bottom.flatOperations});try{near(measureVolume(solid),bottom.width*bottom.height*bottom.thickness-area*11*connectorCount,.01);}finally{solid.delete();}
 const s=state(c),sheet=projectLayout(s).sheets[0],rows=sheetStepRows(sheet),text=await cadStep(rows);assert(text.includes('Lamello Cabineo')===false);assert.equal((text.match(/MANIFOLD_SOLID_BREP\(/g)||[]).length,rows.length);assert.equal((text.match(/= PRODUCT\(/g)||[]).length,1);
 const imported=await importSTEP(new Blob([text]));try{let expected=0;for(const row of rows){const body=buildPart(row);try{expected+=measureVolume(body);}finally{body.delete();}}near(measureVolume(imported),expected,.02);}finally{imported.delete();}
});
