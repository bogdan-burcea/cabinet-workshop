import test from 'node:test';
import assert from 'node:assert/strict';
import {labelSlots,labelGrid,checkedLabelPaper,partLabelsPdf} from '../src/workbench/part-labels.js';
import {cabinetParts} from '../src/workbench/cabinet.js';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {enableInstallation} from '../src/workbench/installation.js';
import {initializeProject,serializeProject,deserializeProject} from '../src/workbench/project.js';
import {globalsFrom} from '../src/workbench/globals.js';
import {machineDefaults} from '../src/workbench/cam.js';
const part=cabinetParts(enableInstallation(cabinetDefaults(),undefined,{fresh:true}))[0];
test('custom label sizes drive A4 packing, skip slots and calibration dimensions',()=>{
 for(const [width,height,columns,rows]of [[64,34,3,8],[48,25,4,11],[90,50,2,5]]){
 const paper=checkedLabelPaper({width,height}),capacity=columns*rows;
 assert.deepEqual(labelGrid(paper),{columns,rows,capacity});
 const slots=labelSlots(capacity+1,{width,height});assert.equal(slots[capacity].page,1);
 assert.equal(labelSlots(2,{width,height,start:capacity-1})[1].page,1);
 for(const slot of slots){assert.equal(slot.width,width);assert.equal(slot.height,height);assert(slot.x+width<=210);assert(slot.y+height<=297);}
 const calibration=partLabelsPdf([],{width,height},undefined,true);
 assert(calibration.includes('Label '+capacity+' | '+width+' x '+height+' mm'));
 assert(!calibration.includes('Label '+(capacity+1)+' |'));
 const pdf=partLabelsPdf(Array.from({length:capacity+1},()=>part),paper);
 assert.match(pdf,/\/Count 2\b/);assert(!pdf.includes('NaN'));assert(!pdf.includes('Infinity'));
 }
});
test('label size validation rejects invalid dimensions, impossible A4 fits and invalid skipped cells',()=>{
 for(const settings of [{width:0},{height:24},{width:NaN},{height:Infinity},{width:'64'},{width:211},{height:298}])assert.throws(()=>checkedLabelPaper(settings),/Label (width|height)/);
 assert.throws(()=>checkedLabelPaper({width:210}),/fit A4/);
 assert.throws(()=>checkedLabelPaper({width:90,height:50,start:10}),/Skip used/);
 assert.deepEqual(labelSlots(1,{left:7}),[{page:0,x:7,y:12.5,width:64,height:34}]);
});
test('custom sizes persist through project save/open and old settings keep 64 by 34 mm defaults',()=>{
 const cabinet=enableInstallation(cabinetDefaults(),undefined,{fresh:true});const state=initializeProject({cabinet,globals:globalsFrom(cabinet),machine:machineDefaults});
 state.labelPaper=checkedLabelPaper({width:90,height:50,start:9});
 assert.deepEqual(deserializeProject(serializeProject(state)).labelPaper,state.labelPaper);
 assert.equal(checkedLabelPaper({left:6.5,top:12.5,gapX:2.5,gapY:0,start:0}).width,64);
 assert.equal(checkedLabelPaper({}).height,34);
});
