import * as THREE from 'three';

// A depth-buffered fallback for devices without WebGL. Unlike a painter-sorted
// SVG, it correctly hides shelves behind intersecting carcass/joinery solids.
export class SoftwareRenderer {
 constructor(){this.domElement=document.createElement('canvas');this.context=this.domElement.getContext('2d');if(!this.context)throw Error('Canvas rendering is unavailable.');}
 setClearColor(){}
 setSize(w,h){w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));if(this.domElement.width===w&&this.domElement.height===h)return;this.domElement.width=w;this.domElement.height=h;this.pixels=this.context.createImageData(w,h);this.depth=new Float32Array(w*h);}
 render(scene,camera){const w=this.domElement.width,h=this.domElement.height;if(!this.pixels)return;const pixels=this.pixels.data,depth=this.depth;pixels.fill(0);depth.fill(Infinity);scene.updateMatrixWorld();camera.updateMatrixWorld();const vp=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),point=new THREE.Vector3(),light=new THREE.Vector3(1,1.6,1.2).normalize(),meshes=[],lines=[];
  scene.traverse(o=>{if(!o.visible)return;if(o.isMesh)meshes.push(o);if(o.isLineSegments)lines.push(o);});meshes.sort((a,b)=>Number(a.material.transparent)-Number(b.material.transparent));
  const project=(x,y,z,m)=>{point.set(x,y,z).applyMatrix4(m);return [(point.x+1)*w/2,(1-point.y)*h/2,point.z];};
  const blend=(i,rgb,opacity)=>{const j=i*4,old=pixels[j+3]/255,alpha=opacity+old*(1-opacity);for(let k=0;k<3;k++)pixels[j+k]=(rgb[k]*opacity+pixels[j+k]*old*(1-opacity))/alpha;pixels[j+3]=alpha*255;};
  for(const mesh of meshes){const g=mesh.geometry,a=g.getAttribute('position'),indices=g.index?.array,m=new THREE.Matrix4().multiplyMatrices(vp,mesh.matrixWorld),normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld),count=indices?.length??a.count,material=mesh.material,opacity=material.opacity??1;
   for(let i=0;i<count;i+=3){const ids=indices?[indices[i],indices[i+1],indices[i+2]]:[i,i+1,i+2],v=ids.map(j=>project(a.getX(j),a.getY(j),a.getZ(j),m));if(v.some(p=>p[2]<-1||p[2]>1))continue;const area=(v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[1][1]-v[0][1])*(v[2][0]-v[0][0]);if(Math.abs(area)<.0001)continue;
    const pa=new THREE.Vector3().fromBufferAttribute(a,ids[0]),pb=new THREE.Vector3().fromBufferAttribute(a,ids[1]),pc=new THREE.Vector3().fromBufferAttribute(a,ids[2]),n=pb.sub(pa).cross(pc.sub(pa)).normalize().applyMatrix3(normalMatrix).normalize(),color=material.color.clone().multiplyScalar(.48+.48*Math.max(0,n.dot(light))),rgbColor={r:0,g:0,b:0};color.getRGB(rgbColor,THREE.SRGBColorSpace);const rgb=[rgbColor.r,rgbColor.g,rgbColor.b].map(n=>Math.min(255,n*255));
    const minX=Math.max(0,Math.floor(Math.min(...v.map(p=>p[0])))),maxX=Math.min(w-1,Math.ceil(Math.max(...v.map(p=>p[0])))),minY=Math.max(0,Math.floor(Math.min(...v.map(p=>p[1])))),maxY=Math.min(h-1,Math.ceil(Math.max(...v.map(p=>p[1]))));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const px=x+.5,py=y+.5,b=((v[1][0]-px)*(v[2][1]-py)-(v[1][1]-py)*(v[2][0]-px))/area,c=((v[2][0]-px)*(v[0][1]-py)-(v[2][1]-py)*(v[0][0]-px))/area,d=1-b-c;if(b<0||c<0||d<0)continue;const z=b*v[0][2]+c*v[1][2]+d*v[2][2],offset=y*w+x;if(z>depth[offset]+1e-7)continue;blend(offset,rgb,opacity);if(material.depthWrite!==false)depth[offset]=z;}
   }
  }
  for(const line of lines){const a=line.geometry.getAttribute('position'),m=new THREE.Matrix4().multiplyMatrices(vp,line.matrixWorld),rgbColor={r:0,g:0,b:0};line.material.color.getRGB(rgbColor,THREE.SRGBColorSpace);const rgb=[rgbColor.r,rgbColor.g,rgbColor.b].map(n=>n*255);for(let i=0;i<a.count;i+=2){const p=project(a.getX(i),a.getY(i),a.getZ(i),m),q=project(a.getX(i+1),a.getY(i+1),a.getZ(i+1),m),steps=Math.ceil(Math.max(Math.abs(q[0]-p[0]),Math.abs(q[1]-p[1])));if(p[2]<-1||q[2]<-1||steps>w+h)continue;for(let j=0;j<=steps;j++){const f=steps?j/steps:0,x=Math.round(p[0]+(q[0]-p[0])*f),y=Math.round(p[1]+(q[1]-p[1])*f),z=p[2]+(q[2]-p[2])*f;if(x<0||x>=w||y<0||y>=h)continue;const i=y*w+x;if(z<=depth[i]+.000008)blend(i,rgb,.65);}}}
  this.context.putImageData(this.pixels,0,0);
 }
 dispose(){this.pixels=null;this.depth=null;}
}
