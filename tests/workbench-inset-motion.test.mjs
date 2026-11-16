import test from 'node:test';import assert from 'node:assert/strict';import init from 'replicad-opencascadejs';import{setOC,measureVolume}from'replicad';
import{cabinetDefaults}from'../src/workbench/styles.js';import{enableInstallation}from'../src/workbench/installation.js';import{assemblyRows,assemblyPoint}from'../src/workbench/assembly-model.js';import{doorOpeningPose,openDoorPoint}from'../src/workbench/door-motion.js';import{buildPart}from'../src/cad-core.js';
const ready=init({print:()=>{}}).then(setOC),config=extra=>enableInstallation({...cabinetDefaults(),hinge:'blum_71b3750',...extra},undefined,{fresh:true});
test('inset opening pivots on the front face with matching transforms for solids, edges and glass frames',()=>{
 for(const doorStyle of ['slab','glass'])for(const doors of [1,2])for(const hand of ['Left','Right']){
 const c=config({doorStyle,doors,hand,doorThickness:22}),parts=assemblyRows(c).filter(p=>p.row[0].startsWith('Door'));
 for(const p of parts){const b=p.glassDoor?.bounds||p.row.slice(1),pose=doorOpeningPose(p,c);assert.equal(pose.y,b[1]+b[4]);for(const point of [p.row.slice(1,4),p.row.slice(1,4).map((v,i)=>v+p.row[i+4])]){const open=openDoorPoint(point,p,c);assert.deepEqual(assemblyPoint(point,p,c,{open:true}),[open[0],open[2],open[1]]);assert.deepEqual(assemblyPoint(point,p,c,{open:false}),[point[0],point[2],point[1]]);}}
 }
});
test('overlay door opening retains its existing pivot and pose',()=>{const c={...config(),hinge:'blum_71b3550'},p=assemblyRows(c).find(p=>p.row[0]==='Door left'),b=p.row.slice(1),point=[b[0]+30,b[1]+10,b[2]+20],a=Math.PI*.42;assert.deepEqual(openDoorPoint(point,p,c),[b[0]+30*Math.cos(a)-10*Math.sin(a),b[1]+30*Math.sin(a)+10*Math.cos(a),point[2]]);});
test('the reported inset/carcass collision is reproduced by the old pivot and removed by the corrected pose',async()=>{
 await ready;for(const hand of ['Left','Right'])for(const doorThickness of [16,18,24]){
 const c=config({doors:1,hand,doorThickness}),rows=assemblyRows(c),door=rows.find(p=>p.row[0]==='Door'),sideRow=rows.find(p=>p.row[0]===(hand==='Left'?'Left side':'Right side')),pose=doorOpeningPose(door,c);
 for(const old of [true,false]){const opened=buildPart(door).rotate(pose.angle*180/Math.PI,[pose.x,old?door.row[2]:pose.y,0],[0,0,1]),side=buildPart(sideRow),cut=opened.intersect(side);try{const overlap=measureVolume(cut);if(old)assert(overlap>1000);else assert(Math.abs(overlap)<.001);}finally{cut.delete();opened.delete();side.delete();}}
 }
});
