// Planning envelope, not a supplier-certified hardware solid. Includes screw
// centres plus 8 mm at each end, 12 mm fore/aft and 12 mm inward projection.
export function hingeShelfWarnings(parts){
 const shelves=parts.filter(p=>/^Shelf \d+$/.test(p.row[0])),warnings=[];
 for(const side of parts.filter(p=>/^(Left|Right) side$/.test(p.row[0]))){
  const holes=side.flatOperations.filter(o=>o.type==='bore'&&o.label==='Hinge plate');
  for(let i=0;i<holes.length;i+=2){const pair=holes.slice(i,i+2);if(pair.length!==2)continue;
   const ys=pair.map(o=>side.row[2]+o.point[0]),zs=pair.map(o=>side.row[3]+o.point[1]),y0=Math.min(...ys)-12,y1=Math.max(...ys)+12,z0=Math.min(...zs)-8,z1=Math.max(...zs)+8;
   const left=side.row[0]==='Left side',x=left?side.row[1]+side.row[4]:side.row[1],x0=left?x:x-12,x1=left?x+12:x;
   for(const shelf of shelves){const [,sx,sy,sz,sw,sd,st]=shelf.row;if(Math.min(sx+sw,x1)-Math.max(sx,x0)<=.01||Math.min(sy+sd,y1)-Math.max(sy,y0)<=.01||Math.min(sz+st,z1)-Math.max(sz,z0)<=.01)continue;
    warnings.push({side:side.row[0],shelf:shelf.row[0],hinge:i/2+1,centre:(Math.min(...zs)+Math.max(...zs))/2,shelfBottom:sz,shelfTop:sz+st,message:`${side.row[0]} hinge plate ${i/2+1} may collide with ${shelf.row[0]} at its current height. Move the shelf or change the hinge count/end setback. The check uses a conservative plate envelope; confirm clearance with the bought hardware.`});
   }
  }
 }
 return warnings;
}
