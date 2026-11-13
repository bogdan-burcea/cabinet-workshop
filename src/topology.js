// Exact closed planar B-rep topology for a box with disjoint rectangular through-holes.
export function boxTopology(row,holes=[]){
 const [,x,y,z,w,d,h]=row;
 const ring=(a,b,w,d,z)=>[[a,b,z],[a+w,b,z],[a+w,b+d,z],[a,b+d,z]];
 const vertices=[...ring(x,y,w,d,z),...ring(x,y,w,d,z+h)];
 const faces=[{loops:[[0,3,2,1]],normal:[0,0,-1]},{loops:[[4,5,6,7]],normal:[0,0,1]},
 {loops:[[0,1,5,4]],normal:[0,-1,0]},{loops:[[1,2,6,5]],normal:[1,0,0]},
 {loops:[[2,3,7,6]],normal:[0,1,0]},{loops:[[3,0,4,7]],normal:[-1,0,0]}];
 for(const hole of holes){const k=vertices.length;vertices.push(...ring(hole.x,hole.y,hole.width,hole.depth,z),...ring(hole.x,hole.y,hole.width,hole.depth,z+h));
  faces[0].loops.push([k,k+1,k+2,k+3]);faces[1].loops.push([k+4,k+7,k+6,k+5]);
  faces.push({loops:[[k,k+4,k+5,k+1]],normal:[0,1,0]},
   {loops:[[k+1,k+5,k+6,k+2]],normal:[-1,0,0]},
   {loops:[[k+2,k+6,k+7,k+3]],normal:[0,-1,0]},
   {loops:[[k+3,k+7,k+4,k]],normal:[1,0,0]});
 }return {vertices,faces};
}
