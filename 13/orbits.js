(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const W = 600, H = 338, TAU = Math.PI * 2, FOCAL = 1800;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let seed = 130913;
  function random() {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n;
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  }

  // Initial ellipse geometry in the 600 × 338 reference frame. Each plane
  // revolves independently around the same fixed point; the camera is static.
  const rings = [
    { x: 291, y: 205, a: 205, b: 59, angle: 25.4, z: -35, ink: .95, ticks: 103, line: .14 },
    { x: 301, y: 198, a: 200, b: 62, angle: -20, z: 55, ink: .57, ticks: 162, line: .055 },
    { x: 288, y: 194, a: 178, b: 35, angle: 49, z: 100, ink: .48, ticks: 157, line: .045 },
    { x: 283, y: 178, a: 170, b: 20, angle: 69, z: 130, ink: .48, ticks: 160, line: .04 },
    { x: 287, y: 190, a: 194, b: 38, angle: -48, z: 160, ink: .44, ticks: 131, line: 0 },
    { x: 325, y: 140, a: 374, b: 145, angle: -29, z: -180, ink: .48, ticks: 180, line: .045, outer: true },
    { x: 336, y: 124, a: 325, b: 155, angle: 38, z: -100, ink: .4, ticks: 135, line: 0, outer: true },
    { x: 318, y: 175, a: 278, b: 85, angle: 73, z: 90, ink: .42, ticks: 94, line: 0, outer: true },
  ].map((r, id) => ({ ...r, id, angle: r.angle * Math.PI / 180 }));

  const PIVOT = [-15, -24, 0];
  const ORBIT_SPEEDS = [.16, .21, .18, .24, .19, .13, .17, .22];
  let sceneTime = 0;
  function revolve(p, orbit = 0) {
    const angle = sceneTime * ORBIT_SPEEDS[orbit];
    const c = Math.cos(angle), s = Math.sin(angle);
    const x = p[0] - PIVOT[0], z = p[2] - PIVOT[2];
    // Rotation around a shared vertical axis produces lateral orbital motion.
    // There is no camera transform or animated vertical translation.
    return [PIVOT[0] + x*c + z*s, p[1], PIVOT[2] + z*c - x*s];
  }

  function point(r, t, radial = 1) {
    const c = Math.cos(t), s = Math.sin(t), ca = Math.cos(r.angle), sa = Math.sin(r.angle);
    const x = r.x + radial * (r.a * c * ca - r.b * s * sa);
    const y = r.y + radial * (r.a * c * sa + r.b * s * ca);
    const z = r.z + s * Math.sqrt(r.a * r.a - r.b * r.b) * .65;
    const depth = 1 + z / FOCAL;
    return revolve([(x - W / 2) * depth, (y - H / 2) * depth, z], r.id);
  }

  const marks = rings.flatMap(r => Array.from({ length: r.ticks }, (_, i) => ({
    ring: r, t: TAU * i / r.ticks, length: .7 + random() * 3.1,
    alpha: .4 + random() * .6, glyph: '−+·١'.charAt(Math.floor(random() * 4)),
  })));
  const labels = [
    [5, .64, 'SPACE COORDINATES', 7.5], [5, 1.15, '0 1 0 2 0 3 0 4', 8],
    [5, 1.57, 'SYSTEM 013', 6], [5, 2.22, '0x020', 7],
    [5, 3.74, 'POSITION', 6], [5, 4.45, '0 1 2 3 4 5', 6],
    [6, .92, '314159265', 7], [6, 1.39, 'X Y Z', 10],
    [6, 1.78, '00101100', 6], [6, 2.9, '32', 8],
    [6, 3.38, '0010', 6], [6, 5.72, '01001101', 7],
    [7, .6, '00110100', 7], [7, 1.16, '123456789', 7],
    [7, 2.39, 'R 13', 6], [7, 4.58, 'SPACE', 7],
  ].map(([ring, t, text, size]) => ({ ring: rings[ring], t, text, size }));

  // Sparse free marks share the orbital planes rather than screen-space noise.
  const particles = Array.from({ length: 210 }, (_, i) => ({
    ring: rings[5 + i % 3], t: random() * TAU, radial: .62 + random() * .68,
    type: random(), size: 2.3 + random() * 5.8, alpha: .45 + random() * .55,
  }));
  function project(p) {
    const scale = FOCAL / (FOCAL + p[2]);
    return [W / 2 + p[0] * scale, H / 2 + p[1] * scale, scale];
  }
  function screen(r, t, radial = 1) {
    const phase = t + sceneTime * (.035 + r.id * .004);
    return project(point(r, phase, radial));
  }
  function line(a, b, width, alpha) {
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  function triangle(p, tangent, size, alpha) {
    const angle = Math.atan2(tangent[1] - p[1], tangent[0] - p[0]);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(angle);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath(); ctx.moveTo(size * .65, 0); ctx.lineTo(-size * .5, -size * .23);
    ctx.lineTo(-size * .25, size * .24); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawRing(r) {
    if (!r.line) return;
    ctx.strokeStyle = `rgba(0,0,0,${r.line})`; ctx.lineWidth = .3;
    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
      const p = screen(r, i / 360 * TAU);
      if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  }

  function drawLabel(label) {
    const { ring, t, text, size } = label;
    // Each character has its own projected tangent and radial vector: the
    // letters compress, shear and turn with the plane, not a flat text sprite.
    for (let i = 0; i < text.length; i++) {
      const angle = t + i * size * .64 / ring.a;
      const p = screen(ring, angle), q = screen(ring, angle + .002);
      const radial = screen(ring, angle, 1.004);
      const dx = (q[0] - p[0]) / (.002 * ring.a);
      const dy = (q[1] - p[1]) / (.002 * ring.a);
      const ux = (radial[0] - p[0]) / (.004 * ring.a);
      const uy = (radial[1] - p[1]) / (.004 * ring.a);
      ctx.save(); ctx.transform(dx, dy, -ux * 1.8, -uy * 1.8, p[0], p[1]);
      ctx.font = `bold italic ${size * 1.2}px "Courier New", monospace`;
      ctx.fillStyle = `rgba(0,0,0,${ring.ink + .16})`; ctx.fillText(text[i], 0, 0); ctx.restore();
    }
  }

  const arcs = [
    { points: [[6,316],[38,271],[82,239],[124,211]], z: -80, orbit: 5, text: '01020', start: .43, end: .65, size: 10 },
    { points: [[328,334],[419,334],[550,244],[633,150]], z: -110, orbit: 6, text: '012345 SPACE COORDINATES 010123 SPACE COORDINATES', start: .02, end: .95, size: 12 },
    { points: [[516,39],[550,32],[594,36],[638,40]], z: 30, orbit: 7, text: '001001101101001001100110', start: 0, end: 1, size: 4 },
  ];
  function arcPoint(arc, t) {
    const u = 1 - t, weights = [u*u*u, 3*u*u*t, 3*u*t*t, t*t*t];
    let x = 0, y = 0;
    arc.points.forEach((p, i) => { x += p[0] * weights[i]; y += p[1] * weights[i]; });
    const d = 1 + arc.z / FOCAL;
    return project(revolve([(x - W/2) * d, (y - H/2) * d, arc.z], arc.orbit ?? 5));
  }
  function drawArc(arc) {
    for (let i = 0; i < 135; i++) {
      const t = i / 135;
      line(arcPoint(arc, t), arcPoint(arc, t + .007), 1, .65 * (1 - t * .7));
    }
    for (let i = 0; i < arc.text.length; i++) {
      const t = arc.start + (arc.end - arc.start) * i / arc.text.length;
      const p = arcPoint(arc, t), q = arcPoint(arc, t + .002);
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(q[1]-p[1], q[0]-p[0]));
      ctx.transform(1, 0, -.4, .56, 0, 0);
      ctx.font = `bold ${arc.size}px 'Courier New', monospace`; ctx.fillStyle = 'rgba(0,0,0,.75)';
      ctx.fillText(arc.text[i], 0, 0); ctx.restore();
    }
  }

  const annotations = [
    [8,204,'00101',7,1.35], [36,234,'32',8,.5], [177,309,'123',7,.3],
    [208,315,'X Y Z',8,.16], [242,322,'012345',7,.06], [122,275,'0',5,-.6],
    [556,282,'24',7,-.5], [578,231,'1',7,-.6], [47,159,'001',6,-.6],
  ];
  function drawAnnotations() {
    for (const [x,y,text,size,angle] of annotations) {
      const p = project(revolve([x-W/2,y-H/2,-20], 6));
      ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle);ctx.scale(1,.65);
      ctx.font = `bold italic ${size}px 'Courier New', monospace`;
      ctx.fillStyle = 'rgba(0,0,0,.73)';ctx.fillText(text,0,0);ctx.restore();
    }
    // The upper-left arc carries isolated, irregular coordinate fragments.
    const guide = {points:[[171,57],[68,-10],[29,44],[98,127]],z:45};
    for(let i=0;i<19;i++) {
      const p=arcPoint(guide,i/19),q=arcPoint(guide,(i+.25)/19);
      line(p,q,.8,.8);
      if(i%3===0) triangle(p,q,4,.8);
    }
  }

  let scale = 1, elapsed = 0, lastTimestamp = null, animation = 0;
  let inspectionTime = null;
  function renderAt(seconds) {
    const t = Math.max(0, Number(seconds) || 0);
    sceneTime = t;
    ctx.setTransform(scale, 0, 0, canvas.height / H, 0, 0);
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    for (const r of rings) drawRing(r);
    for (const m of marks) {
      const { ring: r } = m;
      if (r.outer && Math.sin(m.t * 7 + r.id) < .78) continue;
      const phase = m.t;
      const p = screen(r, phase), next = screen(r, phase + .006);
      const alpha = r.ink * m.alpha;
      if (r.id === 0) {
        const outer = screen(r, phase + .009, 1 + m.length / r.a);
        line(p, outer, 1, alpha);
        if (m.length > 2.3) triangle(p, next, 4, alpha);
      } else if (!r.outer) {
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.beginPath(); ctx.arc(p[0], p[1], .46, 0, TAU); ctx.fill();
      } else {
        line(p, screen(r, phase + .013, 1.005), .55, alpha);
      }
    }
    // The fine oblique coordinate axes pass through the upper intersection.
    const axis = rings[2];
    line(screen(axis, Math.PI, .46), screen(axis, 0, .72), .3, .3);
    line(project([-79, -20, 40]), project([130, -115, 40]), .42, .48);
    for (const p of particles) {
      const phase = p.t;
      const at = screen(p.ring, phase, p.radial);
      if (at[0] < -12 || at[0] > W + 12 || at[1] < -12 || at[1] > H + 12) continue;
      const tangent = screen(p.ring, phase + .012, p.radial);
      if (p.type < .37) triangle(at, tangent, p.size, p.alpha);
      else if (p.type < .85) {
        const end = screen(p.ring, phase + p.size / p.ring.a, p.radial);
        line(at, end, .7, p.alpha);
      } else {
        ctx.save(); ctx.translate(at[0], at[1]);
        ctx.rotate(Math.atan2(tangent[1] - at[1], tangent[0] - at[0]));
        ctx.scale(1, .55); ctx.font = `${p.size + 1}px "Courier New", monospace`;
        ctx.fillStyle = `rgba(0,0,0,${p.alpha})`; ctx.fillText(String(Math.floor(p.t * 100)), 0, 0); ctx.restore();
      }
    }
    for (const label of labels) drawLabel(label);
    for (const arc of arcs) drawArc(arc);
    drawAnnotations();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = clamp(devicePixelRatio || 1, 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(canvas.width * H / W));
    scale = canvas.width / W;
    renderAt(inspectionTime ?? (reducedMotion.matches ? 0 : elapsed));
  }
  function frame(timestamp) {
    animation = 0;
    if (document.hidden || reducedMotion.matches || inspectionTime !== null) return;
    if (lastTimestamp !== null) elapsed += (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    renderAt(elapsed);
    animation = requestAnimationFrame(frame);
  }
  function syncPlayback() {
    cancelAnimationFrame(animation); animation = 0; lastTimestamp = null;
    renderAt(inspectionTime ?? (reducedMotion.matches ? 0 : elapsed));
    if (!document.hidden && !reducedMotion.matches && inspectionTime === null) animation = requestAnimationFrame(frame);
  }
  // Deterministic inspection only when explicitly requested in the URL.
  // /13/?inspect=1 → window.orbits.renderAt(1.75), then .resume().
  if (new URLSearchParams(location.search).has('inspect')) {
    inspectionTime = 0;
    window.orbits = Object.freeze({
      renderAt(seconds) { inspectionTime = Math.max(0, Number(seconds) || 0); syncPlayback(); },
      resume() { inspectionTime = null; syncPlayback(); },
      geometry() {
        return {
          pivot: project(PIVOT),
          fixedAxis: [project([-79, -20, 40]), project([130, -115, 40])],
          rings: rings.map(r => Array.from({length: 16}, (_, i) => screen(r, i * TAU / 16))),
        };
      },
    });
  }
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  resize(); syncPlayback();
})();
