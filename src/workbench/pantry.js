import {drawerPlan,tandemRows,tandemOperations} from './tandem.js';
export const isPantry=c=>c.style==='Pantry';
export const pantrySideSpacer=c=>c.hinge==='blum_71b7550'?0:(c.pantrySpacer??25);
export const pantryDefaults={pantryDrawerZone:1400,pantrySpacer:25,pantrySetback:60};
export function pantryConfig(c){
 const a={...pantryDefaults,...c};
 for(const [k,lo,hi]of [['pantrySpacer',20,60],['pantrySetback',55,150],['pantryDrawerZone',300,c.height-c.thickness-20]])if(!Number.isFinite(a[k])||a[k]<lo||a[k]>hi)throw Error(k+' must be '+lo+'–'+Number(hi.toFixed(1))+' mm.');
 return {...a,style:'Tall',frontMode:'drawers',width:c.width-2*pantrySideSpacer(c),depth:c.depth-a.pantrySetback,height:a.pantryDrawerZone,drawerFront1:0,drawerFront2:0,drawerFront3:0,handle:'none'};
}
export function pantryPlan(c){return drawerPlan(pantryConfig(c));}
const spacerName=(i,left)=>'Runner spacer '+i+' '+(left?'left':'right');
export function pantryRows(c){const a={...pantryDefaults,...c,pantrySpacer:pantrySideSpacer(c)},virtual=pantryConfig(c),p=drawerPlan(virtual),rows=tandemRows(virtual).filter(r=>!r[0].endsWith('overlay front')).map(([name,x,y,...rest])=>[name,x+a.pantrySpacer,y+a.pantrySetback,...rest]);
 if(a.pantrySpacer)for(const box of p.boxes)for(const left of [true,false])rows.push([spacerName(box.index,left),left?c.thickness:c.width-c.thickness-a.pantrySpacer,a.pantrySetback,box.fixingZ-20,a.pantrySpacer,p.length+3,60]);return rows;
}
export function pantryOperations(c,rows){const a={...pantryDefaults,...c,pantrySpacer:pantrySideSpacer(c)},virtual=pantryConfig(c),p=drawerPlan(virtual),rawRows=tandemRows(virtual),ops=tandemOperations(virtual,rawRows).filter(o=>!o.label.startsWith('Drawer front fixing'));
 const out=ops.map(o=>{const next={...o};if(o.type==='pocket')next.box=o.box.map((v,i)=>v+(i===0?a.pantrySpacer:i===1?a.pantrySetback:0));else{next.point=o.point.map((v,i)=>v+(i===0?a.pantrySpacer:i===1?a.pantrySetback:0));if(a.pantrySpacer&&o.label.includes('runner pilot')){const box=p.boxes.find(b=>Math.abs(b.fixingZ-o.point[2])<1e-6);next.part=spacerName(box.index,o.part==='Left side');}}return next;});
 if(a.pantrySpacer)for(const box of p.boxes)for(const left of [true,false])for(const y of [a.pantrySetback+100,a.pantrySetback+p.length-30]){const sign=left?-1:1,x=left?c.thickness+a.pantrySpacer:c.width-c.thickness-a.pantrySpacer,z=box.fixingZ+15;out.push({type:'bore',part:spacerName(box.index,left),label:'Runner spacer fixing clearance',axis:0,point:[x,y,z],sign,diameter:4,depth:a.pantrySpacer},{type:'bore',part:left?'Left side':'Right side',label:'Runner spacer mounting pilot',axis:0,point:[left?c.thickness:c.width-c.thickness,y,z],sign,diameter:2.5,depth:10});}return out;
}

// Keep hinge plates/arms between tray levels; a zero-protrusion door still needs vertical clearance.
export function pantryHingeCentres(c,bottom=2,height=c.height-4){const boxes=pantryPlan(c).boxes,centres=[],top=bottom+height-c.hingeEnd;for(let i=0;i<c.hingeCount;i++){let z=Math.max(bottom+c.hingeEnd+i*(height-2*c.hingeEnd)/(c.hingeCount-1),(centres.at(-1)??-Infinity)+90);for(const box of [...boxes].sort((a,b)=>a.sideZ-b.sideZ))if(z>=box.sideZ-32&&z<=box.sideZ+box.height+32)z=box.sideZ+box.height+33;if(z>top+.001)throw Error('Pantry hinges need clear space between trays. Reduce hinge/tray quantity or tray height, or change the drawer zone height.');centres.push(z);}return centres;}
