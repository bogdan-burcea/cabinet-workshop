// European TANDEM 560H/560F BLUMOTION, locking device T51.1700.04.
// Sources: Blum catalogue planning 446–447 / 454–455; fixing charts 476–477.
export const tandemDefaults={frontMode:'doors',drawerCount:3,drawerStock:18,drawerBottom:6,drawerRunner:'auto',drawerLength:0,drawerFront1:0,drawerFront2:0,drawerFront3:0,drawerBoxHeight:140,drawerHandlePosition:'top_center'};
export const tandemLengths=[250,270,300,350,400,450,500,550,600];
export const isDrawers=c=>c.frontMode==='drawers';
export function drawerPlan(c){
 const a={...tandemDefaults,...c},n=a.drawerCount,s=a.drawerStock,b=a.drawerBottom;
 const fail=message=>{throw Error('TANDEM drawers: '+message);};
 if(!Number.isInteger(n)||n<1||n>4)fail('Choose 1–4 drawers.');
 if(!Number.isFinite(s)||s<11||s>19)fail('Drawer stock must be 11–19 mm. 560H takes 11–16 mm; 560F takes 17–19 mm.');
 const family=a.drawerRunner==='auto'?(s<=16?'560H':'560F'):a.drawerRunner;
 if(!['560H','560F'].includes(family)||family==='560H'&&s>16||family==='560F'&&s<17||s>16&&s<17)fail('Runner and drawer stock do not match. Choose 560H for 11–16 mm or 560F for 17–19 mm.');
 if(!Number.isFinite(b)||b<6||b>12)fail('Drawer bottom thickness must be 6–12 mm.');
 if(!Number.isFinite(a.drawerBoxHeight)||a.drawerBoxHeight<60||a.drawerBoxHeight>400)fail('Maximum box height must be 60–400 mm.');
 const availableDepth=c.depth-c.back-(c.backGroove?c.backInset:0),length=a.drawerLength===0?[...tandemLengths].reverse().find(v=>v+3<=availableDepth):a.drawerLength;
 if(!tandemLengths.includes(length)||length+3>availableDepth)fail('Runner length must fit before the back panel: nominal length + 3 mm. Reduce runner length or increase body depth.');
 const inner=c.width-2*c.thickness-(family==='560H'?42:49),outer=inner+2*s,depth=length-10,x=(c.width-outer)/2;
 if(inner<120)fail('Drawer box is too narrow. Increase body width or reduce cabinet stock thickness.');
 const usable=c.height-4-2*(n-1),equal=usable/n,heights=[];let remain=usable;
 for(let i=0;i<n-1;i++){const specified=a['drawerFront'+(i+1)];if(!Number.isFinite(specified)||specified<0)fail('Front heights must be positive, or zero for equal share.');const h=specified||equal;heights.push(h);remain-=h;}heights.push(remain);
 if(heights.some(h=>h<100))fail('Each front needs at least 100 mm. Reduce earlier front heights or drawer quantity; the last front fills the remaining height.');
 if(!['top_center','middle_center','bottom_center'].includes(a.drawerHandlePosition))fail('Choose top, middle or bottom centre handle placement.');
 const groove=4,recess=13,clear=c.clearance??.2,floor=(c.bottomDado?c.bottomLift:0)+c.thickness,boxes=[];let top=c.height-2;
 for(let i=0;i<n;i++){const h=heights[i],z=top-h,baseline=Math.max(z+2,floor+2),bottomZ=baseline+27.5,sideZ=bottomZ-recess,maxTop=Math.min(top-7,c.height-c.thickness-7),boxHeight=Math.min(a.drawerBoxHeight,maxTop-sideZ);
  if(boxHeight<60||bottomZ+b>sideZ+boxHeight-10)fail('Drawer '+(i+1)+' has too little box clearance. Increase its front height, reduce drawer quantity or reduce bottom lift.');
  boxes.push({index:i+1,frontZ:z,frontHeight:h,sideZ,bottomZ,height:boxHeight,fixingZ:baseline+37});top=z-2;
 }
 return {family,length,partNumber:family+length+'0B',inner,outer,depth,x,stock:s,bottom:b,groove,recess,clear,heights,boxes,capacity:30};
}
export function tandemRows(c){const p=drawerPlan(c),rows=[],s=p.stock;for(const a of p.boxes){const pre='Drawer '+a.index+' ',z=a.sideZ,top=z+a.height;
 rows.push([pre+'overlay front',2,-20,a.frontZ,c.width-4,18,a.frontHeight],
 [pre+'left side',p.x,0,z,s,p.depth,a.height],[pre+'right side',p.x+p.outer-s,0,z,s,p.depth,a.height],
 [pre+'internal front',p.x+s,0,z,p.inner,s,a.height],
 [pre+'back',p.x+s,p.depth-s,a.bottomZ+p.bottom,p.inner,s,top-a.bottomZ-p.bottom],
 [pre+'bottom',p.x+s-p.groove+p.clear/2,s-p.groove+p.clear/2,a.bottomZ,p.inner+2*p.groove-p.clear,p.depth-s+p.groove-p.clear/2,p.bottom]);
 }return rows;}
