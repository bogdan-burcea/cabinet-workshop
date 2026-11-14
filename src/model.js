import {tandemRows} from './workbench/tandem.js';
import {frameDoorParts} from './workbench/glass-frame.js';
import {machineSettings,machiningActive,adjustPanels,localMachining,transformOperation} from './machining.js';
export const WALLS=['North','East','South','West','Free'];
export const FRONTS=['Open','One door','Two doors','1 drawer','2 drawers','3 drawers','4 drawers'];
export const CABINETS=['Base','Wall','Tall','Blind corner'];
export const FIXTURES=['Sink','Hob'];
export const isFixture=c=>FIXTURES.includes(c.kind);
export const FINISHING=['Filler','End panel'];
export const isFinish=c=>FINISHING.includes(c.kind);
export const isBase=c=>['Base','Blind corner'].includes(c.kind);
export const APPLIANCES=['Fridge','Dishwasher','Cooker'];
export const isCab=c=>CABINETS.includes(c.kind);
export const isOpening=c=>['Door','Window'].includes(c.kind);
export const objects=p=>[...p.cabinets,...p.appliances,...p.openings,...p.worktops,...(p.finishing||[]),...(p.fixtures||[])];
export function collection(p,c){return isFixture(c)?p.fixtures:isFinish(c)?p.finishing:isCab(c)?p.cabinets:APPLIANCES.includes(c.kind)?p.appliances:isOpening(c)?p.openings:p.worktops}
export const uid=()=>crypto.randomUUID().replaceAll('-','');
export function create(kind,wall='North'){
 const c={id:uid(),label:kind+(isCab({kind})?' cabinet':''),kind,width:600,height:720,depth:560,elevation:150,wall,offset:0,x:1000,y:1000,rotation:0};
 if(isCab(c))Object.assign(c,{front:'Two doors',rail_width:100,shelves:kind==='Tall'?4:kind==='Wall'?2:1,thickness:18,back:6,height:kind==='Tall'?2100:720,depth:kind==='Wall'?320:560,elevation:kind==='Wall'?1500:150});
 if(kind==='Blind corner')Object.assign(c,{width:1050,front:'One door',blind_side:'Left',blind_width:600,return_clearance:50});
 if(isFinish(c))Object.assign(c,{width:kind==='Filler'?50:18,depth:kind==='Filler'?18:580,height:kind==='Filler'?720:870,elevation:kind==='Filler'?150:0,setback:kind==='Filler'?562:0});
 else if(isOpening(c))Object.assign(c,{width:kind==='Door'?900:1200,height:kind==='Door'?2100:1000,depth:kind==='Door'?900:100,elevation:kind==='Door'?0:1100,wall:wall==='Free'?'North':wall});
 else if(kind==='Worktop')Object.assign(c,{width:1200,height:38,depth:600,elevation:870});
 else if(APPLIANCES.includes(kind))Object.assign(c,{height:kind==='Fridge'?2000:kind==='Dishwasher'?820:870,depth:kind==='Fridge'?650:kind==='Dishwasher'?580:600,elevation:0});
 return c;
}
export function empty(){return {schema:4,title:'My kitchen',room:{width:4800,depth:3600,height:2600},cabinets:[],appliances:[],openings:[],worktops:[],finishing:[],fixtures:[]}}
export function frame(p,c){if(isFixture(c))return frame(p,fixtureTop(p,c));const {width:w,depth:d}=p.room,o=c.offset;
 const f={North:[o,0,1,0,0,1],East:[w,o,0,1,-1,0],South:[w-o,d,-1,0,0,-1],West:[0,d-o,0,-1,1,0]};
 if(c.wall!=='Free')return f[c.wall];
 const uv={0:[1,0,0,1],90:[0,1,-1,0],180:[-1,0,0,-1],270:[0,-1,1,0]};return [c.x,c.y,...uv[c.rotation]];
}
export function oriented(p,c,row){const [name,u,v,z,w,d,h]=row,[ox,oy,ux,uy,vx,vy]=frame(p,c);
 const pts=[u,u+w].flatMap(a=>[v,v+d].map(b=>[ox+ux*a+vx*b,oy+uy*a+vy*b]));
 const xs=pts.map(a=>a[0]),ys=pts.map(a=>a[1]);return [name,Math.min(...xs),Math.min(...ys),c.elevation+z,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),h];
}
export function panels(p,c,local=false){
 if(isFixture(c))return fixturePanels(p,c);
 if(!isCab(c)){
  if(isFinish(c))return [oriented(p,c,[c.kind,0,c.setback,0,c.width,c.depth,c.height])];
  if(isOpening(c)){const t=Math.min(35,c.width/6,c.height/6),w=c.width,h=c.height;
   const rows=[['Left frame',0,0,0,t,30,h],['Right frame',w-t,0,0,t,30,h],['Top frame',t,0,h-t,w-2*t,30,t]];
   if(c.kind==='Window')rows.push(['Bottom frame',t,0,0,w-2*t,30,t]);rows.push([c.kind==='Window'?'Glass':'Door leaf',t,10,t,w-2*t,10,h-2*t]);return rows.map(r=>oriented(p,c,r));
  }return [oriented(p,c,[c.kind,0,0,0,c.width,c.depth,c.height])];
 }
 const w=c.width,h=c.height,d=c.depth,t=c.thickness,b=c.back,cd=d-b,r=c.rail_width??100;
 const rows=[['Left side',0,0,0,t,cd,h],['Right side',w-t,0,0,t,cd,h],['Bottom',t,0,0,w-2*t,cd,t]];
 if((c.top_construction??(isBase(c)?'rails':'full'))==='rails')rows.push(['Front rail',t,0,h-t,w-2*t,r,t],['Rear rail',t,cd-r,h-t,w-2*t,r,t]);
 else rows.push(['Top',t,0,h-t,w-2*t,cd,t]);
 rows.push(['Back',0,cd,0,w,b,h]);
 const count=c.front.includes('drawer')?Number(c.front[0]):0;
 if(!count){const n=c.shelves,gap=(h-2*t-n*18)/(n+1);for(let i=1;i<=n;i++)rows.push(['Shelf '+i,t,20,t+i*gap+(i-1)*18,w-2*t,cd-20,18]);}
 if(c.kind==='Blind corner'){
  const left=c.blind_side==='Left',blindX=left?2:w-c.blind_width,doorX=left?c.blind_width+2:2;
  rows.push(['Blind front',blindX,-20,2,c.blind_width-2,18,h-4]);
  if(c.front==='One door')rows.push(['Access door',doorX,-20,2,w-c.blind_width-4,18,h-4]);
 }
 else if(c.front==='One door')rows.push(['Door',2,-20,2,w-4,18,h-4]);
 if(c.front==='Two doors'){const dw=(w-6)/2;rows.push(['Door left',2,-20,2,dw,18,h-4],['Door right',4+dw,-20,2,dw,18,h-4]);}
 if(count&&!c.tandem){const fh=(h-4-(count-1)*2)/count,dep=Math.min(450,cd-10),x=t+12.7,bw=w-2*t-25.4;
  for(let i=0;i<count;i++){const prefix='Drawer '+(i+1)+' ',fz=2+i*(fh+2),base=fz+10+(i===0?t-2:0),wh=i===count-1?75:120,z=base+6;
   if(z+wh>Math.min(fz+fh-10,h-t-10)+1e-7)throw Error('Drawer boxes are too tall for these fronts. Increase cabinet height or reduce drawer count.');
   rows.push([prefix+'overlay front',2,-20,fz,w-4,18,fh],[prefix+'left side',x,0,z,12,dep,wh],[prefix+'right side',x+bw-12,0,z,12,dep,wh],[prefix+'internal front',x+12,0,z,bw-24,12,wh],[prefix+'back',x+12,dep-12,z,bw-24,12,wh],[prefix+'bottom',x,0,base,bw,dep,6]);
  }
 }
 const adjusted=adjustPanels(c,rows);if(c.tandem)adjusted.push(...tandemRows(c.tandem));rows.splice(0,rows.length,...adjusted);
 if(w<=2*t||h<=2*t||cd<=0||b<=0||t<=0)throw Error('Panel thickness leaves no usable cabinet space.');
 if((c.top_construction??(isBase(c)?'rails':'full'))==='rails'&&cd<=2*r)throw Error('Base depth must leave space between its two support rails.');
 if(!count&&c.shelves&&(h-2*t<=c.shelves*18||cd<=20))throw Error('The shelves do not fit. Increase the cabinet size or reduce shelf quantity.');
 if(rows.some(r=>r.slice(4).some(v=>v<=0||!Number.isFinite(v))))throw Error('These dimensions leave an empty or invalid panel.');
 if(local)return rows;
 return rows.map(([name,x,y,z,w,dep,h])=>oriented(p,c,[name,x,d-y-dep,z,w,dep,h]));
}
export function bounds(p,c){const boxes=panels(p,c);return [1,2,3].map(i=>Math.min(...boxes.map(b=>b[i]))).concat([1,2,3].map(i=>Math.max(...boxes.map(b=>b[i]+b[i+3]))));}
export function clearance(p,c){const [,x,y,z,w,d,h]=oriented(p,c,['Clearance',0,0,0,c.width,c.depth,c.height]);return [x,y,z,x+w,y+d,z+h]}
export function blindZones(p,c){
 const left=c.blind_side==='Left',boxes=[['Return clearance',left?0:c.width-c.blind_width,c.depth+20,0,c.blind_width,c.return_clearance,c.height],['Door access',left?c.blind_width:0,c.depth+20,0,c.width-c.blind_width,Math.min(500,c.width-c.blind_width),c.height]];
 return boxes.map(row=>{const [name,x,y,z,w,d,h]=oriented(p,c,row);return {name,box:[x,y,z,x+w,y+d,z+h]};});
}
export const overlaps=(a,b)=>[0,1,2].every(i=>Math.min(a[i+3],b[i+3])-Math.max(a[i],b[i])>.1);
export function issues(p){const result=[],solid=[...p.cabinets,...p.appliances,...p.worktops,...(p.finishing||[])],bb=new Map(solid.map(c=>[c.id,bounds(p,c)]));const room=[p.room.width,p.room.depth,p.room.height];
 solid.forEach((c,i)=>{const a=bb.get(c.id);if([0,1,2].some(j=>a[j]<-.1||a[j+3]>room[j]+.1))result.push({text:c.label+': outside the room',id:c.id});for(const o of solid.slice(0,i))if(overlaps(a,bb.get(o.id)))result.push({text:c.label+' overlaps '+o.label,id:c.id});});
 for(const c of p.cabinets.filter(c=>c.kind==='Blind corner'))for(const zone of blindZones(p,c))for(const other of solid){
  if(other.id===c.id||other.kind==='Worktop'||(zone.name==='Return clearance'&&isFinish(other)))continue;
  if(overlaps(zone.box,bb.get(other.id)))result.push({text:other.label+(zone.name==='Return clearance'?' crowds return clearance of ':' blocks door access to ')+c.label,id:other.id});
 }
 p.openings.forEach((o,i)=>{const length=['North','South'].includes(o.wall)?p.room.width:p.room.depth;
 if(o.offset<0||o.offset+o.width>length+.1||o.elevation+o.height>p.room.height+.1)result.push({text:o.label+': opening extends beyond its wall',id:o.id});const zone=clearance(p,o);
 if([0,1].some(j=>zone[j]<-.1||zone[j+3]>room[j]+.1))result.push({text:o.label+': clearance extends outside the room',id:o.id});
 for(const c of solid)if(overlaps(zone,bb.get(c.id)))result.push({text:c.label+' blocks '+o.label+' clearance',id:c.id});
 for(const other of p.openings.slice(0,i))if(o.wall===other.wall&&Math.min(o.offset+o.width,other.offset+other.width)-Math.max(o.offset,other.offset)>.1&&Math.min(o.elevation+o.height,other.elevation+other.height)-Math.max(o.elevation,other.elevation)>.1)result.push({text:o.label+' overlaps opening '+other.label,id:o.id});
 });result.push(...fixtureChecks(p));return result;
}
export function validate(data){if(!data||![1,2,3,4].includes(data.schema)||!data.room||!Array.isArray(data.cabinets))throw Error('Choose a Kitchen Planner v0.1, v0.2 or browser project JSON file.');
 const p=structuredClone(data);
 if(p.nesting!==undefined){const n=p.nesting;if(!n||typeof n!=='object'||Array.isArray(n))throw Error('Invalid nesting settings.');for(const key of ['stock','parts','groups'])if(n[key]!==undefined&&(!n[key]||typeof n[key]!=='object'||Array.isArray(n[key])))throw Error('Invalid nesting '+key+'.');for(const entry of Object.values(n.parts||{}))if(!entry||typeof entry!=='object'||(entry.material!==undefined&&(typeof entry.material!=='string'||!entry.material.trim()||entry.material.length>80))||(entry.grain!==undefined&&typeof entry.grain!=='boolean'))throw Error('Invalid part material or orientation.');for(const stock of [n.stock,...Object.values(n.groups||{})].filter(s=>s!==undefined)){if(!stock||typeof stock!=='object'||Array.isArray(stock))throw Error('Invalid stock settings.');for(const key of ['width','height','margin','gap'])if(stock[key]!==undefined&&(!Number.isFinite(stock[key])||stock[key]<0||stock[key]>100000))throw Error('Invalid stock '+key+'.');}}
 p.schema=4;p.title=typeof p.title==='string'?p.title.slice(0,100):'Imported kitchen';
 for(const k of ['appliances','openings','worktops','finishing','fixtures']){p[k]??=[];if(!Array.isArray(p[k]))throw Error('Invalid project collection.');}
 for(const v of Object.values(p.room))if(typeof v!=='number'||!Number.isFinite(v)||v<500||v>100000)throw Error('Room dimensions must be 500–100,000 mm.');
 for(const key of ['width','depth','height'])if(!Number.isFinite(p.room[key]))throw Error('Missing room dimension.');
 const ids=new Set();if(objects(p).length>500)throw Error('This development version supports up to 500 objects.');
 for(const list of [p.cabinets,p.appliances,p.openings,p.worktops,p.finishing,p.fixtures])for(const c of list){
  if(!c||typeof c.id!=='string'||ids.has(c.id)||!c.id||typeof c.label!=='string'||!c.label.trim()||c.label.length>200)throw Error('An object has an invalid name or ID.');ids.add(c.id);
  if(isFixture(c)){
   if(list!==p.fixtures||typeof c.worktop_id!=='string'||!p.worktops.some(t=>t.id===c.worktop_id))throw Error('Every sink or hob must be attached to an existing worktop.');
   for(const key of ['offset_u','offset_v','width','depth','cutout_width','cutout_depth','body_width','body_depth','body_drop','edge_clearance'])if(typeof c[key]!=='number'||!Number.isFinite(c[key])||c[key]<0||c[key]>100000)throw Error('Invalid '+key+' in '+c.label+'.');
   if(Math.min(c.width,c.depth,c.cutout_width,c.cutout_depth,c.body_width,c.body_depth)<20||c.body_drop<1||c.edge_clearance>500)throw Error('Fixture sizes must be at least 20 mm; body drop must be positive.');
   if(c.cutout_width>c.width||c.cutout_depth>c.depth||c.body_width>c.cutout_width||c.body_depth>c.cutout_depth)throw Error('The body must fit inside the cutout, and the cutout inside the overall fixture.');
   continue;
  }
  if(list===p.fixtures)throw Error('Only sinks and hobs belong in the fixture collection.');
  if(![...CABINETS,...APPLIANCES,...FINISHING,'Door','Window','Worktop'].includes(c.kind)||!WALLS.includes(c.wall)||![0,90,180,270].includes(c.rotation))throw Error('Invalid object type or placement.');
  if((list===p.cabinets&&!isCab(c))||(list===p.openings&&!isOpening(c))||(list===p.appliances&&!APPLIANCES.includes(c.kind))||(list===p.worktops&&c.kind!=='Worktop')||(list===p.finishing&&!isFinish(c)))throw Error('Object is in the wrong collection.');
  if(isOpening(c)&&c.wall==='Free')throw Error('Openings must be attached to a wall.');
  for(const key of ['width','height','depth','elevation','offset','x','y'])if(typeof c[key]!=='number'||!Number.isFinite(c[key])||Math.abs(c[key])>100000)throw Error('Invalid '+key+' in '+c.label+'.');
  if(c.width<(isFinish(c)?6:100)||c.height<1||c.depth<(c.kind==='Filler'?6:10)||c.elevation<0||c.offset<0)throw Error('Dimensions or placement values are outside their allowed range.');
  if(isCab(c)){if(!FRONTS.includes(c.front)||!Number.isInteger(c.shelves)||c.shelves<0||c.shelves>20||!Number.isFinite(c.thickness)||c.thickness<6||c.thickness>40||!Number.isFinite(c.back)||c.back<3||c.back>30)throw Error('Invalid cabinet construction settings.');}
  if(isFinish(c)&&(!Number.isFinite(c.setback)||c.setback<0||c.setback>100000))throw Error('Invalid finishing panel distance from wall.');
  if(c.kind==='Filler'&&(c.width<10||c.width>300||c.depth<6||c.depth>40))throw Error('Fillers need a 10–300 mm width and 6–40 mm panel thickness.');
  if(c.kind==='End panel'&&(c.width<6||c.width>40))throw Error('End panel thickness must be 6–40 mm.');
  if((c.top_construction??(isBase(c)?'rails':'full'))==='rails'&&(!Number.isFinite(c.rail_width??100)||(c.rail_width??100)<20||(c.rail_width??100)>200))throw Error('Support rail width must be 20–200 mm.');
  if(c.kind==='Blind corner'){
   if(!['Left','Right'].includes(c.blind_side)||!Number.isFinite(c.blind_width)||c.blind_width<100||c.width-c.blind_width-4<200)throw Error('Leave at least 200 mm for the access door after the blind section and reveals.');
   if(!['Open','One door'].includes(c.front))throw Error('Blind corners support an open access section or one door.');
   if(!Number.isFinite(c.return_clearance)||c.return_clearance<0||c.return_clearance>300)throw Error('Return clearance must be 0–300 mm.');
  }
  panels(p,c);if(isCab(c)&&machiningActive(c))localMachining(c,panels(p,c,true));
 }return p;
}
export function place(p,c){if(c.wall==='Free')return;const len=['North','South'].includes(c.wall)?p.room.width:p.room.depth,original=c.offset;
 const blockers=[...p.cabinets,...p.appliances,...(p.finishing||[])].filter(o=>o.id!==c.id).map(o=>bounds(p,o)).concat(p.openings.filter(o=>o.id!==c.id).map(o=>clearance(p,o)),p.cabinets.filter(o=>o.kind==='Blind corner'&&o.id!==c.id).flatMap(o=>blindZones(p,o).map(z=>z.box)));
 for(let off=Math.max(0,original);off+c.width<=len;off+=10){c.offset=off;const a=isOpening(c)?clearance(p,c):bounds(p,c);if(!blockers.some(b=>overlaps(a,b))&&a[0]>=0&&a[1]>=0&&a[3]<=p.room.width&&a[4]<=p.room.depth)return;}c.offset=original;
}
export function fitFinishing(p,panel,anchor,side='After'){
 if(!isFinish(panel)||!isCab(anchor))return panel;
 panel.wall=anchor.wall;panel.rotation=anchor.rotation;
 panel.depth=panel.kind==='Filler'?18:anchor.depth+20;
 panel.setback=panel.kind==='Filler'?anchor.depth+2:0;
 panel.height=panel.kind==='End panel'&&anchor.kind!=='Wall'?anchor.elevation+anchor.height:anchor.height;
 panel.elevation=panel.kind==='End panel'&&anchor.kind!=='Wall'?0:anchor.elevation;
 const shift=side==='Before'?-panel.width:anchor.width;
 if(anchor.wall==='Free'){const [,,ux,uy]=frame(p,anchor);panel.x=anchor.x+ux*shift;panel.y=anchor.y+uy*shift;}
 else panel.offset=Math.max(0,anchor.offset+shift);
 return panel;
}
export function generateWorktops(p){const runs=new Map(),result=[];for(const c of p.cabinets){if(!isBase(c))continue;const key=JSON.stringify([c.wall,c.elevation+c.height,c.depth+20,c.wall==='Free'?c.id:'']);if(!runs.has(key))runs.set(key,[]);runs.get(key).push([c.offset,c.offset+c.width,c]);}
 for(const [key,items]of runs){const [wall,z,depth]=JSON.parse(key),first=items[0][2];if(wall==='Free'){
 const [,,ux,uy,vx,vy]=frame(p,first),span=[[0,first.width,true]];
 for(const f of p.finishing||[]){if(f.wall!=='Free'||f.rotation!==first.rotation||Math.abs(f.elevation+f.height-z)>.1||f.setback+f.depth>depth+.1)continue;const dx=f.x-first.x,dy=f.y-first.y;if(Math.abs(dx*vx+dy*vy)>.1)continue;const lo=dx*ux+dy*uy;span.push([lo,lo+f.width,false]);}
 span.sort((a,b)=>a[0]-b[0]);const groups=[];for(const [lo,hi,has]of span){const last=groups.at(-1);if(last&&lo<=last[1]+.1){last[1]=Math.max(last[1],hi);last[2]||=has;}else groups.push([lo,hi,has]);}const run=groups.find(g=>g[2]);
 result.push({...create('Worktop','Free'),label:'Worktop '+(result.length+1),width:run[1]-run[0],depth,elevation:z,x:first.x+ux*run[0],y:first.y+uy*run[0],rotation:first.rotation});continue;}
 for(const a of p.appliances)if(a.kind==='Dishwasher'&&a.wall===wall&&a.elevation+a.height<=z+.1&&a.depth<=depth+.1)items.push([a.offset,a.offset+a.width,a]);
 for(const f of p.finishing||[])if(f.wall===wall&&Math.abs(f.elevation+f.height-z)<.1&&f.depth+f.setback<=depth+.1)items.push([f.offset,f.offset+f.width,f]);
 items.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const groups=[];for(const [lo,hi,obj]of items){const last=groups.at(-1);if(last&&lo<=last[1]+.1){last[1]=Math.max(last[1],hi);last[2]||=isBase(obj);}else groups.push([lo,hi,isBase(obj)]);}
 for(const [lo,hi,hasBase]of groups)if(hasBase)result.push({...create('Worktop',wall),label:'Worktop '+(result.length+1),width:hi-lo,depth,elevation:z,offset:lo});
 }return result;
}
export function cabinetOperations(p,c){if(!isCab(c)||!machiningActive(c))return [];const [ox,oy,ux,uy,vx,vy]=frame(p,c);return localMachining(c,panels(p,c,true)).map(o=>transformOperation(o,([x,y,z])=>[ox+ux*x+vx*(c.depth-y),oy+uy*x+vy*(c.depth-y),c.elevation+z],([x,y,z])=>[ux*x-vx*y,uy*x-vy*y,z]));}
export function thicknessAxis(p,c,name){if(c.kind==='Worktop')return 2;let local;if(c.kind==='Filler')local=1;else if(c.kind==='End panel')local=0;else if(/^(Left side|Right side)$|^Drawer .* (left side|right side)$/.test(name))local=0;else if(/^(Bottom|Top|Shelf |Front rail|Rear rail)|^Drawer .*bottom$/.test(name))local=2;else local=1;if(local===2)return 2;const f=frame(p,c);return (local===0?Math.abs(f[2]):Math.abs(f[4]))>.5?0:1;}
export function partRows(p){return [...p.cabinets,...p.worktops,...(p.finishing||[])].flatMap(c=>{
 if(c.doorStyle==='glass'&&isCab(c)){
  const local=panels(p,c,true),ops=localMachining(c,local),[ox,oy,ux,uy,vx,vy]=frame(p,c),transform=o=>transformOperation(o,([x,y,z])=>[ox+ux*x+vx*(c.depth-y),oy+uy*x+vy*(c.depth-y),c.elevation+z],([x,y,z])=>[ux*x-vx*y,uy*x-vy*y,z]);
  const orient=r=>oriented(p,c,[r[0],r[1],c.depth-r[2]-r[5],r[3],...r.slice(4)]);
  return local.flatMap(row=>{const own=ops.filter(o=>o.part===row[0]),pieces=/^Door|^Access door/.test(row[0])?frameDoorParts(row,own,c):[{row,operations:own}];return pieces.map(a=>({...a,owner:c.label,id:c.id,kind:c.kind,row:orient(a.row),...(a.glassDoor?{glassDoor:{...a.glassDoor,bounds:orient([a.glassDoor.name,...a.glassDoor.bounds]).slice(1)}}:{}),thicknessAxis:thicknessAxis(p,c,a.row[0]),holes:[],operations:a.operations.map(transform)}));});
 }
 const ops=cabinetOperations(p,c);return panels(p,c).map(row=>({owner:c.label,id:c.id,kind:c.kind,row,thicknessAxis:thicknessAxis(p,c,row[0]),holes:c.kind==='Worktop'?cutoutsFor(p,c):[],operations:ops.filter(o=>o.part===row[0])}));});}
