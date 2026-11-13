import * as THREE from 'three';
import {boxTopology} from './topology.js';
export function panelGeometry(row,holes=[]){
 const {vertices,faces}=boxTopology(row,holes),positions=[],normals=[];
 for(const face of faces){const axis=face.normal.findIndex(v=>v!==0),dimensions=[0,1,2].filter(i=>i!==axis),loops=face.loops.map(loop=>loop.map(i=>new THREE.Vector2(vertices[i][dimensions[0]],vertices[i][dimensions[1]]))),indices=face.loops.flat();
  const triangles=THREE.ShapeUtils.triangulateShape(loops[0],loops.slice(1)),normal=new THREE.Vector3(face.normal[0],face.normal[2],face.normal[1]);
  for(const tri of triangles){const pts=tri.map(i=>{const v=vertices[indices[i]];return new THREE.Vector3(v[0],v[2],v[1]);});if(new THREE.Vector3().subVectors(pts[1],pts[0]).cross(new THREE.Vector3().subVectors(pts[2],pts[0])).dot(normal)<0)[pts[1],pts[2]]=[pts[2],pts[1]];
   for(const pt of pts){positions.push(pt.x,pt.y,pt.z);normals.push(normal.x,normal.y,normal.z);}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return geometry;
}

export function cadGeometry(mesh){const geometry=new THREE.BufferGeometry(),vertices=[];for(let i=0;i<mesh.vertices.length;i+=3)vertices.push(mesh.vertices[i],mesh.vertices[i+2],mesh.vertices[i+1]);const triangles=[];for(let i=0;i<mesh.triangles.length;i+=3)triangles.push(mesh.triangles[i],mesh.triangles[i+2],mesh.triangles[i+1]);geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(triangles);geometry.computeVertexNormals();return geometry;}
