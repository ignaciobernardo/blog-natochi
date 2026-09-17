(() => {
  'use strict';
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let seed = 17361;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  const between = (a, b) => a + random() * (b - a);
  const palette = ['#66ecb5', '#77d9c3', '#54ac92', '#5469f4', '#8282ed', '#a8a0e7', '#33d60b'];
  const rays = Array.from({ length: 200 }, () => {
    const angle = between(0, Math.PI * 2);
    return { angle, radius: between(60, 255), depth: between(.3, 1), phase: between(0, 6.28), color: palette[Math.floor(random() * palette.length)], width: between(.45, 1.15), bend: between(-55, 55) };
  });
  const motes = Array.from({ length: 420 }, () => ({ x: between(-270, 260), y: between(-220, 210), phase: between(0, 6.28), size: between(.5, 1.8), speed: between(.4, 1.3) }));
  let width, height, frame = 0, elapsed = 0, previous = 0;
  function line(points, color, thickness = .7) {
    ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  }
  function draw(t) {
    ctx.setTransform(canvas.width / 500, 0, 0, canvas.height / 403, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 500, 403);
    const drift = Math.sin(t * .17) * 9;
    // Thin, skewed planes surrounding the central tangle.
    for (let i = -5; i < 16; i++) {
      const y = i * 29 + drift;
      line([[0, y - 20], [130, y + 18], [380, y - 75], [500, y - 50]], '#a0a39e', .48);
      line([[i * 32 - 80, 0], [i * 22 + 45, 230], [i * 37 + 55, 403]], '#a0a39e', .5);
    }
    line([[0, 180], [144, 7], [329, 31], [344, 320], [96, 371], [49, 67], [298, 77], [318, 348]], '#df717e', .7);
    line([[18, 403], [379, 12], [414, 22], [374, 403]], '#c7c4bf', .6);
    for (let i = 0; i < 13; i++) {
      const x = 51 + i * 2.3;
      line([[x, 58], [x + 55, 367], [x + 80, 403]], i % 3 ? '#91a0df' : '#66bbae', .75);
      line([[x, 60], [205 + i * 4, 310], [190 + i * 2, 61]], '#6877b8', .55);
    }
    for (let i = 0; i < 11; i++) {
      const y = 73 + i * 25;
      line([[61 + i * 4, y], [315, y + 10], [337, y + 41], [72 + i * 4, y + 25]], '#408472', .55);
    }
    const cx = 238 + Math.sin(t * .23) * 8, cy = 200 + Math.sin(t * .31) * 6;
    // Sharp crossing trajectories, with a denser knot around the vanishing point.
    rays.forEach((ray, i) => {
      const a = ray.angle + Math.sin(t * .24 + ray.phase) * .045;
      const r = ray.radius * (1 + Math.sin(t * .4 + ray.phase) * .06);
      const x = cx + Math.cos(a) * r * 1.2;
      const y = cy + Math.sin(a) * r;
      const knotX = cx + Math.cos(ray.phase + t * .22) * 29 * ray.depth;
      const knotY = cy + Math.sin(ray.phase + t * .22) * 21 * ray.depth;
      const endX = cx - Math.cos(a + .36) * r * .47 + ray.bend;
      const endY = cy - Math.sin(a + .36) * r * .47;
      ctx.globalAlpha = i % 5 === 0 ? .95 : .69;
      line([[x, y], [knotX, knotY], [endX, endY]], ray.color, ray.width);
      if (i % 3 === 0) line([[x, y], [cx + 90 + ray.bend * .3, cy + ray.bend], [knotX, knotY]], '#68d5a8', .65);
    });
    ctx.globalAlpha = 1;
    motes.forEach((p, i) => {
      const a = t * .035 * p.speed;
      const x = cx + p.x * Math.cos(a) - p.y * Math.sin(a);
      const y = cy + p.x * Math.sin(a) + p.y * Math.cos(a);
      ctx.globalAlpha = .45 + .5 * (Math.sin(p.phase + t * p.speed) * .5 + .5);
      ctx.fillStyle = i % 11 === 0 ? '#9691f7' : '#80efbb';
      ctx.beginPath(); ctx.ellipse(x, y, p.size * 1.4, p.size * .7, p.phase + a, 0, Math.PI * 2); ctx.fill();
      if (i % 7 === 0) line([[x, y], [x + 2, y - 3], [x + 4, y - 2]], '#77d9b3', 1.1);
    });
    ctx.globalAlpha = 1;
  }
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    draw(elapsed);
  }
  function tick(now) {
    if (previous) elapsed += Math.min((now - previous) / 1000, .05);
    previous = now; draw(elapsed); frame = requestAnimationFrame(tick);
  }
  function playback() {
    cancelAnimationFrame(frame); previous = 0;
    if (!document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    else draw(elapsed);
  }
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', playback);
  reduced.addEventListener('change', playback);
  resize(); playback();
})();