export function csv(p){const quote=v=>'"'+String(v).replaceAll('"','""')+'"';return '\ufeff'+[['Cabinet / Worktop / Finishing','Part','X mm','Y mm','Z mm','Size X mm','Size Y mm','Size Z mm','Cutout count'],...partRows(p).map(({owner,row,holes})=>[owner,...row.map(v=>typeof v==='number'?Number(v.toFixed(4)):v),holes.length])].map(r=>r.map(quote).join(',')).join('\r\n');}

export function cornerExample(){
 const p=empty();p.title='Blind corner example';
 const blind={...create('Blind corner'),label:'Blind corner · left'};
 const north={...create('Base'),label:'North base',offset:1050};
 const drawers={...create('Base'),label:'North drawers',offset:1650,front:'3 drawers'};
 const west={...create('Base','West'),label:'Return base',offset:2370};
 const west2={...create('Base','West'),label:'Return drawers',offset:1770,front:'3 drawers'};
 p.cabinets=[blind,north,drawers,west,west2];
 p.finishing=[fitFinishing(p,create('Filler','West'),west,'After'),fitFinishing(p,create('End panel'),drawers,'After'),fitFinishing(p,create('End panel','West'),west2,'Before')];
 p.finishing[0].label='Corner return filler · 50 mm';p.finishing[1].label='North end panel';p.finishing[2].label='Return end panel';
 p.worktops=generateWorktops(p);return validate(p);
}

