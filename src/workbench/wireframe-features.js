// Classify actual CAD edge segments against machining surfaces, in cabinet coordinates.
export function machiningEdge(a,b,operations=[]){
 const p=a.map((v,i)=>(v+b[i])/2),epsilon=.3;
 return operations.some(o=>{
  if(o.type==='pocket'){
   const box=o.box;if(!box||!p.every((v,i)=>v>=box[i]-epsilon&&v<=box[i]+box[i+3]+epsilon))return false;
   return [0,1,2].some(i=>i!==o.axis&&(Math.abs(p[i]-box[i])<epsilon||Math.abs(p[i]-box[i]-box[i+3])<epsilon))||Boolean(o.cutPolygon);
  }
  if(!o.point)return false;const along=(p[o.axis]-o.point[o.axis])*o.sign;
  const radius=Math.hypot(...p.map((v,i)=>i===o.axis?0:v-o.point[i]));
  return along>=-epsilon&&along<=o.depth+epsilon&&Math.abs(radius-o.diameter/2)<epsilon;
 });
}
