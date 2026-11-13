import {defaults} from './cabinet.js';
export const wallDefaults={style:'Wall',name:'My wall cabinet',depth:320,shelves:2,bottomLift:6,feet:'none',handlePosition:'auto_bottom',handleAlignment:'top',handleHeight:1550,mountingHeight:1500};
export const cabinetDefaults=(style='Base')=>({...structuredClone(defaults),...(style==='Wall'?wallDefaults:{})});
// Placement differs between bases and walls; the shared hardware pattern stays common.
export const wallLocalKeys=['handlePosition','handleAlignment','handleHeight'];
export function switchCabinetStyle(c,style){if(!['Base','Wall'].includes(style))throw Error('Choose Base or Wall cabinet style.');if((c.style||'Base')===style)return structuredClone(c);const preset=cabinetDefaults(style),next={...structuredClone(c),style,depth:preset.depth,shelves:preset.shelves,bottomLift:preset.bottomLift,bottomDado:true,topConstruction:style==='Wall'?'full':'rails',featureEdits:{operations:{},bands:{}}};for(const k of wallLocalKeys)next[k]=preset[k];next.feet=style==='Wall'?'none':defaults.feet;if(['My base cabinet','My wall cabinet'].includes(c.name))next.name=preset.name;return next;}
