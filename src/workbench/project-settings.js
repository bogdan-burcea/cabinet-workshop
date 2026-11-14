import {cabinetDefaults} from './styles.js';
import {hingePresets,platePresets} from '../machining.js';
export const feetKeys=['feet','feetCount','feetThrough','feetHeight','feetX','feetFront','feetRear','feetPitchX','feetPitchY','feetDiameter','feetDepth'];
export const commonGroups={feet:feetKeys,hinges:['hinge','plate','hingeEnd'],handles:['handle','handlePosition','handlePitch','handleDiameter','handleEdge','handleAlignment','handleHeight','drawerHandlePosition'],banding:['edgeBand','bandDoors','bandFronts'],shelfDrilling:['pinDepth','pinFront','pinRear'],assemblyDrilling:['screwPilot','screwClearance','screwDepth','screwSetback']};
export const commonGroupForKey=key=>Object.keys(commonGroups).find(g=>commonGroups[g].includes(key))||(key==='worktopThickness'?'worktop':null);
export function commonValues(s,group,style=s.cabinet.style){
 const shared=s.projectSettings||{},saved=group==='handles'?shared.handles?.[style]:shared[group],source=group==='handles'?(s.cabinet.style===style?s.cabinet:s.cabinets.find(r=>r.config.style===style)?.config)||cabinetDefaults(style):group==='feet'?(s.cabinet.style!=='Wall'?s.cabinet:s.cabinets.find(r=>r.config.style!=='Wall')?.config)||cabinetDefaults():s.cabinet;
 if(group==='worktop')return {worktopThickness:shared.worktopThickness??source.installation?.worktopThickness??38};
 return {...Object.fromEntries(commonGroups[group].map(k=>[k,source[k]])),...saved};
}
function clearCommonOverrides(c,group){
 if(group==='banding'){if(c.featureEdits)c.featureEdits.bands={};return;}
 const match=group==='feet'?/^Foot plate/:group==='hinges'?/^Hinge (cup|fixing|plate)$/:group==='handles'?/^Handle through hole$/:group==='shelfDrilling'?/^Shelf .* support$/:group==='assemblyDrilling'?/Assembly/:null;
 if(match)for(const id of Object.keys(c.featureEdits?.operations||{})){let label;try{label=JSON.parse(id)[1];}catch{continue;}if(match.test(label))delete c.featureEdits.operations[id];}
}
function validateCommon(group,values,style){
 const ranges={hingeEnd:[1,1000],handlePitch:[1,1000],handleDiameter:[1,12],handleEdge:[1,1000],handleHeight:[0,3000],edgeBand:[0,3],pinDepth:[.1,40],pinFront:[1,1000],pinRear:[1,1000],screwPilot:[.1,10],screwClearance:[.1,20],screwDepth:[1,100],screwSetback:[1,1000]};
 for(const [k,[lo,hi]]of Object.entries(ranges))if(k in values&&(!Number.isFinite(values[k])||values[k]<lo||values[k]>hi))throw Error(k+' must be '+lo+'–'+hi+' mm.');
 if(group==='hinges'&&(!hingePresets.some(([id])=>id===values.hinge)||!platePresets[values.hinge]?.some(([id])=>id===values.plate)))throw Error('Choose a compatible common hinge and mounting plate.');
 if(group==='handles'&&(!['Base','Wall','Tall'].includes(style)||!['none','knob','horizontal','vertical'].includes(values.handle)||!['top','floor'].includes(values.handleAlignment)||!(style==='Wall'?['auto_bottom','bottom_center']:['auto_top','top_center','auto_middle','auto_bottom','bottom_center']).includes(values.handlePosition)||!['top_center','middle_center','bottom_center'].includes(values.drawerHandlePosition)))throw Error('Choose valid handle settings for this cabinet style.');
}
export function setCommonGroup(s,group,values,style=s.cabinet.style){
 if(group==='worktop'){s.projectSettings??={};s.projectSettings.worktopThickness=values.worktopThickness;return;}
 if(!commonGroups[group])throw Error('Choose a common feature group.');const next={...commonValues(s,group,style),...Object.fromEntries(Object.entries(values).filter(([k])=>commonGroups[group].includes(k)))};validateCommon(group,next,style);s.projectSettings??={};
 if(group==='handles'){s.projectSettings.handles??={};s.projectSettings.handles[style]=next;}else s.projectSettings[group]=next;
 for(const r of s.cabinets)if((group!=='handles'||r.config.style===style)&&(group!=='feet'||r.config.style!=='Wall'))clearCommonOverrides(r.config,group);
}
export function setProjectFeet(s){s.projectSettings??={};s.projectSettings.feet=Object.fromEntries(feetKeys.map(k=>[k,s.cabinet[k]]));for(const r of s.cabinets)if(r.config.style!=='Wall')for(const id of Object.keys(r.config.featureEdits?.operations||{}))if(id.includes('Foot plate'))delete r.config.featureEdits.operations[id];}
export function setProjectWorktop(s){s.projectSettings??={};s.projectSettings.worktopThickness=s.cabinet.installation.worktopThickness;}
export function applyProjectSettings(s,c){
 const shared=s.projectSettings;if(!shared)return c;
 if(shared.feet){if(typeof shared.feet!=='object'||Array.isArray(shared.feet)||feetKeys.some(k=>shared.feet[k]===undefined))throw Error('The shared feet settings are incomplete.');if(!Number.isFinite(shared.feet.feetHeight)||shared.feet.feetHeight<50||shared.feet.feetHeight>250)throw Error('Foot height must be 50–250 mm.');if(c.style!=='Wall')for(const k of feetKeys)c[k]=shared.feet[k];}
 if(shared.worktopThickness!==undefined){if(!Number.isFinite(shared.worktopThickness)||shared.worktopThickness<1||shared.worktopThickness>150)throw Error('Worktop thickness must be 1–150 mm.');c.installation.worktopThickness=shared.worktopThickness;}
 for(const group of ['hinges','banding','shelfDrilling','assemblyDrilling','handles']){const values=group==='handles'?shared.handles?.[c.style]:shared[group];if(!values)continue;if(typeof values!=='object'||Array.isArray(values)||commonGroups[group].some(k=>values[k]===undefined))throw Error('The common '+group+' settings are incomplete.');validateCommon(group,values,c.style);for(const k of commonGroups[group])c[k]=values[k];}
 return c;
}
