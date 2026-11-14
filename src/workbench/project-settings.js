export const feetKeys=['feet','feetCount','feetThrough','feetHeight','feetX','feetFront','feetRear','feetPitchX','feetPitchY','feetDiameter','feetDepth'];
export function setProjectFeet(s){s.projectSettings??={};s.projectSettings.feet=Object.fromEntries(feetKeys.map(k=>[k,s.cabinet[k]]));for(const r of s.cabinets)if(r.config.style!=='Wall')for(const id of Object.keys(r.config.featureEdits?.operations||{}))if(id.includes('Foot plate'))delete r.config.featureEdits.operations[id];}
export function setProjectWorktop(s){s.projectSettings??={};s.projectSettings.worktopThickness=s.cabinet.installation.worktopThickness;}
export function applyProjectSettings(s,c){
 const shared=s.projectSettings;if(!shared)return c;
 if(shared.feet){if(typeof shared.feet!=='object'||Array.isArray(shared.feet)||feetKeys.some(k=>shared.feet[k]===undefined))throw Error('The shared feet settings are incomplete.');if(!Number.isFinite(shared.feet.feetHeight)||shared.feet.feetHeight<50||shared.feet.feetHeight>250)throw Error('Foot height must be 50–250 mm.');if(c.style!=='Wall')for(const k of feetKeys)c[k]=shared.feet[k];}
 if(shared.worktopThickness!==undefined){if(!Number.isFinite(shared.worktopThickness)||shared.worktopThickness<1||shared.worktopThickness>150)throw Error('Worktop thickness must be 1–150 mm.');c.installation.worktopThickness=shared.worktopThickness;}
 return c;
}
