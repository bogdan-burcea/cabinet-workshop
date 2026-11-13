import {hingePresets,platePresets} from '../machining.js';
// Presets are cabinet-level matched hardware, not independent hole overrides.
export function withHingePreset(cabinet,globals,hinge,plate){
 if(!hingePresets.some(([key])=>key===hinge)||!platePresets[hinge]?.some(([key])=>key===plate))throw Error('Choose a compatible hinge and mounting plate.');
 const c=structuredClone(cabinet),g={...globals};
 if(c.hinge!==hinge||c.plate!==plate){for(const id of Object.keys(c.featureEdits?.operations||{})){let label;try{label=JSON.parse(id)[1];}catch{continue;}if(/^Hinge (cup|fixing|plate)$/.test(label))delete c.featureEdits.operations[id];}}
 c.hinge=hinge;c.plate=plate;if(c.inheritGlobals!==false){g.hinge=hinge;g.plate=plate;}return {cabinet:c,globals:g};
}
