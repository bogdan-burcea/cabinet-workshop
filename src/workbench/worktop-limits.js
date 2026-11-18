import {worktopSettings} from './worktops.js';
// Conservative no-notch envelope: preserve rails, side joinery and GOLA.
// Exact aperture, fitting and appliance-clearance checks still run on the draft.
export function cutoutLimits(c){
 const v=worktopSettings(c),t=c.thickness,back=(c.backConstruction==='rails'?t:(c.back??6)+(c.backGroove?c.backInset:0)),connector=c.assembly?(['cabineo8','cabineo12'].includes(c.assemblyConnector)?33.5:(c.screwDepth??20)):0;
 const rails=(c.topConstruction??'rails')==='rails',frontRail=c.frontRailWidth||c.rail||100,rearRail=c.rearTopRailWidth||c.rail||100;
 const left=Math.max(10,v.left+t+connector+2),right=Math.max(10,v.right+t+connector+2),front=Math.max(10,v.front+(rails?frontRail+2:20),c.handle==='gola'?v.front+(c.golaDepth??27.2)+(c.clearance??.2)+2:0),rear=Math.max(10,v.rear+(rails?rearRail+2:20),v.rear+back+(c.clearance??.2)+2,c.backConnector==='hafele_26009765'?v.rear+c.backInset+c.back/2+9.5:0);
 const width=c.width+v.left+v.right,depth=c.depth+v.front+v.rear;
 return {width,depth,left,right,front,rear,maxWidth:Math.max(0,width-left-right),maxDepth:Math.max(0,depth-front-rear)};
}
export function cutoutMetrics(c,cut){const limits=cutoutLimits(c),width=cut.shape==='circle'?cut.diameter:cut.width,depth=cut.shape==='circle'?cut.diameter:cut.depth;return {...limits,cutWidth:width,cutDepth:depth,insets:{left:cut.x,right:limits.width-cut.x-width,front:cut.y,rear:limits.depth-cut.y-depth}};}
