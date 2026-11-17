import {switchCabinetStyle} from './styles.js';
import {streamlineDrawers} from './drawer-setup.js';
import {commonGroups,setCommonGroup,applyProjectSettings,applyResolvedProjectDefaults,commonGroupForKey} from './project-settings.js';
import {captureCabinetTemplate} from './cabinet-template.js';
import {syncProject} from './project.js';
export const isPreserved=c=>c.settingsPolicy==='preserve';
export function localGroupValues(c,group){return group==='worktop'?{worktopThickness:c.installation?.worktopThickness??38}:Object.fromEntries(commonGroups[group].map(k=>[k,structuredClone(c[k])]));}
export function setLocalGroup(state,group,values){
 if(!isPreserved(state.cabinet))throw Error('Choose Preserve saved settings to edit local fittings.');
 const config=structuredClone(state.cabinet),edits=structuredClone(config.featureEdits);delete config.settingsPolicy;
 const scoped={cabinet:config,cabinets:[{id:state.activeCabinetId,config}],activeCabinetId:state.activeCabinetId,projectSettings:{}};
 setCommonGroup(scoped,group,values,config.style);config.featureEdits=edits;applyProjectSettings(scoped,config);config.settingsPolicy='preserve';Object.assign(state.cabinet,config);
}
export function setScopedGroup(state,group,values,style=state.cabinet.style){return isPreserved(state.cabinet)?setLocalGroup(state,group,values):setCommonGroup(state,group,values,style);}
export function withInstancePolicy(state,policy){
 if(!['preserve','project'].includes(policy))throw Error('Choose a settings policy.');const next=structuredClone(state);
 if(policy==='preserve'){const template=captureCabinetTemplate(next);next.cabinet={...structuredClone(template.config),settingsPolicy:'preserve',inheritGlobals:false,materialBindings:structuredClone(template.materials)};}
 else{applyResolvedProjectDefaults(state,next.cabinet);next.cabinet.settingsPolicy='project';next.cabinet.inheritGlobals=!next.independentCabinets;delete next.cabinet.materialBindings;}
 const result=syncProject(next);if(policy==='project')captureCabinetTemplate(result);return result;
}
export function settingsChanges(before,after){
 const changes=[],skip=new Set(['settingsPolicy','inheritGlobals','featureEdits','alignedLowerOffset','alignedLowerBottomDado','alignedLowerBottomLift','handleBaseHeight']);
 const names={handle:'Handle type',handlePitch:'Handle hole spacing',handlePosition:'Door handle position',drawerHandlePosition:'Drawer handle position',drawerLength:'Runner length',frontMode:'Front type',bottomDado:'Bottom in dados',assemblyConnector:'Connector system'},label=k=>names[k]||k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()),value=(key,v)=>v===undefined?'Project default':typeof v==='boolean'?(v?'Enabled':'Disabled'):key==='drawerLength'&&v===0?'Automatic':({top_center:'Top · centre',middle_center:'Middle · centre',bottom_center:'Bottom · centre',auto_top:'Free edge · top',auto_middle:'Free edge · middle',auto_bottom:'Free edge · bottom',horizontal:'Horizontal pull',vertical:'Vertical pull',knob:'Knob',doors:'Doors',drawers:'Drawers',auto:'Automatic'}[v]??(typeof v==='object'?JSON.stringify(v):String(v)));
 const walk=(a,b,prefix='')=>{for(const key of new Set([...Object.keys(a||{}),...Object.keys(b||{})])){if(skip.has(key))continue;const x=a?.[key],y=b?.[key];if(JSON.stringify(x)===JSON.stringify(y))continue;const title=prefix+label(key);if(x&&y&&typeof x==='object'&&typeof y==='object'&&!Array.isArray(x))walk(x,y,title+' · ');else changes.push({label:title,before:value(key,x),after:value(key,y)});}};walk(before,after);return changes;
}

export function withCabinetStyle(state,style,{frontMode,fitDrawers=false}={}){
 const next=structuredClone(state),edits=structuredClone(next.cabinet.featureEdits);next.cabinet=switchCabinetStyle(next.cabinet,style);next.cabinet.featureEdits=edits;if(next.cabinet.assembly&&next.cabinet.assemblyConnector!=='screws')next.cabinet.bottomDado=false;
 if(frontMode!==undefined){if(!['doors','drawers','open'].includes(frontMode))throw Error('Choose a front type.');next.cabinet.frontMode=frontMode;}
 if(fitDrawers&&next.cabinet.frontMode==='drawers'&&!next.cabinet.split){const edits=structuredClone(next.cabinet.featureEdits);next.cabinet=streamlineDrawers(next.cabinet,'style').cabinet;next.cabinet.featureEdits=edits;}
 const record=next.cabinets.find(r=>r.id===next.activeCabinetId);delete record.layoutOrder;
 syncProject(next);const portable=captureCabinetTemplate(next);if(fitDrawers&&next.cabinet.frontMode==='drawers'){next.cabinet.drawerLength=portable.config.drawerLength;next.cabinet.drawerRunner=portable.config.drawerRunner;syncProject(next);}return next;
}
export function correctionTarget(action,cabinet){const group=commonGroupForKey(action.key),local=action.settingScope==='local'||action.settingScope!=='project'&&isPreserved(cabinet);return{view:group&&!local?'common':'build',id:group&&local&&!action.id.startsWith('local-')?'local-'+action.id:action.id,group};}
