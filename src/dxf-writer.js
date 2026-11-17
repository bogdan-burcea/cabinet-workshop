// Conservative ASCII R12: explicit tables and closed 2D POLYLINE/VERTEX
// records, without post-R12 subclass markers or lightweight polylines.
export class DxfWriter {
 constructor(){this.entities=[];this.layers=new Set(['0']);this.serial=256;}
 add(...tags){this.entities.push(...tags.map(String));}
 entity(type,layer){this.layers.add(layer);this.add(0,type,5,(++this.serial).toString(16).toUpperCase(),8,layer);}
 number(n){if(!Number.isFinite(n))throw Error('DXF geometry contains an invalid coordinate.');return Number(n.toFixed(6));}
 rect(x,y,w,h,layer){if(!(w>0&&h>0))throw Error('DXF contours need positive dimensions.');this.entity('POLYLINE',layer);this.add(66,1,10,0,20,0,30,0,70,1);for(const [u,v]of [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]){this.entity('VERTEX',layer);this.add(10,this.number(u),20,this.number(v),30,0,70,0);}this.entity('SEQEND',layer);}
 polygon(points,layer){this.entity('POLYLINE',layer);this.add(66,1,10,0,20,0,30,0,70,1);for(const [x,y]of points){this.entity('VERTEX',layer);this.add(10,this.number(x),20,this.number(y),30,0,70,0);}this.entity('SEQEND',layer);}
 circle(x,y,r,layer){if(!(r>0))throw Error('DXF circles need a positive radius.');this.entity('CIRCLE',layer);this.add(10,this.number(x),20,this.number(y),30,0,40,this.number(r));}
 text(x,y,value,height=10){this.entity('TEXT','LABELS');this.add(7,'STANDARD',10,this.number(x),20,this.number(y),30,0,40,height,1,String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,'?').replace(/[\\\r\n]/g,' '),50,0);}
 finish(){const out=[],add=(...a)=>out.push(...a.map(String));add(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1009',9,'$DWGCODEPAGE',3,'ANSI_1252',9,'$INSUNITS',70,4,9,'$MEASUREMENT',70,1,9,'$LUNITS',70,2,9,'$LUPREC',70,3,0,'ENDSEC');
  add(0,'SECTION',2,'TABLES',0,'TABLE',2,'LTYPE',70,1,0,'LTYPE',2,'CONTINUOUS',70,0,3,'Solid line',72,65,73,0,40,0,0,'ENDTAB');
  add(0,'TABLE',2,'LAYER',70,this.layers.size);for(const layer of this.layers)add(0,'LAYER',2,layer,70,0,62,layer==='STOCK'?8:layer==='LABELS'?7:layer.startsWith('DRILL')?5:layer.startsWith('DADO')?4:7,6,'CONTINUOUS');add(0,'ENDTAB');
  add(0,'TABLE',2,'STYLE',70,1,0,'STYLE',2,'STANDARD',70,0,40,0,41,1,50,0,71,0,42,2.5,3,'txt',4,'',0,'ENDTAB',0,'ENDSEC',0,'SECTION',2,'BLOCKS',0,'ENDSEC',0,'SECTION',2,'ENTITIES');for(const tag of this.entities)out.push(tag);add(0,'ENDSEC',0,'EOF');return out.join('\r\n')+'\r\n';}
}
