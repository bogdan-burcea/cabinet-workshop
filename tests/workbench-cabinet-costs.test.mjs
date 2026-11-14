import test from 'node:test';
import assert from 'node:assert/strict';
import {cabinetCosts,costRows,emptyCosts} from '../src/workbench/costs.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {initializeProject,addCabinet,projectLayout,syncProject} from '../src/workbench/project.js';
import {detachProjectDefaults,streamlineDrawers} from '../src/workbench/drawer-setup.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
function fixture(){const cabinet=enableInstallation(cabinetDefaults(),undefined,{fresh:true});const s=detachProjectDefaults(initializeProject({cabinet,globals:globalsFrom(cabinet),machine:{...machineDefaults},stock:{...stockDefaults},costs:emptyCosts()}));addCabinet(s);s.cabinet.width=450;s.cabinet=streamlineDrawers({...s.cabinet,frontMode:'drawers',drawerCount:2}).cabinet;syncProject(s);return s;}
for(const basis of ['sheet','area'])test('cabinet '+basis+' costs reconcile to each project line and retain exact hardware quantities',()=>{
 const s=fixture(),layout=projectLayout(s);s.costs.basis=basis;for(const r of costRows(s.cabinets,layout.parts,layout,s.costs).rows)s.costs.prices[r.key]=r.category==='Material'?123.47:7.13;s.costs.extras=[{name:'Delivery',quantity:1,price:42.33}];
 const result=cabinetCosts(s.cabinets,layout.parts,layout,s.costs),project=costRows(s.cabinets,layout.parts,layout,s.costs);
 assert.equal(Math.round((result.cabinets.reduce((n,r)=>n+r.total,0)+42.33)*100),Math.round(project.total*100));
 for(const row of project.rows)assert.equal(result.cabinets.reduce((n,c)=>n+Math.round((c.rows.find(r=>r.key===row.key)?.total||0)*100),0),Math.round(row.total*100));
 assert.equal(result.cabinets[0].rows.some(r=>r.label.includes('runner pair')),false);assert.equal(result.cabinets[1].rows.find(r=>r.label.includes('runner pair')).quantity,2);
 for(const c of result.cabinets)assert.equal(c.missing,0);
 const material=project.rows.find(r=>r.category==='Material'&&JSON.parse(r.key)[1][1]===18),shares=result.cabinets.map(c=>c.rows.find(r=>r.key===material.key));assert(shares.every(Boolean));assert.notEqual(shares[0].quantity,shares[1].quantity);
});
test('partial cabinet costs distinguish unpriced hardware, explicit zero and unplaced parts',()=>{
 const s=fixture();addCabinet(s,{style:'Tall'});const layout=projectLayout(s),result=cabinetCosts(s.cabinets,layout.parts,layout,s.costs);assert(result.cabinets[2].unplaced>0);assert.equal(result.cabinets[0].unplaced,0);assert(result.cabinets.every(c=>c.missing>0));const row=result.cabinets[0].rows[0];s.costs.prices[row.key]=0;const priced=cabinetCosts(s.cabinets,layout.parts,layout,s.costs);assert.equal(priced.cabinets[0].missing,result.cabinets[0].missing-1);assert.equal(priced.cabinets[0].total,0);
});
