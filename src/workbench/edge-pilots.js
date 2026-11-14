import {operationFace} from '../nesting.js';
import {svgEl} from './view.js';
const names={EDGE_X_MIN:'Left edge',EDGE_X_MAX:'Right edge',EDGE_Y_MIN:'Bottom edge',EDGE_Y_MAX:'Top edge'};
const fmt=v=>Number(v.toFixed(2));
export function edgePilotPlan(part){
 const ops=part.flatOperations.filter(o=>o.type==='bore'&&o.axis!==2);
 return [...new Set(ops.map(operationFace))].map(edge=>{
  const list=ops.filter(o=>operationFace(o)===edge),along=list[0].axis===0?1:0;
  return {edge,name:names[edge],length:along===1?part.height:part.width,thickness:part.thickness,datum:along===1?'bottom end':'left end',holes:list.map((o,i)=>({number:i+1,along:o.point[along],fromMachiningFace:part.thickness-o.point[2],diameter:o.diameter,depth:o.depth,label:o.label}))};
 });
}
export function drawEdgePilots(parent,part){
 parent.replaceChildren();const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;},plans=edgePilotPlan(part),container=make('div',null,'edge-diagrams');
 container.append(make('p','Reference face = the machining face shown in the main part drawing. Look at that face to identify left, right, top and bottom. Hole depth runs inward from the named edge. All dimensions are millimetres.','edge-reference'));
 const map=svgEl('svg',{viewBox:'0 0 680 260',role:'img','aria-label':part.code+' edge orientation viewed from machining face',class:'edge-orientation'});
 map.append(svgEl('rect',{x:220,y:48,width:240,height:155,fill:'#f4f4f4',stroke:'#8d8d8d'}));
 const text=(svg,x,y,value,attrs={})=>svg.append(svgEl('text',{x,y,'font-size':14,fill:'#393939',...attrs},value));
 text(map,340,26,'TOP',{'text-anchor':'middle'});text(map,340,233,'BOTTOM',{'text-anchor':'middle'});text(map,184,130,'LEFT',{'text-anchor':'end'});text(map,496,130,'RIGHT');text(map,340,119,'MACHINING FACE',{'text-anchor':'middle','font-weight':600});text(map,340,143,'same orientation as the part drawing',{'text-anchor':'middle','font-size':12});
 const lines={EDGE_X_MIN:[220,48,220,203],EDGE_X_MAX:[460,48,460,203],EDGE_Y_MIN:[220,203,460,203],EDGE_Y_MAX:[220,48,460,48]};
 for(const p of plans){const [x1,y1,x2,y2]=lines[p.edge];map.append(svgEl('line',{x1,y1,x2,y2,stroke:'#0f62fe','stroke-width':4}));}
 text(map,340,256,'Blue edges contain pilots. Each edge drawing marks its own zero end.',{'text-anchor':'middle','font-size':12});container.append(map);
 for(const p of plans){
  const block=make('section',null,'edge-detail'),height=200+p.holes.length*62,svg=svgEl('svg',{viewBox:`0 0 680 ${height}`,role:'img','aria-label':part.code+' '+p.name+' dimensioned pilot drawing',class:'edge-section'}),x0=70,x1=590,y0=66,y1=114;
  block.append(make('h3',p.name+' · zero at the '+p.datum));
  const line=(a,b,c,d,attrs={})=>svg.append(svgEl('line',{x1:a,y1:b,x2:c,y2:d,stroke:'#8d8d8d','stroke-width':1,...attrs}));
  const dimension=(a,b,y,label)=>{line(a,y,b,y);for(const x of [a,b])line(x,y-5,x,y+5);text(svg,(a+b)/2,y-8,label,{'text-anchor':'middle'});};
  svg.append(svgEl('rect',{x:x0,y:y0,width:x1-x0,height:y1-y0,fill:'#edf5ff',stroke:'#8d8d8d'}));line(x0,y0,x1,y0,{stroke:'#0043ce','stroke-width':3});text(svg,x0,y0-12,'Machining face / reference surface',{'font-size':13,fill:'#0043ce'});
  dimension(x0,x1,28,fmt(p.length)+' mm edge length');line(624,y0,624,y1);line(619,y0,629,y0);line(619,y1,629,y1);text(svg,642,(y0+y1)/2,fmt(p.thickness)+' mm',{'text-anchor':'middle',transform:`rotate(90 642 ${(y0+y1)/2})`});
  line(x0,y0-5,x0,157,{stroke:'#161616','stroke-dasharray':'3 3'});text(svg,x0,151,'0',{'text-anchor':'middle','font-weight':600});
  for(const h of p.holes){const x=x0+h.along/p.length*(x1-x0),y=y0+h.fromMachiningFace/p.thickness*(y1-y0),dimY=180+(h.number-1)*28;
   svg.append(svgEl('circle',{cx:x,cy:y,r:5,fill:'#fff',stroke:'#0f62fe','stroke-width':1.5}));text(svg,x,y-10,String(h.number),{'text-anchor':'middle','font-size':12,'font-weight':600});line(x,y+7,x,dimY+5,{'stroke-dasharray':'2 3'});dimension(x0,x,dimY,'Hole '+h.number+': '+fmt(h.along)+' mm');
  }
  const labelY=210+p.holes.length*28;for(const [i,h]of p.holes.entries())text(svg,28,labelY+i*31,`${h.number}. Ø${fmt(h.diameter)} × ${fmt(h.depth)} deep · ${fmt(h.along)} from ${p.datum} · ${fmt(h.fromMachiningFace)} from machining face`,{'font-size':14});
  text(svg,28,height-12,'Schematic section: thickness is enlarged for clarity.',{'font-size':12,fill:'#6f6f6f'});block.append(svg);container.append(block);
 }
 if(!plans.length)container.append(make('p','This part has no edge pilots.'));
 parent.append(container);
}
