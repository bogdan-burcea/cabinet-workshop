import {applyProjectSettings} from './project-settings.js';
import {checkedCosts} from './costs.js';
import {glassSchedule} from './doors.js';
import {machineSettings} from './cam.js';
import {defaults,cabinetParts,cabinetProject,saveProject,loadProject} from './cabinet.js';
import {cabinetDefaults} from './styles.js';
import {enableInstallation,resolveInstallation} from './installation.js';
import {globalsFrom,applyGlobals,checkedGlobals} from './globals.js';
import {checkedStock,partMaterial} from './production.js';
import {manufacturingParts} from './single-side.js';
import {packParts} from '../nesting.js';
const copy=v=>structuredClone(v);
const newId=()=>crypto.randomUUID();
export function initializeProject(s){if(!s.cabinets?.length){const id=newId();s.cabinets=[{id,config:s.cabinet}];s.activeCabinetId=id;}if(!s.activeCabinetId)s.activeCabinetId=s.cabinets[0].id;return syncProject(s);}
export function syncProject(s){
 s.machine={...s.machine,singleSide:true};
 if(!Array.isArray(s.cabinets)||!s.cabinets.length||s.cabinets.length>100)throw Error('A project needs 1–100 cabinets.');
 const ids=new Set();for(const r of s.cabinets){if(typeof r.id!=='string'||!r.id||r.id.length>100||ids.has(r.id)||!r.config)throw Error('Invalid or duplicate cabinet ID.');if(r.x!==undefined&&(!Number.isFinite(r.x)||r.x<0||r.x>100000))throw Error('Cabinet position from left must be 0–100000 mm.');ids.add(r.id);}const active=s.cabinets.find(r=>r.id===s.activeCabinetId);if(!active)throw Error('The selected cabinet is missing.');active.config=s.cabinet;
 if(s.costs)s.costs=checkedCosts(s.costs);if(s.independentCabinets)s.globals=globalsFrom(s.cabinet);else checkedGlobals(s.globals);for(const record of s.cabinets){try{if(!s.independentCabinets)applyGlobals(record.config,s.globals);else record.config.inheritGlobals=false;applyProjectSettings(s,record.config);resolveInstallation(record.config);cabinetProject(record.config);cabinetParts(record.config);}catch(e){const error=Error(e.message.startsWith(record.config.name+': ')?e.message:record.config.name+': '+e.message);error.cabinetId=record.id;error.field=e.field;throw error;}}
 s.cabinet=active.config;return s;
}
export function selectCabinet(s,id){const r=s.cabinets.find(r=>r.id===id);if(!r)throw Error('Choose a cabinet in this project.');s.activeCabinetId=id;s.cabinet=r.config;return s;}
export function addCabinet(s,{duplicate=false,style=s.cabinet.style}={}){syncProject(s);if(s.cabinets.length>=100)throw Error('A project supports up to 100 cabinets.');const config=duplicate?copy(s.cabinet):enableInstallation(cabinetDefaults(style),s.globals.installation,{fresh:true});config.name=duplicate?s.cabinet.name+' copy':style+' cabinet '+(s.cabinets.length+1);if(s.independentCabinets)config.inheritGlobals=false;const record={id:newId(),config};s.cabinets.push(record);selectCabinet(s,record.id);return syncProject(s);}
export function removeCabinet(s){if(s.cabinets.length===1)throw Error('Keep at least one cabinet in the project.');const index=s.cabinets.findIndex(r=>r.id===s.activeCabinetId);s.cabinets.splice(index,1);selectCabinet(s,s.cabinets[Math.min(index,s.cabinets.length-1)].id);return syncProject(s);}
export function serializeProject(s){syncProject(s);return {...saveProject(s.cabinet,s.machine,s.stock,s.globals),version:2,...(s.projectSettings?{projectSettings:copy(s.projectSettings)}:{}),...(s.costs?{costs:copy(s.costs)}:{}),...(s.independentCabinets?{independentCabinets:true}:{}),activeCabinetId:s.activeCabinetId,cabinets:copy(s.cabinets)};}
export function deserializeProject(data){
 if(data?.version!==2){const loaded=loadProject(data);loaded.cabinet=enableInstallation(loaded.cabinet,loaded.globals?.installation);loaded.stock=checkedStock(loaded.stock);loaded.globals={...globalsFrom(loaded.cabinet),...loaded.globals};return initializeProject(loaded);}
 if(data.format!=='cabinet-workbench'||!Array.isArray(data.cabinets)||!data.cabinets.length||data.cabinets.length>100)throw Error('Choose a Cabinet Workshop project with 1–100 cabinets.');
 const seen=new Set();for(const r of data.cabinets){if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||seen.has(r.id))throw Error('Invalid or duplicate cabinet ID.');seen.add(r.id);}
 const records=data.cabinets.map(r=>({id:r.id,...(r.x!==undefined?{x:r.x}:{}),config:enableInstallation(loadProject({format:data.format,version:1,cabinet:r.config,machine:data.machine}).cabinet,data.globals?.installation)}));const r=records.find(r=>r.id===data.activeCabinetId);if(!r)throw Error('The selected cabinet is missing.');
 const s={...(data.projectSettings?{projectSettings:copy(data.projectSettings)}:{}),...(data.costs?{costs:checkedCosts(data.costs)}:{}),...(data.independentCabinets?{independentCabinets:true}:{}),cabinet:r.config,cabinets:records,activeCabinetId:r.id,machine:machineSettings(data.machine),stock:checkedStock(data.stock),globals:{...globalsFrom(r.config),...data.globals}};return syncProject(s);
}
export function projectParts(s,{singleSide=s.machine.singleSide}={}){syncProject(s);const stock=checkedStock(s.stock);return s.cabinets.flatMap((r,i)=>manufacturingParts(cabinetParts(r.config),singleSide).map(p=>({...p,code:'C'+String(i+1).padStart(2,'0')+'-'+p.code,sourceCode:p.code,key:r.id+'/'+p.key,cabinetId:r.id,owner:r.config.name,material:partMaterial(p,stock),grain:!stock.rotate})));}
export function projectLayout(s){const settings=checkedStock(s.stock),parts=projectParts(s),trials=['short','area','bottom'].flatMap(heuristic=>['longest','fronts','area','width','height'].map(order=>packParts(parts,settings,{order,heuristic}))).concat(Array.from({length:24},(_,i)=>packParts(parts,settings,{seed:i+1,heuristic:i%2?'area':'short'})));
 const score=l=>[l.unplaced.length,l.sheets.length,l.sheets.reduce((n,s)=>n+Math.max(...s.parts.map(a=>a.x+a.w))*Math.max(...s.parts.map(a=>a.y+a.h)),0),-l.sheets.reduce((n,s,i)=>n+s.utilization/(i+1),0)],less=(a,b)=>a.some((v,i)=>v<b[i]-1e-7&&a.slice(0,i).every((v,j)=>Math.abs(v-b[j])<1e-7));const layout=trials.reduce((a,b)=>less(score(b),score(a))?b:a);layout.searches=trials.length;layout.singleSide=s.machine.singleSide;return layout;
}

export function projectGlassCsv(s,parts){const rows=[['Cabinet','Door','Glass width mm','Glass height mm','Glass thickness mm','Total fit clearance mm','Notes']];for(const r of s.cabinets){const list=parts.filter(p=>p.cabinetId===r.id||(!p.cabinetId&&r.id===s.activeCabinetId));for(const g of glassSchedule(list,r.config))rows.push([r.config.name,g.name,g.width,g.height,g.thickness,g.clearance,'Bought glass; confirm routed fit; fit retainers; no glass CNC drilling']);}return rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}