export function fixtureTop(p,f){const t=p.worktops.find(t=>t.id===f.worktop_id);if(!t)throw Error(f.label+' has no worktop.');return t;}
export function localPoint(p,t,x,y){const [ox,oy,ux,uy,vx,vy]=frame(p,t),dx=x-ox,dy=y-oy;return [dx*ux+dy*uy,dx*vx+dy*vy];}
export function fixtureHole(p,f){const t=fixtureTop(p,f);const [,x,y,,w,d]=oriented(p,t,['Cutout',f.offset_u-f.cutout_width/2,f.offset_v-f.cutout_depth/2,0,f.cutout_width,f.cutout_depth,t.height]);return {id:f.id,name:f.label,x,y,width:w,depth:d};}
export function cutoutsFor(p,t){return (p.fixtures||[]).filter(f=>f.worktop_id===t.id).map(f=>fixtureHole(p,f));}
export function cutoutErrors(p){const errors=[];
 for(const t of p.worktops){const fs=(p.fixtures||[]).filter(f=>f.worktop_id===t.id);
  for(const f of fs){if(f.offset_u-f.cutout_width/2<=.1||f.offset_v-f.cutout_depth/2<=.1||f.offset_u+f.cutout_width/2>=t.width-.1||f.offset_v+f.cutout_depth/2>=t.depth-.1)errors.push({id:f.id,text:f.label+': cutout must stay fully inside its worktop'});}
  for(let i=0;i<fs.length;i++)for(let j=0;j<i;j++){const a=fs[i],b=fs[j];if(Math.abs(a.offset_u-b.offset_u)<=(a.cutout_width+b.cutout_width)/2+.1&&Math.abs(a.offset_v-b.offset_v)<=(a.cutout_depth+b.cutout_depth)/2+.1){errors.push({id:a.id,text:a.label+': cutout touches or overlaps '+b.label},{id:b.id,text:b.label+': cutout touches or overlaps '+a.label});}}
 }return errors;
}
export function assertCutouts(p){const errors=cutoutErrors(p);if(errors.length)throw Error('STEP export stopped: '+errors[0].text+'. Adjust the fixture before exporting.');}
export function renderHoles(p,t){const invalid=new Set(cutoutErrors(p).map(e=>e.id));return cutoutsFor(p,t).filter(h=>!invalid.has(h.id));}
export function fixtureBody(p,f){const t=fixtureTop(p,f),pose={...t,elevation:t.elevation+t.height};const [,x,y,z,w,d,h]=oriented(p,pose,['Body clearance',f.offset_u-f.body_width/2,f.offset_v-f.body_depth/2,-f.body_drop,f.body_width,f.body_depth,f.body_drop]);return [x,y,z,x+w,y+d,z+h];}
export function fixturePanels(p,f){const t=fixtureTop(p,f),pose={...t,elevation:t.elevation+t.height},u=f.offset_u,v=f.offset_v,w=f.width,d=f.depth,bw=f.body_width,bd=f.body_depth,drop=f.body_drop;
 if(f.kind==='Hob')return [['Hob glass',u-w/2,v-d/2,0,w,d,8],['Hob housing',u-bw/2,v-bd/2,-drop,bw,bd,drop],...[-1,1].flatMap(a=>[-1,1].map(b=>['Cooking zone',u+a*w*.23-Math.min(96,w*.25,d*.25)/2,v+b*d*.22-Math.min(96,w*.25,d*.25)/2,8,Math.min(96,w*.25,d*.25),Math.min(96,w*.25,d*.25),1]))].map(r=>oriented(p,pose,r));
 const rimX=(w-bw)/2,rimY=(d-bd)/2,wall=6;
 const rows=[['Sink rim left',u-w/2,v-d/2,0,rimX,d,5],['Sink rim right',u+bw/2,v-d/2,0,rimX,d,5],['Sink rim back',u-bw/2,v-d/2,0,bw,rimY,5],['Sink rim front',u-bw/2,v+bd/2,0,bw,rimY,5],
 ['Sink bowl bottom',u-bw/2,v-bd/2,-drop,bw,bd,wall],['Sink bowl left',u-bw/2,v-bd/2,-drop,wall,bd,drop],['Sink bowl right',u+bw/2-wall,v-bd/2,-drop,wall,bd,drop],['Sink bowl back',u-bw/2+wall,v-bd/2,-drop,bw-2*wall,wall,drop],['Sink bowl front',u-bw/2+wall,v+bd/2-wall,-drop,bw-2*wall,wall,drop]];
 return rows.filter(r=>r.slice(4).every(v=>v>0)).map(r=>oriented(p,pose,r));
}
export function fixtureChecks(p){const result=cutoutErrors(p),fs=p.fixtures||[];
 for(let i=0;i<fs.length;i++){const f=fs[i],t=fixtureTop(p,f),b=fixtureBody(p,f);
  const edge=Math.min(f.offset_u-f.cutout_width/2,f.offset_v-f.cutout_depth/2,t.width-f.offset_u-f.cutout_width/2,t.depth-f.offset_v-f.cutout_depth/2);
  if(edge>.1&&edge<f.edge_clearance-.1)result.push({id:f.id,text:f.label+': cutout is closer to an edge than its '+f.edge_clearance+' mm margin'});
  if(f.offset_u<f.width/2||f.offset_v<f.depth/2||f.offset_u+f.width/2>t.width||f.offset_v+f.depth/2>t.depth)result.push({id:f.id,text:f.label+': visible fixture overhangs the worktop'});
  if(b[2]<0)result.push({id:f.id,text:f.label+': body extends below the floor'});
  for(const c of [...p.cabinets,...p.appliances,...(p.finishing||[])])for(const [name,x,y,z,w,d,h]of panels(p,c))if(overlaps(b,[x,y,z,x+w,y+d,z+h]))result.push({id:f.id,text:f.label+' body intersects '+name+' in '+c.label});
  for(const other of fs.slice(0,i))if(overlaps(bounds(p,f),bounds(p,other)))result.push({id:f.id,text:f.label+' overlaps '+other.label});
 }return result;
}
export function findFixtureTop(p,anchor){if(!anchor)return null;if(anchor.kind==='Worktop')return anchor;if(isFixture(anchor))return fixtureTop(p,anchor);
 if(isBase(anchor)){const [ox,oy,ux,uy,vx,vy]=frame(p,anchor),x=ox+ux*anchor.width/2+vx*anchor.depth/2,y=oy+uy*anchor.width/2+vy*anchor.depth/2;
  return p.worktops.find(t=>{const [u,v]=localPoint(p,t,x,y);return Math.abs(t.elevation-anchor.elevation-anchor.height)<.1&&u>=0&&u<=t.width&&v>=0&&v<=t.depth;});
 }return null;}
