// One-piece routed wooden frame, fitted from the same inside face as hinge cups.
export const insetHinge='blum_71b3750';
export const isInset=c=>c.hinge===insetHinge||c.machining?.hinge===insetHinge;
export function checkedDoorStyle(c){
 if(!['slab','glass'].includes(c.doorStyle??'slab'))throw Error('Choose a solid slab or a glass-in-frame door.');
 if(c.doorStyle!=='glass'||c.doors===0||c.front==='Open')return;
 for(const [key,lo,hi]of [['glassFrame',50,150],['glassThickness',3,6]])if(!Number.isFinite(c[key])||c[key]<lo||c[key]>hi)throw Error(`${key==='glassFrame'?'Glass frame width':'Glass thickness'} must be ${lo}–${hi} mm.`);
}
export function glassDimensions(width,height,c){
 const frame=c.glassFrame??70,lap=8,clearance=2,thickness=c.glassThickness??4;
 if(width-2*frame<40||height-2*frame<80)throw Error('The glass opening is too small. Reduce frame width, use one door, or increase the cabinet size.');
 return {openingWidth:width-2*frame,openingHeight:height-2*frame,width:width-2*frame+2*lap-clearance,height:height-2*frame+2*lap-clearance,thickness,frame,lap,clearance,rebateDepth:thickness+2};
}
export function glassSchedule(parts,c){return c.doorStyle==='glass'?parts.filter(p=>/^Door/.test(p.row[0])).map(p=>({part:p.code,name:p.row[0],...glassDimensions(p.finishedWidth??p.width,p.finishedHeight??p.height,c)})):[];}
export function glassCsv(parts,c){const rows=[['Door','Glass width mm','Glass height mm','Glass thickness mm','Total fit clearance mm','Notes'],...glassSchedule(parts,c).map(g=>[g.name,g.width,g.height,g.thickness,g.clearance,'Bought glass; confirm fit after routing, use retainers; no glass drilling in CNC files'])];return rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}
