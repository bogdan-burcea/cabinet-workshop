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
test('glass doors make four frame parts with a single glass pane and preserved hardware',()=>{
 for(const style of ['Base','Wall','Tall'])for(const hinge of ['blum_71b3550','blum_71b3750'])for(const doors of [1,2]){
 const c={...cabinetDefaults(style),hinge,doorStyle:'glass',doors},raw=cabinetParts(c),ps=manufacturingParts(raw),gs=glassSchedule(ps,c),frames=ps.filter(p=>p.glassFramePart);
 assert.equal(gs.length,doors);assert.equal(frames.length,4*doors);
 assert.equal(frames.flatMap(p=>p.flatOperations).filter(o=>o.label==='Hinge cup').length,doors*c.hingeCount);
 assert.equal(frames.flatMap(p=>p.flatOperations).filter(o=>o.label==='Handle through hole').length,doors*(c.handle==='knob'?1:c.handle==='none'?0:2));
 for(const p of frames){assert.equal(p.flatOperations.filter(o=>o.innerProfile).length,0);assert.equal(p.flatOperations.filter(o=>o.label==='Glass rebate').length,1);assert.equal(p.flatOperations.filter(o=>o.label==='Frame dowel').length,4);assert(p.flatOperations.every(o=>o.axis!==2||o.sign===-1));}
 for(const g of gs){const p=frames.find(p=>p.glassDoor.name===g.name);close(g.width,p.glassDoor.width-2*c.glassFrame+14);close(g.height,p.glassDoor.height-2*c.glassFrame+14);}
 const loaded=loadProject(saveProject(c,machineDefaults));assert.deepEqual(cabinetParts(loaded.cabinet),raw);const faces=previewFaces(c);assert(faces.some(f=>f.glass));assert.equal(new Set(faces.filter(f=>f.name.startsWith('Door')).map(f=>f.code)).size,4*doors);
 }
});
test('each frame dowel has exactly two aligned mating bores in the assembled model',()=>{
 const c={...defaults,doorStyle:'glass'},parts=cabinetRows(c).filter(p=>p.glassFramePart),groups=new Map();
 for(const p of parts)for(const o of p.operations.filter(o=>o.label==='Frame dowel')){const key=JSON.stringify(o.point);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
 assert.equal(groups.size,16);for(const pair of groups.values()){assert.equal(pair.length,2);assert.equal(pair[0].sign,-pair[1].sign);assert.equal(pair[0].diameter,6);assert.equal(pair[0].depth+pair[1].depth,30);}
});
test('band deductions affect external frame edges and leave butt joint edges unbanded',()=>{
 const c={...defaults,doorStyle:'glass',edgeBand:1},parts=cabinetParts(c).filter(p=>p.glassFramePart);
 for(const p of parts){const role=p.glassFramePart,b=p.edgeBand;assert(b);if(role==='left stile'){assert.equal(b.xMin,1);assert.equal(b.xMax,0);}if(role==='right stile'){assert.equal(b.xMin,0);assert.equal(b.xMax,1);}if(role.includes('rail')){assert.equal(b.xMin,0);assert.equal(b.xMax,0);close(p.width,p.finishedWidth);close(p.height,p.finishedHeight-1);}else close(p.height,p.finishedHeight-2);}
 assert.equal(glassSchedule(parts,c).length,2);
});
test('frame size and hardware collisions fail rather than drilling into glass',()=>{
 assert.throws(()=>cabinetParts({...defaults,doorStyle:'glass',glassFrame:150}),/opening/);assert.throws(()=>cabinetParts({...defaults,doorStyle:'glass',handle:'knob',handlePosition:'auto_middle',handleEdge:100}),/glass/);assert.throws(()=>cabinetParts({...defaults,hinge:'blum_71b3750',plate:3}),/compatible/);
});
