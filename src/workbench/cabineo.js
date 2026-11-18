import {golaOperations} from './gola.js';
// Lamello Operating_instructions_Cabineo.pdf, 26 February 2024, p.2:
// surface-mounted collar, option 1 (three Ø15 bores). Not flush/HPL/M6/X.
export const cabineoDefaults={assemblyConnector:'screws',cabineoSetback:50};
export const cabineoVariants={cabineo8:{name:'Lamello Cabineo 8',length:8,article:'267.91.251'},cabineo12:{name:'Lamello Cabineo 12',length:12,article:'267.91.252'}};
export function checkedCabineo(c){
 const connector=c.assemblyConnector??'screws';
 if(!['screws',...Object.keys(cabineoVariants)].includes(connector))throw Error('Choose screws, Cabineo 8 or Cabineo 12 for assembly.');
 if(!Number.isFinite(c.cabineoSetback??50)||(c.cabineoSetback??50)<20||(c.cabineoSetback??50)>300)throw Error('Cabineo end setback must be 20–300 mm.');
 return c.assembly?cabineoVariants[connector]:undefined;
}
export function cabineoOperations(c,rows){
 const variant=checkedCabineo(c);if(!variant)return [];
 if(c.bottomDado)throw Error('Cabineo requires butt joints. Disable Bottom in dados.');
 const t=c.thickness;if(t<variant.length+1)throw Error(variant.name+' needs a side panel at least '+(variant.length+1)+' mm thick.');
 const usable=c.depth-c.back-(c.backGroove?c.backInset:0),out=[],cuts=golaOperations(c,rows);
 for(const row of rows.filter(r=>['Bottom','Top','Front rail','Rear rail','Fixed shelf','Upper back rail','Lower back rail'].includes(r[0]))){
  const vertical=/back rail$/.test(row[0]),[name,x,y,z,w,d,h]=row,upper=name==='Top'||name.endsWith('rail')||name==='Fixed shelf',face=vertical?y:upper?z:z+h,sign=vertical?1:upper?1:-1;
  if((vertical?d:h)<12)throw Error(variant.name+' housing needs a horizontal panel at least 12 mm thick.');
  // Measure from surviving rail edges after the GOLA recess, not cabinet depth.
  let intervals=vertical?[[z,z+h]]:[[y,Math.min(y+d,usable)]];
  for(const cut of cuts.filter(o=>o.part===name&&!vertical)){const lo=cut.box[1],hi=lo+cut.box[4];intervals=intervals.flatMap(([a,b])=>hi<=a||lo>=b?[[a,b]]:[[a,Math.max(a,lo)],[Math.min(b,hi),b]].filter(([u,v])=>v-u>1e-6));}
  const [front,back]=intervals.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0]??[0,0],span=back-front;
  if(span<40)throw Error(name+': '+variant.name+' needs at least 40 mm of wood beyond the GOLA cut. Increase rail width or reduce rail recess depth.');
  const rail=name.endsWith('rail'),setback=rail?Math.min(c.cabineoSetback??50,Math.max(10,(span-20)/2)):Math.min(c.cabineoSetback??50,span/2),first=front+setback,last=back-setback,steps=Math.max(1,Math.ceil((last-first)/300));
  const positions=rail?(vertical||name==='Rear rail'||d<100?[(front+back)/2]:[first,last]):last-first<1e-6?[first]:Array.from({length:steps+1},(_,i)=>first+(last-first)*i/steps);

  for(const [side,edge,inward]of [['Left side',x,1],['Right side',x+w,-1]])for(const [index,along]of positions.entries()){
   const group=name+'/'+side+'/'+index;
   for(const [j,offset]of [3.6,14.8,26].entries())out.push({type:'bore',part:name,label:variant.name+' housing',axis:vertical?1:2,sign,point:vertical?[edge+inward*offset,face,along]:[edge+inward*offset,along,face],diameter:15,depth:11,cabineoGroup:group,...(j===0?{edgeOpening:[-inward,0,0]}:{})});
   out.push({type:'bore',part:side,label:variant.name+' fixing',axis:0,sign:-inward,point:vertical?[edge,face+sign*5,along]:[edge,along,face+sign*5],diameter:5,depth:variant.length});
  }
  if(vertical){
   const top=name==='Upper back rail',target=rows.find(r=>r[0]===(top?'Top':'Bottom'))||top&&rows.find(r=>r[0]==='Rear rail');
   if(!target)throw Error(name+': a top panel or rear top rail is required for the centre connector.');
   const edge=top?z+h:z,inward=top?-1:1,cx=x+w/2,group=name+'/centre';
   for(const [j,offset]of [3.6,14.8,26].entries())out.push({type:'bore',part:name,label:variant.name+' housing',cabineoCentre:true,axis:1,sign:1,point:[cx,y,edge+inward*offset],diameter:15,depth:11,cabineoGroup:group,...(j===0?{edgeOpening:[0,0,-inward]}:{})});
   out.push({type:'bore',part:target[0],label:variant.name+' fixing',cabineoCentre:true,axis:2,sign:-inward,point:[cx,y+5,edge],diameter:5,depth:variant.length});
  }
 }
 return out;
}
