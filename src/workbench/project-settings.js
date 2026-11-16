import {wallHangerDefaults,checkedWallRail,wallSuspensionApplies} from './wall-hangers.js';
import {cabineoDefaults,checkedCabineo} from './cabineo.js';
import {maxBandThickness} from './banding-settings.js';
import {plinthDefaults} from './plinth.js';
import {cabinetDefaults} from './styles.js';
import {hingePresets,platePresets} from '../machining.js';
export const feetKeys=['support','feet','feetCount','feetThrough','feetHeight','feetX','feetFront','feetRear','feetPitchX','feetPitchY','feetDiameter','feetDepth'];
export const commonGroups={wallSuspension:Object.keys(wallHangerDefaults),plinth:Object.keys(plinthDefaults),feet:feetKeys,hinges:['hinge','plate','hingeEnd'],handles:['handle','handlePosition','handlePitch','handleDiameter','handleEdge','handleAlignment','handleHeight','drawerHandlePosition'],backPanel:['back'],joinery:['assemblyConnector','cabineoSetback','backGroove','bottomDado','grooveDepth','bottomLift','backInset','clearance','assembly','screwPilot','screwClearance','screwDepth','screwSetback'],banding:['edgeBand','bandDoors','bandFronts'],shelfDrilling:['pinDepth','pinFront','pinRear'],assemblyDrilling:['screwPilot','screwClearance','screwDepth','screwSetback']};
const byStyle=group=>['handles','joinery'].includes(group);
export const commonGroupForKey=key=>commonGroups.joinery.includes(key)?'joinery':Object.keys(commonGroups).find(g=>commonGroups[g].includes(key))||(key==='worktopThickness'?'worktop':null);
export function commonValues(s,group,style=s.cabinet.style){
 const shared=s.projectSettings||{},saved=byStyle(group)?shared[group]?.[style]:shared[group],source=group==='wallSuspension'?(wallSuspensionApplies(s.cabinet)?s.cabinet:s.cabinets.find(r=>wallSuspensionApplies(r.config))?.config)||cabinetDefaults('Wall'):byStyle(group)?(s.cabinet.style===style?s.cabinet:s.cabinets.find(r=>r.config.style===style)?.config)||cabinetDefaults(style):group==='feet'?(s.cabinet.style!=='Wall'?s.cabinet:s.cabinets.find(r=>r.config.style!=='Wall')?.config)||cabinetDefaults():s.cabinet;
 if(group==='plinth'){const c=(s.cabinet.style!=='Wall'?s.cabinet:s.cabinets.find(r=>r.config.style!=='Wall')?.config)||{};return {...plinthDefaults,...Object.fromEntries(Object.keys(plinthDefaults).filter(k=>c[k]!==undefined).map(k=>[k,c[k]])),...saved};}if(group==='worktop')return {worktopThickness:shared.worktopThickness??source.installation?.worktopThickness??38};
 const values={...(group==='feet'?{support:'feet'}:{}),...Object.fromEntries(commonGroups[group].map(k=>[k,source[k]??(k==='support'?'feet':cabineoDefaults[k]??wallHangerDefaults[k])])),...saved};if(group==='joinery'&&(style==='Wall'||style===s.cabinet.style&&s.cabinet.wallMounted)&&shared.wallSuspension?.wallHanger==='blum_48n0510')Object.assign(values,{backGroove:true,backInset:Math.min(31,Math.max(19,values.backInset))});return values;
}
function clearCommonOverrides(c,group){
 if(group==='banding'){if(c.featureEdits)c.featureEdits.bands={};return;}
 const match=group==='feet'?/^Foot plate/:group==='hinges'?/^Hinge (cup|fixing|plate)$/:group==='handles'?/^Handle through hole$/:group==='shelfDrilling'?/^Shelf .* support$/:group==='joinery'?/Cabineo|Assembly|Captured back|Bottom dado/:group==='backPanel'?/Captured back/:group==='wallSuspension'?/wall hanger|Wall hanger|Wall rail|Captured back/:group==='assemblyDrilling'?/Assembly/:null;
 if(match)for(const id of Object.keys(c.featureEdits?.operations||{})){let label;try{label=JSON.parse(id)[1];}catch{continue;}if(match.test(label))delete c.featureEdits.operations[id];}
}
function validateCommon(group,values,style){
 if(group==='wallSuspension'&&!['none','blum_48n0510'].includes(values.wallHanger))throw Error('Choose no wall hanger or the Blum 48N0510 screw-on pair.');
 if(group==='wallSuspension')checkedWallRail(values,{fit:false});
 if(group==='plinth'&&typeof values.plinth!=='boolean')throw Error('Choose whether to include a plinth.');
 const ranges={plinthThickness:[6,30],plinthSetback:[0,1000],plinthGap:[0,20],hingeEnd:[1,1000],handlePitch:[1,1000],handleDiameter:[1,12],handleEdge:[1,1000],handleHeight:[0,3000],edgeBand:[0,maxBandThickness],pinDepth:[.1,40],pinFront:[1,1000],pinRear:[1,1000],screwPilot:[.1,10],screwClearance:[.1,20],screwDepth:[1,100],screwSetback:[1,1000]};
 for(const [k,[lo,hi]]of Object.entries(ranges))if(k in values&&(!Number.isFinite(values[k])||values[k]<lo||values[k]>hi))throw Error(k+' must be '+lo+'–'+hi+' mm.');
 for(const [k,lo,hi]of [['back',3,30],['grooveDepth',.1,37],['bottomLift',0,1000],['backInset',3,1000],['clearance',0,1]])if(k in values&&(!Number.isFinite(values[k])||values[k]<lo||values[k]>hi))throw Error(k+' must be '+lo+'–'+hi+' mm.');
 if(group==='joinery')checkedCabineo(values);
 if(group==='joinery'&&(!['Base','Wall','Tall','Pantry'].includes(style)||['backGroove','bottomDado','assembly'].some(k=>typeof values[k]!=='boolean')))throw Error('Choose valid joinery settings for this cabinet style.');
 if(group==='hinges'&&(!hingePresets.some(([id])=>id===values.hinge)||!platePresets[values.hinge]?.some(([id])=>id===values.plate)))throw Error('Choose a compatible common hinge and mounting plate.');
 if(group==='handles'&&(!['Base','Wall','Tall','Pantry'].includes(style)||!['none','knob','horizontal','vertical'].includes(values.handle)||!['top','floor'].includes(values.handleAlignment)||!(style==='Wall'?['auto_bottom','bottom_center']:['auto_top','top_center','auto_middle','auto_bottom','bottom_center']).includes(values.handlePosition)||!['top_center','middle_center','bottom_center'].includes(values.drawerHandlePosition)))throw Error('Choose valid handle settings for this cabinet style.');
}
export function setCommonGroup(s,group,values,style=s.cabinet.style){
 if(group==='worktop'){s.projectSettings??={};s.projectSettings.worktopThickness=values.worktopThickness;return;}
 if(!commonGroups[group])throw Error('Choose a common feature group.');const next={...commonValues(s,group,style),...(group==='joinery'&&values.assemblyConnector&&values.assemblyConnector!=='screws'?{bottomDado:false}:{}),...(group==='wallSuspension'&&values.wallHanger==='blum_48n0510'?{wallRailNotches:true}:{}),...Object.fromEntries(Object.entries(values).filter(([k])=>commonGroups[group].includes(k)))};validateCommon(group,next,style);if(group==='joinery'&&(style==='Wall'||style===s.cabinet.style&&s.cabinet.wallMounted)&&s.projectSettings?.wallSuspension?.wallHanger==='blum_48n0510'&&(!next.backGroove||next.backInset<19||next.backInset>31))throw Error('Blum wall hangers need a captured back inset of 19–31 mm.');s.projectSettings??={};
 if(byStyle(group)){s.projectSettings[group]??={};s.projectSettings[group][style]=next;}else s.projectSettings[group]=next;
 if(group==='wallSuspension'&&next.wallHanger==='blum_48n0510'&&s.projectSettings.joinery?.Wall)Object.assign(s.projectSettings.joinery.Wall,{backGroove:true,backInset:Math.min(31,Math.max(19,s.projectSettings.joinery.Wall.backInset))});
 for(const r of s.cabinets)if((group!=='wallSuspension'||wallSuspensionApplies(r.config))&&((!byStyle(group)||r.config.style===style)&&(group!=='feet'||r.config.style!=='Wall')))clearCommonOverrides(r.config,group);
}
export function setProjectFeet(s){s.projectSettings??={};s.projectSettings.feet=Object.fromEntries(feetKeys.map(k=>[k,s.cabinet[k]]));for(const r of s.cabinets)if(r.config.style!=='Wall')for(const id of Object.keys(r.config.featureEdits?.operations||{}))if(id.includes('Foot plate'))delete r.config.featureEdits.operations[id];}
export function setProjectWorktop(s){s.projectSettings??={};s.projectSettings.worktopThickness=s.cabinet.installation.worktopThickness;}
export function applyProjectSettings(s,c){
 const shared=s.projectSettings;if(!shared)return c;
 if(shared.feet){if(typeof shared.feet!=='object'||Array.isArray(shared.feet)||feetKeys.some(k=>shared.feet[k]===undefined&&k!=='support'))throw Error('The shared feet settings are incomplete.');if(!Number.isFinite(shared.feet.feetHeight)||shared.feet.feetHeight<50||shared.feet.feetHeight>250)throw Error('Foot height must be 50–250 mm.');if(c.style!=='Wall')for(const k of feetKeys)c[k]=shared.feet[k]??(k==='support'?'feet':c[k]);}
 if(shared.worktopThickness!==undefined){if(!Number.isFinite(shared.worktopThickness)||shared.worktopThickness<1||shared.worktopThickness>150)throw Error('Worktop thickness must be 1–150 mm.');c.installation.worktopThickness=shared.worktopThickness;}
 for(const group of ['plinth','hinges','banding','shelfDrilling','assemblyDrilling','handles','backPanel','joinery','wallSuspension']){if(group==='plinth'&&c.style==='Wall'||group==='wallSuspension'&&!wallSuspensionApplies(c))continue;let values=byStyle(group)?shared[group]?.[c.style]:shared[group];if(!values)continue;if(group==='joinery')values={...cabineoDefaults,...values};if(group==='wallSuspension')values={...wallHangerDefaults,...values};if(typeof values!=='object'||Array.isArray(values)||commonGroups[group].some(k=>values[k]===undefined))throw Error('The common '+group+' settings are incomplete.');validateCommon(group,values,c.style);for(const k of commonGroups[group])c[k]=values[k];}
 if(wallSuspensionApplies(c)&&shared.wallSuspension?.wallHanger==='blum_48n0510'){c.backGroove=true;c.backInset=Math.min(31,Math.max(19,c.backInset));}
 return c;
}
