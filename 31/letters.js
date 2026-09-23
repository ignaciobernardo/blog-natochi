(() => {
'use strict';
const canvas = document.querySelector('#page');
const ctx = canvas.getContext('2d');
const W = 1000, H = 603;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let playing = !reduced.matches, time = 0, previous = 0;
const pointer = {x: -1000, y: -1000};
const glyphs = [];
let seed = 31;
const random = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
const font = '17px "Times New Roman", Georgia, serif';
ctx.font = font;
function line(text, x, y, left = false) {
  let offset = 0;
  for (const char of text) {
    const width = ctx.measureText(char).width;
    if (char !== ' ') glyphs.push({char, x:x+offset, y, left, noise:random(), phase:random()*Math.PI*2, dx:0, dy:0, vx:0, vy:0});
    offset += width;
  }
}
function lines(text, x, y, left = false) {text.forEach((text,i) => line(text,x,y+i*22.5,left));}
lines([
 'Cream two tablespoonfuls of butter, add one-',
 'fourth cupful of grated American cheese and one tea-',
 'spoonful of vinegar, and season with salt, paprika,',
 'mustard and anchovy essence. Place mixture between',
 'thin slices of white bread. Garnish with a pickle.'
],22,91,true);
lines(['AMERICAN CHEESE SAND-','WICH NO. 3'],22,227,true);
lines(['Salted cracker slightly toasted, spread with','American cheese ; serve hot.'],22,295,true);
line('103',22,407,true);
lines(['AMERICAN CHEESE SANDWICH','NO. 4'],22,498,true);
lines([
 'Melt a quarter of a pound of American cheese in',
 'a sauce pan, add the yolk of one egg beaten, two',
 'tablespoonfuls of cream, a dash of salt and pepper,',
 'and half a teaspoonful of Worcestershire sauce. Take',
 'from the fire and when cooled, spread on buttered',
 'white or rye bread. Press the two together and cut in',
 'strips. Garnish with a pickle.'
],519,102);
line('CHEESE RARE-BIT SANDWICH',519,282);
lines([
 'Grate a quarter of a pound of American cheese',
 'fine; melt it in a sauce pan over the fire, add the yolks',
 'of two eggs well beaten, two tablespoonfuls of cream,',
 'a dash of salt and a half teaspoonful of',
 'Worcestershire sauce. Stir until melted',
 'cheese ; when blended remove from the fire and when',
 'cool, spread it on thin slices of lightly buttered',
 'bread. Put the two slices together and garnish with',
 'an olive.'
],519,327);
const vortices = [
 {x:852,y:133,rx:77,ry:81,reach:102},
 {x:688,y:379,rx:51,ry:68,reach:76},
 {x:817,y:449,rx:62,ry:70,reach:86}
];
function position(g) {
  let x=g.x, y=g.y, angle=0;
  if(g.left) {
    y += Math.sin(g.x*.11+g.phase*.22)*1.25;
    angle = (g.noise-.5)*.18;
  } else {
    for(const v of vortices) {
      const dx=g.x-v.x,dy=g.y-v.y,d=Math.hypot(dx,dy);
      if(d >= v.reach) continue;
      const weight=Math.min(1,(v.reach-d)/22);
      const a=Math.atan2(dy,dx)+.58+time*.17*(.7+g.noise*.3);
      const radius=1+(g.noise-.5)*.30;
      x += (v.x+Math.cos(a)*v.rx*radius-g.x)*weight;
      y += (v.y+Math.sin(a)*v.ry*radius-g.y)*weight;
      angle += (a+Math.PI/2)*weight;
    }
  }
  return {x,y,angle};
}
function render(step=0) {
  const scale=canvas.width/W;
  ctx.setTransform(scale,0,0,scale,0,0);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#dededc';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(474,30);ctx.lineTo(474,526);ctx.stroke();
  ctx.font=font;ctx.fillStyle='#454541';
  for(const g of glyphs) {
    const p=position(g);
    if(step) {
      const dx=p.x+g.dx-pointer.x,dy=p.y+g.dy-pointer.y,d=Math.hypot(dx,dy);
      if(d<65 && d>0) {const f=(1-d/65)*.85;g.vx+=dx/d*f*step;g.vy+=dy/d*f*step;}
      g.vx=(g.vx-g.dx*.018*step)*Math.pow(.88,step);
      g.vy=(g.vy-g.dy*.018*step)*Math.pow(.88,step);
      g.dx+=g.vx*step;g.dy+=g.vy*step;
    }
    ctx.save();ctx.translate(p.x+g.dx,p.y+g.dy);ctx.rotate(p.angle+g.vx*.025);
    ctx.fillText(g.char,0,0);ctx.restore();
  }
}
function resize() {
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(canvas.clientWidth*dpr);
  canvas.height=Math.round(canvas.clientWidth*H/W*dpr);
  render();
}
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*W/r.width;pointer.y=(e.clientY-r.top)*H/r.height;});
canvas.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-1000;});
canvas.addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();playing=!playing;}
  if(e.key.toLowerCase()==='r'){time=0;for(const g of glyphs)g.dx=g.dy=g.vx=g.vy=0;render();}
});
reduced.addEventListener('change',e=>{playing=!e.matches;});
new ResizeObserver(resize).observe(canvas);
function frame(now) {
  const dt=previous?Math.min((now-previous)/1000,.035):0;previous=now;
  if(playing&&!document.hidden){time+=dt;render(dt*60);}
  requestAnimationFrame(frame);
}
resize();requestAnimationFrame(frame);
})();
