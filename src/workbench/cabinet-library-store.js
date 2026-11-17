import {migrateTemplate,importCabinetTemplate,TemplateValidationError} from './cabinet-template.js';
export const libraryDatabaseName='cabinet-workshop-library';
export function parseLibraryImport(json){
 let data;try{data=JSON.parse(json);}catch{throw Error('Library JSON could not be read.');}
 if(data?.format==='cabinet-workshop-template')return[importCabinetTemplate(json)];
 if(data?.format!=='cabinet-workshop-library'||data.schemaVersion!==1||!Array.isArray(data.templates)||data.templates.length>500)throw Error('Choose a template or version 1 library JSON with up to 500 templates.');
 const results=[],issues=[];for(const [i,t]of data.templates.entries()){try{results.push(migrateTemplate(t));}catch(e){issues.push(...(e.issues||[{message:e.message}]).map(issue=>({...issue,message:'Template '+(i+1)+': '+issue.message})));}}if(issues.length)throw new TemplateValidationError(issues);return structuredClone(results);
}
export function exportLibraryJSON(templates){return JSON.stringify({format:'cabinet-workshop-library',schemaVersion:1,templates:templates.map(migrateTemplate)},null,2);}
export function createLibraryStore(factory=globalThis.indexedDB,{name=libraryDatabaseName}={}){
 let opening;
 async function db(){if(!factory)throw Error('Local library storage is unavailable. Enable browser storage and try again.');if(!opening)opening=new Promise((resolve,reject)=>{const request=factory.open(name,1);request.onupgradeneeded=()=>{request.result.createObjectStore('templates',{keyPath:'id'});request.result.createObjectStore('thumbnails',{keyPath:'id'});};request.onsuccess=()=>{const database=request.result;database.onversionchange=()=>{database.close();opening=null;};resolve(database);};request.onerror=()=>{opening=null;reject(Error('Could not open the local cabinet library: '+request.error?.message));};request.onblocked=()=>{opening=null;reject(Error('Close other Cabinet Workshop tabs to update library storage.'));};});return opening;}
 async function transact(stores,mode,action){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction(stores,mode);let result,failure;tx.oncomplete=()=>resolve(structuredClone(result));tx.onerror=()=>reject(Error('Library storage failed: '+(tx.error?.message||'Storage may be full. Export a backup and free browser storage.')));tx.onabort=()=>reject(failure||Error('Library storage transaction was cancelled.'));try{action(tx,v=>{result=v;},error=>{failure=error;tx.abort();});}catch(e){tx.abort();reject(e);}});}
 const api={
 async list(){return transact(['templates'],'readonly',(tx,done)=>{const req=tx.objectStore('templates').getAll();req.onsuccess=()=>{const templates=[],issues=[];for(const t of req.result){try{templates.push(migrateTemplate(t));}catch(e){issues.push({id:t.id,name:t.name||'Unreadable template',message:e.message});}}done({templates,issues});};});},
 async exportJSON(){return transact(['templates'],'readonly',(tx,done)=>{const r=tx.objectStore('templates').getAll();r.onsuccess=()=>done(JSON.stringify({format:'cabinet-workshop-library',schemaVersion:1,templates:r.result},null,2));});},
 async raw(id){return transact(['templates'],'readonly',(tx,done)=>{const r=tx.objectStore('templates').get(id);r.onsuccess=()=>done(r.result);});},
 async put(input){const t=migrateTemplate(input);await transact(['templates','thumbnails'],'readwrite',(tx,done,fail)=>{const records=tx.objectStore('templates'),existing=records.get(t.id);existing.onsuccess=()=>{const save=()=>{records.put(structuredClone(t));tx.objectStore('thumbnails').delete(t.id);};if(existing.result)save();else{const count=records.count();count.onsuccess=()=>{if(count.result>=500)fail(Error('The library holds up to 500 templates. Export a backup and remove unused entries first.'));else save();};}};});return structuredClone(t);},
 async remove(id){await transact(['templates','thumbnails'],'readwrite',tx=>{tx.objectStore('templates').delete(id);tx.objectStore('thumbnails').delete(id);});},
 async importJSON(json){const templates=parseLibraryImport(json).map(t=>({...t,id:crypto.randomUUID()}));await transact(['templates','thumbnails'],'readwrite',(tx,done,fail)=>{const records=tx.objectStore('templates'),count=records.count();count.onsuccess=()=>{if(count.result+templates.length>500){fail(Error('Import would exceed the 500-template library limit. Export a backup and remove unused entries first.'));return;}for(const t of templates)records.add(structuredClone(t));};});return structuredClone(templates);},
 async duplicate(input){const t=migrateTemplate(input);t.id=crypto.randomUUID();t.name=(t.name+' copy').slice(0,100);return api.put(t);},
 async thumbnail(id){return transact(['thumbnails'],'readonly',(tx,done)=>{const r=tx.objectStore('thumbnails').get(id);r.onsuccess=()=>done(r.result);});},
 async cacheThumbnail(id,key,svg){await transact(['templates','thumbnails'],'readwrite',tx=>{const r=tx.objectStore('templates').get(id);r.onsuccess=()=>{if(r.result)tx.objectStore('thumbnails').put({id,key,svg});};});},
 async clearThumbnails(){await transact(['thumbnails'],'readwrite',tx=>tx.objectStore('thumbnails').clear());}
 };return api;
}
