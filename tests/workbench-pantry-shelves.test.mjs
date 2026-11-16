import test from 'node:test';
import assert from 'node:assert/strict';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {cabinetParts} from '../src/workbench/cabinet.js';
import {pantryPlan,pantryShelfGap,pantryDrawerTop} from '../src/workbench/pantry.js';
import {initializeProject,serializeProject,deserializeProject,projectParts,projectLayout} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineSettings} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
import {sheetStepRows} from '../src/workbench/sheet-step.js';
import {correctionActions} from '../src/workbench/error-actions.js';
import {costRows} from '../src/workbench/costs.js';
const config=()=>enableInstallation(cabinetDefaults('Pantry'),undefined,{fresh:true});
const shelves=parts=>parts.filter(p=>/^Shelf /.test(p.row[0]));
test('optional pantry shelves preserve legacy and disabled parts, drawer geometry and non-Pantry shelves',()=>{
 const legacy=config();delete legacy.pantryShelfSet;delete legacy.pantryShelfCount;
 assert.deepEqual(cabinetParts(legacy),cabinetParts(config()));
 const c={...config(),pantryShelfSet:true};const parts=cabinetParts(c),base=cabinetParts(config());
 assert.equal(shelves(parts).length,2);
 for(const p of base.filter(p=>/^Drawer |^Door/.test(p.row[0]))){const {code,...before}=p,{code:nextCode,...after}=parts.find(a=>a.row[0]===p.row[0]);assert.deepEqual(after,before);}
 const highestTray=Math.max(...pantryPlan(c).boxes.map(b=>b.sideZ+b.height));
 for(const p of shelves(parts))assert(p.row[3]>highestTray+20);
 assert.equal(shelves(cabinetParts({...c,pantryShelfSet:false})).length,0);
 assert.equal(shelves(cabinetParts({...enableInstallation(cabinetDefaults('Tall'),undefined,{fresh:true}),pantryShelfSet:true})).length,4);
});
test('upper shelves use real stock, remain above wooden or metal trays and constrain the complete pin banks',()=>{
 for(const drawerSystem of ['tandem','tandembox_m'])for(const shelfThickness of [12,24]){
 const c={...config(),pantryShelfSet:true,drawerSystem,shelfThickness,...(drawerSystem==='tandembox_m'?{drawerStock:16,drawerBottom:16}:{})};
 const parts=cabinetParts(c);assert(shelves(parts).every(p=>p.thickness===shelfThickness));
 // Flat side operations also carry every bank into the manufacturing path.
 const flatPins=parts.filter(p=>/^(Left|Right) side$/.test(p.row[0])).flatMap(p=>p.flatOperations).filter(o=>/^Shelf .* support$/.test(o.label));
 assert.equal(flatPins.length,40);
 }
 assert.throws(()=>cabinetParts({...config(),pantryShelfSet:true,pantryShelfCount:8,pantryDrawerZone:1950}),/Pantry shel/);
 assert.throws(()=>cabinetParts({...config(),pantryShelfSet:true,pantryShelfCount:2,pantryDrawerZone:1920}),/shelf.*crosses/);
 assert.equal(shelves(cabinetParts({...config(),pantryShelfSet:true,pantryDrawerZone:1920,pins:false})).length,2);
 for(const count of [0,9,1.5,NaN])assert.throws(()=>cabinetParts({...config(),pantryShelfSet:true,pantryShelfCount:count}),/1–8 pantry shelves/);
 assert.throws(()=>cabinetParts({...config(),pantryShelfSet:'yes'}),/pantry shelf set/);
});
test('upper shelf parts survive project roundtrip and enter nesting, costing and sheet STEP rows',()=>{
 const c={...config(),pantryShelfSet:true};const state=initializeProject({cabinet:c,globals:globalsFrom(c),independentCabinets:true,machine:machineSettings({}),stock:{...stockDefaults,width:2440,height:1220,rotate:true}});
 const restored=deserializeProject(serializeProject(state));assert.equal(restored.cabinet.pantryShelfSet,true);assert.equal(restored.cabinet.pantryShelfCount,2);assert.deepEqual(projectParts(restored),projectParts(state));
 const layout=projectLayout(state);assert.equal(layout.unplaced.length,0);
 assert.equal(layout.sheets.flatMap(sheet=>sheetStepRows(sheet)).filter(r=>/Shelf /.test(r.row[0])).length,2);
 const withShelves=costRows(state.cabinets,projectParts(state),layout);
 assert(withShelves.rows.some(r=>r.category==='Material'));
});

test('Pantry shelf fit diagnostics lead to upper shelves and drawer zone settings',()=>{const actions=correctionActions(new Error('Pantry shelves do not fit above the drawers.'),{style:'Pantry'});assert.deepEqual(actions.slice(0,2).map(a=>a.id),['cabinet-pantryShelfCount','cabinet-pantryDrawerZone']);});

test('explicit drawer-to-shelf clearance controls the first shelf and keeps upper openings equal for both systems',()=>{
 for(const drawerSystem of ['tandem','tandembox_m'])for(const pantryShelfCount of [1,2,3]){
 const c={...config(),pantryShelfSet:true,pantryShelfCount,pantryShelfGap:150,drawerSystem,...(drawerSystem==='tandembox_m'?{drawerStock:16,drawerBottom:16}:{})};
 const rows=shelves(cabinetParts(c)).map(p=>p.row);
 assert.equal(rows[0][3]-pantryDrawerTop(c),150);
 const openings=rows.map((r,i)=>i+1<rows.length?rows[i+1][3]-r[3]-r[6]:c.height-c.thickness-r[3]-r[6]);
 for(const gap of openings)assert(Math.abs(gap-openings[0])<1e-8);
 const s=initializeProject({cabinet:c,globals:globalsFrom(c),independentCabinets:true,machine:machineSettings({}),stock:stockDefaults});
 assert.equal(deserializeProject(serializeProject(s)).cabinet.pantryShelfGap,150);
 }
 const c={...config(),pantryShelfSet:true};
 assert.equal(shelves(cabinetParts(c))[0].row[3]-pantryDrawerTop(c),pantryShelfGap(c));
 for(const pantryShelfGap of [-1,0,NaN,Infinity,100001])assert.throws(()=>cabinetParts({...c,pantryShelfGap}),/shelf clearance/);
 assert.throws(()=>cabinetParts({...c,pantryShelfGap:1800}),/shelves do not fit/);
 assert.throws(()=>cabinetParts({...c,pantryShelfGap:20}),/shelf pin bank crosses/);
 assert.equal(shelves(cabinetParts({...c,pantryShelfGap:20,pins:false}))[0].row[3]-pantryDrawerTop(c),20);
});
