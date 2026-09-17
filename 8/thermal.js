(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const buffer = document.createElement('canvas');
  const bctx = buffer.getContext('2d', { alpha: false });
  const S = 360;
  buffer.width = buffer.height = S;
  const pixels = bctx.createImageData(S, S);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let seed = Math.random()*100, specimen = 1, time = 0, previous = 0, request = 0;
  const TAU = Math.PI*2;
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
  const colors = [[1,254/255,250/255],[1,.95,.89],[1,.78,.57],[1,.60,.35],[.79,.58,.71],[.30,.66,.91],[.46,.86,.92],[.98,.99,.59]];
  const stops = [0,.06,.18,.33,.45,.56,.7,1.05];
  const geometry = new Float32Array(S*S*4);
  for (let y=0;y<S;y++) for (let x=0;x<S;x++) {
    const px=(x+.5)/S*2-1, py=(y+.5)/S*2-1, k=(y*S+x)*4;
    geometry[k]=px;geometry[k+1]=py;geometry[k+2]=Math.hypot(px,py);geometry[k+3]=Math.atan2(py,px);
  }
  function draw() {
    const sites=[];
    for (let i=0;i<8;i++) {
      const angle=i/8*TAU+seed+Math.sin(time*.13+i*2.1)*.13+Math.sin(i*7.1+seed)*.1;
      const radius=.57+Math.sin(i*4.3+seed+time*.17)*.045;
      sites.push([Math.cos(angle)*radius,Math.sin(angle)*radius,.048+.019*(.5+.5*Math.sin(i*3.7+seed)),.72+.22*Math.sin(i*1.7+seed+time*.3)]);
    }
    for (let i=0;i<S*S;i++) {
      const k=i*4,x=geometry[k],y=geometry[k+1],r=geometry[k+2],a=geometry[k+3];
      const wave=Math.sin(a*3+seed+time*.17)*.027+Math.sin(a*7-seed-time*.12)*.018;
      const radius=.575+wave;
      const thickness=.072+.02*Math.sin(a*5+seed+time*.14);
      const dr=(r-radius)/thickness;
      let value=.29*Math.exp(-dr*dr*.6);
      for (let j=0;j<8;j++) {
        const site=sites[j],dx=x-site[0],dy=y-site[1];
        let radial=(dx*site[0]+dy*site[1])/.57;
        let tangent=(-dx*site[1]+dy*site[0])/.57;
        radial+=Math.sin(tangent*65+j+time*.2)*.011;
        tangent+=Math.sin(radial*55+j*2)*.009;
        const dist=radial*radial/(site[2]*site[2])+tangent*tangent/(site[2]*site[2]*1.55);
        value+=site[3]*Math.exp(-dist*.6);
      }
      // Small outward folds give the soft ring its irregular, specimen-like edge.
      for (let j=0;j<3;j++) {
        const angle=seed+j*2.13+Math.sin(time*.12+j)*.09;
        const ca=Math.cos(angle),sa=Math.sin(angle);
        const radial=x*ca+y*sa-.7,tangent=-x*sa+y*ca;
        value+=.6*Math.exp(-(radial*radial/.004+tangent*tangent/.00065));
      }
      const mask=smooth(.32,.4,r)*(1-smooth(.81,.9,r));
      value*=mask;
      let band=0;
      while(band<stops.length-2 && value>stops[band+1])band++;
      const blend=smooth(stops[band],stops[band+1],value);
      const grain=(Math.sin(i*127.1+seed)*43758.5453)%1*.004*clamp(value*6);
      for(let channel=0;channel<3;channel++) pixels.data[k+channel]=255*(colors[band][channel]*(1-blend)+colors[band+1][channel]*blend+grain);
      pixels.data[k+3]=255;
    }
    bctx.putImageData(pixels,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(buffer,0,0,canvas.width,canvas.height);
    document.getElementById('frame').textContent=String(Math.floor(time*12)%1000);
  }
  function resize() {
    const size=Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,2));
    canvas.width=canvas.height=size; draw();
  }
  function tick(now) {
    request=0;
    if(document.hidden || reduced.matches)return;
    if(now-previous>65) {time+=Math.min((now-previous)/1000,.1);previous=now;draw();}
    request=requestAnimationFrame(tick);
  }
  function start() {previous=performance.now();if(!request&&!document.hidden&&!reduced.matches)request=requestAnimationFrame(tick);}
  document.querySelector('button').addEventListener('click',()=>{seed=Math.random()*100;time=0;document.getElementById('specimen').textContent=String(++specimen).padStart(2,'0');draw();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(request);request=0;}else start();});
  reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(request);request=0;}else start();});
  addEventListener('resize',resize);
  resize();start();
})();
