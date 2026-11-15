import QRCode from 'qrcode';
import {mm,pdfNumber,pdfText,pdfRect,fitText,vectorPdf} from '../pdf-writer.js';
export const labelDefaults={left:6.5,top:12.5,gapX:2.5,gapY:0,start:0};
export function checkedLabelPaper(input={}){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Label paper settings must be an object.');const s={...labelDefaults,...input};for(const [key,max]of [['left',18],['top',25],['gapX',9],['gapY',3],['start',23]])if(!Number.isFinite(s[key])||s[key]<0||s[key]>max)throw Error('Label '+key+' must be 0–'+max+'.');if(!Number.isInteger(s.start)||s.left+192+2*s.gapX>210+.00001||s.top+272+7*s.gapY>297+.00001)throw Error('The 3 × 8 label grid must fit A4 (210 × 297 mm). Reduce margins or gaps.');return s;}
const round=n=>Number(n.toFixed(1));
export function labelSnapshot(p){return {v:1,c:p.code,o:p.owner,n:p.row[0],d:[p.width,p.height,p.thickness].map(round),m:p.material,b:Object.entries(p.edgeBand||{}).filter(([,v])=>v).map(([k,v])=>k+':'+round(v)).join(' ')};}
export function partLabelUrl(p,base='https://bogdan-burcea.github.io/cabinet-workshop/'){const json=JSON.stringify(labelSnapshot(p)),bytes=new TextEncoder().encode(json);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return base.split('#')[0]+'#label='+btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function readPartLabel(hash){if(!hash.startsWith('#label='))return null;if(hash.length>4000)throw Error('This part label is too long.');const raw=atob(hash.slice(7).replaceAll('-','+').replaceAll('_','/')),a=JSON.parse(new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));if(a.v!==1||!Array.isArray(a.d)||a.d.length!==3||a.d.some(n=>!Number.isFinite(n)||n<=0)||['c','o','n','m','b'].some(k=>typeof a[k]!=='string'||a[k].length>300))throw Error('This part label is invalid.');return a;}
export function labelSlots(count,input={}){const s=checkedLabelPaper(input);return Array.from({length:count},(_,i)=>{const slot=i+s.start;return {page:Math.floor(slot/24),x:s.left+(slot%3)*(64+s.gapX),y:s.top+(Math.floor(slot/3)%8)*(34+s.gapY),width:64,height:34};});}
export function partLabelsPdf(parts,input={},base,calibration=false){
 const slots=labelSlots(calibration?24:parts.length,calibration?{...input,start:0}:input),pages=Array.from({length:Math.max(1,...slots.map(s=>s.page+1))},()=>''),W=210*mm,H=297*mm;
 for(const [i,slot]of slots.entries()){const x=slot.x*mm,y=H-(slot.y+34)*mm,w=64*mm,h=34*mm;let c='q\n0 g\n';
  if(calibration){c+='0.65 G 0.35 w\n'+pdfRect(x,y,w,h)+pdfText(x+4*mm,y+h-6*mm,8,'Label '+(i+1)+' | 64 x 34 mm')+pdfText(x+4*mm,y+h-12*mm,6.5,'A4 portrait | actual size / 100%')+pdfText(x+4*mm,y+5*mm,6.5,'Check margins before label stock');}
  else{const p=parts[i],a=labelSnapshot(p),qr=QRCode.create(partLabelUrl(p,base),{errorCorrectionLevel:'M'}),size=qr.modules.size,extent=26*mm,unit=extent/(size+8),qx=x+36*mm,qy=y+4*mm;
   // Four blank modules on every side are the mandatory quiet zone.
   for(let row=0;row<size;row++)for(let col=0;col<size;col++)if(qr.modules.get(row,col))c+=pdfRect(qx+(col+4)*unit,qy+(size-row+3)*unit,unit+.003,unit+.003,'f');
   const tx=x+2.5*mm,limit=32*mm;c+=pdfText(tx,y+h-5*mm,9,a.c)+pdfText(tx,y+h-10*mm,7,fitText(a.o,limit,7));const name=a.n.split(' ');let first='';while(name.length&&first.length+name[0].length<25)first+=(first?' ':'')+name.shift();c+=pdfText(tx,y+h-14*mm,7,fitText(first||a.n,limit,7));if(name.length)c+=pdfText(tx,y+h-18*mm,7,fitText(name.join(' '),limit,7));
   c+=pdfText(tx,y+11*mm,7,fitText(a.d.join(' x ')+' mm',limit,7))+pdfText(tx,y+7*mm,6.5,fitText(a.m,limit,6.5))+pdfText(tx,y+3*mm,5.8,fitText(a.b?'Bands '+a.b:'No edge bands',limit,5.8));
  }pages[slot.page]+=c+'Q\n';
 }
 return vectorPdf(pages,W,H);
}
