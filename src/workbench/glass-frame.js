import {roundSeam,expandPolygon,clipToJointEdge} from './rounded-joint.js';
import {glassDimensions} from './doors.js';
import {validateOperations} from '../machining.js';

// Flat through-dovetails, cut face-up with an 8 mm straight end mill.
// Rails carry one tail at each end; stiles receive the matching socket.
// Rounded complementary mating corners replace visible drilled joint reliefs.
export function frameDoorParts(row,operations,c){
 const [name,x,y,z,w,t,h]=row,g=glassDimensions(w,h,c),f=g.frame,reach=20,radius=4,fit=c.machining?.clearance??.2;
 if(g.rebateDepth>t-3)throw Error(name+': '+(c.doorStyle==='shaker'?'Shaker panel rebate':'Glass rebate')+' must leave at least 3 mm of wood. Reduce the infill thickness or increase door stock.');
 const neck=Math.max(12,Math.min(f/3,f-2*(g.lap+radius+2)-10)),head=neck+10;
 const roles=[['left stile',x,z,f,h],['right stile',x+w-f,z,f,h],['bottom rail',x+f-reach,z,w-2*f+2*reach,f],['top rail',x+f-reach,z+h-f,w-2*f+2*reach,f]];
 const pieces=roles.map(([role,px,pz,pw,ph])=>({row:[name+' · '+role,px,y,pz,pw,t,ph],operations:[],frameStyle:c.doorStyle,drawerFrame:/^Drawer /.test(name),glassFramePart:role,glassDoor:{name,width:w,height:h,bounds:row.slice(1)},frameJoint:{type:'rounded-flat-dovetail',cutter:8,radius:4.5,reach,neck,head,clearance:fit}}));
 const contains=(p,o)=>{const a=p.row.slice(1);return [0,1,2].every(k=>{const lo=o.point[k]-(k===o.axis?0:o.diameter/2),hi=o.point[k]+(k===o.axis?0:o.diameter/2),end=o.point[k]+(k===o.axis?o.sign*o.depth:0);return Math.min(lo,end)>=a[k]-1e-6&&Math.max(hi,end)<=a[k]+a[k+3]+1e-6;});};
 for(const o of operations){const matches=pieces.filter(p=>contains(p,o));if(matches.length!==1)throw Error(name+': '+o.label+' crosses a frame joint or the glass opening. Move the handle/hinge fixing onto one stile or rail, or increase frame width.');matches[0].operations.push({...o,part:matches[0].row[0]});}
 const rebate=[x+f-g.lap,y+t-g.rebateDepth,z+f-g.lap,g.openingWidth+2*g.lap,g.rebateDepth,g.openingHeight+2*g.lap];
 for(const p of pieces){const a=p.row.slice(1),lo=a.slice(0,3).map((v,k)=>Math.max(v,rebate[k])),hi=a.slice(0,3).map((v,k)=>Math.min(v+a[k+3],rebate[k]+rebate[k+3]));p.operations.push({type:'pocket',part:p.row[0],label:'Glass rebate',axis:1,sign:-1,box:[...lo,...hi.map((v,k)=>v-lo[k])],maxToolDiameter:8});}
 // A square pane clears an 8 mm cutter's rounded rebate ends only with
 // these small extra reliefs. Centres are 3 mm in from the nominal corner;
 // the pane corner is 1 mm in, hence lies within the 4 mm cutter radius.
 for(const [index,px]of [[0,x+f-g.lap+3],[1,x+w-f+g.lap-3]])for(const pz of [z+f-g.lap+3,z+h-f+g.lap-3])pieces[index].operations.push({type:'bore',part:pieces[index].row[0],label:'Glass rebate corner relief',axis:1,sign:-1,point:[px,y+t,pz],diameter:8,depth:g.rebateDepth,glassRebateRelief:true});
 const pocket=(part,points,group)=>{const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),lo=[Math.min(...xs),y,Math.min(...zs)],hi=[Math.max(...xs),y+t,Math.max(...zs)];part.operations.push({type:'pocket',part:part.row[0],label:'Glass dovetail profile',axis:1,sign:-1,box:[...lo,...hi.map((v,k)=>v-lo[k])],cutPolygon:points.map(([px,pz])=>[px,y,pz]),dovetailGroup:group,maxToolDiameter:8});};
 for(const [railIndex,rz]of [[2,z],[3,z+h-f]])for(const left of [true,false]){
  const rail=pieces[railIndex],stile=pieces[left?0:1],edge=left?x+f:x+w-f,dir=left?-1:1,tip=edge+dir*reach,centre=rz+f/2,group=name+'/'+railIndex+'/'+left;
  const arcs=roundSeam([[edge,rz],[edge,centre-neck/2],[tip,centre-head/2],[tip,centre+head/2],[edge,centre+neck/2],[edge,rz+f]]),lower=arcs.slice(0,2).flat(),upper=arcs.slice(2).flat(),socket=clipToJointEdge(expandPolygon([...lower,...upper],fit/2),edge,dir);
  pocket(rail,[[edge,rz],[tip,rz],...lower.toReversed()],group);
  pocket(rail,[[edge,rz+f],[tip,rz+f],...upper],group);
  pocket(stile,socket,group);
 }
 for(const p of pieces)validateOperations({[p.row[0]]:p.row.slice(1)},p.operations,e=>{throw Error(e);});
 if(c.doorStyle==='shaker')pieces.push({row:[name+' · centre panel',x+f-g.lap+g.clearance/2,y+t-g.rebateDepth,z+f-g.lap+g.clearance/2,g.width,g.thickness,g.height],operations:[],shakerPanel:true,glassDoor:{name,width:w,height:h,bounds:row.slice(1)}});
 return pieces;
}
