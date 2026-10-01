import {createCrowd} from './crowd.js';
export function startWalkers(){
 const canvas=document.querySelector('#walkers'),toggle=document.querySelector('#motion-toggle'),reroute=document.querySelector('#reroute');
 const context=canvas.getContext('2d');let crowd;
 try{crowd=createCrowd();}catch{document.body.classList.add('no-animation');toggle.hidden=true;reroute.textContent='Volver al principio ↑';reroute.onclick=()=>document.querySelector('#inicio').scrollIntoView({behavior:'smooth'});return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=reduced.matches,time=13,last=0,frameId=0,width=0,height=0,dpr=1,ready=false;
 const sample=document.createElement('canvas'),sampleContext=sample.getContext('2d',{willReadFrequently:true});
 const settings={pace:72,zoom:104,flow:'wander'};
 function syncToggle(){toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Animar personajes':'Pausar personajes');toggle.querySelector('.motion-symbol').textContent=paused?'▷':'Ⅱ';toggle.querySelector('.motion-label').textContent=paused?'Reanudar':'Pausar';}
 function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);const max=1100/Math.max(width,height);crowd.resize(Math.round(width*Math.min(max,1)),Math.round(height*Math.min(max,1)));crowd.rebuild(width<600?20:42);draw();ready=true;}
 function draw(){
  const source=crowd.render(time,settings);const step=width<600?3.4:4.25;
  const cols=Math.ceil(width/step),rows=Math.ceil(height/step);if(sample.width!==cols||sample.height!==rows){sample.width=cols;sample.height=rows;}
  sampleContext.drawImage(source,0,0,cols,rows);const pixels=sampleContext.getImageData(0,0,cols,rows).data;
  context.clearRect(0,0,width,height);
  const fills=[new Path2D(),new Path2D()],lines=[new Path2D(),new Path2D()];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const i=(y*cols+x)*4;if(Math.max(pixels[i],pixels[i+1],pixels[i+2])<65)continue;
   const color=pixels[i+1]>pixels[i+2]?0:1,hash=((x*7+y*11)^(x*y))%11,px=(x+.5)*step,py=(y+.5)*step,r=step*.31;
   if(color===1||hash<3){fills[color].moveTo(px+r,py);fills[color].arc(px,py,r,0,Math.PI*2);}
   else if(hash<6){lines[color].rect(px-r,py-r,r*2,r*2);}
   else if(hash<9){lines[color].moveTo(px+r,py);lines[color].arc(px,py,r,0,Math.PI*2);}
   else{lines[color].moveTo(px-r,py-r);lines[color].lineTo(px+r,py+r);lines[color].moveTo(px-r,py+r);lines[color].lineTo(px+r,py-r);}
  }
  ['#c6ff54','#394fff'].forEach((color,i)=>{context.fillStyle=color;context.strokeStyle=color;context.lineWidth=.8;context.fill(fills[i]);context.stroke(lines[i]);});
 }
 function animate(now){frameId=0;if(paused||document.hidden)return;if(!last)last=now;if(now-last>=1000/24){time+=Math.min((now-last)/1000,.1);last=now;draw();}frameId=requestAnimationFrame(animate);}
 function start(){if(!paused&&!document.hidden&&!frameId){last=0;frameId=requestAnimationFrame(animate);}}
 function stop(){cancelAnimationFrame(frameId);frameId=0;last=0;}
 toggle.addEventListener('click',()=>{paused=!paused;syncToggle();paused?stop():start();});
 let changes=0;
 reroute.addEventListener('click',()=>{crowd.rebuild(width<600?20:42,true);changes++;settings.flow=['wander','crossing','stream'][changes%3];draw();document.querySelector('#direction-note').textContent=['Ahora pasean.','Ahora se cruzan.','Ahora van en fila.'][changes%3];});
 reduced.addEventListener('change',()=>{paused=reduced.matches;syncToggle();paused?stop():start();});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,120);});
 window.addEventListener('pagehide',()=>{stop();});window.addEventListener('pageshow',()=>{if(ready)start();});
 syncToggle();resize();start();
}
