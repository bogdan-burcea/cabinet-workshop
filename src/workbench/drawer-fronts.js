// Drawer frontage is independent of door hinges. Keep stable source names for overrides.
export function drawerFrontGeometry(c){
 const inset=c.drawerInset??false,style=c.drawerFrontStyle??'slab';
 if(typeof inset!=='boolean'||!['slab','shaker'].includes(style))throw Error('Choose overlay or inset drawers and a slab or Shaker front.');
 if(inset&&(c.handle==='gola'||c.machining?.handle==='gola'))throw Error('Inset drawers need a knob, pull or no handle holes. GOLA requires overlay drawer fronts.');
 const t=c.thickness,dt=c.doorThickness??18,bottom=inset?(c.drawerBottomAllowance??((c.bottomDado?c.bottomLift:0)+t))+2:2,top=inset?c.height-(c.drawerTopAllowance??t)-2:c.height-2;
 return {x:inset?t+2:2,y:inset?0:-dt-2,width:c.width-(inset?2*t+4:4),top,bottom,setback:inset?dt+4:0};
}
export function drawerFrontRow(c,box){const f=drawerFrontGeometry(c);return ['Drawer '+box.index+' overlay front',f.x,f.y,box.frontZ,f.width,c.doorThickness??18,box.frontHeight];}
