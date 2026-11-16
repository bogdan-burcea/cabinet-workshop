import {deflateSync,inflateSync} from 'fflate';
import {previewSnapshot,partThumbnailPdf} from './part-thumbnail.js';
import QRCode from 'qrcode';
import {mm,pdfNumber,pdfText,pdfRect,fitText,textWidth,vectorPdf} from '../pdf-writer.js';
export const labelDefaults={width:64,height:34,left:6.5,top:12.5,gapX:2.5,gapY:0,start:0};
export function checkedLabelPaper(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Label paper settings must be an object.');
 const s={...labelDefaults,...input};
 for(const [key,min,max]of [['width',40,210],['height',25,297],['left',0,18],['top',0,25],['gapX',0,9],['gapY',0,3]])if(!Number.isFinite(s[key])||s[key]<min||s[key]>max)throw Error('Label '+key+' must be '+min+'–'+max+' mm.');
 const grid=labelGrid(s);
 if(!grid.columns||!grid.rows)throw Error('The label size must fit A4 (210 × 297 mm). Reduce size, margins or gaps.');
 if(!Number.isInteger(s.start)||s.start<0||s.start>=grid.capacity)throw Error('Skip used labels must be 0–'+(grid.capacity-1)+' for labels that fit A4.');
 return s;
}
export function labelGrid(s){const columns=Math.floor((210-s.left+s.gapX+.00001)/(s.width+s.gapX)),rows=Math.floor((297-s.top+s.gapY+.00001)/(s.height+s.gapY));return {columns,rows,capacity:columns*rows};}

const round=n=>Number(n.toFixed(1));
export function labelBandSummary(p){const entries=Object.entries(p.edgeBand||{}).filter(([,v])=>v);if(!entries.length)return '';if(entries.length===4&&entries.every(([,v])=>v===entries[0][1]))return 'All edges '+round(entries[0][1])+' mm';if(entries.length===1&&entries[0][0]===p.frontEdge)return 'Front '+round(entries[0][1])+' mm';return entries.map(([k,v])=>({xMin:'L',xMax:'R',yMin:'B',yMax:'T'}[k])+round(v)).join(' ')+' mm';}
export function labelSnapshot(p){return {v:2,f:previewSnapshot(p),h:(p.flatHoles||[]).map(h=>[h.x,h.y,h.width,h.height]),c:p.code,o:p.owner,n:p.row[0],d:[p.width,p.height,p.thickness].map(round),m:p.material,b:Object.entries(p.edgeBand||{}).filter(([,v])=>v).map(([k,v])=>k+':'+round(v)).join(' ')};}
export function partLabelUrl(p,base='https://bogdan-burcea.github.io/cabinet-workshop/'){const a=labelSnapshot(p),json=JSON.stringify([a.c,a.o,a.n,a.d,a.m,a.b,a.f,a.h]),bytes=deflateSync(new TextEncoder().encode(json),{level:9});let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return base.split('#')[0]+'#p='+btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function readPartLabel(hash){const compact=hash.startsWith('#p='),compressed=compact||hash.startsWith('#label2=');if(!compressed&&!hash.startsWith('#label='))return null;if(hash.length>12000)throw Error('This part label is too long.');const raw=atob(hash.slice(compact?3:compressed?8:7).replaceAll('-','+').replaceAll('_','/')),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),json=compressed?inflateSync(bytes,{out:new Uint8Array(64000)}):bytes,parsed=JSON.parse(new TextDecoder().decode(json)),a=compact?{v:2,c:parsed[0],o:parsed[1],n:parsed[2],d:parsed[3],m:parsed[4],b:parsed[5],f:parsed[6],h:parsed[7]}:parsed;if(![1,2].includes(a?.v)||!Array.isArray(a.d)||a.d.length!==3||a.d.some(n=>!Number.isFinite(n)||n<=0||n>100000)||['c','o','n','m','b'].some(k=>typeof a[k]!=='string'||a[k].length>300))throw Error('This part label is invalid.');if(a.v===2){if(!Array.isArray(a.f)||a.f.length>500||a.f.some(o=>!Array.isArray(o)||o.length!==(o[0]===0?8:9)||![0,1].includes(o[0])||![0,1,2].includes(o[1])||![-1,1].includes(o[2])||o.some(n=>!Number.isFinite(n)||Math.abs(n)>100000))||!Array.isArray(a.h)||a.h.length>100||a.h.some(h=>!Array.isArray(h)||h.length!==4||h.some(n=>!Number.isFinite(n)||n<0||n>100000)))throw Error('This label has invalid feature geometry.');}return a;}

