// A shared rounded seam keeps both mating parts complementary. The 4.5 mm
// nominal radius leaves at least 4 mm on either side at up to 1 mm joint play.
export function roundSeam(points,radius=4.5){
 return points.slice(1,-1).map((v,i)=>{
  const a=points[i],b=points[i+2],u=v.map((n,k)=>n-a[k]),w=b.map((n,k)=>n-v[k]),ul=Math.hypot(...u),wl=Math.hypot(...w);u.forEach((n,k)=>u[k]=n/ul);w.forEach((n,k)=>w[k]=n/wl);
  const turn=Math.atan2(u[0]*w[1]-u[1]*w[0],u[0]*w[0]+u[1]*w[1]),d=radius*Math.tan(Math.abs(turn)/2);
  if(d>Math.min(ul,wl)/2)throw Error('Frame dovetail is too small for the 8 mm cutter. Increase frame width.');
  const start=v.map((n,k)=>n-u[k]*d),end=v.map((n,k)=>n+w[k]*d),sign=Math.sign(turn),centre=[start[0]-u[1]*radius*sign,start[1]+u[0]*radius*sign],angle=Math.atan2(start[1]-centre[1],start[0]-centre[0]);
  return Array.from({length:17},(_,j)=>j===0?start:j===16?end:[centre[0]+radius*Math.cos(angle+turn*j/16),centre[1]+radius*Math.sin(angle+turn*j/16)]);
 });
}
export function expandPolygon(points,gap){
 if(!gap)return points;
 const area=points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p[0]*q[1]-q[0]*p[1];},0),sign=area>0?1:-1;
 return points.map((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length],u=[p[0]-a[0],p[1]-a[1]],v=[b[0]-p[0],b[1]-p[1]],ul=Math.hypot(...u),vl=Math.hypot(...v),n1=[sign*u[1]/ul,-sign*u[0]/ul],n2=[sign*v[1]/vl,-sign*v[0]/vl],scale=gap/(1+n1[0]*n2[0]+n1[1]*n2[1]);return[p[0]+(n1[0]+n2[0])*scale,p[1]+(n1[1]+n2[1])*scale];});
}
export function clipToJointEdge(points,edge,dir){
 const inside=p=>(p[0]-edge)*dir>=-1e-8,out=[];
 for(let i=0;i<points.length;i++){const a=points[(i+points.length-1)%points.length],b=points[i];if(inside(a)!==inside(b)){const t=(edge-a[0])/(b[0]-a[0]);out.push([edge,a[1]+t*(b[1]-a[1])]);}if(inside(b))out.push(b);}
 return out.filter((p,i)=>!i||Math.hypot(p[0]-out[i-1][0],p[1]-out[i-1][1])>1e-7);
}
