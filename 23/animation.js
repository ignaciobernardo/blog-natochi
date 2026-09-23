/* Procedural shape animation. No source frames, traced paths, or media assets.
 * Power-diagram cells = rectangle clipped by weighted bisectors of moving sites.
 * Insets create cuts; tangent circular arcs round each convex cell. A variable
 * raster grid creates the pixel transitions. All geometry is recalculated live.
 */
(() => {
'use strict';
const canvas=document.querySelector('#animation'), ctx=canvas.getContext('2d');
const mask=document.createElement('canvas'), ink=document.createElement('canvas');
const mc=mask.getContext('2d'), ic=ink.getContext('2d');
const W=1920,H=1080,UNIT=500,MAX=64,DURATION=4.5;
const defaults={speed:.4,gap:22,roundness:105,density:1,pixelation:1,motion:1,seed:17};
const settings={...defaults}, offsets=Array.from({length:MAX},()=>({x:0,y:0}));
let position=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,last,drag=null,liveSites=[],visibleSites=[],hitRegions=[];
const sceneOffset={x:0,y:0};
const smooth=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function blank(){return Array.from({length:MAX},()=>({x:0,y:0,w:-12}));}
let layouts;
function buildLayouts(){
 const rng=random(settings.seed),whole=blank(),ribbons=blank(),radial=blank(),mosaic=blank(),circle=blank(),fan=blank(),two=blank(),four=blank(),end=blank();
 whole[0]={x:0,y:0,w:0};
 for(let i=0;i<3;i++)ribbons[i]={x:(i-1)*.23,y:(i-1)*.56,w:0};
 radial[0]={x:-.23,y:-.05,w:-.08};
 for(let i=1;i<9;i++){const a=(i-1)/8*Math.PI*2+.2;radial[i]={x:-.23+Math.cos(a)*1.16,y:Math.sin(a)*.87,w:(i===5?.2:0)};}
 mosaic[0]={x:-.3,y:-.02,w:.30};circle[0]={x:-.23,y:-.04,w:.18};
 const count=Math.min(MAX,Math.round(46*settings.density));
 for(let i=1;i<count;i++){
  let x,y;do{x=(rng()-.5)*3.45;y=(rng()-.5)*1.95;}while(Math.hypot(x+.3,y)<.66);
  mosaic[i]={x,y,w:-.10+rng()*.09};
  circle[i]={x:x*1.1,y:y*1.12,w:-.22+rng()*.08};
 }
 fan[0]={x:-.37,y:-.15,w:.32};
 for(let i=1;i<10;i++){const a=i/9*Math.PI*2;fan[i]={x:-.37+Math.cos(a)*1.55,y:-.15+Math.sin(a)*1.12,w:-.08};}
 two[0]={x:.48,y:0,w:.3};two[1]={x:-1.15,y:0,w:0};
 four[0]={x:.55,y:.45,w:0};four[1]={x:-1.05,y:.43,w:0};four[2]={x:.6,y:-.5,w:.1};four[3]={x:-1.05,y:-.5,w:0};
 end[0]={x:0,y:.03,w:0};end[1]={x:0,y:-.95,w:0};end[2]={x:-1.9,y:1.03,w:-.85};
 layouts=[{t:0,s:whole,name:'Whole',pixel:0},{t:.08,s:whole,name:'Whole',pixel:0},{t:.23,s:ribbons,name:'Ribbon cuts',pixel:0},{t:.48,s:radial,name:'Radial cells',pixel:0},{t:.82,s:radial,name:'Radial cells',pixel:0},{t:1.22,s:mosaic,name:'Pixel mosaic',pixel:16},{t:1.5,s:circle,name:'Growing core',pixel:12},{t:1.79,s:circle,name:'Soft cells',pixel:0},{t:2.1,s:fan,name:'Sweeping cuts',pixel:0},{t:2.4,s:two,name:'Two columns',pixel:0},{t:2.58,s:two,name:'Two columns',pixel:0},{t:2.85,s:four,name:'Pixel cuts',pixel:17},{t:3.16,s:four,name:'Four cells',pixel:0},{t:3.48,s:end,name:'Final split',pixel:0},{t:3.66,s:end,name:'Final split',pixel:0},{t:4.42,s:whole,name:'Closing cuts',pixel:0},{t:4.5,s:whole,name:'Whole',pixel:0}];
}
// Sutherland–Hodgman clipping against nx*x + ny*y <= limit.
function clip(poly,nx,ny,limit){
 const out=[];for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=nx*a.x+ny*a.y-limit,db=nx*b.x+ny*b.y-limit;
  if(da<=0)out.push(a);
  if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);out.push({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});}
 }return out;
}
function cell(s,sites){
 let p=[{x:-1.52,y:-.82},{x:1.52,y:-.82},{x:1.52,y:.82},{x:-1.52,y:.82}];
 for(const o of sites){if(o===s)continue;const nx=o.x-s.x,ny=o.y-s.y;
  const c=(o.x*o.x+o.y*o.y-o.w-s.x*s.x-s.y*s.y+s.w)/2;
  p=clip(p,nx,ny,c);if(p.length<3)return [];
 }return p;
}
function inset(poly,amount){
 let p=poly;for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],nx=b.y-a.y,ny=a.x-b.x,len=Math.hypot(nx,ny);
  if(len<1e-8)continue;p=clip(p,nx,ny,nx*a.x+ny*a.y-amount*len);if(p.length<3)return [];
 }return p;
}
function roundedPath(c,poly,radius){
 if(poly.length<3)return;
 const corners=poly.map((b,i)=>{
  const a=poly[(i+poly.length-1)%poly.length],d=poly[(i+1)%poly.length];
  const la=Math.hypot(a.x-b.x,a.y-b.y),ld=Math.hypot(d.x-b.x,d.y-b.y);
  const u={x:(a.x-b.x)/la,y:(a.y-b.y)/la},v={x:(d.x-b.x)/ld,y:(d.y-b.y)/ld};
  const angle=Math.acos(Math.max(-.999999,Math.min(.999999,u.x*v.x+u.y*v.y)));
  const tan=Math.tan(angle/2),dist=Math.min(radius/tan,la*.48,ld*.48);
  return{b,start:{x:b.x+u.x*dist,y:b.y+u.y*dist},end:{x:b.x+v.x*dist,y:b.y+v.y*dist},r:Math.max(.000001,dist*tan)};
 });
 c.moveTo(corners[0].start.x,corners[0].start.y);
 for(const v of corners){c.lineTo(v.start.x,v.start.y);c.arcTo(v.b.x,v.b.y,v.end.x,v.end.y,v.r);}
 c.closePath();
}
function stateAt(seconds){
 const t=((seconds%DURATION)+DURATION)%DURATION;
 let k=0;while(k<layouts.length-2&&t>layouts[k+1].t)k++;
 const a=layouts[k],b=layouts[k+1],u=smooth((t-a.t)/(b.t-a.t));
 const envelope=Math.sin(Math.PI*Math.min(1,t/3.48))**2;
 const sites=a.s.map((s,i)=>({x:lerp(s.x,b.s[i].x,u)+offsets[i].x+(i?Math.sin(t*3+i*2.4)*.065*envelope*settings.motion:0),y:lerp(s.y,b.s[i].y,u)+offsets[i].y+(i?Math.cos(t*3.2+i)*.065*envelope*settings.motion:0),w:lerp(s.w,b.s[i].w,u),id:i})).filter(s=>s.w>-11.99);
 return{sites,pixel:lerp(a.pixel,b.pixel,u)*settings.pixelation,name:u<.5?a.name:b.name};
}
function renderAt(seconds){
 const state=stateAt(seconds);liveSites=state.sites;visibleSites=[];hitRegions=[];
 const pixels=Math.max(1,state.pixel),mw=Math.round(Math.min(canvas.width,W/pixels)),mh=Math.round(mw*H/W);
 if(mask.width!==mw||mask.height!==mh){mask.width=mw;mask.height=mh;}
 mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,mw,mh);
 mc.setTransform(mw/W*UNIT,0,0,mh/H*UNIT,mw/2+sceneOffset.x*UNIT*mw/W,mh/2+sceneOffset.y*UNIT*mh/H);mc.fillStyle='#fff';mc.beginPath();
 for(const s of liveSites){
  const p=inset(cell(s,liveSites),settings.gap/(UNIT*2));if(p.length<3)continue;
  const path=new Path2D();roundedPath(path,p,settings.roundness/UNIT);mc.fill(path);
  visibleSites.push(s);hitRegions.push({site:s,path});
 }
 const cw=canvas.width,ch=canvas.height,scale=cw/W;
 if(ink.width!==cw||ink.height!==ch){ink.width=cw;ink.height=ch;}
 ic.clearRect(0,0,cw,ch);ic.imageSmoothingEnabled=state.pixel<2;ic.drawImage(mask,0,0,cw,ch);
 ic.globalCompositeOperation='source-in';
 const g=ic.createLinearGradient(0,ch*.12,0,ch*.65);g.addColorStop(0,'#070707');g.addColorStop(.34,'#0b0b0b');g.addColorStop(.76,'#222222');g.addColorStop(1,'#222222');ic.fillStyle=g;ic.fillRect(0,0,cw,ch);ic.globalCompositeOperation='source-over';
 ctx.clearRect(0,0,cw,ch);ctx.fillStyle='#f6f6f4';ctx.fillRect(0,0,cw,ch);
 ctx.save();ctx.shadowColor='rgba(0,0,0,.33)';ctx.shadowBlur=35*scale;ctx.shadowOffsetY=22*scale;ctx.drawImage(ink,0,0);ctx.restore();
 // Tint the alpha silhouette to create opposite directional edge highlights.
 for(const [color,x,y] of [['#b58b42',2,-3],['#398064',-3,3]]){
  ic.globalCompositeOperation='source-in';ic.fillStyle=color;ic.fillRect(0,0,cw,ch);ic.globalCompositeOperation='source-over';ctx.drawImage(ink,x*scale,y*scale);
 }
 ic.globalCompositeOperation='source-in';ic.fillStyle=g;ic.fillRect(0,0,cw,ch);ic.globalCompositeOperation='source-over';ctx.drawImage(ink,0,0);
}
// Interaction stays enabled while time advances. Hit-test the entire drawn cell.
const toggle=document.querySelector('#toggle');
function sync(){toggle.textContent=playing?'pausar':'continuar';toggle.setAttribute('aria-label',playing?'Pausar animación':'Continuar animación');}
toggle.onclick=()=>{playing=!playing;sync();};
function pointer(e){const r=canvas.getBoundingClientRect();return{x:((e.clientX-r.left)/r.width*W-W/2)/UNIT,y:((e.clientY-r.top)/r.height*H-H/2)/UNIT};}
function applyDrag(){
 if(!drag)return;
 if(drag.whole){sceneOffset.x=drag.scene.x+drag.pointer.x-drag.start.x;sceneOffset.y=drag.scene.y+drag.pointer.y-drag.start.y;return;}
 const site=stateAt(position).sites.find(s=>s.id===drag.id);if(!site)return;
 offsets[drag.id].x+=drag.pointer.x-sceneOffset.x-drag.grab.x-site.x;
 offsets[drag.id].y+=drag.pointer.y-sceneOffset.y-drag.grab.y-site.y;
}
canvas.onpointerdown=e=>{
 if(e.button!==0||drag)return;
 const p=pointer(e),local={x:p.x-sceneOffset.x,y:p.y-sceneOffset.y};
 const hit=hitRegions.find(r=>ctx.isPointInPath(r.path,local.x,local.y));if(!hit)return;
 drag={id:hit.site.id,whole:visibleSites.length===1,start:p,pointer:p,scene:{...sceneOffset},grab:{x:local.x-hit.site.x,y:local.y-hit.site.y}};
 canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');
};
canvas.onpointermove=e=>{if(!drag)return;drag.pointer=pointer(e);applyDrag();renderAt(position);};
function release(){drag=null;canvas.classList.remove('dragging');}
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=release;
function resize(){canvas.width=Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,1.5));canvas.height=Math.round(canvas.width*H/W);renderAt(position);}
function tick(now){if(last!==undefined&&playing){position=(position+Math.min((now-last)/1000,.1)*settings.speed)%DURATION;applyDrag();renderAt(position);}last=now;requestAnimationFrame(tick);}
window.shapeLoop={renderAt,duration:DURATION,get time(){return position;},get playing(){return playing;},get settings(){return{...settings};},get sites(){return visibleSites.map(s=>({...s}));},get offsets(){return offsets.map(o=>({...o}));},get sceneOffset(){return{...sceneOffset};},pause(){playing=false;sync();},play(){playing=true;sync();},seek(t){position=((t%DURATION)+DURATION)%DURATION;renderAt(position);}};
buildLayouts();new ResizeObserver(resize).observe(canvas);resize();sync();requestAnimationFrame(tick);
})();
