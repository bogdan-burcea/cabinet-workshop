import font from './pdf-font.json' with {type:'json'};
export const mm=72/25.4;
export const pdfNumber=n=>String(Number(n.toFixed(4)));
export const pdfAscii=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[×]/g,'x').replace(/[–—]/g,'-').replace(/[^\x20-\x7e]/g,'?');
export const textWidth=(s,size)=>[...pdfAscii(s)].reduce((n,ch)=>n+(font.widths[ch.charCodeAt(0)-font.first]||600)*size/1000,0);
export function fitText(s,width,size){s=pdfAscii(s);if(textWidth(s,size)<=width)return s;while(s&&textWidth(s+'...',size)>width)s=s.slice(0,-1);return s+'...';}
export function pdfText(x,y,size,s){s=pdfAscii(s).replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)');return `BT /F1 ${size} Tf ${pdfNumber(x)} ${pdfNumber(y)} Td (${s}) Tj ET\n`;}
export const pdfRect=(x,y,w,h,op='S')=>`${[x,y,w,h].map(pdfNumber).join(' ')} re ${op}\n`;
export function vectorPdf(pages,width,height){
 const objects=[],put=s=>(objects.push(s),objects.length);put('<< /Type /Catalog /Pages 2 0 R >>');put('');put('');const file=put(`<< /Length ${font.hex.length+1} /Length1 ${font.hex.length/2} /Filter /ASCIIHexDecode >>\nstream\n${font.hex}>\nendstream`),descriptor=put(`<< /Type /FontDescriptor /FontName /${font.name} ${Object.entries(font.descriptor).map(([k,v])=>' /'+k+' '+(Array.isArray(v)?'['+v.join(' ')+']':v)).join('')} /FontFile2 ${file} 0 R >>`);objects[2]=`<< /Type /Font /Subtype /TrueType /BaseFont /${font.name} /FirstChar ${font.first} /LastChar ${font.last} /Widths [${font.widths.join(' ')}] /FontDescriptor ${descriptor} 0 R /Encoding /WinAnsiEncoding >>`;const kids=[];
 for(const content of pages){const stream=put(`<< /Length ${content.length} >>\nstream\n${content}endstream`),page=put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(width)} ${pdfNumber(height)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${stream} 0 R >>`);kids.push(page+' 0 R');}objects[1]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>`;let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=pdf.length;return pdf+`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}
