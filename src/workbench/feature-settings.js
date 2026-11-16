import {commonValues,setCommonGroup} from './project-settings.js';
import {syncProject} from './project.js';
export function featureSettingsValues(state,kind){
 if(kind==='suspension')return commonValues(state,'wallSuspension');
 if(kind==='joinery')return commonValues(state,'joinery',state.cabinet.style);
 if(kind==='glass')return Object.fromEntries(['doorStyle','doorThickness','glassFrame','glassThickness'].map(k=>[k,state.cabinet[k]]));
 throw Error('Choose an editable feature family.');
}
export function featureSettingsFields(state,kind,v){
 const n=(key,label,min=0,max=100000)=>({key,label,min,max}),check=(key,label)=>({key,label,check:true}),select=(key,label,options)=>({key,label,options});
 if(kind==='suspension')return [
 select('wallHanger','Wall hanger',[['none','None / other mounting'],['blum_48n0510','Blum 48N0510 · screw-on pair']]),
 ...(v.wallHanger!=='none'?[check('wallRailNotches','Notch sides for wall rail'),...(v.wallRailNotches?[n('wallRailHeight','Rail height (mm)',1,1000),n('wallRailProjection','Rail projection from wall (mm)',.1,100),n('wallRailClearance','Rail clearance (mm)',0,5)]:[])]:[])
 ];
 if(kind==='joinery')return [check('assembly','Assembly connectors'),...(v.assembly?[
 select('assemblyConnector','Connector system',[['screws','Screws · clearance and edge pilots'],['cabineo8','Lamello Cabineo 8'],['cabineo12','Lamello Cabineo 12']]),
 ...(v.assemblyConnector==='screws'?[n('screwPilot','Edge pilot diameter (mm)',1,10),n('screwClearance','Side clearance diameter (mm)',1,20),n('screwDepth','Edge pilot depth (mm)',1,100),n('screwSetback','Assembly end setback (mm)',1,1000)]:[n('cabineoSetback','Connector end setback (mm)',20,300)])]:[]),
 check('backGroove','Capture back in grooves'),n('backInset','Back inset from rear (mm)',3,1000),{...check('bottomDado','Bottom in dados'),disabled:v.assembly&&v.assemblyConnector!=='screws'},n('bottomLift','Bottom lift (mm)',0,1000),n('grooveDepth','Groove depth (mm)',.1,37),n('clearance','Total groove clearance (mm)',0,1)];
 if(kind==='glass')return [select('doorStyle','Door style',[['slab','Solid slab'],['glass','Glass in wooden frame']]),n('doorThickness','Door thickness (mm)',6,40),...(v.doorStyle==='glass'?[n('glassFrame','Frame width (mm)',50,150),n('glassThickness','Glass thickness (mm)',3,6)]:[])];
 return [];
}
// Validate a complete draft before committing any settings or manufacturing state.
export function withFeatureSettings(state,kind,values){
 const next=structuredClone(state);
 if(kind==='suspension'){
  setCommonGroup(next,'wallSuspension',values);
 }else if(kind==='joinery')setCommonGroup(next,'joinery',values,next.cabinet.style);
 else if(kind==='glass')Object.assign(next.cabinet,values);
 else throw Error('Choose an editable feature family.');
 return syncProject(next);
}
