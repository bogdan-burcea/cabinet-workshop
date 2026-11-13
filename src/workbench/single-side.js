import {transformOperation} from '../machining.js';
const E=1e-5;
const face=o=>o.sign<0?'A':'B';
export function reversibleBore(part,o){
 if(o.type!=='bore'||o.axis!==2)return false;
 const t=part.thickness,z=o.point[2],end=z+o.sign*o.depth;
 if(Math.abs(z-(o.sign<0?t:0))>E)return false;
 if(Math.abs(end-(o.sign<0?0:t))<E)return true;
 // A side clearance terminating exactly at the opposite dado floor is open
 // through the remaining skin. Require the entire bore to lie inside that relief.
 if(o.label!=='Assembly clearance')return false;
 return part.flatOperations.some(p=>p.type==='pocket'&&p.axis===2&&p.sign===-o.sign&&Math.abs(end-(o.sign>0?p.box[2]:p.box[2]+p.box[5]))<E&&Math.abs((p.sign<0?p.box[2]+p.box[5]:p.box[2])-(p.sign<0?t:0))<E&&o.point[0]-o.diameter/2>=p.box[0]-E&&o.point[0]+o.diameter/2<=p.box[0]+p.box[3]+E&&o.point[1]-o.diameter/2>=p.box[1]-E&&o.point[1]+o.diameter/2<=p.box[1]+p.box[4]+E);
}
export function oneSidePart(part){
 const fixed=(part.flatOperations||[]).filter(o=>o.axis===2&&!reversibleBore(part,o)),faces=new Set(fixed.map(face));
 if(faces.size>1)throw Error(`${part.code} (${part.row[0]}) has blind features on both faces. One-side machining cannot preserve them. Change construction or turn off One-side flat machining for this project.`);
 const originalFace=faces.values().next().value||'A',sign=originalFace==='A'?-1:1,t=part.thickness;let redirected=0;
 const operations=part.flatOperations.map(o=>{let a=structuredClone(o);if(o.axis===2&&face(o)!==originalFace){if(!reversibleBore(part,o))throw Error(part.code+': a blind feature cannot move to the machining face.');a={...a,sign,point:[o.point[0],o.point[1],sign<0?t:0],depth:t};redirected++;}if(originalFace==='B')a=transformOperation(a,([x,y,z])=>[part.width-x,y,t-z],([x,y,z])=>[-x,y,-z]);return a;});
 const hasFeatures=fixed.length>0,up=/^Door/.test(part.row[0])&&hasFeatures?'Door inside / hinge-cup face up':/side$/.test(part.row[0])&&hasFeatures?'Cabinet inside face up':hasFeatures?'Groove / drilling face up':'Chosen show face down; plain face up';
 const frontEdge=originalFace==='B'&&part.frontEdge?.startsWith('x')?(part.frontEdge==='xMin'?'xMax':'xMin'):part.frontEdge;
 return {...part,...(frontEdge?{frontEdge}:{}),...(originalFace==='B'&&part.edgeBand?{edgeBand:{...part.edgeBand,xMin:part.edgeBand.xMax,xMax:part.edgeBand.xMin}}:{}),flatOperations:operations,flatHoles:(part.flatHoles||[]).map(h=>originalFace==='B'?{...h,x:part.width-h.x-h.width}:{...h}),singleSide:true,originalFace,redirected,orientation:`${up}. Keep this face up for every flat program. Do not flip during flat machining.`};
}
export function manufacturingParts(parts,singleSide=true){return parts.map(p=>{const secondaryOperations=p.flatOperations.filter(o=>o.label==='Foot plate pilot'&&!reversibleBore(p,o)&&o.sign>0),main={...p,flatOperations:p.flatOperations.filter(o=>o.label!=='Foot plate pilot'||reversibleBore(p,o)||o.sign<0)};return {...(singleSide?oneSidePart(main):{...main,singleSide:false}),secondaryOperations,secondaryFace:secondaryOperations.length?'Bottom underside':null};});}
