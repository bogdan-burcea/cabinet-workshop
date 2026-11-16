import test from 'node:test';
import assert from 'node:assert/strict';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {cabinetParts,saveProject,loadProject} from '../src/workbench/cabinet.js';
import {manufacturingParts} from '../src/workbench/single-side.js';
import {editFeatures} from '../src/workbench/feature-editing.js';
import {checkedFeatureEdits} from '../src/workbench/feature-model.js';

test('20 mm wood lipping deducts cores while retaining finished sizes, grooves and fixing references',()=>{
 const c={...cabinetDefaults(),edgeBand:20,bandDoors:false,feet:'rectangle',assembly:true};
 const raw=cabinetParts({...c,edgeBand:0}),parts=cabinetParts(c);
 for(const p of parts.filter(p=>p.edgeBand)){
  const old=raw.find(a=>a.key===p.key),b=p.edgeBand;
  assert.equal(p.width+b.xMin+b.xMax,old.width);
  assert.equal(p.height+b.yMin+b.yMax,old.height);
  for(const [i,o]of p.flatOperations.entries())if(o.type==='bore'){
   assert.equal(o.point[0]+b.xMin,old.flatOperations[i].point[0]);
   assert.equal(o.point[1]+b.yMin,old.flatOperations[i].point[1]);
  }
 }
 assert.deepEqual(cabinetParts(loadProject(saveProject(c,{})).cabinet),parts);
 assert.throws(()=>cabinetParts({...c,edgeBand:20.1}),/0–20/);
});
test('individual wood strips accept 20 mm through mirrored machining faces and survive project reload',()=>{
 const c={...cabinetDefaults(),edgeBand:1},parts=manufacturingParts(cabinetParts(c)),side=parts.find(p=>p.row[0]==='Left side');
 const changed=editFeatures(c,parts,side,{kind:'band',edge:side.frontEdge},{thickness:20}),next=manufacturingParts(cabinetParts(changed)).find(p=>p.key===side.key);
 assert.equal(next.edgeBand[next.frontEdge],20);assert.equal(next.width,side.finishedWidth-20);
 assert.deepEqual(loadProject(saveProject(changed,{})).cabinet.featureEdits,changed.featureEdits);
 assert.throws(()=>checkedFeatureEdits({bands:{p:{xMin:20.01}}}),/Invalid feature/);
});
test('wide lipping cannot silently remove hinge machining from the CNC core',()=>{
 assert.throws(()=>cabinetParts({...cabinetDefaults(),edgeBand:20}),/wood strip reaches a hardware hole.*Parts → operations table/);
});
