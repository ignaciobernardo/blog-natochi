'use strict';
(() => {
 const canvas=document.getElementById('tunnel'),ctx=canvas.getContext('2d',{alpha:false});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let width=0,height=0,unit=0,outer=0,inner=0,span=0,raf=0,last=0,time=0;
 let seed=615273;
 function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;}
 const stars=Array.from({length:6500},()=>({angle:random()*Math.PI*2,depth:.43+.62*Math.pow(random(),.55),size:random(),brightness:random(),stretch:random(),ring:random()<.065}));
 const trails=Array.from({length:68},()=>({angle:random()*Math.PI*2,start:.2+random()*.46,length:.13+random()*.5,wave:random()*Math.PI*2,frequency:3+random()*10,amplitude:.015+random()*.1,dashed:random()<.67,brightness:.5+random()*.4}));
 function position(t,angle,phase=0){
  const r=inner*Math.exp(t*span);
  const throat=Math.exp(-(((t-.36)/.21)**2));
  const neck=Math.exp(-(((t-.20)/.15)**2));
  const twist=.43*throat+.11*Math.sin(t*6+phase)*Math.sin(t*Math.PI);
  const a=angle+twist;
  const bendX=unit*.048*throat*Math.sin(t*Math.PI);
  const bendY=-unit*.055*throat*Math.sin(t*Math.PI);
  const asymmetry=1+.06*Math.sin(a*3+t*5)*Math.sin(t*Math.PI);
  return [width/2+bendX+r*Math.cos(a)*asymmetry*(1-.33*neck),height/2+bendY+r*Math.sin(a)*asymmetry*(1-.48*neck)];
 }
 function path(points){ctx.beginPath();for(let i=0;i<points.length;i++){const p=points[i];i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();}
 function draw(){
  ctx.fillStyle='#030202';ctx.fillRect(0,0,width,height);
  const phase=Math.sin(time*.055)*.08;
  ctx.lineCap='round';ctx.lineJoin='round';
  // Twenty-eight depth contours and seventeen curved meridians form the funnel.
  ctx.strokeStyle='rgba(179,172,161,0.82)';ctx.lineWidth=.95;
  for(let ring=0;ring<29;ring++){
   const t=ring/28;
   const points=[];
   for(let j=0;j<=210;j++)points.push(position(t,j/210*Math.PI*2,phase));
   path(points);
  }
  ctx.strokeStyle='rgba(192,184,172,0.75)';ctx.lineWidth=1;
  for(let spoke=0;spoke<17;spoke++){
   const points=[];
   for(let j=0;j<=190;j++){const t=j/190;points.push(position(t,spoke/17*Math.PI*2+.055*Math.sin(t*5+spoke*.8)*Math.sin(t*Math.PI),phase));}
   path(points);
  }
  // Irregular dashed trajectories resemble the tracks of an astronomical plate.
  for(const trail of trails){
   ctx.strokeStyle=`rgba(233,230,221,${trail.brightness})`;ctx.lineWidth=.72;
   ctx.setLineDash(trail.dashed?[2.2,5.5,4,8]:[]);
   const points=[];
   for(let j=0;j<=125;j++){
    const t=trail.start+trail.length*j/125;
    const angle=trail.angle+Math.sin(t*trail.frequency*5+trail.wave)*trail.amplitude+.15*Math.sin(t*11+trail.wave);
    points.push(position(t,angle+time*.00065,phase));
   }
   path(points);
  }
  ctx.setLineDash([]);
  for(const star of stars){
   const p=position(star.depth,star.angle+time*.00065,phase);
   if(p[0]<-5||p[0]>width+5||p[1]<-5||p[1]>height+5)continue;
   const s=(star.size>.95?1.7+star.size*.4:.35+star.size*.83)*Math.max(.68,Math.min(1.2,unit/730));
   ctx.fillStyle=ctx.strokeStyle=`rgba(250,247,238,${.7+star.brightness*.3})`;
   ctx.beginPath();ctx.ellipse(p[0],p[1],s*(star.ring?1.45:1),s*(1.2+star.stretch*.65),star.angle+.3,0,Math.PI*2);
   if(star.ring){ctx.lineWidth=.65;ctx.stroke();}else ctx.fill();
  }
  // The final opening is anchored exactly to the viewport centre.
  ctx.fillStyle='#030202';ctx.beginPath();ctx.ellipse(width/2,height/2,inner*.9,inner*.7,0,0,Math.PI*2);ctx.fill();
 }
 function frame(now){raf=0;if(document.hidden)return;if(now-last>32){time+=Math.min((now-last)/1000,.05);last=now;draw();}if(!reduced.matches)raf=requestAnimationFrame(frame);}
 function resize(){width=innerWidth;height=innerHeight;unit=Math.min(width,height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);inner=Math.max(3,unit*.012);outer=Math.hypot(width,height)*.84;span=Math.log(outer/inner);draw();}
 function resume(){cancelAnimationFrame(raf);raf=0;last=performance.now();if(!document.hidden&&!reduced.matches)raf=requestAnimationFrame(frame);else draw();}
 addEventListener('resize',resize);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);resize();resume();
})();
