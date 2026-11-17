import {checkedMaterialBindings,boundPartMaterial,validatePortableCabinet} from './portable-cabinet.js';
import {isInset} from './doors.js';
import {normalizePantry} from './pantry.js';
import {sectionDefaults} from './sections.js';
import {wallHangerDefaults} from './wall-hangers.js';
import {continuousPlinths} from './plinth-runs.js';
import {frontLayout,connectCabinetLayout} from './front-plan.js';
import {checkedLabelPaper} from './part-labels.js';
import {hoodDefaults} from './hood.js';
import {applyProjectSettings} from './project-settings.js';
import {checkedCosts} from './costs.js';
import {glassSchedule} from './doors.js';
import {machineSettings} from './cam.js';
import {defaults,cabinetParts,cabinetProject,saveProject,loadProject} from './cabinet.js';
import {cabinetDefaults} from './styles.js';
import {enableInstallation,resolveInstallation,floorClearance} from './installation.js';
import {globalsFrom,applyGlobals,checkedGlobals} from './globals.js';
import {checkedStock,partMaterial} from './production.js';
import {manufacturingParts} from './single-side.js';
import {packParts} from '../nesting.js';
const copy=v=>structuredClone(v);
const newId=()=>crypto.randomUUID();
export function initializeProject(s){if(!s.cabinets?.length){const id=newId();s.cabinets=[{id,config:s.cabinet}];s.activeCabinetId=id;}if(!s.activeCabinetId)s.activeCabinetId=s.cabinets[0].id;return syncProject(s);}
export function syncProject(s){
 s.labelPaper=checkedLabelPaper(s.labelPaper);s.machine={...s.machine,singleSide:true};
 if(!Array.isArray(s.cabinets)||!s.cabinets.length||s.cabinets.length>100)throw Error('A project needs 1–100 cabinets.');
 const ids=new Set();for(const r of s.cabinets){if(typeof r.id!=='string'||!r.id||r.id.length>100||ids.has(r.id)||!r.config)throw Error('Invalid or duplicate cabinet ID.');if(r.layoutOrder!==undefined&&(!Number.isInteger(r.layoutOrder)||r.layoutOrder<0||r.layoutOrder>100))throw Error('Invalid cabinet arrangement order.');if(r.positionMode!==undefined&&!['auto','manual'].includes(r.positionMode))throw Error('Choose automatic or manual cabinet position.');if(r.positionMode==='manual'&&!Number.isFinite(r.x))throw Error('Enter a manual cabinet position.');if(r.x!==undefined&&(!Number.isFinite(r.x)||r.x<0||r.x>100000))throw Error('Cabinet position from left must be 0–100000 mm.');ids.add(r.id);}const active=s.cabinets.find(r=>r.id===s.activeCabinetId);if(!active)throw Error('The selected cabinet is missing.');active.config=s.cabinet;for(const r of s.cabinets)for(const [k,v]of Object.entries({...hoodDefaults,...sectionDefaults,...wallHangerDefaults,drawerSystem:'tandem',support:'feet',doorThickness:18,shelfThickness:18}))if(r.config[k]===undefined)r.config[k]=v;
 if(s.costs)s.costs=checkedCosts(s.costs);if(s.independentCabinets){if(s.cabinet.settingsPolicy!=='preserve')s.globals=globalsFrom(s.cabinet);}else checkedGlobals(s.globals);for(const record of s.cabinets){try{if(!s.independentCabinets)applyGlobals(record.config,s.globals);else record.config.inheritGlobals=false;applyProjectSettings(s,record.config);normalizePantry(record.config);resolveInstallation(record.config);alignLowerSection(s,record.config);alignBaseHandle(s,record.config);cabinetProject(record.config);cabinetParts(record.config);if(record.config.settingsPolicy!==undefined&&!['preserve','project'].includes(record.config.settingsPolicy))throw Error('Choose Preserve saved settings or Use project defaults.');if(record.config.materialBindings)checkedMaterialBindings(record.config.materialBindings);if(record.config.settingsPolicy==='preserve')validatePortableCabinet(record.config);}catch(e){const error=Error(e.message.startsWith(record.config.name+': ')?e.message:record.config.name+': '+e.message);error.cabinetId=record.id;error.field=e.field;if(e.issues)error.issues=structuredClone(e.issues);throw error;}}
 connectCabinetLayout(s.cabinets);s.cabinet=active.config;return s;
}
export function selectCabinet(s,id){const r=s.cabinets.find(r=>r.id===id);if(!r)throw Error('Choose a cabinet in this project.');s.activeCabinetId=id;s.cabinet=r.config;return s;}
export function addCabinet(s,{duplicate=false,style=s.cabinet.style}={}){syncProject(s);if(s.cabinets.length>=100)throw Error('A project supports up to 100 cabinets.');const config=duplicate?copy(s.cabinet):enableInstallation(cabinetDefaults(style),s.globals.installation,{fresh:true});config.name=duplicate?s.cabinet.name+' copy':style+' cabinet '+(s.cabinets.length+1);if(s.independentCabinets)config.inheritGlobals=false;const record={id:newId(),config};s.cabinets.push(record);selectCabinet(s,record.id);return syncProject(s);}
export function removeCabinet(s){if(s.cabinets.length===1)throw Error('Keep at least one cabinet in the project.');const index=s.cabinets.findIndex(r=>r.id===s.activeCabinetId);s.cabinets.splice(index,1);selectCabinet(s,s.cabinets[Math.min(index,s.cabinets.length-1)].id);return syncProject(s);}
export function serializeProject(s){syncProject(s);return {...saveProject(s.cabinet,s.machine,s.stock,s.globals),version:2,labelPaper:copy(s.labelPaper),...(s.projectSettings?{projectSettings:copy(s.projectSettings)}:{}),...(s.costs?{costs:copy(s.costs)}:{}),...(s.independentCabinets?{independentCabinets:true}:{}),activeCabinetId:s.activeCabinetId,cabinets:copy(s.cabinets)};}
export function deserializeProject(data){
 if(data?.version!==2){const loaded=loadProject(data);loaded.cabinet=enableInstallation(loaded.cabinet,loaded.globals?.installation);loaded.stock=checkedStock(loaded.stock);loaded.globals={...globalsFrom(loaded.cabinet),...loaded.globals};return initializeProject(loaded);}
 if(data.format!=='cabinet-workbench'||!Array.isArray(data.cabinets)||!data.cabinets.length||data.cabinets.length>100)throw Error('Choose a Cabinet Workshop project with 1–100 cabinets.');
 const seen=new Set();for(const r of data.cabinets){if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||seen.has(r.id))throw Error('Invalid or duplicate cabinet ID.');seen.add(r.id);}
 const records=data.cabinets.map(r=>({id:r.id,...(r.x!==undefined?{x:r.x}:{}),...(r.positionMode!==undefined?{positionMode:r.positionMode}:{}),...(r.layoutOrder!==undefined?{layoutOrder:r.layoutOrder}:{}),config:enableInstallation(loadProject({format:data.format,version:1,cabinet:r.config,machine:data.machine}).cabinet,data.globals?.installation)}));const r=records.find(r=>r.id===data.activeCabinetId);if(!r)throw Error('The selected cabinet is missing.');
 const s={...(data.projectSettings?{projectSettings:copy(data.projectSettings)}:{}),...(data.costs?{costs:checkedCosts(data.costs)}:{}),...(data.independentCabinets?{independentCabinets:true}:{}),labelPaper:checkedLabelPaper(data.labelPaper),cabinet:r.config,cabinets:records,activeCabinetId:r.id,machine:machineSettings(data.machine),stock:checkedStock(data.stock),globals:{...globalsFrom(r.config),...data.globals}};return syncProject(s);
}
export function projectParts(s,{singleSide=s.machine.singleSide}={}){syncProject(s);const stock=checkedStock(s.stock);return continuousPlinths(s.cabinets.flatMap((r,i)=>manufacturingParts(cabinetParts(r.config),singleSide).map(p=>({...p,code:'C'+String(i+1).padStart(2,'0')+'-'+p.code,sourceCode:p.code,key:r.id+'/'+p.key,cabinetId:r.id,owner:r.config.name,material:r.config.materialBindings?boundPartMaterial(p,r.config.materialBindings):partMaterial(p,stock),grain:!stock.rotate}))),s.cabinets,stock);}
export function projectLayout(s){const settings=checkedStock(s.stock),parts=projectParts(s),trials=['short','area','bottom'].flatMap(heuristic=>['longest','fronts','area','width','height'].map(order=>packParts(parts,settings,{order,heuristic}))).concat(Array.from({length:24},(_,i)=>packParts(parts,settings,{seed:i+1,heuristic:i%2?'area':'short'})));
 const score=l=>[l.unplaced.length,l.sheets.length,l.sheets.reduce((n,s)=>n+Math.max(...s.parts.map(a=>a.x+a.w))*Math.max(...s.parts.map(a=>a.y+a.h)),0),-l.sheets.reduce((n,s,i)=>n+s.utilization/(i+1),0)],less=(a,b)=>a.some((v,i)=>v<b[i]-1e-7&&a.slice(0,i).every((v,j)=>Math.abs(v-b[j])<1e-7));const layout=trials.reduce((a,b)=>less(score(b),score(a))?b:a);layout.searches=trials.length;layout.singleSide=s.machine.singleSide;return layout;
}

