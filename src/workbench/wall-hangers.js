// Blum screw-on wall hanger pair 48N0510.03 (left) /48N0510.02 (right).
// Catalogue 2026, printed p.616: two screw centres 32 mm apart, 33 mm below top.
export const wallHangerDefaults={wallHanger:'none',wallRailNotches:false,wallRailHeight:30,wallRailProjection:5,wallRailClearance:1};
export const wallSuspensionApplies=c=>c.style==='Wall'||c.wallMounted===true;
export function checkedWallHanger(c){if(!['none','blum_48n0510'].includes(c.wallHanger??'none'))throw Error('Choose no wall hanger or the Blum 48N0510 screw-on pair.');if(c.style==='Wall'&&c.wallSuspensionEnabled===false||!wallSuspensionApplies(c)||c.wallHanger!=='blum_48n0510')return false;if(c.thickness<16)throw Error('Blum wall-hanger pilots require at least 16 mm cabinet stock.');if(c.hood&&c.hoodDuct&&c.hoodDuctPanel==='Back')throw Error('Check the hood duct against the wall hangers: use a side or top duct exit.');if(!c.backGroove||(c.backInset<19||c.backInset>31))throw Error('Blum wall hangers need a captured back inset of 19–31 mm. Selecting the hanger sets this automatically.');checkedWallRail(c);return true;}
export function wallHangerOperations(c,rows){if(!c.wallHanger||c.wallHanger==='none')return [];const ops=[],B=Object.fromEntries(rows.map(r=>[r[0],r.slice(1)])),back=B.Back;
 for(const left of [true,false]){for(const setback of [c.machining.backInset+14,c.machining.backInset+46])ops.push({type:'bore',part:left?'Left side':'Right side',label:'Blum wall hanger pilot',axis:0,sign:left?-1:1,point:[left?c.thickness:c.width-c.thickness,c.depth-setback,c.height-33],diameter:2.5,depth:10});ops.push({type:'pocket',part:'Back',label:'Wall hanger access notch',axis:1,sign:-1,box:[left?back[0]:back[0]+back[3]-18,back[1],back[2]+back[5]-41,18,back[4],41]});}return [...ops,...wallRailOperations({...c,clearance:c.machining.clearance,backInset:c.machining.backInset,bottomDado:c.machining.bottom,bottomLift:c.machining.bottomLift},rows)];}

// User-specified rail clearance envelope, not a manufacturer rail preset.
export function checkedWallRail(c,{fit=true}={}){
 const v={...wallHangerDefaults,...c};
 if(typeof v.wallRailNotches!=='boolean')throw Error('Choose whether to notch the sides for a wall rail.');
 for(const [key,min,max]of [['wallRailHeight',1,1000],['wallRailProjection',.1,100],['wallRailClearance',0,5]])if(!Number.isFinite(v[key])||v[key]<min||v[key]>max)throw Error(key+' must be '+min+'–'+max+' mm.');
 if(!fit||!v.wallRailNotches)return v;
 const depth=v.wallRailProjection+v.wallRailClearance;
 if(depth+2+(v.clearance??0)/2>v.backInset)throw Error('Wall rail notch reaches the captured-back groove. Reduce rail projection/clearance or increase back inset.');
 if(v.thickness+v.wallRailHeight+2*v.wallRailClearance>v.height-v.thickness-(v.bottomDado?v.bottomLift:0)-2)throw Error('Wall rail notch reaches the bottom panel. Reduce rail height or clearance.');
 return v;
}
export function wallRailOperations(c,rows){
 const v=checkedWallRail(c);if(!v.wallRailNotches)return [];
 const {wallRailHeight:h,wallRailProjection:d,wallRailClearance:gap}=v;
 return rows.filter(r=>/^(Left|Right) side$/.test(r[0])).map(([part,x,y,z,w,depth,height])=>({type:'pocket',part,label:'Wall rail clearance notch',axis:0,sign:part==='Left side'?-1:1,box:[x,y+depth-d-gap,z+height-v.thickness-h-2*gap,w,d+gap,h+2*gap]}));
}
