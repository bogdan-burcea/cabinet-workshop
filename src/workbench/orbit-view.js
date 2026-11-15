import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SoftwareRenderer} from './software-renderer.js';
import {assemblyRows,assemblyPoint} from './assembly-model.js';
import {glassDimensions} from './doors.js';
import {requestAssemblyMeshes} from './sheet-step.js';

export class AssemblyView {
 constructor(){
  this.root=document.createElement('div');this.root.className='orbit-view';
  this.status=document.createElement('p');this.status.className='orbit-status';this.status.setAttribute('role','status');
  try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));}catch{this.renderer=new SoftwareRenderer();this.root.dataset.renderer='software';}this.renderer.setClearColor(0xffffff,0);
  this.canvas=this.renderer.domElement;this.canvas.tabIndex=0;this.canvas.style.touchAction='none';this.canvas.setAttribute('aria-label','3D cabinet. Drag to orbit; right-drag to pan; scroll or pinch to zoom. Arrow keys rotate; Home fits cabinet.');
  this.root.append(this.canvas,this.status);this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,1,1,50000);
  this.controls=new OrbitControls(this.camera,this.canvas);this.controls.enableDamping=false;this.controls.minDistance=60;this.controls.maxDistance=30000;this.controls.addEventListener('change',()=>this.paint());
  const software=this.root.dataset.renderer==='software';this.scene.add(new THREE.AmbientLight(software?0xa0a0a0:0xffffff,software?1:1.8));const light=new THREE.DirectionalLight(0xffffff,software?.65:2);light.position.set(1500,2400,1800);this.scene.add(light);this.group=new THREE.Group();this.scene.add(this.group);
  this.cache=new Map();this.revision=0;this.ray=new THREE.Raycaster();let down;
  this.canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY,e.button];});
  this.canvas.addEventListener('pointerup',e=>{if(!down||down[2]!==0||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hit=this.ray.intersectObjects(this.group.children,true).find(h=>h.object.userData.code);if(hit)this.onSelect?.(hit.object.userData.code);});
  this.canvas.addEventListener('keydown',e=>{const angles={ArrowLeft:[.15,0],ArrowRight:[-.15,0],ArrowUp:[0,-.15],ArrowDown:[0,.15]};if(e.key==='Home'){e.preventDefault();this.fit();}else if(angles[e.key]){e.preventDefault();const offset=this.camera.position.clone().sub(this.controls.target),s=new THREE.Spherical().setFromVector3(offset);s.theta+=angles[e.key][0];s.phi=THREE.MathUtils.clamp(s.phi+angles[e.key][1],.05,Math.PI-.05);this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(s));this.controls.update();this.paint();}});
  const tools=document.createElement('div');tools.className='orbit-tools';const fit=document.createElement('button');fit.textContent='Fit view';fit.onclick=()=>this.fit();fit.title='Reset orbit and fit the whole cabinet (Home)';tools.append(fit);this.root.append(tools);
  this.observer=new ResizeObserver(()=>this.scheduleResize());this.observer.observe(this.root);
 }
 // show() reattaches the persistent viewer before the panel's labels/notes are
 // appended. Measure on the next frame, after that entire DOM update settles.
 scheduleResize(){if(this.resizeFrame!==undefined)cancelAnimationFrame(this.resizeFrame);this.resizeFrame=requestAnimationFrame(()=>{this.resizeFrame=undefined;this.resize();});}
 resize(){if(!this.root.isConnected)return;const w=this.root.clientWidth,h=this.root.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.needsFit){this.needsFit=false;this.fit();}else this.paint();}
 paint(){if(this.root.isConnected){this.renderer.render(this.scene,this.camera);this.root.dataset.camera=this.camera.position.toArray().map(n=>n.toFixed(1)).join(',');}}
 fit(){const box=new THREE.Box3().setFromObject(this.group);if(box.isEmpty())return;const centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),aspect=this.camera.aspect||1,v=this.camera.fov*Math.PI/180,distance=Math.max(size.y,size.x/aspect,size.z/aspect)/(2*Math.tan(v/2))*1.65;this.controls.target.copy(centre);this.camera.position.copy(centre).add(new THREE.Vector3(1,.65,1.6).normalize().multiplyScalar(distance));this.camera.near=Math.max(.1,distance/1000);this.camera.far=Math.max(50000,distance*20);this.camera.updateProjectionMatrix();this.controls.update();this.paint();}
 clear(){while(this.group.children.length){const o=this.group.children[0];o.traverse(child=>{child.geometry?.dispose();if(child.material){for(const m of Array.isArray(child.material)?child.material:[child.material])m.dispose();}});this.group.remove(o);}}
 geometry(mesh,part){const positions=[];for(let i=0;i<mesh.vertices.length;i+=3)positions.push(...assemblyPoint(mesh.vertices.slice(i,i+3),part,this.cabinet,this.options));const indices=[];for(let i=0;i<mesh.triangles.length;i+=3)indices.push(mesh.triangles[i],mesh.triangles[i+2],mesh.triangles[i+1]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;}
 rebuild(){this.clear();this.rows.forEach((p,i)=>{const source=this.meshes?.[i];if(!source)return;const chosen=p.code===this.options.selected,material=new THREE.MeshStandardMaterial({color:chosen?0xa6c8ff:/^Door|overlay front/.test(p.row[0])?0xc1c7cd:0xdde1e6,roughness:.8,metalness:0}),solid=new THREE.Mesh(this.geometry(source,p),material);solid.userData.code=p.code;this.group.add(solid);
   const lines=[];for(let j=0;j<(source.edges?.length||0);j+=3)lines.push(...assemblyPoint(source.edges.slice(j,j+3),p,this.cabinet,this.options));if(lines.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));this.group.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:chosen?0x0f62fe:0x626973,transparent:true,opacity:.8})));}
   if(p.glassFramePart==='left stile'){const [x,y,z,w,t,h]=p.glassDoor.bounds,g=glassDimensions(w,h,this.cabinet),f=g.frame,box=new THREE.BoxGeometry(w-2*f,h-2*f,g.thickness);box.translate(x+w/2,z+h/2,y+g.rebateDepth-g.thickness/2);const a=box.getAttribute('position');for(let j=0;j<a.count;j++){const pt=assemblyPoint([a.getX(j),a.getZ(j),a.getY(j)],p,this.cabinet,this.options);a.setXYZ(j,...pt);}box.computeVertexNormals();const glass=new THREE.Mesh(box,new THREE.MeshStandardMaterial({color:0x9dceda,transparent:true,opacity:.25,roughness:.25,side:THREE.DoubleSide,depthWrite:false}));glass.userData.code=p.code;this.group.add(glass);}
  });this.scheduleResize();}
 async show(parent,cabinet,options){parent.append(this.root);this.cabinet=cabinet;this.options=options;this.onSelect=options.onSelect;const identity=options.cabinetId||cabinet.name;if(this.identity!==identity){this.identity=identity;this.needsFit=true;}const rows=assemblyRows(cabinet),key=JSON.stringify(rows.map(p=>[p.row,p.operations]));this.rows=rows;this.revision++;const revision=this.revision;
  if(key===this.meshKey&&this.meshes){this.rebuild();return;}
  this.meshKey=key;this.meshes=undefined;this.clear();this.status.hidden=false;this.status.textContent='Loading detailed 3D geometry…';this.root.dataset.ready='loading';
  try{let request=this.cache.get(key);if(!request){request=requestAssemblyMeshes(rows);this.cache.set(key,request);if(this.cache.size>8)this.cache.delete(this.cache.keys().next().value);}const meshes=await request;if(revision!==this.revision)return;this.meshes=meshes;this.status.hidden=true;this.root.dataset.ready='true';if(!this.group.children.length)this.needsFit=true;this.rebuild();}
  catch(e){this.cache.delete(key);if(revision!==this.revision)return;this.meshKey=null;this.root.dataset.ready='error';this.status.replaceChildren(document.createTextNode('3D view could not load: '+e.message+' '));const retry=document.createElement('button');retry.textContent='Retry 3D view';retry.onclick=()=>this.show(parent,cabinet,options);this.status.append(retry);}
 }
 dispose(){if(this.resizeFrame!==undefined)cancelAnimationFrame(this.resizeFrame);this.observer.disconnect();this.controls.dispose();this.clear();this.renderer.dispose?.();this.cache.clear();}
}
