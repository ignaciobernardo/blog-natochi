(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  let seed = 481923;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const range = (a, b) => a + random() * (b - a);
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const mul = (a, n) => a.map(v => v * n);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = a => mul(a, 1 / Math.hypot(...a));
  const direction = () => { const z = range(-1, 1), t = range(0, TAU), r = Math.sqrt(1-z*z); return [r*Math.cos(t), r*Math.sin(t), z]; };
  const points = [], edges = [], orbits = [];
  function point(p, size = 0) { points.push({ p, size, tone: random() }); return points.length - 1; }
  function connect(a, b, strong = false) { edges.push({ a, b, strong }); }
  const hubs = [];
  // Nested radial fans form an irregular, hollow, three-dimensional organism.
  for (let i = 0; i < 105; i++) {
    const normal = direction();
    const center = mul(normal, range(.68, 1.02));
    const hub = point(center, range(1.3, 2.2));
    hubs.push(hub);
    const u = unit(cross(normal, Math.abs(normal[1]) > .9 ? [1, 0, 0] : [0, 1, 0]));
    const v = cross(normal, u);
    const radius = range(.055, .185);
    const branches = Math.floor(range(17, 43));
    const phase = range(0, TAU);
    for (let j = 0; j < branches; j++) {
      const angle = phase + j / branches * TAU;
      const reach = radius * range(.7, 1.2);
      const tangent = add(mul(u, Math.cos(angle)), mul(v, Math.sin(angle)));
      const tip = add(center, add(mul(tangent, reach), mul(normal, range(.015, .1))));
      const branch = point(tip, range(1.4, 2.8));
      connect(hub, branch);
      const count = Math.floor(range(4, 13));
      for (let k = 0; k < count; k++) {
        const leafAngle = range(0, TAU);
        const leafRadius = range(.006, .039);
        const leaf = add(tip, add(mul(u, Math.cos(leafAngle)*leafRadius), add(mul(v, Math.sin(leafAngle)*leafRadius), mul(normal, range(-.018, .018)))));
        const id = point(leaf, range(1.25, 3));
        connect(branch, id);
      }
      if (random() < .38) {
        const inner = point(add(center, mul(add(mul(tangent, reach), mul(normal, .07)), range(.4, .85))), range(1, 2.2));
        connect(hub, inner);
      }
    }
  }
  // A sparse scaffold connects the dense botanical clusters.
  hubs.forEach((hub, i) => {
    const nearest = hubs.filter((_, j) => j !== i).sort((a, b) => {
      const distance = id => points[id].p.reduce((sum, n, k) => sum + (n-points[hub].p[k])**2, 0);
      return distance(a) - distance(b);
    }).slice(0, 3);
    nearest.forEach(other => { if (hub < other) connect(hub, other, true); });
    if (i % 9 === 0) connect(hub, hubs[(i + 37) % hubs.length], true);
  });
  // Great circles share the particle shell's radius and stay against its surface.
  const shellRadius = 1.04;
  for (let i = 0; i < 4; i++) {
    const normal = direction(), u = unit(cross(normal, [0, 1, 0])), v = cross(normal, u);
    const orbit = [];
    for (let j = 0; j <= 220; j++) {
      const t = j / 220 * TAU;
      orbit.push(mul(add(mul(u, Math.cos(t)), mul(v, Math.sin(t))), shellRadius));
    }
    orbits.push(orbit);
  }
  let width, height, scale, dpr;
  let yaw = .15, pitch = -.18, velocityX = 0, velocityY = 0;
  let dragging = false, pointerId = null, lastX = 0, lastY = 0, lastMove = 0;
  let projected = new Array(points.length), lastFrame = 0, frameId = 0;
  function resize() {
    width = innerWidth; height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width, height) * .365;
    render();
  }
  function project(p) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
    const x = p[0]*cy + p[2]*sy, z = -p[0]*sy + p[2]*cy;
    const y = p[1]*cx - z*sx, depth = p[1]*sx + z*cx;
    const perspective = 4.5 / (4.5-depth);
    return [width*.5+x*scale*perspective, height*.49+y*scale*perspective, depth, perspective];
  }
  function render() {
    ctx.fillStyle = '#291e29'; ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < points.length; i++) projected[i] = project(points[i].p);
    ctx.lineWidth = .55;
    for (const orbit of orbits) {
      ctx.beginPath();
      orbit.forEach((p, i) => { const q = project(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.strokeStyle = '#739773'; ctx.globalAlpha = .7; ctx.stroke();
    }
    // Depth bands keep the back subdued and the foreground acid yellow.
    for (let band = 0; band < 8; band++) {
      const low = -1.5 + band * .375, high = low + .375;
      ctx.beginPath();
      for (const e of edges) {
        const a = projected[e.a], b = projected[e.b], z = (a[2]+b[2])*.5;
        if (z < low || z >= high) continue;
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      }
      ctx.globalAlpha = .12 + band*.065;
      ctx.strokeStyle = '#74ac4b'; ctx.stroke();
      ctx.globalAlpha = 1;
      const t = band / 7;
      ctx.fillStyle = `rgb(${Math.round(105+145*t)},${Math.round(113+142*t)},${Math.round(33+30*t)})`;
      for (let i = 0; i < points.length; i++) {
        const q = projected[i], p = points[i];
        if (q[2] < low || q[2] >= high) continue;
        const size = p.size * q[3] * Math.max(.65, Math.min(1.1, scale/330));
        ctx.fillRect(Math.round(q[0]), Math.round(q[1]), size, size);
      }
    }
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    const dt = Math.min((now-lastFrame)/16.667 || 1, 3); lastFrame = now;
    if (!dragging && !reducedMotion.matches) {
      yaw += (.00075 + velocityX)*dt; pitch += velocityY*dt;
      velocityX *= Math.pow(.94, dt); velocityY *= Math.pow(.94, dt);
    }
    render();
    if (!reducedMotion.matches || dragging) frameId = requestAnimationFrame(tick);
    else frameId = 0;
  }
  function start() { if (!frameId && !document.hidden) { lastFrame = performance.now(); frameId = requestAnimationFrame(tick); } }
  canvas.addEventListener('pointerdown', event => {
    if (pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerId = event.pointerId; dragging = true; lastX = event.clientX; lastY = event.clientY;
    velocityX = velocityY = 0;
    canvas.setPointerCapture(pointerId); document.body.classList.add('interacted'); start();
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== pointerId) return;
    velocityX = (event.clientX-lastX)*.005; velocityY = (event.clientY-lastY)*.005;
    yaw += velocityX; pitch += velocityY;
    lastX = event.clientX; lastY = event.clientY; lastMove = performance.now();
    render();
  });
  function release(event) {
    if (event.pointerId !== pointerId) return;
    dragging = false; pointerId = null;
    if (performance.now()-lastMove > 80 || event.type !== 'pointerup') velocityX = velocityY = 0;
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('keydown', event => {
    const delta = { ArrowLeft: [-.08, 0], ArrowRight: [.08, 0], ArrowUp: [0, -.08], ArrowDown: [0, .08] }[event.key];
    if (!delta) return;
    event.preventDefault(); yaw += delta[0]; pitch += delta[1]; render();
    document.body.classList.add('interacted');
  });
  // Camera distance stays constant: neither wheel nor multi-touch changes scale.
  canvas.addEventListener('wheel', event => { if (!event.ctrlKey) event.preventDefault(); }, { passive: false });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
    else start();
  });
  reducedMotion.addEventListener('change', start);
  addEventListener('resize', resize);
  resize(); start();
})();
