import {transformOperation,validateOperations} from '../machining.js';
export function bandPart(part,settings,override={}){
 if(!settings)return part;
 const t=settings.thickness||0;const name=part.row[0],band={xMin:0,xMax:0,yMin:0,yMax:0};
 if(settings.doors&&(/^Door/.test(name)||/overlay front$/.test(name))){if(part.glassFramePart){const r=part.glassFramePart;if(r==='left stile')band.xMin=t;if(r==='right stile')band.xMax=t;if(r.includes('stile'))band.yMin=band.yMax=t;else band[r==='bottom rail'?'yMin':'yMax']=t;}else Object.keys(band).forEach(k=>band[k]=t);}
 if(settings.fronts&&part.frontEdge&&((!/^Drawer /.test(name)&&/side$/.test(name))||name==='Bottom'||name==='Top'||name==='Front rail'||/^Shelf /.test(name)))band[part.frontEdge]=t;
 const bandDefaults={...band};Object.assign(band,override);if(!Object.values(band).some(Boolean))return {...part,bandDefaults};
 const w=part.width-band.xMin-band.xMax,h=part.height-band.yMin-band.yMax;if(w<=0||h<=0)throw Error(name+': edgebanding leaves no core panel.');
 const move=([x,y,z])=>[x-band.xMin,y-band.yMin,z],ops=part.flatOperations.map(o=>transformOperation(o,move,v=>v)).map(o=>{if(o.type!=='pocket')return o;const b=[...o.box];for(const [i,max]of [[0,w],[1,h]]){const end=Math.min(max,b[i]+b[i+3]);b[i]=Math.max(0,b[i]);b[i+3]=end-b[i];}return {...o,box:b};});
 validateOperations({[name]:[0,0,0,w,h,part.thickness]},ops,e=>{throw Error(name+': edgeband deduction: '+e);});
 const row=[...part.row],axis=part.thicknessAxis??part.row.slice(4).indexOf(part.thickness),axes=[0,1,2].filter(a=>a!==axis);row[axes[0]+1]+=band.xMin;row[axes[1]+1]+=band.yMin;row[axes[0]+4]=w;row[axes[1]+4]=h;
 return {...part,bandDefaults,row,width:w,height:h,finishedWidth:part.width,finishedHeight:part.height,edgeBand:band,coreOffset:{x:band.xMin,y:band.yMin},flatOperations:ops,flatHoles:part.flatHoles.map(a=>({...a,x:a.x-band.xMin,y:a.y-band.yMin}))};
}
