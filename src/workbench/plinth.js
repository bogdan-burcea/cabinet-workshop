import {resolveInstallation} from './installation.js';
import {editedPart} from './feature-model.js';
import {bandPart} from './edgeband.js';
export const plinthDefaults={plinth:false,plinthThickness:18,plinthSetback:60,plinthGap:3};
export function plinthRow(input){
 const c=resolveInstallation({...plinthDefaults,...input});if(c.style==='Wall')return null;if(c.plinth!==undefined&&typeof c.plinth!=='boolean')throw Error('Choose whether to include a plinth.');if(!c.plinth)return null;
 for(const [k,min,max]of [['plinthThickness',6,30],['plinthSetback',0,c.depth-30],['plinthGap',0,20]])if(!Number.isFinite(c[k])||c[k]<min||c[k]>max)throw Error(k+' must be '+min+'–'+max+' mm.');
 const clearance=c.feetHeight-(c.bottomDado?c.bottomLift:0),h=clearance-c.plinthGap;if(h<20)throw Error('Plinth height needs at least 20 mm. Increase foot mounting height or reduce bottom lift / floor gap.');
 return ['Plinth',0,c.depth-c.plinthSetback-c.plinthThickness,-clearance+c.plinthGap,c.width,c.plinthThickness,h];
}
export function plinthPart(input,index){const row=plinthRow(input);if(!row)return null;const part={row,owner:input.name,id:'base-cabinet',kind:input.style||'Base',thicknessAxis:1,holes:[],operations:[],key:'base-cabinet/Plinth',code:'P'+String(index+1).padStart(3,'0'),material:'Carcass',width:row[4],height:row[6],thickness:row[5],flatOperations:[],flatHoles:[]};return bandPart(editedPart(part,input.featureEdits),{thickness:input.edgeBand||0,doors:false,fronts:false},input.featureEdits?.bands?.[part.key]);}
