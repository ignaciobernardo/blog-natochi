/* natochi.cv/5 — a photographic plate of a meteor shower.
   Trails don't get drawn as lines: they get exposed, blob by blob, onto an
   emulsion that keeps a long memory and slowly forgets. */

const sky = document.getElementById('sky');
const grainCanvas = document.getElementById('grain');
const ctx = sky.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// the exposed silver lives here; the visible canvas is this plus its gloom
const plate = document.createElement('canvas');
const px = plate.getContext('2d');
// a small copy, blurred back up, is what makes the halation
const halo = document.createElement('canvas');
const hx = halo.getContext('2d');

let W = 0, H = 0, DPR = 1, unit = 0;
let radiant = { x: 0, y: 0 };

const rr = (a, b) => a + Math.random() * (b - a);

/* ---------- exposure ---------- */

// one grain of silver: a soft core with a harder centre
function blob(c, x, y, r, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(0.45, `rgba(255,255,255,${a * 0.75})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

const TRAILS = [];

function spawn(opts = {}) {
  const a = opts.angle ?? Math.random() * Math.PI * 2;
  const dx = Math.cos(a), dy = Math.sin(a);
  // the radiant is a smudge, not a point
  const sx = radiant.x + rr(-unit * 0.012, unit * 0.012);
  const sy = radiant.y + rr(-unit * 0.012, unit * 0.012);
  const start = rr(0, unit * 0.04);
  const reach = Math.hypot(W, H);
  const roll = Math.random();
  const fireball = opts.fireball ?? (opts.plain ? false : roll > 0.99);

  TRAILS.push({
    x: sx, y: sy, dx, dy,
    d: start,                                   // how far the tip has travelled
    end: start + (fireball ? rr(unit * 0.08, unit * 0.3)
                : roll < 0.3 ? reach * rr(0.12, 0.35)
                : roll < 0.7 ? reach * rr(0.35, 0.7)
                : reach * rr(0.7, 1.1)),
    speed: rr(0.35, 1.1) * unit * (fireball ? 0.25 : 1),
    // how much of the trail actually took: some are near-solid, most are chains
    density: fireball ? 1 : rr(0.22, 0.85),
    weight: fireball ? rr(2.6, 4.6) : rr(0.45, 1.9),
    gain: fireball ? 1 : rr(0.6, 1.15),
    wander: rr(-0.00012, 0.00012),              // trails are not perfectly straight
    fireball,
    next: start,
  });
}

// lay down the grains between where the tip was and where it is now
function expose(t, until) {
  while (t.next < until) {
    const f = (t.next - 0) / t.end;             // 0 at the radiant, 1 at the far tip
    const fall = t.fireball ? 1 : Math.max(0.3, 1 - f * rr(0.3, 0.85));
    const step = t.weight * rr(0.55, 2.4) * (t.fireball ? 0.35 : 1);
    t.next += step;

    // the chain breaks up more the further it runs
    if (Math.random() > t.density * (0.45 + fall * 0.7)) continue;

    const ang = Math.atan2(t.dy, t.dx) + t.wander * t.next;
    const x = t.x + Math.cos(ang) * t.next + rr(-0.5, 0.5) * t.weight;
    const y = t.y + Math.sin(ang) * t.next + rr(-0.5, 0.5) * t.weight;

    const r = t.weight * rr(0.65, 2.2) * (Math.random() < 0.07 ? 2.1 : 1);
    const a = Math.min(1, t.gain * fall * rr(0.45, 1.15));
    blob(px, x, y, r, a);
    if (a > 0.7 && r > 1) {                  // the blown-out core of a bright grain
      px.fillStyle = 'rgba(255,255,255,0.95)';
      px.beginPath();
      px.arc(x, y, r * 0.42, 0, Math.PI * 2);
      px.fill();
    }
  }
}

/* ---------- the dirt on the plate ---------- */

function dust() {
  for (let i = 0; i < 26; i++) {
    const x = rr(0, W), y = rr(0, H);
    blob(px, x, y, rr(1.2, 4.5), rr(0.25, 0.9));
  }
  // a few scratches in the emulsion
  px.save();
  px.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    let x = rr(0, W), y = rr(0, H);
    let a = rr(0, Math.PI * 2);
    px.strokeStyle = `rgba(255,255,255,${rr(0.2, 0.45)})`;
    px.lineWidth = rr(0.7, 1.6);
    px.beginPath();
    px.moveTo(x, y);
    for (let s = 0; s < 14; s++) {
      a += rr(-0.5, 0.5);
      x += Math.cos(a) * rr(4, 16);
      y += Math.sin(a) * rr(4, 16);
      px.lineTo(x, y);
    }
    px.stroke();
  }
  px.restore();
}

/* ---------- the print ---------- */

function compose() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, plate.width, plate.height);

  // gloom: the same exposure, small and blurred back up, added twice
  hx.setTransform(1, 0, 0, 1, 0, 0);
  hx.clearRect(0, 0, halo.width, halo.height);
  hx.drawImage(plate, 0, 0, halo.width, halo.height);

  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = `blur(${Math.round(unit * 0.018)}px)`;
  ctx.globalAlpha = 0.45;
  ctx.drawImage(halo, 0, 0, plate.width, plate.height);
  ctx.filter = `blur(${Math.round(unit * 0.005)}px)`;
  ctx.globalAlpha = 0.55;
  ctx.drawImage(halo, 0, 0, plate.width, plate.height);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  ctx.drawImage(plate, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

/* ---------- time ---------- */

let last = 0, acc = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;

  acc += dt;
  const rate = 0.42;                    // a little over two trails a second
  while (acc > rate) {
    acc -= rate;
    spawn();
    if (Math.random() < 0.05) dustSpeck();
  }

  // the emulsion forgets, slowly
  px.save();
  px.globalCompositeOperation = 'destination-out';
  px.fillStyle = `rgba(0,0,0,${1 - Math.pow(1 - 0.0016, dt * 60)})`;
  px.fillRect(0, 0, W, H);
  px.restore();

  for (let i = TRAILS.length - 1; i >= 0; i--) {
    const t = TRAILS[i];
    if (t.d >= t.end) { TRAILS.splice(i, 1); continue; }
    t.d = Math.min(t.end, t.d + t.speed * dt);
    expose(t, t.d);
  }

  compose();
  requestAnimationFrame(tick);
}

function dustSpeck() {
  blob(px, rr(0, W), rr(0, H), rr(1, 3.5), rr(0.3, 0.85));
}

/* ---------- grain ---------- */

function drawGrain() {
  const g = grainCanvas.getContext('2d');
  const w = grainCanvas.width, h = grainCanvas.height;
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // most of the plate is dead black with a fine silver dust in it
    const n = Math.random();
    const v = n < 0.86 ? (Math.random() * 26) | 0
            : n < 0.99 ? 26 + ((Math.random() * 60) | 0)
            : 90 + ((Math.random() * 90) | 0);
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // clumps, so the grain is not evenly fine
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < w * h / 2600; i++) {
    blob(g, rr(0, w), rr(0, h), rr(0.8, 2.6), rr(0.04, 0.16));
  }
  g.globalCompositeOperation = 'source-over';
}

/* ---------- boot ---------- */

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  unit = Math.min(W, H);

  for (const c of [sky, plate]) {
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
  }
  grainCanvas.width = Math.round(W * Math.min(1.5, DPR));
  grainCanvas.height = Math.round(H * Math.min(1.5, DPR));
  halo.width = Math.max(1, Math.round(W / 3));
  halo.height = Math.max(1, Math.round(H / 3));

  px.setTransform(DPR, 0, 0, DPR, 0, 0);
  px.clearRect(0, 0, W, H);

  radiant = { x: W * 0.56, y: H * 0.515 };
  TRAILS.length = 0;

  drawGrain();
  dust();

  // the shower is already half over when you arrive
  for (let i = 0; i < 52; i++) {
    spawn({ plain: true });
    const t = TRAILS[TRAILS.length - 1];
    expose(t, t.end);
    t.d = t.end;
  }
  // and one of them burned far brighter than the rest
  spawn({ fireball: true, angle: rr(-1.5, -1.15) });
  const fb = TRAILS[TRAILS.length - 1];
  expose(fb, fb.end);
  fb.d = fb.end;
  // the flare it left on the emulsion where it burned out
  blob(px, fb.x + fb.dx * fb.end * 0.35, fb.y + fb.dy * fb.end * 0.35, unit * 0.045, 0.16);
  blob(px, fb.x + fb.dx * fb.end * 0.3, fb.y + fb.dy * fb.end * 0.3, unit * 0.02, 0.3);
  TRAILS.length = 0;
  compose();
}

resize();

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 200);
});

if (!reduced) requestAnimationFrame((t) => { last = t; tick(t); });
