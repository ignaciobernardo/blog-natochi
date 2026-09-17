(() => {
'use strict';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {alpha:false});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let width, height, unit, yaw = -.39, pitch = .25, zoom = 1, drag = null, previous = 0;
let seed = 181993;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const range = (a,b) => a + random() * (b-a);
const names = ['Sirius','Canopus','Alpha Centauri','Arcturus','Vega','Capella','Rigel','Procyon','Achernar','Betelgeuse','Hadar','Altair','Acrux','Aldebaran','Antares','Spica','Pollux','Fomalhaut','Deneb','Mimosa','Regulus',"Barnard’s Star",'Luyten’s Star','Ross 128','Lacaille 9352'];
const greek = ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa','Lambda','Mu','Nu','Xi','Omicron','Pi','Rho','Sigma','Tau','Upsilon'];
const constellations = ['Indi','Ursae Majoris','Sagittarii','Draconis','Hydrae','Eridani','Carinae','Cygni','Centauri','Aquilae','Ceti','Leonis','Pavonis','Cassiopeiae','Trianguli','Canis Majoris'];
const stars = Array.from({length:850}, (_,i) => {
  const outer = i < 65;
  const x = outer ? range(-640,670) : (random()+random()+random()-1.5)*260+100;
  const y = outer ? range(-100,350) : range(-160,160);
  const z = outer ? range(-420,650) : range(-160,610);
  const ra = `${Math.floor(range(0,24))} ${Math.floor(range(0,60))}`;
  const dec = `${range(-89,89).toFixed(1)}`;
  return {x,y,z,outer, lines:[
    i < names.length ? names[i] : `${greek[i%greek.length]} ${constellations[Math.floor(random()*constellations.length)]}`,
    `Equatorial Coordinates  ra:${ra} dec:${dec}`,
    `Galactic Coordinates  l:${range(0,360).toFixed(1)} b:${range(-90,90).toFixed(1)}`,
    `distance:${range(3,470).toFixed(0)}`,
    `the spectral classification:${['B2V','G5III','K5III','A4V','M1V','F8V','O9.5V'][i%7]}`,
    `apparent magnitude:${range(-1,9).toFixed(2)}`,
    `absolute magnitude:${range(-4,12).toFixed(1)}`,
    `prlx:${range(.1,60).toFixed(2)}`,
    `error:${range(.01,1).toFixed(2)}`
  ]};
});
const beams = Array.from({length:32}, (_,i) => {
 const offset=range(-40,40);
 return i<19 ? {a:{x:-1000,y:offset-90,z:-150+offset},b:{x:1000,y:offset+230,z:200+offset},blue:true} : {a:{x:-650+offset,y:330+offset,z:250},b:{x:650+offset,y:-240+offset,z:-250},blue:i<29};
});
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;unit=Math.min(width/900,height/675);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
function project(p){
 const x=p.x*Math.cos(yaw)-p.z*Math.sin(yaw), z=p.x*Math.sin(yaw)+p.z*Math.cos(yaw);
 const y=p.y*Math.cos(pitch)+z*Math.sin(pitch), depth=-p.y*Math.sin(pitch)+z*Math.cos(pitch);
 const scale=820/(1050+depth)*unit*zoom;
 return {x:width*.47+x*scale,y:height*.49-y*scale,s:scale,depth};
}
function line(a,b,color,w=1){const p=project(a),q=project(b);if(p.depth < -850 || q.depth < -850)return;ctx.strokeStyle=color;ctx.lineWidth=w*unit;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
function draw(){
 ctx.fillStyle='#080909';ctx.fillRect(0,0,width,height);
 // A true perspective X/Z floor, composed entirely of individual points.
 ctx.fillStyle='#a9aaaa';
 for(let x=-1000;x<=1000;x+=25)for(let z=-550;z<=1250;z+=25){const p=project({x,y:-190,z});if(p.depth < -850)continue;const s=Math.max(.48,Math.min(1.3,p.s*.9));ctx.globalAlpha=.85;ctx.fillRect(p.x,p.y,s,s);}
 ctx.globalAlpha=1;
 for(let n=-800;n<=1000;n+=400){line({x:n,y:-190,z:-550},{x:n,y:-190,z:1250},'#646666',.7);line({x:-1000,y:-190,z:n},{x:1000,y:-190,z:n},'#646666',.7);}
 line({x:-1000,y:-189,z:0},{x:1000,y:-189,z:0},'#d5d7d7',1.2);
 line({x:0,y:-189,z:-550},{x:0,y:-189,z:1250},'#d5d7d7',1.2);
 line({x:0,y:-190,z:0},{x:0,y:470,z:0},'#2929ff',.8);
 ctx.font=`${10*unit}px monospace`;ctx.fillStyle='#e1e3e3';
 for(let n=-800;n<=1000;n+=200){for(const p of [{x:n,y:-190,z:0},{x:0,y:-190,z:n}]){const q=project(p);ctx.fillText(String(n),q.x+4*unit,q.y+12*unit);}}
 for(const [label,p] of [['X',{x:430,y:-190,z:0}],['Z',{x:0,y:-190,z:-450}],['Y',{x:0,y:440,z:0}]]){const q=project(p);ctx.font=`bold ${17*unit}px Arial`;ctx.fillText(label,q.x+7*unit,q.y);}
 const sorted=stars.map(star=>({star,p:project(star)})).sort((a,b)=>b.p.depth-a.p.depth);
 for(const {star,p} of sorted){
  if(p.depth < -800 || p.x < -200 || p.x>width+30 || p.y < -100 || p.y>height+30)continue;
  const size=Math.max(3.3*unit,Math.min(8.6*unit,7.6*p.s));
  const cross=Math.max(2.1*unit,5*p.s);
  ctx.strokeStyle='#d21b35';ctx.lineWidth=.85*unit;ctx.beginPath();ctx.moveTo(p.x-cross,p.y);ctx.lineTo(p.x+cross,p.y);ctx.moveTo(p.x,p.y-cross);ctx.lineTo(p.x,p.y+cross);ctx.stroke();
  ctx.font=`700 ${size}px Arial, Helvetica, sans-serif`;ctx.fillStyle='#f2f4ef';
  for(let j=0;j<star.lines.length;j++)ctx.fillText(star.lines[j],p.x+6*p.s,p.y+size*.3+j*size*1.05);
 }
 // Electric-blue survey rays cut across the crowded catalogue.
 for(const beam of beams)line(beam.a,beam.b,beam.blue?'#1515ff':'#e0e2e0',beam.blue?rangeStable(beam):.65);
}
function rangeStable(b){return .5+Math.abs(b.a.x%3)*.48;}
function tick(time){const dt=Math.min(40,time-previous);previous=time;if(!reduced.matches && !drag && document.visibilityState==='visible'){yaw+=dt*.000006;draw();}requestAnimationFrame(tick);}
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.004;pitch=Math.max(-.8,Math.min(1.1,pitch+(e.clientY-drag.y)*.003));drag={x:e.clientX,y:e.clientY};draw();});
const release=()=>{drag=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(2.6,zoom*Math.exp(-e.deltaY*.001)));draw();},{passive:false});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','r','R'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.07;if(e.key==='ArrowRight')yaw+=.07;if(e.key==='ArrowUp')pitch=Math.min(1.1,pitch+.07);if(e.key==='ArrowDown')pitch=Math.max(-.8,pitch-.07);if(e.key==='+'||e.key==='=')zoom=Math.min(2.6,zoom*1.1);if(e.key==='-')zoom=Math.max(.45,zoom/1.1);if(e.key.toLowerCase()==='r'){yaw=-.39;pitch=.25;zoom=1;}draw();});
new ResizeObserver(resize).observe(canvas);resize();requestAnimationFrame(tick);
})();
