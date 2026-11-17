import {cabinetParts} from './cabinet.js';
import {hingePresets,platePresets} from '../machining.js';

export const materialRoles=['carcass','front','back','drawerBottom'];
export class TemplateValidationError extends Error {
 constructor(issues){super(issues.map(i=>i.message).join('\n'));this.name='TemplateValidationError';this.issues=structuredClone(issues);}
}
export function checkedMaterialBindings(input){
 const issues=[];if(!input||typeof input!=='object'||Array.isArray(input))throw new TemplateValidationError([{code:'missing-material',message:'Material-role bindings are missing.'}]);for(const key of Object.keys(input))if(!materialRoles.includes(key))issues.push({code:'unsupported-material',message:'Unsupported material role: '+key+'.'});
 for(const role of materialRoles){const m=input?.[role];if(m&&typeof m==='object')for(const key of Object.keys(m))if(!['id','name','description'].includes(key))issues.push({code:'unsupported-material',field:role,message:'Unsupported material property: '+key+'.'});if(!m||typeof m.name!=='string'||!m.name.trim()||m.name.length>80||typeof m.description!=='string'||m.description.length>2000||m.id!==undefined&&(typeof m.id!=='string'||!m.id||m.id.length>200))issues.push({code:'missing-material',field:role,message:'Provide a material name and description for '+role+'.'});}
 if(issues.length)throw new TemplateValidationError(issues);return structuredClone(input);
}
export function boundPartMaterial(part,bindings){const role=part.material==='Back'?'back':/^Drawer \d+ bottom$/.test(part.row[0])?'drawerBottom':part.material==='Front'?'front':'carcass';return bindings[role].name;}
export function hardwareReferences(c){
 const choices=[['hinge',c.hinge,hingePresets],['plate',c.hinge+'/'+c.plate,(platePresets[c.hinge]||[]).map(([id,name])=>[c.hinge+'/'+id,name])],['handle',c.handle,[['none','No handle holes'],['gola','GOLA recessed aluminium rail'],['knob','Knob'],['horizontal','Horizontal pull'],['vertical','Vertical pull']]],['assemblyConnector',c.assemblyConnector,[['screws','Assembly screws'],['cabineo8','Lamello Cabineo 8'],['cabineo12','Lamello Cabineo 12']]],['backConnector',c.backConnector,[['none','None'],['hafele_26009765','Häfele Ixconnect 260.09.765']]],['wallHanger',c.wallHanger,[['none','None'],['blum_48n0510','Blum 48N0510']]],['drawerSystem',c.drawerSystem,[['tandem','Blum TANDEM'],['tandembox_m','Blum TANDEMBOX antaro M']]],['drawerRunner',c.drawerRunner,[['auto','Automatic supported runner'],['560H','Blum 560H'],['560F','Blum 560F']]]];
 const issues=[],refs=[];for(const [kind,id,options]of choices){const item=options.find(o=>o[0]===id);if(!item)issues.push({code:'unavailable-hardware',field:kind,message:'Unavailable '+kind+': '+String(id)+'. Choose a supported fitting explicitly.'});else refs.push({kind,id,description:item[1]});}if(issues.length)throw new TemplateValidationError(issues);return refs;
}
function featureLabel(id){try{const [part,label,,ordinal]=JSON.parse(id);return label+' '+(ordinal+1)+' on '+part.split('/').at(-1);}catch{return id.split('/').at(-1);}}
export function validatePortableCabinet(c,{materialsCatalog,availableHardware}={}){
 const issues=[];let parts=[],hardware=[];
 try{hardware=hardwareReferences(c);}catch(e){issues.push(...e.issues);}
 try{const bindings=checkedMaterialBindings(c.materialBindings);if(materialsCatalog)for(const role of materialRoles){const m=bindings[role],found=materialsCatalog.some(a=>m.id?a.id===m.id:a.name===m.name);if(!found)issues.push({code:'missing-material',field:role,message:'Material unavailable for '+role+': '+m.name+'. Map it explicitly before insertion.'});}}catch(e){issues.push(...e.issues);}
 if(availableHardware)for(const ref of hardware)if(!availableHardware.includes(ref.kind+':'+ref.id))issues.push({code:'unavailable-hardware',field:ref.kind,message:'Hardware unavailable: '+ref.description+'. Resolve the fitting before insertion.'});
 try{parts=cabinetParts(c);}catch(e){issues.push({code:'incompatible-dimensions',message:e.message});}
 if(parts.length){const features=new Set(parts.flatMap(p=>p.flatOperations.map(o=>o.featureId))),keys=new Set(parts.map(p=>p.key));for(const id of Object.keys(c.featureEdits?.operations||{}))if(!features.has(id))issues.push({code:'orphaned-override',field:id,message:'Saved drilling override no longer matches a feature: '+featureLabel(id)+'. Restore the feature or remove the override explicitly.'});for(const id of Object.keys(c.featureEdits?.bands||{}))if(!keys.has(id))issues.push({code:'orphaned-override',field:id,message:'Saved banding override no longer matches a panel: '+featureLabel(id)+'. Restore the panel or remove the override explicitly.'});}
 if(issues.length)throw new TemplateValidationError(issues);return parts;
}
