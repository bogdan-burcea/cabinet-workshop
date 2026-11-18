import {golaRails} from './gola.js';
export const worktopDefaults={enabled:'auto',front:20,rear:0,left:0,right:0,cutouts:[]};
export function worktopSettings(c){if(c.worktop!==undefined&&(!c.worktop||typeof c.worktop!=='object'||Array.isArray(c.worktop)))throw Error('Invalid worktop settings.');for(const key of Object.keys(c.worktop||{}))if(!Object.hasOwn(worktopDefaults,key))throw Error('Unsupported worktop setting: '+key+'.');const v={...worktopDefaults,...c.worktop};if(!['auto',true,false].includes(v.enabled))throw Error('Choose whether to include a worktop.');for(const k of ['front','rear','left','right'])if(!Number.isFinite(v[k])||v[k]<0||v[k]>300)throw Error('Worktop '+k+' overhang must be 0–300 mm.');if(!Array.isArray(v.cutouts)||v.cutouts.length>30)throw Error('A worktop supports up to 30 cutouts.');return v;}
export const hasWorktop=c=>(c.worktop?.enabled==='auto'||c.worktop?.enabled===undefined?c.style==='Base':c.worktop.enabled===true)&&(c.installation?.worktopThickness??0)>0;
export function worktopPart(c){
 const v=worktopSettings(c);if(!hasWorktop(c))return null;
 const thickness=c.installation.worktopThickness,width=c.width+v.left+v.right,depth=c.depth+v.front+v.rear,operations=[],ids=new Set();
 for(const cut of v.cutouts){if(!cut||typeof cut!=='object'||Array.isArray(cut))throw Error('Invalid worktop cutout.');for(const key of Object.keys(cut))if(!['id','name','shape','x','y','width','depth','diameter','below'].includes(key))throw Error('Unsupported worktop cutout setting: '+key+'.');if(typeof cut.name!=='string'||!cut.name.trim()||cut.name.length>100)throw Error('Give each worktop cutout a name (up to 100 characters).');const fail=s=>{throw Error('Worktop cutout '+(cut.name||'')+': '+s);};if(!cut||typeof cut.id!=='string'||!cut.id||cut.id.length>100||ids.has(cut.id))throw Error('Worktop cutouts need unique IDs.');ids.add(cut.id);if(!['rectangle','circle'].includes(cut.shape))fail('choose Rectangle or Circle.');for(const k of ['x','y','below'])if(!Number.isFinite(cut[k])||cut[k]<0||cut[k]>5000)fail('enter a valid '+k+'.');const w=cut.shape==='circle'?cut.diameter:cut.width,h=cut.shape==='circle'?cut.diameter:cut.depth;if(!Number.isFinite(w)||!Number.isFinite(h)||Math.min(w,h)<8)fail('minimum size is 8 mm.');if(cut.x<10||cut.y<10||cut.x+w>width-10||cut.y+h>depth-10)fail('leave at least 10 mm to every worktop edge.');const x=-v.left+cut.x,y=c.depth+v.front-cut.y-h;
  operations.push(cut.shape==='circle'?{type:'bore',axis:2,sign:-1,point:[x+w/2,y+h/2,c.height+thickness],diameter:w,depth:thickness,label:'Worktop '+(cut.name||'circular cutout'),worktopCutout:cut.id}:{type:'pocket',axis:2,sign:-1,box:[x,y,c.height,w,h,thickness],label:'Worktop '+(cut.name||'rectangular cutout'),worktopCutout:cut.id});
 }
 for(let i=0;i<operations.length;i++)for(const b of operations.slice(i+1))if(footprintsOverlap(footprint(operations[i]),footprint(b)))throw Error('Worktop cutouts overlap. Separate them before continuing.');
 return {code:'WT',row:['Worktop',-v.left,-v.rear,c.height,width,depth,thickness],operations,holes:[],worktop:true};
}
export function footprint(o){return o.type==='pocket'?[o.box[0],o.box[1],o.box[3],o.box[4]]:[o.point[0]-o.diameter/2,o.point[1]-o.diameter/2,o.diameter,o.diameter];}
function footprintsOverlap(a,b){return a[0]<b[0]+b[2]-1e-6&&a[0]+a[2]>b[0]+1e-6&&a[1]<b[1]+b[3]-1e-6&&a[1]+a[3]>b[1]+1e-6;}
function circlePolygon(o){return Array.from({length:96},(_,i)=>[o.point[0]+o.diameter/2*Math.cos(i*Math.PI/48),o.point[1]+o.diameter/2*Math.sin(i*Math.PI/48)]);}
function clipPolygon(points,rect){let result=points;for(const [axis,bound,less]of [[0,rect[0],false],[0,rect[0]+rect[2],true],[1,rect[1],false],[1,rect[1]+rect[3],true]]){const input=result;result=[];for(let i=0;i<input.length;i++){const a=input[i],b=input[(i+1)%input.length],inside=p=>less?p[axis]<=bound:p[axis]>=bound,ai=inside(a),bi=inside(b);if(ai)result.push(a);if(ai!==bi){const t=(bound-a[axis])/(b[axis]-a[axis]);result.push(a.map((v,k)=>v+t*(b[k]-v)));}}}return result;}
// Continue openings through supporting top panels/rails. Never notch aluminium GOLA.
// Rows here use the generator's +Y towards the back coordinates.
export function worktopCarcassOperations(c,rows){
 const part=worktopPart(c);if(!part)return [];const out=[];
 for(const o of part.operations){const bounds=footprint(o),local=[bounds[0],c.depth-bounds[1]-bounds[3],bounds[2],bounds[3]];
  for(const side of rows.filter(r=>/^(Left|Right) side$/.test(r[0])))if(footprintsOverlap(local,[side[1],side[2],side[4],side[5]]))throw Error(o.label+' meets '+side[0]+'. Move the opening inside the carcass sides.');
  const clearance=Math.max(c.thickness,worktopSettings(c).cutouts.find(a=>a.id===o.worktopCutout)?.below??0);
  for(const rail of golaRails(c,rows))if(rail.box[2]+rail.box[5]>c.height-clearance-1e-6&&footprintsOverlap(local,[rail.box[0],rail.box[1],rail.box[3],rail.box[4]]))throw Error(o.label+' meets the GOLA profile. Move or resize the cutout; aluminium rails are not cut automatically.');
  for(const r of rows.filter(r=>['Top','Front rail','Rear rail'].includes(r[0]))){const rect=[r[1],r[2],r[4],r[5]];if(!footprintsOverlap(local,rect))continue;
   if(o.type==='bore'&&local[0]>=rect[0]&&local[1]>=rect[1]&&local[0]+local[2]<=rect[0]+rect[2]&&local[1]+local[3]<=rect[1]+rect[3]){out.push({...o,part:r[0],point:[o.point[0],c.depth-o.point[1],r[3]+r[6]],depth:r[6],label:o.label+' support opening'});continue;}
   const polygon=o.type==='bore'?circlePolygon({...o,point:[o.point[0],c.depth-o.point[1],0]}):[[local[0],local[1]],[local[0]+local[2],local[1]],[local[0]+local[2],local[1]+local[3]],[local[0],local[1]+local[3]]],clipped=clipPolygon(polygon,rect);if(clipped.length<3)continue;
   const lo=[Math.min(...clipped.map(p=>p[0])),Math.min(...clipped.map(p=>p[1]))],hi=[Math.max(...clipped.map(p=>p[0])),Math.max(...clipped.map(p=>p[1]))];
   if(r[0].endsWith('rail')&&hi[1]-lo[1]>r[5]-20)throw Error(o.label+' cuts through '+r[0]+'. Reduce that rail’s width, move the cutout, or use another top construction. Leave at least 20 mm of continuous rail depth.');
   out.push({type:'pocket',part:r[0],label:o.label+' support opening',axis:2,sign:-1,box:[...lo,r[3],hi[0]-lo[0],hi[1]-lo[1],r[6]],...(o.type==='bore'?{cutPolygon:clipped.map(p=>[...p,r[3]])}:{}),worktopCutout:o.worktopCutout});
  }
 }
 return out;
}
export function validateWorktopClearance(c,rows){const part=worktopPart(c);if(!part)return;const v=worktopSettings(c);for(const [i,o]of part.operations.entries()){const depth=v.cutouts[i].below;if(!depth)continue;for(const p of rows){const r=p.row;if(p.worktop||!/^Drawer|^Shelf |^Fixed shelf|^Upper back rail|^Back|side$/.test(r[0]))continue;if(r[3]+r[6]<=c.height-depth+1e-6||r[3]>=c.height)continue;if(footprintsOverlap(footprint(o),[r[1],r[2],r[4],r[5]]))throw Error(o.label+' needs '+depth+' mm clearance below the worktop and meets '+r[0]+'. Move the opening, shorten/remove the obstruction, or reduce the required clearance.');}}
}
