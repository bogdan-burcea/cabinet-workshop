import {golaDefaults} from './gola.js';
import {applyResolvedProjectDefaults} from './project-settings.js';
import {drawerPlan} from './tandem.js';
import {sectionDrawerConfigs} from './sections.js';
import {pantryConfig} from './pantry.js';
import {defaults} from './cabinet.js';
import {syncProject} from './project.js';
import {checkedStock} from './production.js';
import {checkedMaterialBindings,hardwareReferences,validatePortableCabinet,TemplateValidationError,materialRoles} from './portable-cabinet.js';
export {TemplateValidationError} from './portable-cabinet.js';

export const templateSchemaVersion=5;
// Increment when generator semantics change; migration must approve the new result.
export const templateGeneratorRevision='workbench-geometry-5';
const format='cabinet-workshop-template';
const settingKeys=new Set([...Object.keys(defaults).filter(k=>k!=='inheritGlobals'),'installation','topConstruction','splitFloorHeight','lowerSectionOffset','lowerSectionBottomDado','lowerSectionBottomLift']);
const clone=v=>structuredClone(v);
const fail=(code,message,field)=>{throw new TemplateValidationError([{code,message,...(field?{field}:{})}]);};
function text(value,field,max,empty=false){if(typeof value!=='string'||(!empty&&!value.trim())||value.length>max)fail('invalid-template','Enter a valid '+field+'.',field);return value.trim();}
function checkedSettings(c){if(!c||typeof c!=='object'||Array.isArray(c))fail('invalid-template','Cabinet settings are missing.');for(const k of Object.keys(c))if(!settingKeys.has(k))fail('unsupported-setting','Unsupported template cabinet setting: '+k+'. A schema migration is required.',k);for(const k of Object.keys(defaults).filter(k=>k!=='inheritGlobals'))if(c[k]===undefined)fail('invalid-template','Template cabinet setting is missing: '+k+'.',k);if(c.alignLowerToBase||c.handleAlignment==='base')fail('unresolved-dependency','Resolve Base alignment before saving a standalone template.');for(const k of ['lowerSectionOffset','lowerSectionBottomLift'])if(c[k]!==undefined&&(!Number.isFinite(c[k])||Math.abs(c[k])>100000))fail('invalid-template','Invalid standalone section offset.',k);if(c.lowerSectionBottomDado!==undefined&&typeof c.lowerSectionBottomDado!=='boolean')fail('invalid-template','Invalid standalone bottom construction.');return clone(c);}
// Historical versions are accepted only through these explicit migrations.
// Register and test a sequential, pure migration here before accepting a new version.
const migrations=new Map([[1,t=>{if(t.generatorRevision!=='workbench-geometry-1')fail('unsupported-generator','Unknown version 1 generator revision.');return {...t,schemaVersion:2,generatorRevision:'workbench-geometry-2',config:{shakerThickness:6,...Object.fromEntries(Object.entries(golaDefaults).filter(([k])=>k!=='golaSharedPair')),...t.config}};}],[2,t=>{if(t.generatorRevision!=='workbench-geometry-2')fail('unsupported-generator','Unknown version 2 generator revision.');return {...t,schemaVersion:3,generatorRevision:'workbench-geometry-3',config:{splitShelf:true,fullDoor:false,golaSharedPair:0,...t.config}};}],[3,t=>{if(t.generatorRevision!=='workbench-geometry-3')fail('unsupported-generator','Unknown version 3 generator revision.');return {...t,schemaVersion:4,generatorRevision:'workbench-geometry-4',config:{drawerInset:false,drawerFrontStyle:'slab',...t.config}};}],[4,t=>{if(t.generatorRevision!=='workbench-geometry-4')fail('unsupported-generator','Unknown version 4 generator revision.');return {...t,schemaVersion:5,generatorRevision:templateGeneratorRevision};}]]);
export function migrateTemplate(input){
 let t=clone(input);if(!t||t.format!==format||!Number.isInteger(t.schemaVersion))fail('unsupported-schema','Choose a Cabinet Workshop template JSON. Project files are not templates.');
 if(t.schemaVersion>templateSchemaVersion)fail('unsupported-schema','This template needs a newer Cabinet Workshop version.');
 while(t.schemaVersion<templateSchemaVersion){const migrate=migrations.get(t.schemaVersion);if(!migrate)fail('unsupported-schema','No migration is available for template schema '+t.schemaVersion+'.');const version=t.schemaVersion;t=migrate(clone(t));if(t.schemaVersion!==version+1)fail('unsupported-schema','Invalid template migration.');}
 if(t.generatorRevision!==templateGeneratorRevision)fail('unsupported-generator','The saved generator revision is unavailable. An explicit geometry migration is required.');
 for(const key of Object.keys(t))if(!['format','schemaVersion','generatorRevision','id','name','category','description','tags','config','materials','hardware'].includes(key))fail('unsupported-setting','Unsupported template property: '+key+'.');
 t.id=text(t.id,'template ID',100);t.name=text(t.name,'name',100);t.category=text(t.category,'category',80,true);t.description=text(t.description,'description',2000,true);if(!Array.isArray(t.tags)||t.tags.length>30)fail('invalid-template','Use up to 30 tags.');t.tags=t.tags.map(tag=>text(tag,'tag',80));t.config=checkedSettings(t.config);t.materials=checkedMaterialBindings(t.materials);const refs=hardwareReferences(t.config);if(JSON.stringify(t.hardware)!==JSON.stringify(refs))fail('unavailable-hardware','Hardware references do not match the saved cabinet settings. Resolve or migrate them explicitly.');
 const config={...clone(t.config),inheritGlobals:false,settingsPolicy:'preserve',materialBindings:clone(t.materials)};validatePortableCabinet(config);return clone(t);
}
export function captureCabinetTemplate(state,{cabinetId=state.activeCabinetId,name,category='',tags=[],description='',materialDescriptions={}}={}){
 const draft=clone(state);syncProject(draft);const source=draft.cabinets.find(r=>r.id===cabinetId)?.config;if(!source)fail('missing-cabinet','Choose a cabinet to capture.');const config=Object.fromEntries([...settingKeys].filter(k=>source[k]!==undefined).map(k=>[k,clone(source[k])]));
 if(source.alignLowerToBase){config.lowerSectionOffset=source.alignedLowerOffset??0;config.lowerSectionBottomDado=source.alignedLowerBottomDado??source.bottomDado;config.lowerSectionBottomLift=source.alignedLowerBottomLift??source.bottomLift;config.alignLowerToBase=false;}
 if(config.handleAlignment==='base'){config.handleAlignment='floor';config.handleHeight=source.handleBaseHeight;}
 const drawers=source.split?sectionDrawerConfigs(source):source.style==='Pantry'?[pantryConfig(source)]:source.frontMode==='drawers'?[source]:[];if(drawers.length){const plan=drawerPlan(drawers[0]);config.drawerLength=plan.length;if(source.drawerSystem==='tandem')config.drawerRunner=plan.family;}
 const stock=checkedStock(draft.stock),names={carcass:stock.carcassMaterial,front:stock.doorsMatchCarcass?stock.carcassMaterial:stock.frontMaterial,back:stock.backMaterial,drawerBottom:stock.drawerBottomsMatchBack?stock.backMaterial:stock.carcassMaterial};
 const materials=source.materialBindings?clone(source.materialBindings):Object.fromEntries(materialRoles.map(role=>[role,{name:names[role].trim(),description:materialDescriptions[role]??names[role].trim()}]));
 return migrateTemplate({format,schemaVersion:templateSchemaVersion,generatorRevision:templateGeneratorRevision,id:crypto.randomUUID(),name:name??source.name,category,tags:clone(tags),description,config,materials,hardware:hardwareReferences(config)});
}
export function exportCabinetTemplate(template){return JSON.stringify(migrateTemplate(template),null,2);}
export function importCabinetTemplate(json){let value;try{value=JSON.parse(json);}catch{fail('invalid-json','Template JSON could not be read.');}return migrateTemplate(value);}
// Prepare on an isolated project. Caller commits result.state inside its Undo transaction.
// A failed insertion never mutates the destination, template or overrides.
export function instantiateCabinetTemplate(state,template,{policy='preserve',overrides={},materialsCatalog,availableHardware}={}){
 if(!['preserve','project'].includes(policy))fail('invalid-policy','Choose Preserve saved settings or Use project defaults.');const t=migrateTemplate(template),draft=clone(state);syncProject(draft);if(draft.cabinets.length>=100)fail('project-full','A project supports up to 100 cabinets.');
 for(const key of Object.keys(overrides))if(!settingKeys.has(key))fail('unsupported-setting','Unsupported cabinet override: '+key+'.',key);
 const config={...checkedSettings({...clone(t.config),...clone(overrides)}),name:t.name,inheritGlobals:policy==='project',settingsPolicy:policy,...(policy==='preserve'?{materialBindings:clone(t.materials)}:{})},record={id:crypto.randomUUID(),config};if(policy==='project')applyResolvedProjectDefaults(draft,config);draft.cabinets.push(record);draft.activeCabinetId=record.id;draft.cabinet=config;
 try{syncProject(draft);}catch(e){if(e instanceof TemplateValidationError)throw e;throw new TemplateValidationError(e.issues??[{code:'incompatible-dimensions',message:e.message}]);}
 const effective={...clone(draft.cabinet),materialBindings:policy==='preserve'?clone(t.materials):(()=>{const s=checkedStock(draft.stock);return{carcass:{name:s.carcassMaterial,description:s.carcassMaterial},front:{name:s.doorsMatchCarcass?s.carcassMaterial:s.frontMaterial,description:'Project front material'},back:{name:s.backMaterial,description:s.backMaterial},drawerBottom:{name:s.drawerBottomsMatchBack?s.backMaterial:s.carcassMaterial,description:'Project drawer-bottom material'}};})()};
 validatePortableCabinet(effective,{materialsCatalog,availableHardware});return{state:clone(draft),record:clone(record),policy};
}
