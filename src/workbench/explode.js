// Cabinet coordinates are X across, Y toward the front, Z up.
export function explodedOffset(name,cabinet){return [name==='Left side'?-70:name==='Right side'?70:0,name.startsWith('Door')?90:name==='Plinth'?Math.max(150,(cabinet.plinthSetback??60)+(cabinet.plinthThickness??18)+40):name==='Back'?-70:0,name==='Bottom'?-60:name.includes('rail')||name==='Top'?60:0];}
