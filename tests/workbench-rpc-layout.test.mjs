import test from 'node:test';import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';import {setOC,measureVolume,importSTEP} from 'replicad';
import {cabinetDefaults} from '../src/workbench/styles.js';import {cabinetParts} from '../src/workbench/cabinet.js';
import {enableInstallation,floorClearance} from '../src/workbench/installation.js';import {globalsFrom} from '../src/workbench/globals.js';
import {initializeProject,syncProject,serializeProject,deserializeProject,projectParts,projectLayout,moveCabinetInElevation} from '../src/workbench/project.js';
import {machineDefaults} from '../src/workbench/cam.js';import {stockDefaults} from '../src/workbench/production.js';
import {setCommonGroup} from '../src/workbench/project-settings.js';import {featureSettingsValues,withFeatureSettings} from '../src/workbench/feature-settings.js';
import {frontLayout} from '../src/workbench/front-plan.js';import {costRows} from '../src/workbench/costs.js';
import {assemblyRows} from '../src/workbench/assembly-model.js';import {buildPart,cadStep} from '../src/cad-core.js';
import {roundSeam} from '../src/workbench/rounded-joint.js';
const config=(style='Base',extra={})=>enableInstallation({...cabinetDefaults(style),...extra},undefined,{fresh:true});
const state=c=>initializeProject({cabinet:c,globals:globalsFrom(c),independentCabinets:true,machine:{...machineDefaults},stock:{...stockDefaults,width:2440,height:1220,rotate:true}});
const near=(a,b,t=.01)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);const ready=init({print:()=>{}}).then(setOC);
test('Ixconnect accepts only its specified material/groove envelope and counts evenly on both vertical sides',()=>{
 for(const style of ['Base','Wall','Tall','Pantry'])for(const count of [1,2,4]){
 const c=config(style,{back:3,backInset:11,backConnector:'hafele_26009765',backConnectorsPerSide:count}),parts=cabinetParts(c),holes=parts.flatMap(p=>p.flatOperations).filter(o=>o.rpcConnector);assert.equal(holes.length,count*2+2);assert(holes.every(o=>o.axis===2&&o.depth===12.5&&o.diameter===15));assert(!parts.find(p=>p.row[0]==='Back').flatOperations.some(o=>o.rpcConnector));
 for(const p of parts.filter(p=>/^(Left|Right) side$/.test(p.row[0]))){const hs=p.flatOperations.filter(o=>o.rpcConnector);assert.equal(hs.length,count);for(let i=2;i<hs.length;i++)near(hs[i].point[1]-hs[i-1].point[1],hs[1].point[1]-hs[0].point[1]);}
 }
 const base={...cabinetDefaults(),backConnector:'hafele_26009765',back:3,backInset:11};for(const patch of [{back:6},{thickness:14},{backGroove:false},{grooveDepth:7},{backInset:9},{backConnectorsPerSide:2.5},{backConnectorsPerSide:21}])assert.throws(()=>cabinetParts({...base,...patch}),/Ixconnect|Back connectors/);
});
test('shared connector changes validate atomically, reserve the rear bore location, persist and count pre-screwed fittings',()=>{
 const s=state(config()),before=structuredClone(s);assert.throws(()=>withFeatureSettings(s,'joinery',{...featureSettingsValues(s,'joinery'),backConnector:'hafele_26009765'}),/2.5–3.5/);assert.deepEqual(s,before);
 setCommonGroup(s,'backPanel',{back:3});syncProject(s);const next=withFeatureSettings(s,'joinery',{...featureSettingsValues(s,'joinery'),backConnector:'hafele_26009765',backConnectorsPerSide:3});assert.equal(next.cabinet.backInset,10.5);assert.throws(()=>withFeatureSettings(next,'joinery',{...featureSettingsValues(next,'joinery'),backGroove:false}),/captured back groove/);const layout=projectLayout(next),estimate=costRows(next.cabinets,layout.parts,layout);assert.equal(estimate.rows.find(r=>r.label.startsWith('260.09.765')).quantity,8);assert.deepEqual(projectParts(deserializeProject(serializeProject(next))),projectParts(next));
 const legacy=structuredClone(next);delete legacy.projectSettings.joinery.Base.backConnector;delete legacy.projectSettings.joinery.Base.backConnectorsPerSide;legacy.cabinet.backConnector='none';syncProject(legacy);assert.equal(legacy.cabinet.backConnector,'none');
});
test('Ixconnect CAD bores subtract the catalogue cylinder minus its intentional captured-groove intersection',async()=>{
 await ready;const c=config('Base',{back:3,backInset:11,backConnector:'hafele_26009765',backConnectorsPerSide:2}),rows=assemblyRows(c).filter(p=>/^(Left|Right) side$/.test(p.row[0]));let expected=0;
 for(const row of rows){const solid=buildPart(row),plain=buildPart({...row,operations:row.operations.filter(o=>!o.rpcConnector)});try{const r=7.5,h=(c.back+c.clearance)/2,stripe=2*(h*Math.sqrt(r*r-h*h)+r*r*Math.asin(h/r));near(measureVolume(plain)-measureVolume(solid),2*(Math.PI*r*r*12.5-stripe*c.grooveDepth));expected+=measureVolume(solid);}finally{solid.delete();plain.delete();}}
 const text=await cadStep(rows),shape=await importSTEP(new Blob([text]));try{near(measureVolume(shape),expected);}finally{shape.delete();}
});
function screenshotState(auto=false){const configs=[config('Tall'),config('Base'),config('Tall'),config('Wall'),config('Wall')],xs=[0,600,1200,600,1800],records=configs.map((c,i)=>({id:'cab-'+i,config:c,x:xs[i],positionMode:'manual'}));if(auto)for(const r of records){delete r.x;delete r.positionMode;}return initializeProject({...state(configs[2]),cabinet:configs[2],cabinets:records,activeCabinetId:'cab-2'});}
test('the screenshot Tall/last-Wall swap preserves an intentional empty floor slot and survives save/open',()=>{
 for(const auto of [false,true]){const s=screenshotState(auto),before=frontLayout(s.cabinets);assert.equal(before.overlaps.length,0);assert(moveCabinetInElevation(s,'cab-2',4));const after=frontLayout(s.cabinets);assert.equal(after.items.find(a=>a.id==='cab-2').x,1800);assert.equal(after.items.find(a=>a.id==='cab-4').x,1200);assert.equal(after.overlaps.length,0);assert(!after.items.some(a=>a.style!=='Wall'&&a.x===1200));assert.deepEqual(frontLayout(deserializeProject(serializeProject(s)).cabinets).items,after.items);
 assert(moveCabinetInElevation(s,'cab-2',1));const reordered=frontLayout(s.cabinets);assert.equal(reordered.overlaps.length,0);assert.equal(reordered.items.find(a=>a.id==='cab-2').x,600);}
});
test('wall fixing preserves the selected floor support on Base, Tall and Pantry',()=>{
 for(const style of ['Base','Tall','Pantry']){const c=config(style,{feet:'rectangle',wallMounted:false,plinth:true}),before=cabinetParts(c),floor=floorClearance(c),height=c.height;c.wallMounted=true;c.wallSuspensionEnabled=false;c.wallHanger='blum_48n0510';c.backInset=19;syncProject(state(c));const after=cabinetParts(c);assert.equal(after.flatMap(p=>p.flatOperations).filter(o=>o.label==='Blum wall hanger pilot').length,4);assert.equal(floorClearance(c),floor);assert.equal(c.height,height);assert(after.some(p=>p.row[0]==='Plinth'));assert.equal(after.flatMap(p=>p.flatOperations).filter(o=>o.label.startsWith('Foot plate')).length,before.flatMap(p=>p.flatOperations).filter(o=>o.label.startsWith('Foot plate')).length);}
});
test('rounded seams share four tangent corner arcs without separate drilled corner holes',()=>{
 const arcs=roundSeam([[0,0],[0,25],[-20,20],[-20,50],[0,45],[0,70]]);assert.equal(arcs.length,4);assert(arcs.every(a=>a.length===17));for(const a of arcs)assert(a.every(p=>p.every(Number.isFinite)));
 const parts=cabinetParts({...cabinetDefaults(),doorStyle:'glass'}).filter(p=>p.glassFramePart);assert(parts.every(p=>!p.flatOperations.some(o=>o.dovetailGroup&&o.type==='bore')));assert(parts.some(p=>p.flatOperations.some(o=>o.glassRebateRelief)));
});
