import {cabinetParts} from './cabinet.js';
import {drawerPlan,tandemDefaults,tandemLengths,isDrawers} from './tandem.js';
// Reconcile dependent settings before validating the whole cabinet. Do not resize the carcass.
export function streamlineDrawers(input,key='frontMode'){
 const c={...structuredClone(input)},notes=[];if(!isDrawers(c))return {cabinet:c,notes};
 const set=(k,v,note)=>{if(c[k]!==v){c[k]=v;if(note&&!notes.includes(note))notes.push(note);}};
 if(key==='drawerRunner'&&c.drawerRunner!=='auto'){if(c.drawerRunner==='560H'&&(c.drawerStock>16||c.drawerStock<11))set('drawerStock',16,'Drawer stock set to 16 mm for 560H.');if(c.drawerRunner==='560F'&&(c.drawerStock<17||c.drawerStock>19))set('drawerStock',18,'Drawer stock set to 18 mm for 560F.');}
 if(!Number.isFinite(c.drawerStock)||c.drawerStock<11||c.drawerStock>19||c.drawerStock>16&&c.drawerStock<17)set('drawerStock',18,'Drawer stock set to 18 mm.');
 if(c.drawerRunner==='560H'&&c.drawerStock>16||c.drawerRunner==='560F'&&c.drawerStock<17||!['auto','560H','560F'].includes(c.drawerRunner))set('drawerRunner','auto','Runner family now follows drawer stock.');
 const available=c.depth-c.back-(c.backGroove?c.backInset:0);if(c.drawerLength!==0&&(!tandemLengths.includes(c.drawerLength)||c.drawerLength+3>available))set('drawerLength',0,'Runner length changed to automatic to fit the back clearance.');
 if(!Number.isFinite(c.drawerBottom)||c.drawerBottom<6||c.drawerBottom>12)set('drawerBottom',6,'Drawer floor reset to the 6 mm starter.');
 if(!Number.isFinite(c.drawerBoxHeight)||c.drawerBoxHeight<60||c.drawerBoxHeight>400)set('drawerBoxHeight',140,'Box height now fits automatically, up to 140 mm.');
 const topMin=Math.max(120,c.thickness+84),lastMin=Math.max(topMin,(c.bottomDado?c.bottomLift:0)+c.thickness+82);
 const maxCount=[4,3,2,1].find(n=>c.height-4-2*(n-1)>=(n-1)*topMin+lastMin)||1;
 set('drawerCount',Math.max(1,Math.min(maxCount,Math.round(c.drawerCount)||3)),maxCount<(c.drawerCount||3)?'Drawer quantity reduced to fit the available height.':undefined);
 const n=c.drawerCount,usable=c.height-4-2*(n-1),equal=usable/n;let remaining=usable,balanced=false;
 for(let i=1;i<n;i++){const k='drawerFront'+i,wanted=Number.isFinite(c[k])&&c[k]>0?c[k]:equal,max=remaining-lastMin-(n-1-i)*topMin,h=Math.max(topMin,Math.min(wanted,max));if(Math.abs(h-wanted)>.001){c[k]=h;balanced=true;}else if(!Number.isFinite(c[k])||c[k]<0)c[k]=0;remaining-=h;}
 if(balanced)notes.push('Front heights balanced to keep every drawer usable; the last fills the remainder.');
 if(!['top_center','middle_center','bottom_center'].includes(c.drawerHandlePosition))set('drawerHandlePosition','top_center');
 let p;try{p=drawerPlan(c);}catch{return {cabinet:c,notes};}
 if(c.handle!=='none'){
  const short=Math.min(...p.heights),diam=c.handleDiameter||5,span=c.handle==='vertical'?short:c.width-4;
  const edge=Math.max(15,Math.min(c.handleEdge||40,(short-diam-20)/2));set('handleEdge',edge,'Handle setback adjusted to fit the drawer fronts.');
  if(c.handle!=='knob'){const limit=c.handle==='vertical'?short-2*edge-diam:p.inner-30-diam;if(c.handlePitch>limit||c.handlePitch<1){const pitch=[320,256,224,192,160,128,96,64,32].find(x=>x<=limit);if(pitch)set('handlePitch',pitch,'Handle spacing adjusted to fit the fronts.');else set('handle','knob','Handle changed to one-hole fixing for this narrow front.');}}
 }
 // Keep carcass edits; drawer geometry changes invalidate only drawer-specific overrides.
 const edits=c.featureEdits||{operations:{},bands:{}};if(['frontMode','style','width','depth','height','thickness','back','bottomLift','bottomDado','backInset','backGroove','clearance'].includes(key)||key.startsWith('drawer'))for(const group of ['operations','bands'])for(const id of Object.keys(edits[group]||{}))if(id.includes('Drawer '))delete edits[group][id];c.featureEdits=edits;
 try{cabinetParts(c);}catch(e){if(/handle/i.test(e.message)&&c.handle!=='none'){
  const original={handle:c.handle,position:c.drawerHandlePosition,edge:c.handleEdge};let fitted=false;
  outer:for(const handle of [...new Set([c.handle,'knob'])])for(const position of ['top_center','middle_center','bottom_center'])for(const edge of [30,40,25,50,20,60]){const trial={...c,handle,drawerHandlePosition:position,handleEdge:edge};try{cabinetParts(trial);Object.assign(c,trial);fitted=true;break outer;}catch{}}
  if(fitted)notes.push(c.handle!==original.handle?'Handle changed to one-hole fixing to clear the drawer box.':'Handle setback and placement adjusted to clear the drawer box.');
 }}

 return {cabinet:c,notes};
}
export function detachProjectDefaults(s){for(const r of s.cabinets)r.config.inheritGlobals=false;s.independentCabinets=true;s.cabinet=s.cabinets.find(r=>r.id===s.activeCabinetId).config;return s;}

function shortLimit(c,p){return Math.min(...p.heights)-2*25-(c.handleDiameter||5);}
