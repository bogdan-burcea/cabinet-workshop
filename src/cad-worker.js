import init from 'replicad-opencascadejs';import {setOC} from 'replicad';import {cadStep,cadMesh} from './cad-core.js';
let ready;
const initialize=()=>ready??=(async()=>{const path=typeof __CAD_WASM_URL__==='string'?__CAD_WASM_URL__:'./cad.wasm';const oc=await init({locateFile:()=>new URL(path,import.meta.url).href});setOC(oc);})();
let queue=Promise.resolve();self.onmessage=({data})=>{queue=queue.then(async()=>{const {id,mode,rows}=data;try{await initialize();if(mode==='step'){const text=await cadStep(rows,(done,total)=>self.postMessage({id,progress:{done,total}}));self.postMessage({id,result:text});}else{const meshes=rows.map(row=>cadMesh(row));self.postMessage({id,result:meshes});}}catch(e){self.postMessage({id,error:e?.message||'The CAD engine could not process this part.'});}});};
