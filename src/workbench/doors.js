// Four-piece rounded dovetail frame with a rebated glass or Shaker infill.
export const insetHinge='blum_71b3750';
export const isInset=c=>c.hinge===insetHinge||c.machining?.hinge===insetHinge;
export function checkedDoorStyle(c){
 if(!['slab','glass','shaker'].includes(c.doorStyle??'slab'))throw Error('Choose slab, glass frame or Shaker door.');
 if(!['glass','shaker'].includes(c.doorStyle)||c.doors===0||c.front==='Open')return;
 for(const [key,lo,hi]of [['glassFrame',50,150],[c.doorStyle==='shaker'?'shakerThickness':'glassThickness',3,c.doorStyle==='shaker'?18:6]])if(!Number.isFinite(c[key])||c[key]<lo||c[key]>hi)throw Error(`${key==='glassFrame'?'Glass frame width':c.doorStyle==='shaker'?'Shaker panel thickness':'Glass thickness'} must be ${lo}–${hi} mm.`);
}
export function glassDimensions(width,height,c){
 const frame=c.glassFrame??70,lap=8,clearance=2,thickness=c.doorStyle==='shaker'?(c.shakerThickness??6):(c.glassThickness??4);
 if(width-2*frame<40||height-2*frame<80)throw Error('The glass opening is too small. Reduce frame width, use one door, or increase the cabinet size.');
 return {openingWidth:width-2*frame,openingHeight:height-2*frame,width:width-2*frame+2*lap-clearance,height:height-2*frame+2*lap-clearance,thickness,frame,lap,clearance,rebateDepth:thickness+2};
}
export function glassSchedule(parts,c){return c.doorStyle==='glass'?parts.filter(p=>!p.drawerFrame).filter(p=>p.glassFramePart?p.glassFramePart==='left stile':/^Door/.test(p.row[0])).map(p=>({part:p.code,name:p.glassDoor?.name||p.row[0],...glassDimensions(p.glassDoor?.width??p.finishedWidth??p.width,p.glassDoor?.height??p.finishedHeight??p.height,c)})):[];}
export function glassCsv(parts,c){const rows=[['Door','Glass width mm','Glass height mm','Glass thickness mm','Total fit clearance mm','Notes'],...glassSchedule(parts,c).map(g=>[g.name,g.width,g.height,g.thickness,g.clearance,'Bought glass; confirm fit after routing, use retainers; no glass drilling in CNC files'])];return rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}
