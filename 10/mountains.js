(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const hash = (x, y) => {
    let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    let u = x-ix, v = y-iy;
    u = u*u*(3-2*u); v = v*v*(3-2*v);
    return (hash(ix, iy)*(1-u)+hash(ix+1, iy)*u)*(1-v)
      + (hash(ix, iy+1)*(1-u)+hash(ix+1, iy+1)*u)*v;
  }
  function elevation(x, z) {
    const peak = Math.exp(-((x+.16)**2*5.4+(z+.17)**2*2.5));
    const shoulder = .32*Math.exp(-((x-.5)**2*12+(z-.12)**2*5));
    let detail = 0, amplitude = .62, frequency = 3;
    for (let octave = 0; octave < 7; octave++) {
      const ridge = 1-Math.abs(noise(x*frequency+17, z*frequency+31)*2-1);
      detail += (ridge-.48)*amplitude;
      amplitude *= .56; frequency *= 2.13;
    }
    const edge = Math.max(0, 1-Math.abs(x)**3);
    return Math.max(0, (peak+shoulder)*(0.7+detail)*edge);
  }
  function draw() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(760*dpr); canvas.height = Math.round(450*dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f8f8f5'; ctx.fillRect(0, 0, 760, 570);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Draw successive terrain sections from back to front, masking hidden lines.
    for (let row = 0; row < 32; row++) {
      const z = -1+row/31*2;
      const breadth = .69 + .28*Math.sin((z+1)*Math.PI/2);
      const line = [];
      const baseline = 252 + z*112;
      for (let j = 0; j <= 540; j++) {
        const x = (j/540*2-1)*breadth;
        const h = elevation(x, z);
        const px = 380 + x*326 + z*28;
        const py = baseline - h*242 + x*19;
        line.push({x:px, y:py, h, worldX:x});
      }
      ctx.beginPath();
      line.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.lineTo(line[line.length-1].x, 550); ctx.lineTo(line[0].x, 550); ctx.closePath();
      ctx.fillStyle = '#f8f8f5'; ctx.fill();
      // Broken, pressure-varying strokes keep the slopes open like a pen sketch.
      for (let j = 1; j < line.length; j++) {
        const p = line[j], prev = line[j-1];
        const slope = Math.abs(p.y-prev.y);
        const ink = noise(p.worldX*15+7, z*19);
        if (p.h < .065 || (ink < .29 && p.h < .35) || (row > 26 && ink < .48)) continue;
        ctx.strokeStyle = '#20221e';
        ctx.lineWidth = .35 + Math.min(.65, slope*.16) + (ink > .77 ? .35 : 0);
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        if (j % 2 === 0 && slope > .4 && p.h > .13 && ink > .33) {
          const length = 2+hash(j, row)*8;
          const sign = p.y > prev.y ? -1 : 1;
          ctx.lineWidth = .36;
          ctx.beginPath(); ctx.moveTo(p.x, p.y+.5);
          ctx.lineTo(p.x+sign*length*.35, p.y+length*.65);
          ctx.lineTo(p.x+sign*length*.2+hash(row, j), p.y+length);
          ctx.stroke();
        }
      }
    }
  }
  document.querySelector('button').addEventListener('click', () => {
    seed = crypto.getRandomValues(new Uint32Array(1))[0]; draw();
  });
  draw();
})();
