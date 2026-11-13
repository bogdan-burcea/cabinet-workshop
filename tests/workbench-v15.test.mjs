import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,cabinetParts,saveProject,loadProject} from '../src/workbench/cabinet.js';
import {globalsFrom,applyGlobals} from '../src/workbench/globals.js';
import {withHingePreset} from '../src/workbench/hinge-settings.js';
import {previewFaces,previewCamera,previewProject} from '../src/workbench/view.js';
import {visibleEdges} from '../src/workbench/preview-edges.js';
import {manufacturingParts} from '../src/workbench/single-side.js';
import {editFeatures,displayedPoint} from '../src/workbench/feature-editing.js';
const parts=c=>manufacturingParts(cabinetParts(c)),eps=(a,b)=>Math.abs(a-b)<1e-5;
test('captured back and bottom show visible junction seams where buried perimeters cannot outline them',()=>{
 for(const width of [400,600,900]){
 const c={...defaults,width},faces=previewFaces(c),edges=visibleEdges(faces,previewCamera,previewProject),junctions=edges.filter(e=>e.seam),names=e=>[e.name,faces.find(f=>f.code===e.otherCode)?.name];
 assert(junctions.some(e=>names(e).includes('Back')&&names(e).includes('Left side')&&eps(e.a[0],18)&&eps(e.a[1],16)&&Math.abs(e.b[2]-e.a[2])>20));
 assert(junctions.some(e=>names(e).includes('Bottom')&&names(e).includes('Left side')&&eps(e.a[0],18)&&eps(e.a[2],48)&&Math.abs(e.b[1]-e.a[1])>20));
 assert(edges.every(e=>[...e.a,...e.b].every(Number.isFinite)));
 const exploded=visibleEdges(previewFaces(c,{exploded:true}),previewCamera,previewProject);assert(!exploded.some(e=>e.seam));
 }
});
test('nearer closed doors hide back/bottom junctions instead of showing x-ray seams',()=>{
 const faces=previewFaces(defaults,{open:false}),edges=visibleEdges(faces,previewCamera,previewProject);
 assert(!edges.some(e=>e.seam&&(e.name==='Bottom'||faces.find(f=>f.code===e.otherCode)?.name==='Bottom')));
 for(const e of edges.filter(e=>e.seam&&(e.name==='Back'||faces.find(f=>f.code===e.otherCode)?.name==='Back')))assert(Math.min(e.a[2],e.b[2])>=384-1e-4);
});
test('popup hinge selection regenerates complete matched drilling and inherited defaults',()=>{
 const c={...defaults},p=parts(c),door=p.find(a=>a.row[0]==='Door left'),hole=door.flatOperations.find(o=>o.label==='Hinge cup'),[x,y]=displayedPoint(hole,door),edited=editFeatures(c,p,door,{kind:'operation',operation:hole},{diameter:36,depth:13,through:false,x,y}),g=globalsFrom(c),next=withHingePreset(edited,g,'hafele_31104003',0);
 assert.equal(Object.keys(next.cabinet.featureEdits.operations).length,0);assert.equal(g.hinge,c.hinge);assert.equal(next.globals.hinge,'hafele_31104003');applyGlobals(next.cabinet,next.globals);
 const cups=parts(next.cabinet).flatMap(p=>p.flatOperations).filter(o=>o.label==='Hinge cup');assert.equal(cups.length,4);assert(cups.every(o=>o.depth===12&&o.diameter===35));
 const loaded=loadProject(saveProject(next.cabinet,{}, {},next.globals));assert.equal(loaded.cabinet.hinge,'hafele_31104003');assert.equal(loaded.globals.hinge,'hafele_31104003');
});
test('independent hinge settings keep shared defaults and unrelated feature edits',()=>{
 const c={...defaults,inheritGlobals:false},ps=parts(c),p=ps[0],o=p.flatOperations.find(o=>/^Shelf/.test(o.label)),[x,y]=displayedPoint(o,p),edited=editFeatures(c,ps,p,{kind:'operation',operation:o},{diameter:6,depth:10,through:false,x,y}),g=globalsFrom(c),next=withHingePreset(edited,g,'hafele_31104003',2);
 assert.deepEqual(next.globals,g);assert.equal(next.cabinet.featureEdits.operations[o.featureId].diameter,6);assert.equal(next.cabinet.plate,2);assert.throws(()=>withHingePreset(c,g,'blum_71b3550',2),/compatible/);
});
