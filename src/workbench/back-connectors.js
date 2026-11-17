import {wallHangerOperations} from './wall-hangers.js';
// Häfele catalogue FF 2.56: RPC S 15/25, 260.09.765.
// Ø15 × 12.5 bore in the captured-back groove; no machining in the back itself.
export const backConnectorDefaults={backConnector:'none',backConnectorsPerSide:2};
export function checkedBackConnector(c,{fit=true}={}){
 const v={...backConnectorDefaults,...c};if(!['none','hafele_26009765'].includes(v.backConnector))throw Error('Choose no back connector or Häfele Ixconnect 260.09.765.');
 if(!Number.isInteger(v.backConnectorsPerSide)||v.backConnectorsPerSide<1||v.backConnectorsPerSide>20)throw Error('Back connectors per side must be a whole number from 1 to 20.');
 if(v.backConnector==='none'||!fit)return v;
 if(v.thickness<15)throw Error('Häfele Ixconnect 260.09.765 requires at least 15 mm stock.');
 if(v.back<2.5||v.back>3.5)throw Error('Häfele Ixconnect 260.09.765 requires a 2.5–3.5 mm back panel. Change Back thick. before selecting it.');
 if(!v.backGroove||v.grooveDepth>6)throw Error('Häfele Ixconnect 260.09.765 requires a captured back groove no deeper than 6 mm.');
 if(v.backInset+v.back/2<12-1e-6)throw Error('Häfele Ixconnect 260.09.765 bore centre must be at least 12 mm from the rear edge. Increase back inset.');
 return v;
}
export function backConnectorOperations(c,rows){
 if((c.backConnector??'none')==='none')return [];
 const v=checkedBackConnector({...c,backGroove:c.machining.back,grooveDepth:c.machining.backDepth,backInset:c.machining.backInset});if(v.backConnector==='none')return [];
 const b=rows.find(r=>r[0]==='Back'),top=rows.find(r=>r[0]==='Top')||rows.find(r=>r[0]==='Rear rail'),bottom=rows.find(r=>r[0]==='Bottom');
 if(!b||!top||!bottom)throw Error('The back connector requires a back, top (or rear rail) and bottom panel.');
 const count=v.backConnectorsPerSide,radius=7.5,clearance=50,notches=wallHangerOperations(c,rows).filter(o=>o.type==='pocket'),ops=[],backCentre=b[2]+b[5]/2;
 const bore=(part,axis,sign,point)=>({type:'bore',part,label:'Häfele Ixconnect 260.09.765',axis,sign,point,diameter:15,depth:12.5,rpcConnector:true});
 for(const [part,x,,z,w]of rows.filter(r=>/^(Left|Right) side$/.test(r[0]))){
  const cuts=notches.filter(o=>o.part==='Back'||o.part===part),lo=b[3]+50,hi=Math.min(b[3]+b[6]-50,...cuts.map(o=>o.box[2]-clearance-radius));
  if(hi<lo||count>1&&(hi-lo)/(count-1)<30)throw Error('Too many back connectors for the available space. Reduce connectors per side; keep 50 mm clear of the wall notches and at least 30 mm pitch.');
  const heights=count===1?[Math.min((b[3]*2+b[6])/2,hi)]:Array.from({length:count},(_,i)=>lo+(hi-lo)*i/(count-1));
  ops.push(...heights.map(height=>bore(part,0,part==='Left side'?-1:1,[part==='Left side'?x+w:x,backCentre,height])));
 }
 ops.push(bore(top[0],2,1,[top[1]+top[4]/2,backCentre,top[3]]),bore(bottom[0],2,-1,[bottom[1]+bottom[4]/2,backCentre,bottom[3]+bottom[6]]));
 // Check actual cut envelopes as well as the side-row setback. This protects
 // the centred top fixing on narrow units and unusually large rail notches.
 for(const op of ops)for(const cut of notches){const low=op.point.map((v,k)=>k===op.axis?Math.min(v,v+op.sign*op.depth):v-radius),high=op.point.map((v,k)=>k===op.axis?Math.max(v,v+op.sign*op.depth):v+radius),distance=Math.hypot(...low.map((v,k)=>Math.max(0,v-cut.box[k]-cut.box[k+3],cut.box[k]-high[k])));if(distance<clearance-1e-6)throw Error(op.part+': back connector needs 50 mm clearance from wall-mount notches. Increase cabinet size or change the fixing layout.');}
 return ops;
}
