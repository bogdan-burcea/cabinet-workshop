import {isDrawers} from './tandem.js';
import {localKeysForStyle} from './styles.js';
const keys=['handle','handlePosition','handlePitch','handleDiameter','handleEdge','handleAlignment','handleHeight','drawerHandlePosition'];
export const handleStyles=[['none','No handle holes'],['knob','Knob · one hole'],['horizontal','Pull · horizontal pair'],['vertical','Pull · vertical pair']];
export const handlePositions=wall=>wall?[['auto_bottom','Free edge · bottom'],['bottom_center','Bottom · centre of door']]:[['auto_top','Free edge · top'],['top_center','Top · centre of door'],['auto_middle','Free edge · middle'],['auto_bottom','Free edge · bottom'],['bottom_center','Bottom · centre of door']];
export function withHandleSettings(cabinet,globals,values){
 const c=structuredClone(cabinet),g=structuredClone(globals);
 if(!handleStyles.some(([v])=>v===(values.handle??c.handle)))throw Error('Choose a handle style.');
 if(!handlePositions(c.style==='Wall').some(([v])=>v===(values.handlePosition??c.handlePosition)))throw Error('Choose a handle placement for this cabinet style.');
 if(values.drawerHandlePosition!==undefined&&!['top_center','middle_center','bottom_center'].includes(values.drawerHandlePosition))throw Error('Choose a drawer handle placement.');for(const key of keys)if(values[key]!==undefined)c[key]=values[key];
 if(keys.some(k=>c[k]!==cabinet[k]))for(const id of Object.keys(c.featureEdits?.operations||{})){let label;try{label=JSON.parse(id)[1];}catch{continue;}if(label==='Handle through hole')delete c.featureEdits.operations[id];}
 if(c.inheritGlobals!==false)for(const k of keys)if(k!=='drawerHandlePosition'&&!localKeysForStyle(c.style).includes(k))g[k]=c[k];
 return {cabinet:c,globals:g};
}
