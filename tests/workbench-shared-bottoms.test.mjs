import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../src/workbench/cabinet.js';
import {streamlineDrawers,detachProjectDefaults} from '../src/workbench/drawer-setup.js';
import {stockDefaults,checkedStock,layoutFor,sheetPartJobs} from '../src/workbench/production.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {initializeProject,projectLayout,serializeProject,deserializeProject} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {costRows,emptyCosts} from '../src/workbench/costs.js';
const cabinet=()=>streamlineDrawers({...defaults,frontMode:'drawers',drawerCount:3,back:6,drawerBottom:6,handle:'none'}).cabinet;
const bottom=p=>/^Drawer \d+ bottom$/.test(p.row[0]);
const back=p=>p.row[0]==='Back';
const state=(stock={})=>{const c=cabinet();return detachProjectDefaults(initializeProject({cabinet:c,globals:globalsFrom(c),machine:{...machineDefaults},stock:checkedStock(stock),costs:emptyCosts()}));};
test('6 mm backs and drawer bottoms actually share a sheet in single-cabinet and project nesting',()=>{
 for(const layout of [layoutFor(cabinet()),projectLayout(state())]){
  assert.equal(layout.unplaced.length,0);
  const thin=layout.sheets.filter(s=>s.thickness===6);
  assert.equal(thin.length,1);
  assert.equal(thin[0].material,'Back board');
  assert(thin[0].parts.some(back));assert.equal(thin[0].parts.filter(bottom).length,3);
  assert(layout.parts.filter(p=>/Drawer \d+ (left side|right side|back|internal front)$/.test(p.row[0])).every(p=>p.material==='Carcass board'));
  const jobs=sheetPartJobs(layout,machineDefaults);assert(jobs.length>0);
 }
});
test('opt-out keeps the former material assignment and survives project save/load',()=>{
 const s=state({drawerBottomsMatchBack:false});
 const loaded=deserializeProject(serializeProject(s));
 assert.equal(loaded.stock.drawerBottomsMatchBack,false);
 const l=projectLayout(loaded);
 assert(l.parts.filter(bottom).every(p=>p.material==='Carcass board'));
 assert(l.parts.filter(back).every(p=>p.material==='Back board'));
 assert.equal(l.sheets.filter(s=>s.thickness===6).length,2);
});
test('shared stock follows back-material names, preserves thickness separation and estimate quantities',()=>{
 const s=state({backMaterial:'Birch plywood'});s.cabinet.drawerBottom=9;
 const l=projectLayout(s);
 assert(l.parts.filter(bottom).every(p=>p.material==='Birch plywood'&&p.thickness===9));
 assert(l.parts.filter(back).every(p=>p.material==='Birch plywood'&&p.thickness===6));
 assert(l.sheets.every(s=>s.parts.every(p=>p.thickness===s.thickness&&p.material===s.material)));
 const e=costRows(s.cabinets,l.parts,l,emptyCosts());
 for(const r of e.rows.filter(r=>r.category==='Material'))assert.equal(r.quantity,l.sheets.filter(s=>r.label.startsWith(s.material+' · '+s.thickness+' mm')).length);
 const saved=deserializeProject(serializeProject(s));assert.equal(saved.stock.drawerBottomsMatchBack,true);
 assert.equal(saved.stock.backMaterial,'Birch plywood');
});
test('legacy projects gain shared drawer-bottom stock and reject malformed settings',()=>{
 const s=state();delete s.stock.drawerBottomsMatchBack;
 const saved=serializeProject(s);delete saved.stock.drawerBottomsMatchBack;
 assert.equal(deserializeProject(saved).stock.drawerBottomsMatchBack,true);
 assert.equal(checkedStock({}).drawerBottomsMatchBack,true);
 assert.throws(()=>checkedStock({drawerBottomsMatchBack:'yes'}),/drawer bottoms/);
});