export function labelSlots(count,input={}){const s=checkedLabelPaper(input),{columns,rows,capacity}=labelGrid(s);return Array.from({length:count},(_,i)=>{const slot=i+s.start;return {page:Math.floor(slot/capacity),x:s.left+(slot%columns)*(s.width+s.gapX),y:s.top+(Math.floor(slot/columns)%rows)*(s.height+s.gapY),width:s.width,height:s.height};});}
export function labelNameLine(p){const dimensions=round(p.width)+' x '+round(p.height)+' mm',size=7,name=fitText(p.row[0],59*mm-textWidth(dimensions,size)-3*mm,size);return name+'   '+dimensions;}
export function partLabelsPdf(parts,input={},base,calibration=false){
 const paper=checkedLabelPaper(calibration?{...input,start:0}:input),slots=labelSlots(calibration?labelGrid(paper).capacity:parts.length,paper),pages=Array.from({length:Math.max(1,...slots.map(s=>s.page+1))},()=>''),W=210*mm,H=297*mm;
 for(const [i,slot]of slots.entries()){const x=slot.x*mm,y=H-(slot.y+slot.height)*mm,w=slot.width*mm,h=slot.height*mm,scale=Math.min(slot.width/64,slot.height/34),cx=x+(w-64*mm*scale)/2,cy=y+(h-34*mm*scale)/2;let c='q\n0 g\n';
  if(calibration){c+='0 G 0.35 w\n'+pdfRect(x,y,w,h)+pdfText(x+4*mm*scale,y+h-6*mm*scale,8*scale,'Label '+(i+1)+' | '+round(slot.width)+' x '+round(slot.height)+' mm','F2')+pdfText(x+4*mm*scale,y+h-12*mm*scale,6.5*scale,'A4 portrait | actual size / 100%')+pdfText(x+4*mm*scale,y+5*mm*scale,6.5*scale,'Check margins before label stock');}
  else{const p=parts[i],a=labelSnapshot(p),qr=QRCode.create(partLabelUrl(p,base),{errorCorrectionLevel:'L'}),size=qr.modules.size,pixel=72/300,box=22*mm*scale,unit=Math.floor(box/(size+8)/pixel)*pixel,extent=unit*(size+8),qx=Math.round((cx+40.5*mm*scale+(box-extent)/2)/pixel)*pixel,qy=Math.round((cy+2*mm*scale+(box-extent)/2)/pixel)*pixel;
   if(unit<pixel)throw Error('Label size is too small for this part QR code at 300 dpi. Increase label width or height.');
   // Four blank modules on every side are the mandatory quiet zone.
   for(let row=0;row<size;row++)for(let col=0;col<size;col++)if(qr.modules.get(row,col))c+=pdfRect(qx+(col+4)*unit,qy+(size-row+3)*unit,unit+.003,unit+.003,'f');
   const tx=cx+2.5*mm*scale,limit=59*mm*scale;c+=pdfText(tx,cy+29*mm*scale,8.5*scale,fitText(a.c+' | '+a.o,limit,8.5*scale,'F2'),'F2')+pdfText(tx,cy+25*mm*scale,7*scale,labelNameLine(p));c+=partThumbnailPdf(p,tx,cy+2*mm*scale,36*mm*scale,21*mm*scale);
  }pages[slot.page]+=c+'Q\n';
 }
 return vectorPdf(pages,W,H);
}
