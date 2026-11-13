import {boxTopology} from './topology.js';
import {assertCutouts,partRows} from './model.js';
// ISO 10303-21 / AP203: closed, consistently oriented planar B-rep solids.
// This exporter handles the rectangular panels and rectangular worktop through-cutouts.
export function step(p){assertCutouts(p);return stepRows(partRows(p));}
export function stepRows(rows){if(rows.some(r=>r.operations?.length))throw Error('Machined panels require the CAD STEP exporter.');let lines=[],n=0;const entity=s=>{lines.push(`#${++n}=${s};`);return '#'+n;};
 const str=s=>"'"+String(s).replace(/[^\x20-\x7e]/g,'?').replaceAll("'","''")+"'";
 const number=v=>{const s=Number(v.toFixed(7)).toString();return /[.eE]/.test(s)?s:s+'.';};
 const point=xyz=>entity(`CARTESIAN_POINT('',(${xyz.map(number).join(',')}))`);
 const dir=xyz=>entity(`DIRECTION('',(${xyz.map(number).join(',')}))`);
 const application=entity("APPLICATION_CONTEXT('configuration controlled 3d designs of mechanical parts and assemblies')");
 entity(`APPLICATION_PROTOCOL_DEFINITION('international standard','config_control_design',1994,${application})`);
 const context=entity(`PRODUCT_CONTEXT('',${application},'mechanical')`);
 const product=entity(`PRODUCT('Kitchen','Kitchen Planner','',(${context}))`);
 const formation=entity(`PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE('','',${product},.NOT_KNOWN.)`);
 const defcontext=entity(`PRODUCT_DEFINITION_CONTEXT('part definition',${application},'design')`);
 const definition=entity(`PRODUCT_DEFINITION('design','',${formation},${defcontext})`);
 const definitionShape=entity(`PRODUCT_DEFINITION_SHAPE('','',${definition})`);
 const unit=entity('(LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.))');
 const angle=entity('(NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.))');
 const solidangle=entity('(NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT())');
 const uncertainty=entity(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-7),${unit},'distance_accuracy_value','')`);
 const representationContext=entity(`(GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${uncertainty})) GLOBAL_UNIT_ASSIGNED_CONTEXT((${unit},${angle},${solidangle})) REPRESENTATION_CONTEXT('',''))`);
 const solids=[];
 for(const {owner,row,holes=[]} of rows){
  const {vertices:xyz,faces:faceData}=boxTopology(row,holes),points=xyz.map(point),vertices=points.map(pt=>entity(`VERTEX_POINT('',${pt})`)),edges=new Map(),faces=[];
  for(const face of faceData){const bounds=[];
   face.loops.forEach((loop,loopIndex)=>{const oriented=[];
    for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],key=[Math.min(a,b),Math.max(a,b)].join(':');let edge=edges.get(key),same=true;
     if(!edge){const vec=xyz[b].map((v,j)=>v-xyz[a][j]),length=Math.hypot(...vec),direction=dir(vec.map(v=>v/length)),vector=entity(`VECTOR('',${direction},${number(length)})`),line=entity(`LINE('',${points[a]},${vector})`);
      edge={id:entity(`EDGE_CURVE('',${vertices[a]},${vertices[b]},${line},.T.)`),start:a};edges.set(key,edge);
     }else same=edge.start===a;
     oriented.push(entity(`ORIENTED_EDGE('',*,*,${edge.id},.${same?'T':'F'}.)`));
    }
    const loopEntity=entity(`EDGE_LOOP('',(${oriented.join(',')}))`);
    bounds.push(entity(`${loopIndex?'FACE_BOUND':'FACE_OUTER_BOUND'}('',${loopEntity},.T.)`));
   });
   const loop=face.loops[0],refVector=xyz[loop[1]].map((v,j)=>v-xyz[loop[0]][j]),length=Math.hypot(...refVector);
   const axis=entity(`AXIS2_PLACEMENT_3D('',${points[loop[0]]},${dir(face.normal)},${dir(refVector.map(v=>v/length))})`),plane=entity(`PLANE('',${axis})`);
   faces.push(entity(`ADVANCED_FACE('',(${bounds.join(',')}),${plane},.T.)`));
  }
  const shell=entity(`CLOSED_SHELL('',(${faces.join(',')}))`);solids.push(entity(`MANIFOLD_SOLID_BREP(${str(owner+' / '+row[0])},${shell})`));
 }
 if(!solids.length)throw Error('Add a cabinet or worktop before exporting STEP.');
 const repr=entity(`ADVANCED_BREP_SHAPE_REPRESENTATION('Kitchen',(${solids.join(',')}),${representationContext})`);
 entity(`SHAPE_DEFINITION_REPRESENTATION(${definitionShape},${repr})`);
 return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('Kitchen Planner panel solids and worktop cutouts'),'2;1');\nFILE_NAME('Kitchen.step','${new Date().toISOString()}',(''),(''),'Kitchen Planner','Kitchen Planner','');\nFILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));\nENDSEC;\nDATA;\n${lines.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}
