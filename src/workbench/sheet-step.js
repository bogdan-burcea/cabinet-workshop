import {placedOperations,placedHoles} from '../nesting.js';
import {transformOperation} from '../machining.js';

export function sheetStepRows(sheet){
 if(!sheet?.parts?.length)throw Error('Choose a nested sheet containing parts.');
 const {width,height}=sheet.settings,t=sheet.thickness;
 if(![width,height,t].every(v=>Number.isFinite(v)&&v>0))throw Error('The sheet dimensions are invalid.');
 return sheet.parts.map(p=>{
  if(!p.singleSide)throw Error('Enable One-side flat machining in Toolpaths before exporting machining-face-up STEP sheets.');
  if(![p.x,p.y,p.w,p.h,p.thickness].every(Number.isFinite)||p.w<=0||p.h<=0||p.x<0||p.y<0||p.x+p.w>width+1e-5||p.y+p.h>height+1e-5||Math.abs(p.thickness-t)>1e-5)throw Error(p.code+': invalid sheet placement or stock thickness.');
  // Secondary feet were stored before the one-side mirror. Apply the same
  // transform before placing them; edge pilots are already canonical.
  const secondary=(p.secondaryOperations||[]).map(o=>p.originalFace==='B'?transformOperation(o,([x,y,z])=>[p.width-x,y,t-z],([x,y,z])=>[-x,y,-z]):structuredClone(o));
  const operations=placedOperations({...p,flatOperations:[...(p.flatOperations||[]),...secondary]}).map(o=>transformOperation(o,([x,y,z])=>[x,y,z-t],v=>v));
  return {owner:p.owner||'Cabinet',row:[p.code+' '+p.row[0],p.x,p.y,-t,p.w,p.h,t],operations,holes:placedHoles({...p,flatHoles:p.flatHoles||[]}).map(h=>({x:h.x,y:h.y,width:h.width,depth:h.height}))};
 });
}
export const sheetStepFilename=s=>'Sheet_'+String(s.number).padStart(2,'0')+'_'+String(s.thickness).replace('.','p')+'mm.step';
export function sheetStepManifest(sheet){
 const rows=sheetStepRows(sheet);
 return {sheet:sheet.number,file:sheetStepFilename(sheet),material:sheet.material,units:'mm',stock:{width:sheet.settings.width,height:sheet.settings.height,thickness:sheet.thickness},origin:'X0/Y0 = sheet lower-left; Z0 = stock top; solids extend down to -thickness.',machiningFace:'UP (+Z). No sheet-wide face flip for primary flat machining.',stockBodyIncluded:false,parts:sheet.parts.map((p,i)=>({id:p.code,cabinet:p.owner,name:p.row[0],solidName:(p.owner||'Cabinet')+' / '+rows[i].row[0],x:p.x,y:p.y,width:p.w,height:p.h,rotation:p.rotated?90:0,orientation:p.orientation,operations:rows[i].operations.length,edgeOperations:rows[i].operations.filter(o=>o.axis!==2).length,undersideFeet:(p.secondaryOperations||[]).length,coreAfterEdgebandDeduction:true}))};
}
export function stepSetupGuide(manifests,{unplaced=0}={}){
 return 'NESTED SHEETS — SOLID GEOMETRY FOR CAM\n\n'+
 'Import each .step file into Fusion or another solid-model CAM application. Each named body is one finished CNC core, positioned exactly as in the nesting layout. Units: millimetres. X0/Y0: sheet lower-left. Z0: stock TOP; solid undersides are at negative stock thickness. Machining faces point UP (+Z).\n\n'+
 'Create one milling setup per sheet. Select the PART BODIES as the model. Define fixed-size stock using the dimensions below and in sheet-manifest.json, aligned with this sheet origin. There is deliberately no overlapping stock solid in STEP.\n\n'+
 'Holes, dados, pockets, apertures and any secondary edge/underside bores are actual cuts in the solids. Set machining strategies, tools, depths per pass, feeds, cutter compensation, tabs and the machine post in CAM. The STEP has no toolpaths, cutter offsets, holding tabs, or spoilboard allowance. Pockets have their designed geometry; physical internal corner radii depend on the cutter. Glass itself is bought separately and is not a wood solid.\n\n'+
 'SECONDARY WORK: edge pilots and blind underside feet, where listed, cannot be machined from the primary top face. Plan separate fixtures/setups after cutout. TANDEM hook/locking-device jig work remains in its separate preparation guide and is not invented by this export.\n\n'+
 manifests.map(m=>'Sheet '+m.sheet+': '+m.material+', '+m.stock.width+' × '+m.stock.height+' × '+m.stock.thickness+' mm; '+m.parts.length+' bodies; '+m.parts.reduce((n,p)=>n+p.edgeOperations,0)+' edge bores; '+m.parts.reduce((n,p)=>n+p.undersideFeet,0)+' underside foot bores.').join('\n')+
 (unplaced?'\n\nPROJECT INCOMPLETE: '+unplaced+' parts are unplaced and not included in this selected-sheet export.':'')+'\n';
}

let worker,serial=0;const pending=new Map();
function resetWorker(message){for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error(message));}pending.clear();worker?.terminate();worker=undefined;}
export function exportSheetStep(sheet,onProgress=()=>{}){
 const rows=sheetStepRows(sheet);
 if(!worker){const path=typeof __STEP_WORKER_URL__==='string'?__STEP_WORKER_URL__:'./step-worker.js';worker=new Worker(new URL(path,import.meta.url),{type:'module'});worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;if(data.progress){clearTimeout(p.timer);p.timer=setTimeout(()=>resetWorker('STEP export timed out. Try a smaller sheet or reload the page.'),180000);p.progress(data.progress);return;}clearTimeout(p.timer);pending.delete(data.id);data.error?p.reject(Error(data.error)):p.resolve(data.result);};worker.onerror=()=>resetWorker('The solid CAD engine could not load. Check the connection, reload and retry.');}
 return new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>resetWorker('STEP export timed out. Check the connection and retry.'),180000);pending.set(id,{resolve,reject,progress:onProgress,timer});try{worker.postMessage({id,mode:'step',rows});}catch(e){clearTimeout(timer);pending.delete(id);reject(e);}});
}
