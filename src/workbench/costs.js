import {isDrawers,drawerPlan,tandemFixings} from './tandem.js';
import {glassSchedule} from './doors.js';
export const emptyCosts=()=>({currency:'RON',basis:'sheet',prices:{},extras:[]});
export function checkedCosts(value){const c={...emptyCosts(),...structuredClone(value||{})};if(typeof c.currency!=='string'||!c.currency.trim()||c.currency.length>12||!['sheet','area'].includes(c.basis)||!c.prices||Array.isArray(c.prices)||typeof c.prices!=='object'||!Array.isArray(c.extras)||c.extras.length>50)throw Error('Enter a currency, pricing basis and up to 50 additional cost items.');for(const [k,v]of Object.entries(c.prices))if(k.length>300||!Number.isFinite(v)||v<0||v>1e8)throw Error('Unit prices must be 0–100,000,000.');for(const e of c.extras)if(!e||typeof e.name!=='string'||e.name.length>100||!e.name.trim()||!Number.isFinite(e.quantity)||e.quantity<0||e.quantity>1e6||e.price!==null&&(!Number.isFinite(e.price)||e.price<0||e.price>1e8))throw Error('Additional items need a name, non-negative quantity and price.');return c;}
export function costRows(cabinets,parts,layout,costs={}){
 const c=checkedCosts(costs),rows=[],groups=new Map();
 const add=(category,label,unit,quantity,id=label)=>{if(quantity<=0)return;const key=JSON.stringify([category,id,unit]),old=rows.find(r=>r.key===key);if(old)old.quantity+=quantity;else rows.push({key,category,label,unit,quantity});};
 for(const p of parts){const key=JSON.stringify([p.material,p.thickness]);if(!groups.has(key))groups.set(key,{material:p.material,t:p.thickness,area:0,sheets:0,width:layout.settings.width,height:layout.settings.height});groups.get(key).area+=p.width*p.height/1e6;}
 for(const sheet of layout.sheets){const g=groups.get(JSON.stringify([sheet.material,sheet.thickness]));if(g)g.sheets++;}
 for(const g of groups.values())add('Material',`${g.material} · ${g.t} mm`+(c.basis==='sheet'?` · ${g.width} × ${g.height} mm`:''),c.basis==='sheet'?'sheet':'m²',c.basis==='sheet'?g.sheets:g.area,[g.material,g.t,c.basis,...(c.basis==='sheet'?[g.width,g.height]:[])]);
 for(const r of cabinets){const a=r.config||r,ps=parts.filter(p=>p.cabinetId===r.id||!p.cabinetId),cups=ps.flatMap(p=>p.flatOperations).filter(o=>o.label==='Hinge cup').length;
  if(isDrawers(a)){const p=drawerPlan(a),n=a.drawerCount;add('Hardware',`${p.partNumber} · L/R runner pair`,'pair',n,p.partNumber);add('Hardware','T51.1700.04 · L/R locking-device pair','pair',n,'T51.1700.04');add('Hardware','Runner screws · Ø4 × 15 mm','each',2*n*tandemFixings(p.length).length,'runner-screw');}
  if(cups){add('Hardware',a.hinge+' · hinge','each',cups,a.hinge);add('Hardware',a.hinge+' · '+a.plate+' mm mounting plate','each',cups,a.hinge+'-plate-'+a.plate);}
  const handles=new Set(ps.filter(p=>p.flatOperations.some(o=>o.label==='Handle through hole')).map(p=>p.glassDoor?.name||p.key||p.code)).size;if(handles)add('Hardware',a.handle==='knob'?'Knob':a.handle+' pull · '+a.handlePitch+' mm','each',handles,a.handle==='knob'?'knob':a.handle+'-'+a.handlePitch);
  if(a.style!=='Wall'&&a.feet!=='none')add('Hardware',a.feet+' foot plate / adjustable foot','each',a.feetCount,a.feet);
  const dowels=ps.flatMap(p=>p.flatOperations).filter(o=>o.label==='Frame dowel');for(const diameter of new Set(dowels.map(o=>o.diameter)))add('Hardware','Frame dowel · Ø'+diameter+' × 30 mm','each',dowels.filter(o=>o.diameter===diameter).length/2,'frame-dowel-'+diameter);
  for(const g of glassSchedule(ps,a))add('Glass',`Glass · ${g.thickness} mm`,'m²',g.width*g.height/1e6,'glass-'+g.thickness);
 }
 for(const p of parts)for(const [edge,t]of Object.entries(p.edgeBand||{}))if(t)add('Edgeband',`Edgeband · ${t} mm`,'m',(edge.startsWith('x')?(p.finishedHeight||p.height):(p.finishedWidth||p.width))/1000,'band-'+t);
 const priced=rows.map(r=>({...r,price:c.prices[r.key]??null,total:Math.round(r.quantity*(c.prices[r.key]??0)*100)/100}));const extras=c.extras.map((e,i)=>({key:'extra-'+i,category:'Additional',label:e.name,unit:'each',quantity:e.quantity,price:e.price,total:Math.round(e.quantity*(e.price??0)*100)/100}));
 const total=[...priced,...extras].reduce((n,r)=>n+r.total,0);return {rows:priced,extras,total:Math.round(total*100)/100,currency:c.currency,missing:[...priced,...extras].filter(r=>r.price===null).length,unplaced:layout.unplaced.length,basis:c.basis};
}
// Allocate each rounded project line in cents, so cabinet subtotals reconcile
// exactly even when cabinets share sheets. Extras remain project-wide.
export function cabinetCosts(cabinets,parts,layout,costs={}){
 const c=checkedCosts(costs),estimate=costRows(cabinets,parts,layout,c),local=cabinets.map(r=>{
  const own=parts.filter(p=>p.cabinetId===r.id),quantities=costRows([r],own,{...layout,sheets:[],unplaced:[]},{...c,basis:'area',extras:[]}).rows;
  return {id:r.id,name:r.config.name,rows:[],total:0,missing:0,unplaced:layout.unplaced.filter(p=>p.cabinetId===r.id).length,quantities,parts:own};
 });
 for(const row of estimate.rows){
  const weights=local.map(a=>{if(row.category!=='Material')return a.quantities.find(q=>q.key===row.key)?.quantity||0;const [material,t]=JSON.parse(row.key)[1];return a.parts.filter(p=>p.material===material&&p.thickness===t).reduce((n,p)=>n+p.width*p.height,0);}),sum=weights.reduce((n,w)=>n+w,0);
  if(!sum)continue;
  const raw=weights.map(w=>Math.round(row.total*100)*w/sum),cents=raw.map(Math.floor),order=raw.map((v,i)=>({i,remainder:v-cents[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
  let left=Math.round(row.total*100)-cents.reduce((n,v)=>n+v,0);for(const a of order){if(left--<=0)break;cents[a.i]++;}
  local.forEach((a,i)=>{if(!weights[i])return;const share={...row,quantity:row.quantity*weights[i]/sum,total:cents[i]/100};a.rows.push(share);a.total+=cents[i];if(row.price===null)a.missing++;});
 }
 return {cabinets:local.map(({quantities,parts,total,...a})=>({...a,total:total/100})),extras:estimate.extras,total:estimate.total,currency:c.currency,missing:estimate.missing,unplaced:estimate.unplaced};
}
export function estimateCsv(estimate){const rows=[['Category','Item','Quantity','Unit','Unit price '+estimate.currency,'Amount '+estimate.currency],...[...estimate.rows,...estimate.extras].map(r=>[r.category,r.label,Number(r.quantity.toFixed(4)),r.unit,r.price??'NOT PRICED',Number(r.total.toFixed(2))]),['TOTAL',estimate.missing||estimate.unplaced?'PARTIAL ESTIMATE':'Estimate','','','',Number(estimate.total.toFixed(2))]];return rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}
