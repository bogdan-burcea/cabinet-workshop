import {drawerPlan,tandemRows,tandemOperations} from './tandem.js';
export const isPantry=c=>c.style==='Pantry';
export const pantrySideSpacer=()=>0;
export function normalizePantry(c){if(c.style==='Pantry'){c.hinge='blum_71b7550';c.plate=0;c.pantrySpacer=0;}return c;}
export const pantryDefaults={pantryShelfSet:false,pantryShelfCount:2,pantryDrawerZone:1400,pantrySpacer:0,pantrySetback:60};
export function pantryConfig(c){
 const a={...pantryDefaults,...c};
 for(const [k,lo,hi]of [['pantrySetback',55,150],['pantryDrawerZone',300,c.height-c.thickness-20]])if(!Number.isFinite(a[k])||a[k]<lo||a[k]>hi)throw Error(k+' must be '+lo+'–'+Number(hi.toFixed(1))+' mm.');
 return {...a,hinge:'blum_71b7550',plate:0,style:'Tall',innerDrawer:true,frontMode:'drawers',width:c.width-2*pantrySideSpacer(c),depth:c.depth-a.pantrySetback,height:a.pantryDrawerZone,drawerFront1:0,drawerFront2:0,drawerFront3:0,handle:'none'};
}
export function pantryPlan(c){return drawerPlan(pantryConfig(c));}
export function pantryRows(c){const virtual=pantryConfig(c),setback=c.pantrySetback??60;return tandemRows(virtual).filter(r=>!r[0].endsWith('overlay front')).map(([name,x,y,...rest])=>[name,x,y+setback,...rest]);}
export function pantryOperations(c){const virtual=pantryConfig(c),setback=c.pantrySetback??60,rawRows=tandemRows(virtual);return tandemOperations(virtual,rawRows).filter(o=>!o.label.startsWith('Drawer front fixing')).map(o=>o.type==='pocket'?{...o,box:o.box.map((v,i)=>v+(i===1?setback:0))}:{...o,point:o.point.map((v,i)=>v+(i===1?setback:0))});}

// Keep hinge plates/arms between tray levels; a zero-protrusion door still needs vertical clearance.
export function pantryHingeCentres(c,bottom=2,height=c.height-4){const boxes=pantryPlan(c).boxes,centres=[],top=bottom+height-c.hingeEnd;for(let i=0;i<c.hingeCount;i++){let z=Math.max(bottom+c.hingeEnd+i*(height-2*c.hingeEnd)/(c.hingeCount-1),(centres.at(-1)??-Infinity)+90);for(const box of [...boxes].sort((a,b)=>a.sideZ-b.sideZ))if(z>=box.sideZ-32&&z<=box.sideZ+box.height+32)z=box.sideZ+box.height+33;if(z>top+.001)throw Error('Pantry hinges need clear space between trays. Reduce hinge/tray quantity or tray height, or change the drawer zone height.');centres.push(z);}return centres;}

// The upper shelf zone starts above the complete drawer envelope.
export function pantryShelfCount(c){
 const enabled=c.pantryShelfSet??false,count=c.pantryShelfCount??2;
 if(typeof enabled!=='boolean')throw Error('Choose whether to include the pantry shelf set.');
 if(!Number.isInteger(count)||count<1||count>8)throw Error('Choose 1–8 pantry shelves.');
 return enabled?count:0;
}
export function pantryShelfBase(c){return pantryConfig(c).height+20;}

export function pantryDrawerTop(c){return Math.max(...pantryPlan(c).boxes.map(b=>b.sideZ+b.height));}
export function pantryShelfGap(c){
 if(c.pantryShelfGap!==undefined){if(!Number.isFinite(c.pantryShelfGap)||c.pantryShelfGap<20||c.pantryShelfGap>100000)throw Error('Pantry shelf clearance must be 20–100000 mm.');return c.pantryShelfGap;}
 // Keep the previous automatic shelf positions when loading existing projects.
 const n=c.pantryShelfCount??2,st=c.shelfThickness??18,base=pantryShelfBase(c);
 return base+(c.height-c.thickness-base-n*st)/(n+1)-pantryDrawerTop(c);
}