export function createFixture(p,kind,t,anchor=null){const f={id:uid(),label:kind,kind,worktop_id:t.id,offset_u:t.width/2,offset_v:t.depth/2,width:kind==='Sink'?560:590,depth:kind==='Sink'?440:520,cutout_width:kind==='Sink'?520:560,cutout_depth:kind==='Sink'?400:480,body_width:kind==='Sink'?500:540,body_depth:kind==='Sink'?380:440,body_drop:kind==='Sink'?200:50,edge_clearance:40};
 if(isBase(anchor||{})){const [ox,oy,ux,uy,vx,vy]=frame(p,anchor);[f.offset_u,f.offset_v]=localPoint(p,t,ox+ux*anchor.width/2+vx*t.depth/2,oy+uy*anchor.width/2+vy*t.depth/2);}
 if(f.width>t.width||f.depth>t.depth)throw Error('This worktop is too small for the default '+kind.toLowerCase()+'. Enlarge the worktop first.');
 const positions=[f.offset_u,...p.cabinets.filter(c=>c.kind==='Base').map(c=>{const [ox,oy,ux,uy,vx,vy]=frame(p,c);return localPoint(p,t,ox+ux*c.width/2+vx*c.depth/2,oy+uy*c.width/2+vy*c.depth/2)[0];})];
 for(const u of positions){f.offset_u=u;const trial={...p,fixtures:[...(p.fixtures||[]),f]};if(!cutoutErrors(trial).some(e=>e.id===f.id)&&u>=f.width/2&&u+f.width/2<=t.width)return f;}
 throw Error('No space for another '+kind.toLowerCase()+' on this worktop. Move existing fixtures or choose another worktop.');
}
export function regenerateWorktops(p){const placements=(p.fixtures||[]).map(f=>{const t=fixtureTop(p,f),[ox,oy,ux,uy,vx,vy]=frame(p,t);return {f,t,x:ox+ux*f.offset_u+vx*f.offset_v,y:oy+uy*f.offset_u+vy*f.offset_v,ux,uy};});const next=generateWorktops(p),updates=[];
 for(const s of placements){const t=next.find(t=>{const [,,ux,uy]=frame(p,t),[u,v]=localPoint(p,t,s.x,s.y);return Math.abs(t.elevation-s.t.elevation)<.1&&ux===s.ux&&uy===s.uy&&u-s.f.cutout_width/2>.1&&u+s.f.cutout_width/2<t.width-.1&&v-s.f.cutout_depth/2>.1&&v+s.f.cutout_depth/2<t.depth-.1;});if(!t)throw Error('Cannot regenerate: '+s.f.label+' would lose its worktop. Move or remove that fixture first.');const [u,v]=localPoint(p,t,s.x,s.y);updates.push([s.f,t.id,u,v]);}
 p.worktops=next;for(const [f,id,u,v]of updates)Object.assign(f,{worktop_id:id,offset_u:u,offset_v:v});
}
export function cutoutCsv(p){const quote=v=>'"'+String(v).replaceAll('"','""')+'"',errors=cutoutErrors(p);const rows=[['Worktop','Fixture','Center along worktop mm','Center from back mm','Cutout width mm','Cutout depth mm','World X mm','World Y mm','World size X mm','World size Y mm','Through thickness mm','Status']];
 for(const f of p.fixtures||[]){const t=fixtureTop(p,f),h=fixtureHole(p,f);rows.push([t.label,f.label,f.offset_u,f.offset_v,f.cutout_width,f.cutout_depth,h.x,h.y,h.width,h.depth,t.height,errors.filter(e=>e.id===f.id).map(e=>e.text).join('; ')||'Valid rectangular through-cutout']);}
 return '\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\r\n');
}
export function fixtureExample(){const p=empty();p.title='Sink and hob example';const sink={...create('Base'),label:'Sink base',shelves:0,rail_width:50},hob={...create('Base'),label:'Hob base',offset:1200,shelves:0,rail_width:40},drawers={...create('Base'),label:'Drawer base',offset:1800,front:'3 drawers'};p.cabinets=[sink,hob,drawers];p.appliances=[{...create('Dishwasher'),offset:600}];p.worktops=generateWorktops(p);p.fixtures=[createFixture(p,'Sink',p.worktops[0],sink),createFixture(p,'Hob',p.worktops[0],hob)];return validate(p);}
export function duplicateFixture(p,original){const top=fixtureTop(p,original),f={...structuredClone(original),id:uid(),label:(original.label+' copy').slice(0,200)};const candidates=[original.offset_u+original.width+50];for(let u=f.width/2;u+f.width/2<=top.width;u+=10)candidates.push(u);for(const u of candidates){f.offset_u=u;const trial={...p,fixtures:[...(p.fixtures||[]),f]};if(u>=f.width/2&&u+f.width/2<=top.width&&!cutoutErrors(trial).some(e=>e.id===f.id))return f;}throw Error('No space to duplicate this fixture on its worktop.');}

export function machiningExample(){const p=empty();p.title='Dados and drilling example';p.cabinets=[{...create('Base'),label:'Base - hinges, shelf pins & two front feet',machining:{back:true,bottom:true,carcass:true,shelfPins:true,hinge:'blum_71b3550',handle:'horizontal',feet:'rectangle',feetCount:2}},{...create('Base'),label:'Drawers - grooves & 3832 runners',offset:600,front:'3 drawers',shelves:0,machining:{back:true,bottom:true,drawers:true,carcass:true,drawerJoints:true,runner:'3832',handle:'horizontal',feet:'rectangle',drawerWallHeight:100}},{...create('Wall'),label:'Wall - captured back & Hafele hinges',machining:{back:true,carcass:true,shelfPins:true,hinge:'hafele_31104003',handle:'knob',doorHandle:'auto_bottom'}}];p.worktops=generateWorktops(p);return validate(p);}
