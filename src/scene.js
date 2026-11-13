import {cachedMachinedMesh} from './cad-client.js';
import {partRows} from './model.js';
import {cadGeometry} from './mesh.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {objects,panels,isOpening,isFixture,renderHoles}from './model.js';
import {panelGeometry}from'./mesh.js';
export const COLORS={Sink:'#afc2c4',Hob:'#273b3e','Blind corner':'#c6aa86',Filler:'#bd9977','End panel':'#cfb594',Base:'#c6aa86',Wall:'#a6c0ad',Tall:'#b9abc3',Fridge:'#9aaeb5',Dishwasher:'#9aaeb5',Cooker:'#7c8f95',Door:'#c4a081',Window:'#9ccee0',Worktop:'#4d5b5b'};
export const partColor=(c,name)=>name==='Cooking zone'?'#526469':name==='Sink bowl bottom'?'#8ba5a8':name==='Glass'?'#a9d7e3':name==='Blind front'?'#a58d72':COLORS[c.kind];
export class Scene{
 constructor(container,onSelect){this.container=container;this.onSelect=onSelect;this.meshes=[];this.showFixtures=true;this.selection=null;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#eaf0e9');
 this.camera=new THREE.PerspectiveCamera(40,1,1,1000000);this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(this.renderer.domElement);
 this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.1;this.controls.maxPolarAngle=Math.PI*.49;this.controls.minDistance=300;this.controls.maxDistance=500000;
 this.scene.add(new THREE.HemisphereLight('#ffffff','#8b987d',2.4));const sun=new THREE.DirectionalLight('#fff7e7',2.6);sun.position.set(-2000,6000,4000);this.scene.add(sun);this.group=new THREE.Group();this.scene.add(this.group);
 this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();let start;
 this.renderer.domElement.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY]});this.renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;const r=container.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.meshes)[0];onSelect(hit?.object.userData.id||null);});
 new ResizeObserver(()=>this.resize()).observe(container);this.resize();this.renderer.setAnimationLoop(()=>{if(container.clientHeight&&container.clientWidth){this.controls.update();this.renderer.render(this.scene,this.camera);}});
 }
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(w<1||h<1)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 clear(){this.group.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()});this.group.clear();this.meshes=[];}
 update(p,selection){this.project=p;this.selection=selection;this.clear();const {width:w,depth:d}=p.room;
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:'#f6f7f1',roughness:1,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.set(w/2,-3,d/2);this.group.add(floor);
 const grid=[];for(let x=0;x<=w;x+=600)grid.push(x,0,0,x,0,d);for(let z=0;z<=d;z+=600)grid.push(0,0,z,w,0,z);this.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(grid,3)),new THREE.LineBasicMaterial({color:'#d9e0d5'})));
 const border=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,1,0),new THREE.Vector3(w,1,0),new THREE.Vector3(w,1,d),new THREE.Vector3(0,1,d)]),new THREE.LineBasicMaterial({color:'#a9b6a3'}));this.group.add(border);
 const manufactured=new Map(partRows(p).map(a=>[a.id+'/'+a.row[0],a]));
 for(const c of objects(p).filter(c=>this.showFixtures||!isFixture(c)))for(const row of panels(p,c)){
  const [name,x,y,z,bw,bd,bh]=row;
  const cached=cachedMachinedMesh(manufactured.get(c.id+'/'+name)||{row});
  const geometry=cached?cadGeometry(cached):c.kind==='Worktop'?panelGeometry(row,renderHoles(p,c)):new THREE.BoxGeometry(bw,bh,bd),material=new THREE.MeshStandardMaterial({color:partColor(c,name),roughness:.75,metalness: ['Fridge','Dishwasher','Cooker','Sink'].includes(c.kind)?.25:0,transparent:name==='Glass',opacity:name==='Glass'?.58:1});
  const box=new THREE.Mesh(geometry,material);if(!cached&&c.kind!=='Worktop')box.position.set(x+bw/2,z+bh/2,y+bd/2);box.userData.id=c.id;this.meshes.push(box);this.group.add(box);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:c.id===selection?'#e18a49':'#748173',transparent:true,opacity:c.id===selection?1:.47}));edges.position.copy(box.position);this.group.add(edges);
 }
 if(!this.hasFit){this.fit();this.hasFit=true;}
 }
 fit(){if(!this.project)return;const {width:w,depth:d,height:h}=this.project.room;
 const box=new THREE.Box3();for(const mesh of this.meshes)box.expandByObject(mesh);
 const center=this.meshes.length?box.getCenter(new THREE.Vector3()):new THREE.Vector3(w/2,h*.24,d/2);
 const size=this.meshes.length?box.getSize(new THREE.Vector3()):new THREE.Vector3(w,h,d),span=Math.max(size.x,size.y,size.z,500);
 this.controls.target.copy(center);this.camera.position.set(center.x+span*.9,center.y+span*.85,center.z+span*1.2);this.controls.update();this.resize();}
}
