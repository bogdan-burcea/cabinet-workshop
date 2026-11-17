import {golaPositions,golaNoTop} from './gola.js';
import {isPreserved,localGroupValues,setScopedGroup} from './instance-settings.js';
import {commonValues} from './project-settings.js';
import {syncProject} from './project.js';
export function featureSettingsValues(state,kind){
 if(kind==='gola')return {...(isPreserved(state.cabinet)?localGroupValues(state.cabinet,'handles'):commonValues(state,'handles',state.cabinet.style)),golaSharedPair:state.cabinet.golaSharedPair??0};
 if(kind==='suspension')return isPreserved(state.cabinet)?localGroupValues(state.cabinet,'wallSuspension'):commonValues(state,'wallSuspension');
 if(kind==='joinery')return isPreserved(state.cabinet)?localGroupValues(state.cabinet,'joinery'):commonValues(state,'joinery',state.cabinet.style);
 if(kind==='drawerFrame')return Object.fromEntries(['drawerFrontStyle','drawerInset','doorThickness','glassFrame','shakerThickness'].map(k=>[k,state.cabinet[k]]));
 if(kind==='glass')return Object.fromEntries(['doorStyle','doorThickness','glassFrame','glassThickness','shakerThickness'].map(k=>[k,state.cabinet[k]]));
 throw Error('Choose an editable feature family.');
}
export function featureSettingsFields(state,kind,v){
 const n=(key,label,min=0,max=100000)=>({key,label,min,max}),check=(key,label)=>({key,label,check:true}),select=(key,label,options)=>({key,label,options});
 if(kind==='gola')return [{...select('golaPosition','Door rail position',golaPositions(state.cabinet)),...(v.golaPosition==='top'&&!golaPositions(state.cabinet).some(([p])=>p==='top')?{value:'bottom'}:{})},n('golaHeight','Rail height / width (mm)',30,100),n('golaDepth','Rail recess depth (mm)',15,60),n('golaGap','Finger gap (mm)',15,50),n('golaWall','Aluminium wall thickness (mm)',1,4),...((state.cabinet.frontMode==='drawers'&&!golaNoTop(state.cabinet)||state.cabinet.split&&!state.cabinet.fullDoor&&state.cabinet.lowerType==='drawers')?[select('golaSharedPair','Shared drawer rail',[[0,'Separate rail for each drawer'],...Array.from({length:Math.max(0,(state.cabinet.split?state.cabinet.lowerDrawers:state.cabinet.drawerCount)-1)},(_,i)=>[i+1,'Drawers '+(i+1)+' & '+(i+2)+' · upper pulls from bottom'])])]:[])];
 if(kind==='drawerFrame')return [check('drawerInset','Inset drawer fronts'),select('drawerFrontStyle','Drawer front style',[['slab','Solid slab'],['shaker','Shaker']]),n('glassFrame','Door & drawer frame width (mm)',50,150),n('shakerThickness','Shaker panel thickness (mm)',3,18),n('doorThickness','Front thickness (mm)',16,30)];
 if(kind==='suspension')return [
 select('wallHanger','Wall hanger',[['none','None / other mounting'],['blum_48n0510','Blum 48N0510 · screw-on pair']]),

 {...check('wallRailNotches','Notch sides for wall rail'),disabled:v.wallHanger==='none'},...['wallRailHeight','wallRailProjection','wallRailClearance'].map((key,i)=>({...n(key,['Rail height (mm)','Rail projection from wall (mm)','Rail clearance (mm)'][i],[1,.1,0][i],[1000,100,5][i]),disabled:v.wallHanger==='none'||!v.wallRailNotches}))
 ];
 if(kind==='joinery')return [{...select('assemblyConnector','Connector system',[['none','None'],['screws','Screws · clearance and edge pilots'],['cabineo8','Lamello Cabineo 8'],['cabineo12','Lamello Cabineo 12']]),value:v.assembly?v.assemblyConnector:'none'},{...check('bottomDado','Bottom in dados'),disabled:v.assembly&&v.assemblyConnector!=='screws'},...(v.assembly?[
 ...(v.assemblyConnector==='screws'?[n('screwPilot','Edge pilot diameter (mm)',1,10),n('screwClearance','Side clearance diameter (mm)',1,20),n('screwDepth','Edge pilot depth (mm)',1,100),n('screwSetback','Assembly end setback (mm)',1,1000)]:[n('cabineoSetback','Connector end setback (mm)',20,300)])]:[]),
 select('backConnector','Back panel connector',[['none','None'],['hafele_26009765','Häfele Ixconnect · 260.09.765']]),...(v.backConnector!=='none'?[n('backConnectorsPerSide','Connectors per vertical side',1,20)]:[]),{...check('backGroove','Capture back in grooves'),disabled:v.backConnector==='hafele_26009765'},n('backInset','Back inset from rear (mm)',3,1000),n('bottomLift','Bottom lift (mm)',0,1000),n('grooveDepth','Groove depth (mm)',.1,37),n('clearance','Total groove clearance (mm)',0,1)];
 if(kind==='glass')return [select('doorStyle','Door style',[['slab','Solid slab'],['glass','Glass in wooden frame'],['shaker','Shaker · recessed panel']]),n('doorThickness','Door thickness (mm)',6,40),...(['glass','shaker'].includes(v.doorStyle)?[n('glassFrame','Frame width (mm)',50,150),v.doorStyle==='shaker'?n('shakerThickness','Panel thickness (mm)',3,18):n('glassThickness','Glass thickness (mm)',3,6)]:[])];
 return [];
}
// Validate a complete draft before committing any settings or manufacturing state.
export function withFeatureSettings(state,kind,values){
 const next=structuredClone(state);
 if(kind==='gola'){const {golaSharedPair,...shared}=values;setScopedGroup(next,'handles',shared,next.cabinet.style);if(golaSharedPair!==undefined)next.cabinet.golaSharedPair=Number(golaSharedPair);}
 else if(kind==='suspension'){
  setScopedGroup(next,'wallSuspension',values);
 }else if(kind==='joinery')setScopedGroup(next,'joinery',values.assemblyConnector==='none'?{...values,assembly:false,assemblyConnector:'screws'}:values,next.cabinet.style);
 else if(kind==='glass'||kind==='drawerFrame')Object.assign(next.cabinet,values);
 else throw Error('Choose an editable feature family.');
 return syncProject(next);
}