export function projectGlassCsv(s,parts){const rows=[['Cabinet','Door','Glass width mm','Glass height mm','Glass thickness mm','Total fit clearance mm','Notes']];for(const r of s.cabinets){const list=parts.filter(p=>p.cabinetId===r.id||(!p.cabinetId&&r.id===s.activeCabinetId));for(const g of glassSchedule(list,r.config))rows.push([r.config.name,g.name,g.width,g.height,g.thickness,g.clearance,'Bought glass; confirm routed fit; fit retainers; no glass CNC drilling']);}return rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}

export function moveCabinet(s,id,targetIndex){
 connectCabinetLayout(s.cabinets);const record=s.cabinets.find(r=>r.id===id);if(!record)throw Error('Choose a cabinet.');const wall=record.config.style==='Wall',lane=s.cabinets.filter(r=>(r.config.style==='Wall')===wall).sort((a,b)=>a.layoutOrder-b.layoutOrder),index=lane.indexOf(record);
 if(!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>=lane.length)throw Error('Choose a position within this cabinet row.');if(index===targetIndex){if(record.positionMode==='manual'){delete record.x;record.positionMode='auto';return true;}return false;}delete record.x;record.positionMode='auto';lane.splice(index,1);lane.splice(targetIndex,0,record);lane.forEach((r,i)=>r.layoutOrder=i);return true;
}
export function reorderCabinet(s,id,direction){if(![-1,1].includes(direction))throw Error('Choose left or right.');connectCabinetLayout(s.cabinets);const a=s.cabinets.find(r=>r.id===id);if(!a)throw Error('Choose a cabinet.');const lane=s.cabinets.filter(r=>(r.config.style==='Wall')===(a.config.style==='Wall')).sort((a,b)=>a.layoutOrder-b.layoutOrder),target=lane.indexOf(a)+direction;return target<0||target>=lane.length?false:moveCabinet(s,id,target);}

