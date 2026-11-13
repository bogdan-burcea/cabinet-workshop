import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,cabinetProject,cabinetParts,cabinetRows,saveProject,loadProject} from '../src/workbench/cabinet.js';
import {cabinetDefaults,switchCabinetStyle} from '../src/workbench/styles.js';
import {applyGlobals,globalsFrom} from '../src/workbench/globals.js';
import {manufacturingParts} from '../src/workbench/single-side.js';
import {layoutFor,sheetJobs} from '../src/workbench/production.js';
import {machineDefaults,gcode} from '../src/workbench/cam.js';
import {nestingDxf,machiningCsv} from '../src/nesting.js';
import {nestingPdf} from '../src/nesting-pdf.js';
import {edgeFamily,matchingFeatures,editFeatures} from '../src/workbench/feature-editing.js';
const parts=c=>manufacturingParts(cabinetParts(c)),near=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
test('wall style produces a full top, captured back, two shelf banks and lower door handles',()=>{
 const c=cabinetDefaults('Wall'),p=cabinetProject(c),ps=parts(c),rows=cabinetRows(c).map(p=>p.row);
 assert.equal(p.cabinets[0].kind,'Wall');assert.equal(ps.length,9);assert(rows.some(r=>r[0]==='Top'));assert(!rows.some(r=>/rail/.test(r[0])));
 const top=ps.find(p=>p.row[0]==='Top');near(top.width,564);near(top.height,320);assert.equal(top.originalFace,'B');assert(top.flatOperations.some(o=>o.label==='Captured back groove'));
 assert.equal(ps.flatMap(p=>p.flatOperations).filter(o=>/support$/.test(o.label)).length,40);
 const door=rows.find(r=>r[0]==='Door left'),handles=ps.filter(p=>/^Door/.test(p.row[0])).flatMap(p=>p.flatOperations).filter(o=>o.label==='Handle through hole');assert.equal(handles.length,4);handles.forEach(o=>near(o.point[1],c.handleEdge));
 assert.equal(door[6],716);assert(ps.every(p=>!p.secondaryOperations.length));
});
test('wall ignores shared feet but inherits hardware; wall handle placement leaves saved base placement intact',()=>{
 const base={...defaults,feet:'rectangle',handlePosition:'top_center',handleAlignment:'floor',handleHeight:800},g=globalsFrom(base),c=switchCabinetStyle(base,'Wall');applyGlobals(c,g);assert.equal(c.feet,'none');assert.equal(g.feet,'rectangle');assert.equal(c.handlePosition,'auto_bottom');assert.equal(c.handleAlignment,'top');assert(!parts(c).flatMap(p=>p.flatOperations).some(o=>/Foot/.test(o.label)));
 // Even direct input cannot generate a foot pattern for a wall cabinet.
 assert.equal(cabinetProject({...c,feet:'rectangle'}).cabinets[0].machining.feet,'none');
 const back=switchCabinetStyle(c,'Base');applyGlobals(back,g);assert.equal(back.feet,'rectangle');assert.equal(back.handlePosition,'top_center');assert.equal(back.depth,560);assert.equal(back.bottomLift,30);assert.equal(g.handleHeight,800);
});
test('switching construction preserves dimensions/material-independent hardware and removes stale individual edits',()=>{
 const base={...defaults,width:800,height:900,name:'Custom cabinet',hinge:'hafele_31104003',plate:0,featureEdits:{operations:{obsolete:{depth:8}},bands:{obsolete:{xMax:1}}}},wall=switchCabinetStyle(base,'Wall');assert.equal(wall.width,800);assert.equal(wall.height,900);assert.equal(wall.name,'Custom cabinet');assert.equal(wall.hinge,'hafele_31104003');assert.equal(wall.depth,320);assert.equal(wall.bottomLift,6);assert.deepEqual(wall.featureEdits,{operations:{},bands:{}});assert.equal(base.featureEdits.operations.obsolete.depth,8);assert(parts(wall).length);assert.deepEqual(switchCabinetStyle(wall,'Wall'),wall);assert.throws(()=>switchCabinetStyle(base,'Tall'),/Base or Wall/);
});
test('wall top banding deducts its front edge and follows matching carcass-front edits through mirroring',()=>{
 const c={...cabinetDefaults('Wall'),edgeBand:1},ps=parts(c),top=ps.find(p=>p.row[0]==='Top'),r={kind:'band',edge:top.frontEdge};near(top.height,319);assert.equal(top.edgeBand[top.frontEdge],1);assert.equal(edgeFamily(top,top.frontEdge),'Carcass front edges');assert.equal(matchingFeatures(ps,top,r).length,6);
 const changed=parts(editFeatures(c,ps,top,r,{thickness:2},{all:true}));for(const p of changed.filter(p=>/side$/.test(p.row[0])||['Bottom','Top'].includes(p.row[0])||/^Shelf/.test(p.row[0])))assert.equal(p.edgeBand[p.frontEdge],2);near(changed.find(p=>p.row[0]==='Top').height,318);
});
test('wall handles remain bottom-referenced even in older floor-alignment projects',()=>{
 const c={...cabinetDefaults('Wall'),handleAlignment:'floor',mountingHeight:1500,handleHeight:1550},a=parts(c),b=parts({...c,mountingHeight:1700,handleHeight:1750});assert.deepEqual(a,b);for(const o of a.flatMap(p=>p.flatOperations).filter(o=>o.label==='Handle through hole'))near(o.point[1],50);assert.deepEqual(parts({...c,handleHeight:800}),a);
});
test('legacy base projects keep geometry and wall style roundtrips through project files',()=>{
 const legacy={...defaults};delete legacy.style;delete legacy.mountingHeight;const loaded=loadProject(saveProject(legacy,machineDefaults));assert.equal(loaded.cabinet.style,'Base');assert.deepEqual(parts(loaded.cabinet),parts(defaults));
 const wall=cabinetDefaults('Wall'),g={...globalsFrom(defaults),feet:'single'},data=loadProject(saveProject(wall,machineDefaults,{},g));assert.equal(data.cabinet.style,'Wall');assert.equal(data.globals.feet,'single');assert.deepEqual(parts(data.cabinet),parts(wall));assert.throws(()=>cabinetProject({...wall,style:'Tall'}),/Base or Wall/);
});
test('wall nests and exports complete top/back/hardware geometry as one primary program per sheet',()=>{
 for(const doors of [1,2]){const c={...cabinetDefaults('Wall'),doors,edgeBand:1,assembly:true},layout=layoutFor(c,{width:1200,height:1200,rotate:true},{singleSide:true}),jobs=sheetJobs(layout,{});assert.equal(layout.unplaced.length,0);assert.equal(jobs.length,layout.sheets.length);const ops=jobs.flatMap(j=>j.operations),top=layout.parts.find(p=>p.row[0]==='Top');assert(top);assert(ops.some(o=>o.part==='Top'&&o.label==='Captured back groove'));assert.equal(ops.filter(o=>o.label==='Hinge cup').length,doors*2);assert(!ops.some(o=>/Foot/.test(o.label)));
 for(const j of jobs){const nc=gcode(j);assert.equal(nc.split('\n').filter(s=>s==='M2').length,1);assert(!/NaN|Infinity/.test(nc));}assert(nestingDxf(layout).includes('EOF'));assert(machiningCsv(layout).includes('Captured back groove'));assert(nestingPdf(layout).startsWith('%PDF'));}
});
