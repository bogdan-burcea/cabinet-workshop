import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {initializeProject,serializeProject,deserializeProject,projectLayout} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
import {stockDefaults} from '../src/workbench/production.js';
import {costRows} from '../src/workbench/costs.js';
test('glass frame costs count two panes, sixteen dowels, four hinges and two handles',()=>{
 const cabinet={...cabinetDefaults(),doorStyle:'glass'},s=initializeProject({cabinet,globals:globalsFrom(cabinet),machine:{...machineDefaults},stock:{...stockDefaults}}),layout=projectLayout(s),costs=costRows(s.cabinets,layout.parts,layout);
 assert.equal(layout.parts.filter(p=>p.glassFramePart).length,8);
 assert.equal(costs.rows.find(r=>r.label.startsWith('Frame dowel')).quantity,16);
 assert.equal(costs.rows.find(r=>r.label.endsWith(' · hinge')).quantity,4);
 assert.equal(costs.rows.find(r=>/pull ·|Knob/.test(r.label)).quantity,2);
 const restored=deserializeProject(serializeProject(s));assert.deepEqual(projectLayout(restored).parts,layout.parts);
});
test('legacy two-face project settings migrate to the STEP face-up workflow',()=>{
 const cabinet=cabinetDefaults(),s=initializeProject({cabinet,globals:globalsFrom(cabinet),machine:{...machineDefaults,singleSide:false},stock:{...stockDefaults}});
 assert.equal(s.machine.singleSide,true);assert(projectLayout(s).parts.every(p=>p.singleSide));
});
test('a pull with holes on two frame members still counts as one handle per door',()=>{
 const cabinet={...cabinetDefaults(),width:446,doorStyle:'glass',handle:'horizontal'},s=initializeProject({cabinet,globals:globalsFrom(cabinet),machine:{...machineDefaults},stock:{...stockDefaults}}),layout=projectLayout(s);
 assert.equal(layout.parts.filter(p=>p.flatOperations.some(o=>o.label==='Handle through hole')).length,4);
 assert.equal(costRows(s.cabinets,layout.parts,layout).rows.find(r=>r.label.includes('pull ·')).quantity,2);
});
test('the public workflow exposes four tabs and no toolpath generator or program download',()=>{
 const html=readFileSync(new URL('../public/cabinet.html',import.meta.url),'utf8'),app=readFileSync(new URL('../src/workbench/app.js',import.meta.url),'utf8');
 assert.equal((html.match(/role="tab"/g)||[]).length,4);assert(!html.includes('aria-label="Toolpaths"'));
 for(const text of ['function generate(','function camView(','function downloadPack(','Generate nested toolpaths','Download this .nc file','toolListText('])assert(!app.includes(text),text);
 assert(app.includes('Download this sheet · STEP'));assert(app.includes('Nested sheets · STEP pack'));
});