// Manufacturer fixing positions used with Ø4 x 15 chipboard screws. Pilot Ø2.5 x10.
export function tandemFixings(length){return length<=270?[37,69,197]:length<=350?[37,69,261]:length===400?[37,69,229]:length===600?[37,69,261,325]:[37,69,261];}
export function tandemOperations(c,rows){const p=drawerPlan(c),B=Object.fromEntries(rows.map(r=>[r[0],r.slice(1)])),ops=[];
 const bore=(part,label,axis,point,sign,diameter,depth)=>ops.push({type:'bore',part,label,axis,point,sign,diameter,depth});
 if(c.thickness<16)throw Error('TANDEM runner pilots need cabinet stock of at least 16 mm for the specified Ø4 × 15 mm fixing screws.');
 for(const a of p.boxes){const pre='Drawer '+a.index+' ',floor=B[pre+'bottom'];
  for(const [suffix,axis,sign]of [['left side',0,-1],['right side',0,1],['internal front',1,-1]]){const name=pre+suffix,r=B[name],box=[...r.slice(0,3),...r.slice(3)];box[2]=floor[2]-p.clear/2;box[5]=p.bottom+p.clear;box[axis]=sign<0?r[axis]+r[axis+3]-p.groove:r[axis];box[axis+3]=p.groove;ops.push({type:'pocket',part:name,label:'Drawer bottom groove',axis,sign,box});}
  for(const left of [true,false])for(const y of tandemFixings(p.length))bore(left?'Left side':'Right side','TANDEM '+p.family+' runner pilot',0,[left?c.thickness:c.width-c.thickness,y,a.fixingZ],left?-1:1,2.5,10);
  const f=B[pre+'internal front'],face=B[pre+'overlay front'];for(const x of [f[0]+35,f[0]+f[3]-35]){const z=a.sideZ+a.height*.65;bore(pre+'internal front','Drawer front fixing clearance',1,[x,f[1]+f[4],z],-1,4,f[4]);bore(pre+'overlay front','Drawer front fixing pilot',1,[x,face[1]+face[4],z],-1,2.5,10);}
 }return ops;}
export function tandemHardware(c){if(!isDrawers(c))return [];const p=drawerPlan(c),n=c.drawerCount;return [[c.name,p.partNumber,'Left runner',n],[c.name,p.partNumber,'Right runner',n],[c.name,'T51.1700.04','Left locking device',n],[c.name,'T51.1700.04','Right locking device',n],[c.name,'Ø4 × 15 mm','Runner chipboard screws',2*n*tandemFixings(p.length).length]];}
export function tandemGuide(c){if(!isDrawers(c))return '';const p=drawerPlan(c);return `${c.name}: ${c.drawerCount} drawers, ${p.family} BLUMOTION 30 kg, NL ${p.length} mm.\nBox internal width ${p.inner} mm; external width ${p.outer} mm; length ${p.depth} mm. ${p.stock} mm walls, ${p.bottom} mm bottom, 13 mm bottom recess, 4 mm groove depth.\nThe rear panel sits on the extended drawer bottom; it has no bottom groove. Glue and secure the rear to the sides and floor using a suitable assembly method. Front fixing pilots and clearances are included in the flat programs.\nREQUIRED SECONDARY PREPARATION, NOT IN THE FLAT NC:\nFit left/right T51.1700.04 locking devices using Blum template T65.1000.02. Prepare rear hook bores Ø6 x 10 mm and rear runner clearances according to the matching Blum drawing/template after cutting the box parts. Do not skip the hook engagement or substitute through holes. Clip and hook operations are manual/jig steps in this release.\nTrial-fit one complete drawer on the actual runners before batch machining. Hardware capacity is not a rating for the wooden box or bottom. No TIP-ON, stabiliser, inset drawer front or inner-drawer application is inferred.\nReferences: https://publications.blum.com/2026/catalogue/en/455/ and https://publications.blum.com/2026/catalogue/en/477/\n`;}
export function hardwareCsv(cabinets){const rows=[['Cabinet','Part number','Description','Quantity'],...cabinets.flatMap(r=>tandemHardware(r.config||r))];return rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}