export function setCabinetPosition(s,id,x){const r=s.cabinets.find(r=>r.id===id);if(!r)throw Error('Choose a cabinet.');if(x===null){delete r.x;r.positionMode='auto';}else{if(!Number.isFinite(x)||x<0||x>100000)throw Error('Position from left must be 0–100000 mm.');r.x=x;r.positionMode='manual';}return r;}

// Reorder physical columns instead of swapping two X coordinates. Stacked
// neighbors stay together; pulling one cabinet out creates its own column.
// This allows Tall cabinets to pass a Base/Wall stack without colliding with it.
export function moveCabinetInElevation(s,id,targetIndex){
 connectCabinetLayout(s.cabinets);const before=frontLayout(s.cabinets),ordered=[...before.items].sort((a,b)=>a.x-b.x||a.bottom-b.bottom),index=ordered.findIndex(a=>a.id===id);
 if(index<0||!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>=ordered.length)throw Error('Choose a position in the elevation.');if(index===targetIndex)return false;
 const active=ordered[index],target=ordered[targetIndex],columns=[];
 for(const item of ordered){let col=columns.at(-1);if(!col||Math.abs(item.x-col.x)>.01){col={x:item.x,width:0,items:[]};columns.push(col);}const offset=item.x-col.x;col.items.push({item,offset});col.width=Math.max(col.width,offset+item.width);}
 const source=columns.find(c=>c.items.some(a=>a.item.id===id)),destination=columns.find(c=>c.items.some(a=>a.item.id===target.id));if(source===destination)return false;
 const gaps=columns.map((c,i)=>i?Math.max(0,c.x-columns[i-1].x-columns[i-1].width):0),origin=columns[0].x;
 source.items=source.items.filter(a=>a.item.id!==id);
 if(!source.items.length)columns.splice(columns.indexOf(source),1);else source.width=Math.max(...source.items.map(a=>a.offset+a.item.width));
 const insertion=columns.indexOf(destination)+(index<targetIndex?1:0);columns.splice(insertion,0,{width:active.width,items:[{item:active,offset:0}]});
 const positions=new Map();let x=origin;for(const [i,col]of columns.entries()){x+=gaps[i]||0;for(const a of col.items){const px=x+a.offset;if(px>100000)throw Error('The reordered run exceeds the 100000 mm cabinet-position limit.');positions.set(a.item.id,px);}x+=col.width;}
 const draft=s.cabinets.map(r=>({...r,x:positions.get(r.id),positionMode:'manual'})),after=frontLayout(draft);
 if(after.overlaps.some(a=>!before.overlaps.some(b=>[b.first,b.second].includes(a.first)&&[b.first,b.second].includes(a.second))))throw Error('The reordered cabinets overlap. Check their dimensions and elevations.');
 for(const r of s.cabinets){r.x=positions.get(r.id);r.positionMode='manual';}
 for(const wall of [false,true])s.cabinets.filter(r=>(r.config.style==='Wall')===wall).sort((a,b)=>a.x-b.x).forEach((r,i)=>r.layoutOrder=i);
 return true;
}

