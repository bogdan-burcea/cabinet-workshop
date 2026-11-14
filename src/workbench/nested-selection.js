export function nestedPartLocation(layout,cabinetId,sourceCode){
 const matches=p=>p.cabinetId===cabinetId&&(p.sourceCode||p.code)===sourceCode;
 const sheetIndex=layout.sheets.findIndex(s=>s.parts.some(matches));
 return {sheetIndex,part:sheetIndex<0?layout.unplaced.find(matches):layout.sheets[sheetIndex].parts.find(matches)};
}
