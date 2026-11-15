import test from 'node:test';
import assert from 'node:assert/strict';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {cabinetParts} from '../src/workbench/cabinet.js';
import {hingeShelfWarnings} from '../src/workbench/hinge-clearance.js';
import {drawingNumber,edgePilotPlan} from '../src/workbench/edge-pilots.js';
test('plate clearance warns on a middle hinge at a current shelf, and ignores clear/open cabinets',()=>{
 const c={...cabinetDefaults(),handle:'none',hingeCount:3};
 const warnings=hingeShelfWarnings(cabinetParts(c));assert.equal(warnings.length,2);assert(warnings.every(w=>w.shelf==='Shelf 1'&&w.hinge===2));
 assert.equal(hingeShelfWarnings(cabinetParts({...c,hingeCount:2})).length,0);
 assert.equal(hingeShelfWarnings(cabinetParts({...c,shelves:0})).length,0);
 assert.equal(hingeShelfWarnings(cabinetParts({...c,frontMode:'open'})).length,0);
 for(const hinge of ['blum_71b3550','blum_71b3750','hafele_31104003'])for(const doorStyle of ['slab','glass'])assert(hingeShelfWarnings(cabinetParts({...c,hinge,doorStyle})).length>0);
});
test('plate clearance respects actual plate drilling and shelf front setback',()=>{
 const parts=cabinetParts({...cabinetDefaults(),handle:'none',hingeCount:3}),before=structuredClone(parts);
 for(const p of parts)if(p.row[0].startsWith('Shelf '))p.row[5]-=100;
 assert.equal(hingeShelfWarnings(parts).length,0);assert.equal(hingeShelfWarnings(before).length,2);
 const shifted=structuredClone(before);for(const p of shifted)for(const o of p.flatOperations)if(o.label==='Hinge plate')o.point[1]+=1000;
 assert.equal(hingeShelfWarnings(shifted).length,0);
});
test('edge labels round for display only and hole numbering follows the datum',()=>{
 const p={width:100,height:100,thickness:18,flatOperations:[66.666666,33.333333].map(y=>({type:'bore',axis:0,sign:1,point:[0,y,9],diameter:2.5,depth:20}))};
 const a=edgePilotPlan(p)[0];assert.deepEqual(a.holes.map(h=>[h.number,drawingNumber(h.along)]),[[1,'33.3'],[2,'66.7']]);assert.equal(a.holes[0].along,33.333333);assert.equal(p.flatOperations[0].point[1],66.666666);assert.equal(drawingNumber(18), '18');assert.equal(drawingNumber(2.5),'2.5');
});
