import {partRows} from './model.js';
import {cachedMachinedMesh} from './cad-client.js';
import{objects,panels,bounds,isFixture,renderHoles}from'./model.js';import{COLORS,partColor}from'./scene.js';import{boxTopology}from'./topology.js';
// Depth-tested orthographic fallback for devices without WebGL.
export class SoftwareScene{
 constructor(container,onSelect){this.container=container;this.canvas=document.createElement('canvas');this.canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none';container.append(this.canvas);this.q=this.canvas.getContext('2d');this.yaw=-.65;this.pitch=.65;this.zoom=1;this.selection=null;this.showFixtures=true;let last,start,moved;
 this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;last=[e.clientX,e.clientY];start=last;moved=0;this.canvas.setPointerCapture(e.pointerId)});
 this.canvas.addEventListener('pointermove',e=>{if(!last)return;const dx=e.clientX-last[0],dy=e.clientY-last[1];moved+=Math.abs(dx)+Math.abs(dy);this.yaw+=dx*.008;this.pitch=Math.max(.12,Math.min(1.4,this.pitch+dy*.006));last=[e.clientX,e.clientY];this.draw()});
 this.canvas.addEventListener('pointerup',e=>{if(last&&moved<5&&this.ids){const r=this.canvas.getBoundingClientRect(),x=Math.floor(e.clientX-r.left),y=Math.floor(e.clientY-r.top),index=this.ids[y*this.width+x];onSelect(index>=0?this.objectIds[index]:null)}last=null;});this.canvas.addEventListener('pointercancel',()=>last=null);
 this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.4,Math.min(5,this.zoom*Math.exp(-e.deltaY*.001)));this.draw()},{passive:false});new ResizeObserver(()=>this.resize()).observe(container);
 }
 update(p,selection){this.p=p;this.selection=selection;this.draw()}
 resize(){this.draw()}
 fit(){this.zoom=1;if(this.p){const boxes=objects(this.p).map(c=>bounds(this.p,c));this.viewBounds=boxes.length?[...Array.from({length:3},(_,i)=>Math.min(...boxes.map(b=>b[i]))),...Array.from({length:3},(_,i)=>Math.max(...boxes.map(b=>b[i+3])))]:null;}this.draw()}
 draw(){if(!this.p)return;const width=Math.floor(this.container.clientWidth),height=Math.floor(this.container.clientHeight);if(!width||!height)return;this.width=width;this.canvas.width=width;this.canvas.height=height;
 const p=this.p,cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
 const raw=(x,y,z)=>{x-=p.room.width/2;y-=p.room.depth/2;z-=p.room.height*.3;const a=cy*x-sy*y,b=sy*x+cy*y;return [a,b*sp-z*cp,b*cp+z*sp]};
 const focus=this.viewBounds||[0,0,0,p.room.width,p.room.depth,p.room.height];const corners=[focus[0],focus[3]].flatMap(x=>[focus[1],focus[4]].flatMap(y=>[focus[2],focus[5]].map(z=>raw(x,y,z))));const xs=corners.map(a=>a[0]),ys=corners.map(a=>a[1]),minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys),scale=Math.min((width-70)/(maxx-minx),(height-60)/(maxy-miny))*this.zoom;
 const screen=(x,y,z)=>{const [a,b,d]=raw(x,y,z);return [width/2+(a-(minx+maxx)/2)*scale,height/2+12+(b-(miny+maxy)/2)*scale,d]};
 const q=this.q;q.fillStyle='#eaf0e9';q.fillRect(0,0,width,height);q.fillStyle='#f7f8f2';q.strokeStyle='#becbb9';q.lineWidth=1;q.beginPath();[[0,0],[p.room.width,0],[p.room.width,p.room.depth],[0,p.room.depth]].forEach(([x,y],i)=>{const v=screen(x,y,0);i?q.lineTo(v[0],v[1]):q.moveTo(v[0],v[1]);});q.closePath();q.fill();q.stroke();q.strokeStyle='#dbe3d5';q.beginPath();for(let x=0;x<=p.room.width;x+=600){let a=screen(x,0,0),b=screen(x,p.room.depth,0);q.moveTo(a[0],a[1]);q.lineTo(b[0],b[1]);}for(let y=0;y<=p.room.depth;y+=600){let a=screen(0,y,0),b=screen(p.room.width,y,0);q.moveTo(a[0],a[1]);q.lineTo(b[0],b[1]);}q.stroke();
 const image=q.getImageData(0,0,width,height),rgba=image.data,depth=new Float64Array(width*height).fill(-Infinity),ids=new Int32Array(width*height).fill(-1),faces=[];
 const camera=[sy*cp,cy*cp,sp],visible=objects(p).filter(c=>this.showFixtures||!isFixture(c));
 const manufactured=new Map(partRows(p).map(a=>[a.id+'/'+a.row[0],a]));
 this.objectIds=visible.map(c=>c.id);visible.forEach((c,objectId)=>{for(const row of panels(p,c)){
  const cached=cachedMachinedMesh(manufactured.get(c.id+'/'+row[0])||{row});if(cached){let edgeAdded=false;for(let i=0;i<cached.triangles.length;i+=3){const world=cached.triangles.slice(i,i+3).map(k=>cached.vertices.slice(k*3,k*3+3)),a=world[1].map((v,j)=>v-world[0][j]),b=world[2].map((v,j)=>v-world[0][j]),normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...normal);if(!length||normal.reduce((sum,v,j)=>sum+v*camera[j],0)<=0)continue;const light=.8+.28*Math.abs(normal[2]/length),color=partColor(c,row[0]).match(/\w\w/g).map(v=>Math.min(255,Math.round(parseInt(v,16)*light))),points=world.map(v=>screen(...v));const edgeLoops=[];if(!edgeAdded){for(let j=0;j<(cached.edges?.length||0);j+=6)edgeLoops.push([screen(...cached.edges.slice(j,j+3)),screen(...cached.edges.slice(j+3,j+6))]);edgeAdded=true;}faces.push({points,world,holes:[],edgeLoops,color,objectId,selected:c.id===this.selection});}continue;}
  const {vertices,faces:topology}=boxTopology(row,c.kind==='Worktop'?renderHoles(p,c):[]),pts=vertices.map(v=>screen(...v));
  for(const face of topology){const normal=face.normal;if(normal.reduce((s,v,j)=>s+v*camera[j],0)<=0)continue;
   const hex=partColor(c,row[0]),base=hex.match(/\w\w/g).map(v=>parseInt(v,16)),light=normal[2]?1.08:normal[0]?.94:1,color=base.map(v=>Math.min(255,Math.round(v*light))),points=face.loops[0].map(j=>pts[j]);
   const world=face.loops[0].map(j=>vertices[j]),holes=face.loops.slice(1).map(loop=>{const v=loop.map(j=>vertices[j]);return [Math.min(...v.map(v=>v[0])),Math.min(...v.map(v=>v[1])),Math.max(...v.map(v=>v[0])),Math.max(...v.map(v=>v[1]))];});
   faces.push({points,world,holes,edgeLoops:face.loops.map(loop=>loop.map(j=>pts[j])),color,objectId,selected:c.id===this.selection});
  }
 }});
 for(const{points:f,world,holes,color,objectId}of faces){const a=f[1].map((v,i)=>v-f[0][i]),b=f[f.length-1].map((v,i)=>v-f[0][i]),det=a[0]*b[1]-a[1]*b[0];if(Math.abs(det)<1e-8)continue;const x0=Math.max(0,Math.floor(Math.min(...f.map(a=>a[0])))),x1=Math.min(width,Math.ceil(Math.max(...f.map(a=>a[0])))),y0=Math.max(0,Math.floor(Math.min(...f.map(a=>a[1])))),y1=Math.min(height,Math.ceil(Math.max(...f.map(a=>a[1]))));
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const dx=x+.5-f[0][0],dy=y+.5-f[0][1],u=(dx*b[1]-dy*b[0])/det,v=(dy*a[0]-dx*a[1])/det;if(u<0||u>1||v<0||v>1||(f.length===3&&u+v>1))continue;const wx=world[0][0]+u*(world[1][0]-world[0][0])+v*(world[world.length-1][0]-world[0][0]),wy=world[0][1]+u*(world[1][1]-world[0][1])+v*(world[world.length-1][1]-world[0][1]);if(holes.some(h=>wx>h[0]&&wx<h[2]&&wy>h[1]&&wy<h[3]))continue;const z=f[0][2]+u*a[2]+v*b[2],index=y*width+x;if(z<=depth[index])continue;depth[index]=z;ids[index]=objectId;rgba[index*4]=color[0];rgba[index*4+1]=color[1];rgba[index*4+2]=color[2];rgba[index*4+3]=255;}}
 for(const{edgeLoops,selected}of faces){const col=selected?[221,127,61]:[112,128,107];for(const f of edgeLoops)for(let e=0;e<f.length;e++){const a=f[e],b=f[(e+1)%f.length],n=Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1])));for(let i=0;i<=n;i++){const t=n?i/n:0,x=Math.floor(a[0]+(b[0]-a[0])*t),y=Math.floor(a[1]+(b[1]-a[1])*t),z=a[2]+(b[2]-a[2])*t,index=y*width+x;if(x<0||x>=width||y<0||y>=height||z<depth[index]-.65/scale)continue;rgba.set([...col,255],index*4);}}}
 q.putImageData(image,0,0);this.ids=ids;
 }
}
