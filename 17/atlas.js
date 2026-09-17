(() => {
  'use strict';
  const canvas = document.getElementById('atlas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = 720;
  const paper = document.createElement('canvas');
  const ink = paper.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let seed = 17943;
  const random = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const between = (a, b) => a + random() * (b - a);
  const districts = [
    [75, 78, .05, 43], [238, 75, -.62, 33], [425, 86, -.7, 42],
    [616, 94, 0, 48], [82, 259, -.18, 33], [274, 255, .54, 43],
    [512, 290, .64, 56], [667, 323, 0, 67], [88, 451, -.52, 31],
    [270, 458, .55, 68], [520, 510, 0, 62], [98, 652, .04, 46],
    [294, 660, .04, 56], [650, 650, .02, 40],
  ].map(([x, y, angle, spacing]) => ({x, y, angle, spacing}));
  const roads = [];
  const buildings = [];
  const nodes = [];

  // Each neighbourhood has its own street grid, clipped to its Voronoi cell.
  // Keeping the vector plan separate from the canvas makes resizing lossless.
  function clip(a, b, district) {
    let low = 0, high = 1;
    const dx = b.x - a.x, dy = b.y - a.y;
    const planes = [[-1, 0, -15], [1, 0, 705], [0, -1, -15], [0, 1, 705]];
    for (const other of districts) {
      if (other === district) continue;
      planes.push([other.x - district.x, other.y - district.y,
        (other.x ** 2 + other.y ** 2 - district.x ** 2 - district.y ** 2) / 2]);
    }
    for (const [nx, ny, limit] of planes) {
      const p = nx * dx + ny * dy;
      const q = limit - nx * a.x - ny * a.y;
      if (Math.abs(p) < 1e-8) { if (q < 0) return null; continue; }
      if (p > 0) high = Math.min(high, q / p);
      else low = Math.max(low, q / p);
      if (low >= high) return null;
    }
    return [{x: a.x + low * dx, y: a.y + low * dy},
      {x: a.x + high * dx, y: a.y + high * dy}];
  }
  function addRoad(a, b, district, main) {
    const clipped = clip(a, b, district);
    if (!clipped) return;
    [a, b] = clipped;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < 8) return;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    roads.push({a, b, length, opacity: main ? .82 : between(.35, .62), width: main ? 1 : .8});
    nodes.push(a, b);
    // Sparse cadastral marks gather into uneven, inhabited blocks.
    for (let t = between(3, 12); t < length - 5; t += between(6, 13)) {
      const x = a.x + (b.x - a.x) * t / length;
      const y = a.y + (b.y - a.y) * t / length;
      const density = .38 + .26 * Math.sin(x * .019 + y * .012);
      if (random() > density) continue;
      for (const side of [-1, 1]) {
        if (random() > .76) continue;
        buildings.push({x, y, angle, side, width: between(2, 5),
          height: between(3, 8), fill: random() > .46, opacity: between(.5, 1)});
      }
    }
  }
  for (const district of districts) {
    const c = Math.cos(district.angle), s = Math.sin(district.angle);
    const point = (u, v) => ({x: district.x + u * c - v * s, y: district.y + u * s + v * c});
    for (let i = -14; i <= 14; i++) {
      const offset = i * district.spacing;
      addRoad(point(offset, -900), point(offset, 900), district, i % 3 === 0);
      addRoad(point(-900, offset), point(900, offset), district, i % 4 === 0);
    }
  }
  const travellers = Array.from({length: 48}, () => ({
    road: roads[Math.floor(random() * roads.length)], offset: random(),
    speed: between(3, 8), direction: random() > .5 ? 1 : -1,
  }));
  function riverPath(context, offset = 0) {
    context.beginPath();
    context.moveTo(360 + offset, 746);
    context.bezierCurveTo(317 + offset, 610, 435 + offset, 579, 392 + offset, 468);
    context.bezierCurveTo(355 + offset, 382, 194 + offset, 335, 153 + offset, 191);
    context.bezierCurveTo(118 + offset, 91, 148 + offset, 45, 102 + offset, -20);
  }
  function drawPlan() {
    ink.fillStyle = '#030303'; ink.fillRect(0, 0, size, size);
    for (const road of roads) {
      ink.strokeStyle = `rgba(242,242,234,${road.opacity})`;
      ink.lineWidth = road.width;
      ink.beginPath(); ink.moveTo(road.a.x, road.a.y); ink.lineTo(road.b.x, road.b.y); ink.stroke();
    }
    for (const b of buildings) {
      ink.save(); ink.translate(b.x, b.y); ink.rotate(b.angle);
      ink.fillStyle = ink.strokeStyle = `rgba(248,248,240,${b.opacity})`;
      ink.lineWidth = .8;
      const y = b.side > 0 ? 2 : -2 - b.height;
      if (b.fill) ink.fillRect(-b.width / 2, y, b.width, b.height);
      else ink.strokeRect(-b.width / 2, y, b.width, b.height);
      ink.restore();
    }
    ink.fillStyle = 'rgba(255,255,248,.65)';
    for (let i = 0; i < nodes.length; i += 3) {
      const n = nodes[i]; ink.fillRect(n.x - 1, n.y - 1, 2, 2);
    }
    // An unbuilt corridor breaks the regularity, like a river through a city.
    ink.strokeStyle = '#030303'; ink.lineWidth = 19; riverPath(ink); ink.stroke();
    ink.strokeStyle = 'rgba(240,240,232,.32)'; ink.lineWidth = .8;
    riverPath(ink, -8); ink.stroke(); riverPath(ink, 8); ink.stroke();
    const bridges = [[135, 94, -.15], [170, 230, -.45], [266, 358, -.85], [383, 480, -.3], [369, 625, .3]];
    ink.strokeStyle = 'rgba(245,245,237,.68)';
    for (const [x, y, angle] of bridges) {
      ink.save(); ink.translate(x, y); ink.rotate(angle);
      for (const dy of [-2, 2]) { ink.beginPath(); ink.moveTo(-16, dy); ink.lineTo(16, dy); ink.stroke(); }
      ink.restore();
    }
    // Fade only the drawn marks; the background stays identical to the page.
    const fade = ink.createRadialGradient(360, 360, 290, 360, 360, 475);
    fade.addColorStop(0, 'rgba(3,3,3,0)'); fade.addColorStop(1, '#030303');
    ink.fillStyle = fade; ink.fillRect(0, 0, size, size);
  }
  let frame = 0, previous = 0, elapsed = 0;
  function paint() {
    ctx.drawImage(paper, 0, 0, size, size);
    if (motion.matches) return;
    for (const dot of travellers) {
      const progress = ((dot.offset + elapsed * dot.speed / dot.road.length * dot.direction) % 1 + 1) % 1;
      const {a, b} = dot.road;
      const x = a.x + (b.x - a.x) * progress, y = a.y + (b.y - a.y) * progress;
      ctx.fillStyle = `rgba(255,255,249,${.65 * Math.sin(progress * Math.PI)})`;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  function resize() {
    const resolution = Math.round(canvas.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2));
    canvas.width = canvas.height = paper.width = paper.height = resolution;
    ctx.setTransform(resolution / size, 0, 0, resolution / size, 0, 0);
    ink.setTransform(resolution / size, 0, 0, resolution / size, 0, 0);
    drawPlan(); paint();
  }
  function tick(time) {
    if (time - previous >= 1000 / 30) {
      elapsed += previous ? Math.min((time - previous) / 1000, .1) : 0;
      previous = time; paint();
    }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame); previous = 0;
    if (!document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
    else paint();
  }
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', start);
  motion.addEventListener('change', start);
  resize(); start();
})();
