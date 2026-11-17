import {makeBox,makeCylinder,makeCompound,exportSTEP,measureVolume,getOC,GCWithScope,makePolygon,basicFaceExtrusion,Vector} from 'replicad';
export function buildPart({row,holes=[],operations=[]}){const [,x,y,z,w,d,h]=row;let solid=makeBox([x,y,z],[x+w,y+d,z+h]);const tools=[],pockets=[];
 try{for(const a of holes)tools.push(makeBox([a.x,a.y,z-.001],[a.x+a.width,a.y+a.depth,z+h+.001]));for(const o of operations){if(o.type==='pocket'){const b=o.box;if(o.cutPolygon){const face=makePolygon(o.cutPolygon.map(p=>p.map((v,k)=>k===o.axis?b[k]:v))),direction=new Vector([0,1,2].map(i=>i===o.axis?b[i+3]:0));try{pockets.push(basicFaceExtrusion(face,direction));}finally{face.delete();direction.delete();}}else pockets.push(makeBox(b.slice(0,3),b.slice(0,3).map((v,i)=>v+b[i+3])));}else{const vector=[0,1,2].map(i=>i===o.axis?o.sign:0),start=o.point.map((v,i)=>v-vector[i]*.001);(o.cabineoGroup||o.dovetailGroup?pockets:tools).push(makeCylinder(o.diameter/2,o.depth+.001,start,vector));}}for(const pocket of pockets){const next=solid.cut(pocket);solid.delete();solid=next;}if(tools.length){const compound=makeCompound(tools);try{const next=solid.cut(compound);solid.delete();solid=next;}finally{compound.delete();}}if(!(measureVolume(solid)>0))throw Error('Machining removed the whole part.');return solid;}catch(e){solid.delete();throw e;}finally{for(const tool of [...tools,...pockets])tool.delete();}}
// One product containing independent solids imports as bodies rather than an assembly.
const stepName=value=>String(value).replaceAll('\\','\\X2\\005C\\X0\\').replaceAll("'","''").replace(/[^\x20-\x7e]/g,c=>'\\X2\\'+c.charCodeAt(0).toString(16).padStart(4,'0').toUpperCase()+'\\X0\\');
export async function cadStep(rows,onProgress=()=>{}){
 if(!rows.length)throw Error('Choose a sheet containing parts.');
 const shapes=[];let compound;
 try{
  for(let i=0;i<rows.length;i++){const part=rows[i];try{shapes.push(buildPart(part));}catch(e){throw Error(part.owner+' / '+part.row[0]+': CAD cut failed. '+(e?.message||'Check machining dimensions.'));}onProgress(i+1,rows.length);}
  compound=makeCompound(shapes);
  const text=await exportSTEP([{shape:compound,name:'Nested sheet',color:'#b8bec5'}],{unit:'MM',modelUnit:'MM'}).text();
  // XCAF names the single product; give each B-rep body its part identity too.
  let index=0;
  const named=text.replace(/MANIFOLD_SOLID_BREP\('(?:''|[^'])*'/g,()=>{const part=rows[index++];if(!part)throw Error('Unexpected extra solid in sheet STEP.');return "MANIFOLD_SOLID_BREP('"+stepName(part.owner+' / '+part.row[0])+"'";});
  if(index!==rows.length)throw Error('Sheet STEP body count does not match the nested parts.');
  return named;
 }finally{compound?.delete();for(const shape of shapes)shape.delete();}
}

export function cadMesh(part){const shape=buildPart(part);try{return {...shape.mesh({tolerance:.15,angularTolerance:.25}),edges:shape.meshEdges({tolerance:.15,angularTolerance:.25}).lines};}finally{shape.delete();}}

// One root assembly, one non-assembly compound per cabinet. XCAF component
// labels carry cabinet names; the B-reps inside each compound are panel bodies.
export async function cadAssemblyStep(rows,onProgress=()=>{}){
 if(!rows.length)throw Error('The assembly has no panels.');
 const oc=getOC(),r=GCWithScope(),shapes=[],compounds=[],groups=new Map();
 const str=s=>r(new oc.TCollection_ExtendedString(s,true));
 try{
  const doc=r(new oc.TDocStd_Document(str('XmlOcaf')));
  oc.XCAFDoc_ShapeTool.SetAutoNaming(false);
  const tool=r(oc.XCAFDoc_DocumentTool.ShapeTool(r(doc.Main()))),root=r(tool.NewShape());
  oc.TDataStd_Name.Set(root,str('Cabinet assembly'));
  for(const [i,part]of rows.entries()){
   let shape;try{shape=buildPart(part);}catch(e){throw Error(part.owner+' / '+part.row[0]+': CAD cut failed. '+(e?.message||''));}
   shapes.push(shape);const key=part.component;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({part,shape});onProgress(i+1,rows.length);
  }
  const ordered=[];
  for(const group of groups.values()){
   const compound=makeCompound(group.map(a=>a.shape));compounds.push(compound);
   const label=r(tool.NewShape());tool.SetShape(label,compound.wrapped);
   oc.TDataStd_Name.Set(label,str(group[0].part.owner));
   r(tool.AddComponent(root,label,r(new oc.TopLoc_Location())));
   ordered.push(...group.map(a=>a.part));
  }
  tool.UpdateAssemblies();
  const session=r(new oc.XSControl_WorkSession()),writer=r(new oc.STEPCAFControl_Writer(session,false));
  writer.SetNameMode(true);writer.SetColorMode(true);
  oc.Interface_Static.SetCVal('xstep.cascade.unit','MM');oc.Interface_Static.SetCVal('write.step.unit','MM');
  oc.Interface_Static.SetIVal('write.step.assembly',2);oc.Interface_Static.SetIVal('write.step.schema',5);
  const file='assembly.step';if(!writer.Perform(doc,file,r(new oc.Message_ProgressRange())))throw Error('Assembly STEP write failed.');
  let text;try{text=new TextDecoder().decode(oc.FS.readFile('/'+file));}finally{oc.FS.unlink('/'+file);}
  let i=0;const named=text.replace(/MANIFOLD_SOLID_BREP\('(?:''|[^'])*'/g,()=>{const part=ordered[i++];if(!part)throw Error('Unexpected assembly body.');return "MANIFOLD_SOLID_BREP('"+stepName(part.owner+' / '+part.row[0])+"'";});
  if(i!==ordered.length)throw Error('Assembly STEP body count does not match the panels.');
  return named;
 }finally{compounds.forEach(s=>s.delete());shapes.forEach(s=>s.delete());}
}
