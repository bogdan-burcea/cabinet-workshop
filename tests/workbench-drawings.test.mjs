import test from 'node:test';
import assert from 'node:assert/strict';
import {cabinetDefaults} from '../src/workbench/styles.js';
import {frontGeometry,frontLayout} from '../src/workbench/front-plan.js';
import {enableInstallation,installationHeightEffect} from '../src/workbench/installation.js';
import {edgePilotPlan} from '../src/workbench/edge-pilots.js';
import {oneSidePart} from '../src/workbench/single-side.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('elevation glass openings follow frame width and the actual inset/overlay door boundaries',()=>{
 for(const style of ['Base','Wall','Tall'])for(const hinge of ['blum_71b3550','blum_71b3750'])for(const frame of [50,70,100]){
  const c={...cabinetDefaults(style),doorStyle:'glass',hinge,glassFrame:frame,handle:'none'},g=frontGeometry(c),item=frontLayout([{id:'c',config:c}]).items[0];assert.equal(g.glassOpenings.length,c.doors);assert.deepEqual(item.glassOpenings,g.glassOpenings);
  for(const opening of g.glassOpenings){assert.equal(opening.frameWidth,frame);assert(opening.width>0&&opening.height>0);near(opening.z,hinge==='blum_71b3750'?(c.bottomDado?c.bottomLift:0)+c.thickness+2+frame:2+frame);}
 }
 const c={...cabinetDefaults(),doorStyle:'glass',handle:'none'},a=frontGeometry({...c,glassFrame:60}).glassOpenings[0],b=frontGeometry({...c,glassFrame:90}).glassOpenings[0];near(b.x-a.x,30);near(b.z-a.z,30);near(a.width-b.width,60);near(a.height-b.height,60);assert.equal(frontGeometry({...c,doorStyle:'slab'}).glassOpenings.length,0);
});
test('bottom lift explains the physical foot reference while preserving the counter target',()=>{
 const c=enableInstallation(cabinetDefaults(),undefined,{fresh:true}),before=structuredClone(c),a=installationHeightEffect(c),b=installationHeightEffect({...c,bottomLift:40});assert.deepEqual(c,before);assert.equal(a.footLength,150);assert.equal(a.lift,30);assert.equal(a.floorClearance,120);assert.equal(a.bodyHeight,742);assert.equal(b.floorClearance,110);assert.equal(b.bodyHeight,752);assert.equal(a.counterHeight,900);assert.equal(b.counterHeight,900);near(a.topHeight+c.installation.worktopThickness,900);near(b.topHeight+c.installation.worktopThickness,900);
 const w=enableInstallation(cabinetDefaults('Wall'),undefined,{fresh:true}),wa=installationHeightEffect(w),wb=installationHeightEffect({...w,bottomLift:20});assert.equal(wa.bodyHeight,wb.bodyHeight);assert.equal(wa.floorClearance,wb.floorClearance);assert.equal(wa.footLength,null);
});
test('edge pilot plans name the datum and measure thickness offsets from the machining face',()=>{
 const part={width:500,height:700,thickness:18,flatOperations:[
  {type:'bore',axis:0,sign:1,point:[0,50,6],diameter:3,depth:20,label:'Assembly pilot'},
  {type:'bore',axis:0,sign:-1,point:[500,650,12],diameter:3,depth:20,label:'Assembly pilot'},
  {type:'bore',axis:1,sign:1,point:[80,0,9],diameter:6,depth:15,label:'Frame dowel'},
  {type:'bore',axis:1,sign:-1,point:[420,700,4],diameter:6,depth:15,label:'Frame dowel'}]};
 const plans=edgePilotPlan(part);assert.deepEqual(plans.map(p=>[p.name,p.datum,p.length,p.holes[0].along,p.holes[0].fromMachiningFace]),[['Left edge','bottom end',700,50,12],['Right edge','bottom end',700,650,6],['Bottom edge','left end',500,80,9],['Top edge','left end',500,420,14]]);
});
test('edge pilot labels follow a mirrored machining-face reorientation',()=>{
 const p={row:['Test'],width:500,height:700,thickness:18,flatHoles:[],flatOperations:[{type:'bore',axis:2,sign:1,point:[100,100,0],diameter:35,depth:13,label:'Hinge cup'},{type:'bore',axis:0,sign:1,point:[0,50,6],diameter:3,depth:20,label:'Assembly pilot'}]},plan=edgePilotPlan(oneSidePart(p))[0];assert.equal(plan.name,'Right edge');assert.equal(plan.holes[0].along,50);assert.equal(plan.holes[0].fromMachiningFace,6);
});
