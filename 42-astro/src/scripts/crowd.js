import * as THREE from 'three';
export function createCrowd(){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(852,676);renderer.setClearColor(0x000000);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-5.8,5.8,4.6,-4.6,.1,100);camera.position.set(0,11,13);camera.lookAt(0,.4,0);
 const sphere=new THREE.SphereGeometry(1,12,10),capsule=new THREE.CapsuleGeometry(1,1,4,8);const people=[];let seed=8462,random,halfWidth=7;
 const makeRandom=()=>{let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
 function person(index){
  const material=new THREE.MeshBasicMaterial({color:index%5<3?0xaaff55:0x3455ff});
  const root=new THREE.Group();const scale=.86+random()*.29;root.scale.setScalar(scale);scene.add(root);
  function ellipsoid(parent,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  function bone(parent,x,y,z,length,radius){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);const m=new THREE.Mesh(capsule,material);m.scale.set(radius,length/3,radius);m.position.y=-length/2;g.add(m);return g;}
  const body=new THREE.Group();root.add(body);
  ellipsoid(body,0,1.16,0,.22,.32,.135);ellipsoid(body,0,.94,0,.175,.16,.13);ellipsoid(body,0,1.47,0,.068,.09,.068);ellipsoid(body,0,1.64,.012,.116,.157,.12);
  if(index%4===0)ellipsoid(body,0,1.65,-.037,.125,.162,.125);
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const arm=bone(body,side*.222,1.36,0,.30,.063);const forearm=bone(arm,0,-.29,0,.29,.05);forearm.rotation.x=-.24;ellipsoid(forearm,0,-.3,0,.048,.072,.045);arms.push(arm);
   const leg=bone(root,side*.102,.92,0,.45,.09);const shin=bone(leg,0,-.445,0,.45,.068);ellipsoid(shin,0,-.45,.047,.082,.058,.14);legs.push({leg,shin});
  }
  if(index%5===0){const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.15,.235,.40,12),material);skirt.position.y=.87;body.add(skirt);}
  const x=(random()-.5)*14,z=(random()-.5)*13,phase=random()*Math.PI*2,speed=.3+random()*.3,angle=random()*Math.PI*2;
  return{root,body,arms,legs,x,z,phase,speed,angle,material};
 }
 function rebuild(count,newSeed=false){if(newSeed)seed=Math.floor(Math.random()*1e8);for(const p of people){scene.remove(p.root);p.root.traverse(n=>{if(n.geometry&&n.geometry!==sphere&&n.geometry!==capsule)n.geometry.dispose();});p.material.dispose();}people.length=0;random=makeRandom();for(let i=0;i<count;i++)people.push(person(i));}
 function render(time,{pace,zoom,flow}){
  const t=time*pace/100;camera.zoom=zoom/100;camera.updateProjectionMatrix();
  for(let i=0;i<people.length;i++){
   const p=people[i];let angle=flow==='stream'?.7:flow==='crossing'?(i%2===0?.65:.65+Math.PI):p.angle;
   let x=p.x+Math.sin(angle)*t*p.speed,z=p.z+Math.cos(angle)*t*p.speed;
   if(flow==='wander'){x+=Math.sin(t*.15+p.phase)*.8;z+=Math.cos(t*.15+p.phase)*.8;angle+=Math.sin(t*.15+p.phase)*.25;}
   x=((x+7)%14+14)%14-7;z=((z+6)%12+12)%12-6;
   const phase=t*(3.2+p.speed*2)+p.phase;const swing=Math.sin(phase);
   p.root.position.set(x/7*(halfWidth+1),Math.abs(Math.cos(phase))*.027,z);p.root.rotation.y=angle;
   p.body.rotation.z=swing*.025;p.body.rotation.y=swing*.055;
   for(let side=0;side<2;side++){const s=Math.sin(phase+side*Math.PI);p.legs[side].leg.rotation.x=s*.52;p.legs[side].shin.rotation.x=Math.max(0,-s)*.85;p.arms[side].rotation.x=-s*.48-.08;p.arms[side].rotation.z=(side===0?1:-1)*.08;}
  }
  renderer.render(scene,camera);return renderer.domElement;
 }
 function resize(width,height){
  halfWidth=4.8*width/height;camera.left=-halfWidth;camera.right=halfWidth;camera.top=4.8;camera.bottom=-4.8;camera.updateProjectionMatrix();renderer.setSize(width,height);
 }
 function dispose(){renderer.dispose();sphere.dispose();capsule.dispose();for(const p of people)p.material.dispose();}
 rebuild(38);return{render,rebuild,resize,dispose,canvas:renderer.domElement};
}
