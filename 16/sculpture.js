(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const space = document.querySelector('#space');
  let canvas = document.querySelector('#sculpture');
  const details = document.querySelector('#details');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width, height, dpr, scale, gl, program, mesh, cloud, frame = 0;
  let elapsed = 0, last = null, mobile = null, fallback = false;

  // A fixed seed keeps each grain attached to the same place on the surface.
  function random(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function surface(band, u, v) {
    const latitude = -1.38 + band * .455 + v * .285
      + .23 * Math.sin(2 * u + band * .77) * Math.cos(-1.3 + band * .44)
      + .075 * Math.sin(5 * u - band * .6);
    const r = 1 + .10 * Math.sin(3 * u + band * 1.12)
      + .065 * Math.cos(7 * u + latitude * 4)
      + .09 * Math.sin(v * Math.PI);
    return [r * Math.cos(latitude) * Math.cos(u),
      r * Math.sin(latitude), r * Math.cos(latitude) * Math.sin(u)];
  }

  function geometry(small) {
    const rnd = random(161803);
    const triangles = [], points = [];
    const nu = 240, nv = 18;
    for (let b = 0; b < 6; b++) {
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = surface(b, i / nu * TAU, j / nv);
        const c = surface(b, (i + 1) / nu * TAU, j / nv);
        const d = surface(b, i / nu * TAU, (j + 1) / nv);
        const e = surface(b, (i + 1) / nu * TAU, (j + 1) / nv);
        for (const p of [a, c, d, c, e, d]) triangles.push(...p, 0, 1);
      }
      const count = small ? 24000 : 64000;
      for (let i = 0; i < count; i++) {
        const u = rnd() * TAU;
        // Additional samples hug the torn lips of each ribbon.
        let v = rnd();
        if (rnd() < .28) v = rnd() < .5 ? Math.pow(v, 3) * .15 : 1 - Math.pow(v, 3) * .15;
        const p = surface(b, u, v);
        const edge = Math.pow(Math.abs(v * 2 - 1), 5);
        const light = .45 + .45 * rnd() + .20 * edge;
        points.push(...p, light, 1.0 + Math.pow(rnd(), 3) * .9);
      }
    }
    return { triangles: new Float32Array(triangles), points: new Float32Array(points) };
  }

  const vertex = `
    attribute vec3 aPosition;
    attribute float aLight;
    attribute float aSize;
    uniform vec2 uViewport;
    uniform float uScale, uAngle, uDpr;
    varying float vLight;
    varying vec2 vPosition;
    void main() {
      float c = cos(uAngle), s = sin(uAngle);
      vec3 p = vec3(c*aPosition.x+s*aPosition.z, aPosition.y, -s*aPosition.x+c*aPosition.z);
      // Fixed camera inclination; no pointer-dependent camera or geometry.
      p.yz = mat2(.9689, .2474, -.2474, .9689) * p.yz;
      p.xy = mat2(.9781, -.2079, .2079, .9781) * p.xy;
      float perspective = 3.8 / (3.8-p.z);
      vPosition = p.xy * perspective;
      gl_Position = vec4(vPosition * uScale * 2.0 / uViewport, -p.z*.3, 1.0);
      gl_PointSize = aSize * uDpr;
      vLight = aLight * (.64 + .36 * smoothstep(-1.0, 1.0, p.z));
    }`;
  const fragment = `
    precision highp float;
    uniform bool uPoints;
    varying float vLight;
    varying vec2 vPosition;
    void main() {
      float angle = atan(vPosition.y, vPosition.x);
      // Both the opaque depth surfaces and their grains leave this aperture open.
      float aperture = .245 + .012*sin(angle*5.0) + .008*sin(angle*9.0);
      if (length(vPosition) < aperture) discard;
      if (uPoints) {
        float d = length(gl_PointCoord-.5);
        if (d > .5) discard;
        gl_FragColor = vec4(vec3(vLight * (1.0-smoothstep(.23,.5,d))), 1.0);
      } else gl_FragColor = vec4(0.0,0.0,0.0,1.0);
    }`;

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  function initGL() {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: true, premultipliedAlpha: false });
    if (!gl) return false;
    program = gl.createProgram();
    const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    program.uniforms = Object.fromEntries(['uViewport','uScale','uAngle','uDpr','uPoints'].map(n => [n, gl.getUniformLocation(program, n)]));
    program.attributes = ['aPosition','aLight','aSize'].map(n => gl.getAttribLocation(program, n));
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    return true;
  }
  function upload(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return { buffer, count: data.length / 5 };
  }
  function drawBuffer(data, points) {
    gl.bindBuffer(gl.ARRAY_BUFFER, data.buffer);
    program.attributes.forEach((a, i) => {
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, i === 0 ? 3 : 1, gl.FLOAT, false, 20, i === 0 ? 0 : (i + 2) * 4);
    });
    gl.uniform1i(program.uniforms.uPoints, points);
    gl.drawArrays(points ? gl.POINTS : gl.TRIANGLES, 0, data.count);
  }
  function render() {
    if (fallback) return;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(program.uniforms.uViewport, width, height);
    gl.uniform1f(program.uniforms.uScale, scale);
    gl.uniform1f(program.uniforms.uDpr, dpr);
    gl.uniform1f(program.uniforms.uAngle, elapsed / 120000 * TAU + .48);
    // Opaque surfaces first: grains on the far side cannot shine through a fold.
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
    drawBuffer(mesh, false);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    drawBuffer(cloud, true);
  }

  function setup2D(element) {
    const ctx = element.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    return ctx;
  }
  function background() {
    const ctx = setup2D(space), rnd = random(6174);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < Math.min(26000, width * height / 32); i++) {
      const x = rnd() * width, y = rnd() * height;
      const bright = rnd(), size = bright > .993 ? 1.3 : .35 + rnd() * .55;
      ctx.fillStyle = `rgba(255,255,255,${.045 + Math.pow(bright, 9) * .55})`;
      ctx.fillRect(x, y, size, size);
    }
    ctx.save(); ctx.translate(width / 2, height / 2);
    const glow = ctx.createRadialGradient(0, 0, scale * .245, 0, 0, scale * .39);
    glow.addColorStop(0, '#fff'); glow.addColorStop(.32, '#b8b8b8'); glow.addColorStop(.59, '#252525'); glow.addColorStop(1, '#0000');
    ctx.fillStyle = glow; ctx.fillRect(-scale, -scale, scale * 2, scale * 2);
    ctx.beginPath(); ctx.arc(0, 0, scale * .266, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }
  function foreground() {
    const ctx = setup2D(details);
    const cx = width / 2, cy = height / 2, foot = cy + scale * .155;
    ctx.lineWidth = .5;
    ctx.strokeStyle = 'rgba(150,150,150,.48)';
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
    ctx.moveTo(0, foot); ctx.lineTo(width, foot); ctx.stroke();
    // A tiny, still human scale marker silhouetted against the luminous core.
    const s = Math.max(.58, scale / 380);
    ctx.save(); ctx.translate(cx + scale * .031, foot); ctx.scale(s, s);
    ctx.fillStyle = '#050505'; ctx.strokeStyle = '#050505';
    ctx.beginPath(); ctx.ellipse(0, -24, 2.4, 3, -.12, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, -20); ctx.quadraticCurveTo(-5,-16,-3,-10);
    ctx.lineTo(3,-10); ctx.lineTo(3,-18); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2,-11); ctx.lineTo(-2, -5); ctx.lineTo(-3,0);
    ctx.moveTo(2,-11); ctx.lineTo(2,-5); ctx.lineTo(4,0);
    ctx.moveTo(-3,-18); ctx.lineTo(-5,-11); ctx.moveTo(3,-18); ctx.lineTo(5,-12); ctx.stroke();
    ctx.restore();
  }

  function staticFallback() {
    const ctx = setup2D(canvas);
    const { points } = geometry(true);
    // Rasterize opaque curved ribbons, then grains, from back to front.
    const c = Math.cos(.48), s = Math.sin(.48);
    function project(p) {
      const x = c*p[0]+s*p[2], z = -s*p[0]+c*p[2];
      const y = .9689*p[1]-.2474*z, zz = .2474*p[1]+.9689*z;
      const f = 3.8/(3.8-zz);
      return [(.9781*x+.2079*y)*f,(-.2079*x+.9781*y)*f,zz];
    }
    ctx.save(); ctx.translate(width/2,height/2);
    const path = new Path2D();
    path.rect(-width,-height,width*2,height*2);
    for (let i = 0; i <= 180; i++) {
      const a = i/180*TAU, r = (.245+.012*Math.sin(a*5)+.008*Math.sin(a*9))*scale;
      if (!i) path.moveTo(Math.cos(a)*r, -Math.sin(a)*r);
      else path.lineTo(Math.cos(a)*r, -Math.sin(a)*r);
    }
    path.closePath(); ctx.clip(path,'evenodd');
    // A software z buffer also prevents back-facing particles from leaking through.
    const size = Math.ceil(scale * 2.9), half = size / 2;
    const zbuf = new Float32Array(size * size); zbuf.fill(-Infinity);
    const pixels = ctx.createImageData(size,size);
    function raster(a,b,c) {
      const pts = [a,b,c].map(p=>[p[0]*scale+half,-p[1]*scale+half,p[2]]);
      const [p,q,r] = pts;
      const area = (q[1]-r[1])*(p[0]-r[0])+(r[0]-q[0])*(p[1]-r[1]);
      if (Math.abs(area)<.001) return;
      const x0=Math.max(0,Math.floor(Math.min(p[0],q[0],r[0]))), x1=Math.min(size-1,Math.ceil(Math.max(p[0],q[0],r[0])));
      const y0=Math.max(0,Math.floor(Math.min(p[1],q[1],r[1]))), y1=Math.min(size-1,Math.ceil(Math.max(p[1],q[1],r[1])));
      for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) {
        const u=((q[1]-r[1])*(x-r[0])+(r[0]-q[0])*(y-r[1]))/area;
        const v=((r[1]-p[1])*(x-r[0])+(p[0]-r[0])*(y-r[1]))/area, w=1-u-v;
        if(u<0||v<0||w<0) continue;
        const k=y*size+x, z=u*p[2]+v*q[2]+w*r[2];
        if(z>zbuf[k]) { zbuf[k]=z; pixels.data[k*4+3]=255; }
      }
    }
    for(let b=0;b<6;b++) for(let i=0;i<160;i++) for(let j=0;j<12;j++) {
      const a=project(surface(b,i/160*TAU,j/12)), q=project(surface(b,(i+1)/160*TAU,j/12));
      const r=project(surface(b,i/160*TAU,(j+1)/12)), t=project(surface(b,(i+1)/160*TAU,(j+1)/12));
      raster(a,q,r); raster(q,t,r);
    }
    for(let i=0;i<points.length;i+=5) {
      const p=project(points.subarray(i,i+3)), x=Math.round(p[0]*scale+half), y=Math.round(-p[1]*scale+half);
      if(x<0||x>=size||y<0||y>=size) continue;
      const k=y*size+x;
      if(p[2]<zbuf[k]-.018) continue;
      const light=255*points[i+3]*(.64+.36*Math.max(0,Math.min(1,(p[2]+1)/2)));
      pixels.data[k*4]=pixels.data[k*4+1]=pixels.data[k*4+2]=light;
      pixels.data[k*4+3]=255;
    }
    const offscreen=document.createElement('canvas'); offscreen.width=offscreen.height=size;
    offscreen.getContext('2d').putImageData(pixels,0,0);
    ctx.drawImage(offscreen,-half,-half); ctx.restore();
  }
  function useFallback() {
    cancelAnimationFrame(frame); fallback = true;
    const replacement = canvas.cloneNode(); canvas.replaceWith(replacement); canvas = replacement;
    resize();
  }
  function resize() {
    width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    scale = Math.min(width * .365, height * .355);
    for (const element of [space,canvas,details]) {
      element.width = Math.round(width*dpr); element.height = Math.round(height*dpr);
    }
    background(); foreground();
    if (fallback) { staticFallback(); return; }
    gl.viewport(0,0,canvas.width,canvas.height);
    const small = width < 700;
    if (mobile !== small) {
      mobile = small;
      const data = geometry(small);
      if(mesh) gl.deleteBuffer(mesh.buffer);
      if(cloud) gl.deleteBuffer(cloud.buffer);
      mesh = upload(data.triangles); cloud = upload(data.points);
    }
    render();
  }
  function tick(now) {
    if (document.hidden || reduced.matches || fallback) { last = null; return; }
    if (last !== null) elapsed += now-last;
    last = now; render(); frame = requestAnimationFrame(tick);
  }
  function motion() {
    cancelAnimationFrame(frame); last = null;
    if (reduced.matches) { elapsed = 0; render(); }
    if (!document.hidden && !reduced.matches && !fallback) frame = requestAnimationFrame(tick);
  }
  try {
    if (!initGL()) useFallback();
    else {
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); useFallback(); }, {once:true});
      resize(); motion();
    }
  } catch (error) {
    console.warn('Static sculpture fallback:', error.message); useFallback();
  }
  let resizeFrame;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(resize);
  });
  document.addEventListener('visibilitychange', motion);
  reduced.addEventListener('change', motion);
})();
