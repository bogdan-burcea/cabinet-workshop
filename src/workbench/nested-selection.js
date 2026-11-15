export function isNestedPartSelected(part,cabinetId,sourceCode){return Boolean((part.cabinetId===cabinetId&&(part.sourceCode||part.code)===sourceCode)||part.plinthOwners?.some(a=>a.cabinetId===cabinetId&&a.sourceCode===sourceCode));}
export function nestedPartLocation(layout,cabinetId,sourceCode){
 const matches=p=>isNestedPartSelected(p,cabinetId,sourceCode);
 const sheetIndex=layout.sheets.findIndex(s=>s.parts.some(matches));
 return {sheetIndex,part:sheetIndex<0?layout.unplaced.find(matches):layout.sheets[sheetIndex].parts.find(matches)};
}