// Pointer placement uses the same horizontal datum as the position field.
// Only an actual vertical collision requires column insertion.
export function placeCabinetInElevation(s,id,x,targetIndex){
 const before=frontLayout(s.cabinets),draft=s.cabinets.map(r=>r.id===id?{...r,x,positionMode:'manual'}:r),after=frontLayout(draft);
 if(after.overlaps.some(a=>[a.first,a.second].includes(id)&&!before.overlaps.some(b=>b.first===a.first&&b.second===a.second)))return moveCabinetInElevation(s,id,targetIndex);
 setCabinetPosition(s,id,x);return true;
}

function alignLowerSection(s,c){
 delete c.alignedLowerOffset;delete c.alignedLowerBottomDado;delete c.alignedLowerBottomLift;
 if(!c.split||!c.alignLowerToBase)return;
 const baseRecord=s.cabinets.find(r=>r.config!==c&&r.config.style==='Base'&&!r.config.split&&r.config.frontMode==='drawers')||s.cabinets.find(r=>r.config!==c&&r.config.style==='Base'&&!r.config.split);
 if(!baseRecord)throw Error('Add a Base cabinet to align the lower section.');
 const base=structuredClone(baseRecord.config);if(!s.independentCabinets)applyGlobals(base,s.globals);applyProjectSettings(s,base);resolveInstallation(base);
 const fronts=cabinetParts(base).map(p=>p.row).filter(r=>/^Door/.test(r[0])||/^Drawer \d+ overlay front$/.test(r[0]));
 const top=floorClearance(base)+(fronts.length?Math.max(...fronts.map(r=>r[3]+r[6])):base.height-2),bottom=floorClearance(base)+(fronts.length?Math.min(...fronts.map(r=>r[3])):2);
 const reveal=c.lowerType==='doors'&&isInset(c)?c.thickness+2:2;
 c.alignedLowerOffset=bottom-reveal-floorClearance(c);const lift=(c.bottomDado?c.bottomLift:0)-c.alignedLowerOffset;c.alignedLowerBottomDado=lift>0;c.alignedLowerBottomLift=Math.max(0,lift);
 const insetLower=c.lowerType==='doors'&&isInset(c)||c.lowerType==='drawers'&&c.drawerInset,topReveal=insetLower?(c.splitShelf!==false?(c.shelfThickness??18)/2:0)+2:2;
 c.splitFloorHeight=top+topReveal;c.splitHeight=c.splitFloorHeight-floorClearance(c);
}

function alignBaseHandle(s,c){
 if(c.handleAlignment!=='base')return;
 const source=s.cabinets.find(r=>r.config!==c&&r.config.style==='Base'&&!r.config.split)?.config;
 const base=source?structuredClone(source):enableInstallation(cabinetDefaults('Base'),c.installation,{fresh:true});
 if(!s.independentCabinets)applyGlobals(base,s.globals);applyProjectSettings(s,base);if(base.handleAlignment==='base')base.handleAlignment='top';resolveInstallation(base);
 const centres=cabinetParts(base).filter(p=>/^Door|^Drawer .*overlay front$/.test(p.row[0])).map(p=>p.operations.filter(o=>o.label==='Handle through hole')).filter(ops=>ops.length).map(ops=>ops.reduce((sum,o)=>sum+o.point[2],0)/ops.length);
 c.handleBaseHeight=floorClearance(base)+(centres.length?Math.max(...centres):base.height-2-base.handleEdge-(base.handle==='vertical'?base.handlePitch/2:0));
}
