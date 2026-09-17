'use strict';
const canvas=document.getElementById('volume');
const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:false});
const labels=['0.29','0.281','0.271','0.262','0.252','0.242','0.233','0.223','0.214','0.204','0.195','0.185','0.176','0.166','0.156','0.146','0.137','0.127','0.118','0.108','0.0984','0.0888','0.0792','0.0696','0.06'];
document.getElementById('ticks').replaceChildren(...labels.map(t=>{const s=document.createElement('span');s.textContent=t;return s;}));
if(!gl){document.getElementById('error').hidden=false;}else{start();}
function start(){
const vertex=`attribute vec3 position;attribute vec3 color;uniform mat4 matrix;uniform float size;varying vec3 rgb;void main(){gl_Position=matrix*vec4(position,1.0);gl_PointSize=size;rgb=color;}`;
const fragment=`precision mediump float;varying vec3 rgb;void main(){gl_FragColor=vec4(rgb,1.0);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL link failed');gl.useProgram(program);
const position=gl.getAttribLocation(program,'position'),color=gl.getAttribLocation(program,'color'),matrix=gl.getUniformLocation(program,'matrix'),size=gl.getUniformLocation(program,'size');
let seed=703;
function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;}
function jet(t){return [Math.max(0,Math.min(1,1.5-Math.abs(4*t-3))),Math.max(0,Math.min(1,1.5-Math.abs(4*t-2))),Math.max(0,Math.min(1,1.5-Math.abs(4*t-1)))];}
const points=[];
function point(x,y,z,t,opacity=1){const rgb=jet(Math.max(.13,Math.min(.99,t)));points.push(x,y,z,...rgb.map(c=>c*opacity));}
// Synthetic scalar samples on folded sheets: a dense trough and a vertical plume.
// Each point has a real 3D position and a scalar mapped to the legend's range.
for(let i=0;i<175000;i++){
 const u=random()*2-1,v=random()*2-1;
 const band=Math.sin(v*112+Math.sin(u*5)*2);
 const ripple=.018*Math.sin(u*39+v*13)+.011*Math.sin(v*130);
 const x=u*.97,z=v*.97;
 const y=-.62+1.22*Math.pow(Math.abs(u),3.4)+.085*Math.sin(v*4+u)+ripple+(random()-.5)*.045;
 if(random()<.28+.28*(band>.72)){
  const hot=Math.exp(-((u+.72)**2/.003+(v+.15)**2/.18));
  let t=.135+.09*random()+.30*Math.max(0,band)**14+.52*hot;
  if(y<-.43)t+=.04;
  point(x,y,z,t,.5+random()*.5);
 }
}
for(let row=0;row<32;row++){
 const v=-.94+row*.06;
 for(let j=0;j<900;j++){
  const u=random()*1.94-.97;
  if(random()<.25)continue;
  const y=-.62+1.22*Math.pow(Math.abs(u),3.4)+.085*Math.sin(v*4+u)+.018*Math.sin(u*39+v*13)+.011*Math.sin(v*130);
  point(u*.97,y+(random()-.5)*.008,v*.97,.30+.22*Math.sin(row*7.3)**8+.12*random(),.85);
 }
}
for(let i=0;i<65000;i++){
 const y=random()*1.9-.95,z=random()*1.9-.95;
 const x=-.68+.1*Math.sin(z*4+y*3)+.022*Math.sin(y*85)+.06*(random()-.5);
 const ridge=Math.exp(-((z+.5)**2/.035+(y+.03)**2/.28));
 if(random()<.58)point(x,y,z,.14+.1*random()+1.1*ridge,.8+random()*.2);
}
// Sparse scan echoes add depth without filling the empty volume.
for(let i=0;i<34000;i++){
 const x=random()*1.9-.95,y=random()*1.85-.88,z=random()*1.9-.95;
 if(random()<.25)point(x,y,z,.13+.1*random(),.15+random()*.45);
}
function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return{buffer:b,count:data.length/6};}
const cloud=buffer(points);
const edges=[],dots=[];
const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const pairs=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
for(const[a,b]of pairs){const p=corners[a],q=corners[b];if(a===1||b===1||a===2||b===2){for(let j=0;j<=64;j++){const t=j/64;dots.push(...p.map((v,k)=>v+(q[k]-v)*t),.85,.85,.85);}}else edges.push(...p,.94,.94,.94,...q,.94,.94,.94);}
const frame=buffer(edges),hidden=buffer(dots);
let yaw=.53,pitch=0,zoom=1,auto=false,dirty=true,last=0,raf=0;
const axis=document.getElementById('axes'),ac=axis.getContext('2d');
function project(x,y,z){const a=Math.cos(yaw)*x+Math.sin(yaw)*z,b=-Math.sin(yaw)*x+Math.cos(yaw)*z;return[a,Math.cos(pitch)*y-Math.sin(pitch)*b,Math.sin(pitch)*y+Math.cos(pitch)*b];}
function drawAxes(){const dpr=Math.min(devicePixelRatio||1,2),rect=axis.getBoundingClientRect();axis.width=Math.round(rect.width*dpr);axis.height=Math.round(rect.height*dpr);ac.scale(axis.width/160,axis.height/160);ac.clearRect(0,0,160,160);const origin=[48,110];for(const[a,c,l]of [[[1,0,0],'#8880ff','X'],[[0,1,0],'#70ff90','Y'],[[0,0,1],'#ff8d9e','Z']]){const p=project(...a),x=origin[0]+p[0]*75,y=origin[1]-p[1]*75;ac.strokeStyle=ac.fillStyle=c;ac.lineWidth=1;ac.beginPath();ac.moveTo(...origin);ac.lineTo(x,y);ac.stroke();const angle=Math.atan2(y-origin[1],x-origin[0]);ac.beginPath();ac.moveTo(x,y);ac.lineTo(x-22*Math.cos(angle-.23),y-22*Math.sin(angle-.23));ac.lineTo(x-22*Math.cos(angle+.23),y-22*Math.sin(angle+.23));ac.closePath();ac.fill();ac.font='13px monospace';ac.fillText(l,x+5,y-8);}}
function draw(){const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);const scale=Math.min(w*.267,h*.307)*zoom;const sx=scale/w*2,sy=scale/h*2;const ex=project(1,0,0),ey=project(0,1,0),ez=project(0,0,1);const m=new Float32Array([ex[0]*sx,ex[1]*sy,ex[2]*-.24,-ex[2]*.26,ey[0]*sx,ey[1]*sy,ey[2]*-.24,-ey[2]*.26,ez[0]*sx,ez[1]*sy,ez[2]*-.24,-ez[2]*.26,.055,0,0,1]);gl.uniformMatrix4fv(matrix,false,m);
function render(b,mode,pointSize){gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(color);gl.vertexAttribPointer(color,3,gl.FLOAT,false,24,12);gl.uniform1f(size,pointSize);gl.drawArrays(mode,0,b.count);}
render(cloud,gl.POINTS,Math.max(1,dpr*.85));gl.disable(gl.DEPTH_TEST);render(hidden,gl.POINTS,Math.max(1,dpr*1.2));render(frame,gl.LINES,1);drawAxes();dirty=false;}
function loop(now){raf=0;if(auto){yaw+=Math.min(40,now-last)*.00012;dirty=true;}last=now;if(dirty)draw();if(auto)raf=requestAnimationFrame(loop);}
function update(){dirty=true;if(!raf)raf=requestAnimationFrame(loop);}
const pointers=new Map();let distance=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);distance=0;});
canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1){yaw+=(e.clientX-old[0])*.006;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-old[1])*.006));}else{const[a,b]=[...pointers.values()];const next=Math.hypot(a[0]-b[0],a[1]-b[1]);if(distance)zoom=Math.max(.45,Math.min(2.8,zoom*next/distance));distance=next;}update();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{pointers.delete(e.pointerId);distance=0;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(2.8,zoom*Math.exp(-e.deltaY*.001)));update();},{passive:false});
function reset(){yaw=.53;pitch=0;zoom=1;auto=false;document.getElementById('motion').setAttribute('aria-pressed','false');update();}
document.getElementById('reset').onclick=reset;canvas.addEventListener('dblclick',reset);
document.getElementById('motion').onclick=e=>{auto=!auto;e.currentTarget.setAttribute('aria-pressed',String(auto));last=performance.now();update();};
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','r','R'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.08;if(e.key==='ArrowRight')yaw+=.08;if(e.key==='ArrowUp')pitch=Math.max(-1.4,pitch-.08);if(e.key==='ArrowDown')pitch=Math.min(1.4,pitch+.08);if(e.key==='+'||e.key==='=')zoom=Math.min(2.8,zoom*1.1);if(e.key==='-')zoom=Math.max(.45,zoom/1.1);if(e.key.toLowerCase()==='r')reset();update();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();auto=false;document.getElementById('error').hidden=false;});canvas.addEventListener('webglcontextrestored',()=>location.reload());
addEventListener('resize',update);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();update();}});update();
}
