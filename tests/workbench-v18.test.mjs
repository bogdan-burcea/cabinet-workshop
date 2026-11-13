import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,cabinetParts,cabinetRows,saveProject,loadProject} from '../src/workbench/cabinet.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {globalsFrom,applyGlobals} from '../src/workbench/globals.js';
import {withHandleSettings} from '../src/workbench/handle-settings.js';
import {glassSchedule} from '../src/workbench/doors.js';
import {manufacturingParts} from '../src/workbench/single-side.js';
import {layoutFor,sheetJobs,flatOnly} from '../src/workbench/production.js';
import {allJobs,gcode,validateMoves,machineDefaults} from '../src/workbench/cam.js';
import {previewFaces} from '../src/workbench/view.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('inset doors fit between sides, bottom and top with two millimetre reveals',()=>{
 for(const style of ['Base','Wall'])for(const doors of [1,2]){const c={...cabinetDefaults(style),hinge:'blum_71b3750',doors},rows=cabinetRows(c).map(p=>p.row),fronts=rows.filter(r=>/^Door/.test(r[0]));close(fronts[0][1],20);close(fronts.at(-1)[1]+fronts.at(-1)[4],580);close(fronts[0][3],c.bottomLift+20);close(fronts[0][3]+fronts[0][6],700);if(doors===2)close(fronts[1][1]-fronts[0][1]-fronts[0][4],2);
 const ps=cabinetParts(c),cups=ps.filter(p=>/^Door/.test(p.row[0])).flatMap(p=>p.flatOperations.filter(o=>o.label==='Hinge cup'));assert.equal(cups.length,doors*2);const side=ps.find(p=>p.row[0]==='Left side');side.flatOperations.filter(o=>o.label==='Hinge plate').forEach(o=>close(c.depth-o.point[0],56.5));}
});
test('handle presets update matched drilling, clear stale hole edits and respect wall-local placement',()=>{
 const c=structuredClone(defaults);c.featureEdits.operations['["base-cabinet/Door left","Handle through hole",2,0]']={dx:2};c.featureEdits.operations['["x","Hinge cup",2,0]']={dx:1};const g=globalsFrom(c),r=withHandleSettings(c,g,{handle:'knob',handlePosition:'top_center'});assert.equal(Object.keys(r.cabinet.featureEdits.operations).length,1);assert.equal(r.globals.handle,'knob');const ps=cabinetParts(r.cabinet).filter(p=>/^Door/.test(p.row[0]));for(const p of ps){const holes=p.flatOperations.filter(o=>o.label==='Handle through hole');assert.equal(holes.length,1);close(holes[0].point[0],p.width/2);}
 const w={...cabinetDefaults('Wall')},wr=withHandleSettings(w,globalsFrom(w),{handlePosition:'bottom_center',handle:'vertical'});assert.equal(wr.globals.handlePosition,'auto_bottom');assert.equal(wr.globals.handle,'vertical');applyGlobals(wr.cabinet,wr.globals);assert.equal(wr.cabinet.handlePosition,'bottom_center');assert.throws(()=>withHandleSettings(w,globalsFrom(w),{handlePosition:'top_center'}),/placement/);
});
test('glass frames retain wooden part identity, a separate glass schedule and all inside machining',()=>{
 for(const style of ['Base','Wall'])for(const hinge of ['blum_71b3550','blum_71b3750']){const c={...cabinetDefaults(style),hinge,doorStyle:'glass'},raw=cabinetParts(c),ps=manufacturingParts(raw),gs=glassSchedule(ps,c);assert.equal(gs.length,2);assert.equal(ps.length,9);for(const p of ps.filter(p=>/^Door/.test(p.row[0]))){const ops=p.flatOperations;assert.equal(ops.filter(o=>o.innerProfile).length,1);assert.equal(ops.filter(o=>/^Glass rebate/.test(o.label)).length,4);assert(ops.every(o=>o.axis!==2||o.sign===-1));const g=gs.find(g=>g.part===p.code);close(g.width,p.width-2*c.glassFrame+14);close(g.thickness,4);}
 const loaded=loadProject(saveProject(c,machineDefaults));assert.deepEqual(cabinetParts(loaded.cabinet),raw);const faces=previewFaces(c);assert(faces.some(f=>f.glass));assert(faces.filter(f=>/^Door/.test(f.name)&&!f.glass).length>12);}
});
test('glass aperture uses compensated inside contours with waste tabs and through allowance',()=>{
 const c={...defaults,doorStyle:'glass'},ps=manufacturingParts(cabinetParts(c)),door=ps.find(p=>/^Door/.test(p.row[0]));const jobs=allJobs(flatOnly([door]),{...machineDefaults,toolStrategy:'single'});const j=jobs.find(j=>j.operations.some(o=>o.innerProfile)),o=j.operations.find(o=>o.innerProfile),moves=j.moves.filter(m=>m.operation==='Glass opening');assert(moves.some(m=>m.tab));close(Math.min(...moves.map(m=>m.to[2])),-18.2);const cut=moves.filter(m=>m.kind==='line');assert(cut.every(m=>m.to[0]>=o.box[0]+1.5-1e-6&&m.to[0]<=o.box[0]+o.box[3]-1.5+1e-6));assert(validateMoves(j));
});
test('glass sheet programs preserve every operation and put exterior profiles after frame machining',()=>{
 for(const toolStrategy of ['manual','single']){const c={...defaults,doorStyle:'glass',hinge:'blum_71b3750',edgeBand:1},l=layoutFor(c,{rotate:true},{singleSide:true}),jobs=sheetJobs(l,{toolStrategy});assert.equal(jobs.length,l.sheets.length);assert.equal(jobs.flatMap(j=>j.operations).length,l.parts.flatMap(p=>p.flatOperations).filter(o=>o.axis===2).length);for(const j of jobs){assert(validateMoves(j));let outside=false;for(const m of j.moves){if(m.pathType==='profile')outside=true;else if(m.kind!=='rapid')assert(!outside);}assert(!/NaN|Infinity/.test(gcode(j)));}}
});
test('frame size and hardware collisions fail rather than drilling into glass',()=>{
 assert.throws(()=>cabinetParts({...defaults,doorStyle:'glass',glassFrame:150}),/opening/);assert.throws(()=>cabinetParts({...defaults,doorStyle:'glass',handlePosition:'auto_middle',handleEdge:100}),/Glass/);assert.throws(()=>cabinetParts({...defaults,hinge:'blum_71b3750',plate:3}),/compatible/);
});
