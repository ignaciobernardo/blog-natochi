import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

export function mount({ canvas, stage, statusEl, hoverLights = false, azimuth = Math.PI / 4, people = false, tidy = false }) {


// ---------- palette ----------
const C = {
  fill: 0x141414,
  fillHi: 0x171717,
  line: 0x6a6a6a,
  lineDim: 0x272727,
  lineMid: 0x3c3c3c,
  hover: 0xbdbdbd,
  active: 0xf2f2f2,
  wicker: 0x9c8257,
  wickerDim: 0x4d4130,
  wood: 0x6a5641,
  woodFill: 0x17140f,
  bulbOff: 0x2a2a2a,
  bulbOn: 0xffe3b5,
};


const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);

// ---------- helpers ----------
const lineMat = (color) => new THREE.LineBasicMaterial({ color });
const fillMat = (color, opts = {}) => new THREE.MeshBasicMaterial({
  color, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...opts,
});
const MAT = {
  fill: fillMat(C.fill),
  wood: fillMat(C.woodFill),
  line: lineMat(C.line),
  dim: lineMat(C.lineDim),
  mid: lineMat(C.lineMid),
  woodLine: lineMat(C.wood),
};

function solid(geo, { fill = MAT.fill, line = MAT.line, angle = 20 } = {}) {
  const g = new THREE.Group();
  if (fill) g.add(new THREE.Mesh(geo, fill));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, angle), line));
  return g;
}
function box(w, h, d, x, y, z, opts) {
  const s = solid(new THREE.BoxGeometry(w, h, d), opts);
  s.position.set(x + 0, y + h / 2, z);
  return s;
}
// box by min/max corners (y = bottom)
function boxMM(x0, x1, y0, y1, z0, z1, opts) {
  return box(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, y0, (z0 + z1) / 2, opts);
}
function segs(points, mat) {
  const g = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.LineSegments(g, mat);
}
const v = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- dimensions (meters) ----------
const FLOOR = { x0: -4.6, x1: 4.6, z0: -3.4, z1: 3.1 };
const DECK = { x0: -3.4, x1: 3.3, z0: -2.5, z1: 2.0, top: 0.32 };
const STEP = 0.4;   // width of the step around the deck (front + right)
const STEP_TOP = 0.16;

const world = new THREE.Group();
scene.add(world);

// floor slab
world.add(boxMM(FLOOR.x0, FLOOR.x1, -0.18, 0, FLOOR.z0, FLOOR.z1));
{
  const pts = [];
  for (let x = FLOOR.x0 + 0.6; x < FLOOR.x1; x += 0.6) { pts.push(v(x, 0.002, FLOOR.z0), v(x, 0.002, FLOOR.z1)); }
  for (let z = FLOOR.z0 + 0.6; z < FLOOR.z1; z += 0.6) { pts.push(v(FLOOR.x0, 0.002, z), v(FLOOR.x1, 0.002, z)); }
  world.add(segs(pts, MAT.dim));
}

// deck + L step (front and right)
world.add(boxMM(DECK.x0, DECK.x1, 0, DECK.top, DECK.z0, DECK.z1, { fill: MAT.wood, line: MAT.woodLine }));
world.add(boxMM(DECK.x0, DECK.x1 + STEP, 0, STEP_TOP, DECK.z1, DECK.z1 + STEP, { fill: MAT.wood, line: MAT.woodLine }));
world.add(boxMM(DECK.x1, DECK.x1 + STEP, 0, STEP_TOP, DECK.z0, DECK.z1, { fill: MAT.wood, line: MAT.woodLine }));
{
  // planks along x
  const pts = [];
  const plankMat = lineMat(0x2d261d);
  for (let z = DECK.z0 + 0.15; z < DECK.z1 - 0.01; z += 0.15) pts.push(v(DECK.x0, DECK.top + 0.002, z), v(DECK.x1, DECK.top + 0.002, z));
  for (let z = DECK.z1 + 0.13; z < DECK.z1 + STEP; z += 0.13) pts.push(v(DECK.x0, STEP_TOP + 0.002, z), v(DECK.x1 + STEP, STEP_TOP + 0.002, z));
  for (let x = DECK.x1 + 0.13; x < DECK.x1 + STEP; x += 0.13) pts.push(v(x, STEP_TOP + 0.002, DECK.z0), v(x, STEP_TOP + 0.002, DECK.z1));
  // plank butt joints, staggered
  for (let i = 0, z = DECK.z0; z < DECK.z1 - 0.15; z += 0.15, i++) {
    const off = (i % 3) * 0.7;
    for (let x = DECK.x0 + 1.2 + off; x < DECK.x1 - 0.2; x += 2.1) pts.push(v(x, DECK.top + 0.002, z), v(x, DECK.top + 0.002, z + 0.15));
  }
  world.add(segs(pts, plankMat));
}

// glass railing: back + left
const glassMat = new THREE.MeshBasicMaterial({ color: 0x9fb4b8, transparent: true, opacity: 0.045, depthWrite: false, side: THREE.DoubleSide });
function railing(ax, az, bx, bz, panels) {
  const H = 1.1;
  for (let i = 0; i < panels; i++) {
    const t0 = i / panels, t1 = (i + 1) / panels;
    const x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0;
    const x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
    const len = Math.hypot(x1 - x0, z1 - z0) - 0.04;
    const geo = new THREE.PlaneGeometry(len, H - 0.08);
    const p = solid(geo, { fill: glassMat, line: MAT.mid });
    p.position.set((x0 + x1) / 2, 0.04 + (H - 0.08) / 2, (z0 + z1) / 2);
    p.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    world.add(p);
    // posts
    world.add(segs([v(x0, 0, z0), v(x0, H, z0)], MAT.line));
  }
  world.add(segs([v(bx, 0, bz), v(bx, H, bz)], MAT.line));
  // handrail
  const len = Math.hypot(bx - ax, bz - az);
  const rail = solid(new THREE.BoxGeometry(len, 0.04, 0.05));
  rail.position.set((ax + bx) / 2, H, (az + bz) / 2);
  rail.rotation.y = -Math.atan2(bz - az, bx - ax);
  world.add(rail);
}
railing(FLOOR.x0 + 0.06, FLOOR.z0 + 0.06, FLOOR.x1 - 0.06, FLOOR.z0 + 0.06, 8);
railing(FLOOR.x0 + 0.06, FLOOR.z1 - 0.06, FLOOR.x0 + 0.06, FLOOR.z0 + 0.06, 6);

// pergola: concrete portal frame
const ghost = fillMat(C.fillHi, { transparent: true, opacity: 0.72, depthWrite: false });
const PER = { y: 2.75, h: 0.32, zBack: -2.95, xL: -3.75, xR: 3.95, zFront: 1.15 };
const pergola = new THREE.Group();
world.add(pergola);
// columns
pergola.add(boxMM(PER.xL - 0.25, PER.xL + 0.25, 0, PER.y, PER.zBack - 0.25, PER.zBack + 0.25));
pergola.add(boxMM(PER.xR - 0.22, PER.xR + 0.22, 0, PER.y, PER.zBack - 0.22, PER.zBack + 0.22));
// beams
pergola.add(boxMM(PER.xL - 0.25, PER.xR + 0.22, PER.y, PER.y + PER.h + 0.06, PER.zBack - 0.25, PER.zBack + 0.25, { fill: ghost }));
const crossX = [-1.9, 0.05, 2.0, 3.83];
for (const x of crossX) pergola.add(boxMM(x - 0.12, x + 0.12, PER.y + 0.04, PER.y + PER.h, PER.zBack + 0.25, PER.zFront, { fill: ghost }));

// planters
function planter(x0, x1, z0, z1, h = 0.5) {
  world.add(boxMM(x0, x1, 0, h, z0, z1, { fill: MAT.wood, line: MAT.woodLine }));
  const pts = [];
  for (let y = 0.17; y < h; y += 0.17) {
    pts.push(v(x0 - 0.001, y, z0 - 0.001), v(x1 + 0.001, y, z0 - 0.001), v(x1 + 0.001, y, z0 - 0.001), v(x1 + 0.001, y, z1 + 0.001),
             v(x1 + 0.001, y, z1 + 0.001), v(x0 - 0.001, y, z1 + 0.001), v(x0 - 0.001, y, z1 + 0.001), v(x0 - 0.001, y, z0 - 0.001));
  }
  world.add(segs(pts, lineMat(0x3a3024)));
  // shrubs
  const n = Math.max(2, Math.round(Math.max(x1 - x0, z1 - z0) / 0.55));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const lx = x1 - x0 > z1 - z0;
    const px = lx ? x0 + (x1 - x0) * t : (x0 + x1) / 2;
    const pz = lx ? (z0 + z1) / 2 : z0 + (z1 - z0) * t;
    const r = 0.17 + 0.07 * Math.sin(i * 2.3 + x0);
    const geo = new THREE.IcosahedronGeometry(r, 0);
    const s = solid(geo, { line: lineMat(0x3f4a3a), angle: 1 });
    s.position.set(px, h + r * 0.7, pz);
    s.rotation.set(i, i * 1.7, 0);
    s.scale.set(1.15, 0.85 + (i % 2) * 0.25, 1.1);
    world.add(s);
  }
}
planter(3.95, 4.45, -2.55, -0.4);
planter(-4.45, -3.95, -1.9, 0.4, 0.45);

// ---------- string lights ----------
const BEAM_BOTTOM = PER.y + 0.02;
const P = {
  A: v(PER.xL + 0.25, BEAM_BOTTOM, PER.zBack + 0.25),
  B: v(crossX[0], BEAM_BOTTOM, PER.zFront - 0.05),
  Cc: v(crossX[1], BEAM_BOTTOM, PER.zBack + 0.25),
  D: v(crossX[2], BEAM_BOTTOM, PER.zFront - 0.05),
  E: v(crossX[3], BEAM_BOTTOM, PER.zFront - 0.05),
};
const strands = [[P.A, P.B, 0.55], [P.B, P.Cc, 0.6], [P.Cc, P.D, 0.6], [P.D, P.E, 0.45], [P.B, P.D, 0.5]];

const halo = (() => {
  const s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d'); const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,214,150,1)'); gr.addColorStop(0.25, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(cv);
})();

const wireMat = lineMat(0x4a4a4a);
const bulbs = [];
const bulbHit = [];
const bulbGeo = new THREE.SphereGeometry(0.05, 12, 8);
const hitGeo = new THREE.SphereGeometry(0.22, 6, 4);
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
for (const [a, b, sag] of strands) {
  const N = 40, pts = [];
  const at = (t) => new THREE.Vector3().lerpVectors(a, b, t).add(v(0, -sag * 4 * t * (1 - t), 0));
  for (let i = 0; i < N; i++) pts.push(at(i / N), at((i + 1) / N));
  world.add(segs(pts, wireMat));
  const count = Math.max(3, Math.round(a.distanceTo(b) / 0.62));
  for (let i = 1; i < count; i++) {
    const p = at(i / count);
    const drop = 0.07;
    world.add(segs([p, p.clone().add(v(0, -drop, 0))], wireMat));
    const m = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: C.bulbOff }));
    m.position.copy(p).add(v(0, -drop - 0.05, 0));
    const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), 30), MAT.line);
    ring.position.copy(p).add(v(0, -drop + 0.0, 0));
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.setScalar(0.42);
    sp.position.copy(m.position);
    world.add(m, ring, sp);
    const h = new THREE.Mesh(hitGeo, hitMat); h.position.copy(m.position); world.add(h);
    bulbHit.push(h);
    bulbs.push({ mesh: m, sprite: sp, level: 0, target: 0, delay: 0, seed: Math.random() * 10 });
  }
}

// ---------- chairs ----------
function buildChair() {
  const g = new THREE.Group();
  const frame = lineMat(C.line);
  const wick = lineMat(C.wicker);
  const weave = lineMat(C.wickerDim);
  const seatFill = fillMat(C.woodFill);

  const SW = 0.46, SD = 0.44, SY = 0.46;
  // seat pad
  const seat = new THREE.BoxGeometry(SW, 0.035, SD);
  const seatM = new THREE.Mesh(seat, seatFill); seatM.position.y = SY;
  const seatL = new THREE.LineSegments(new THREE.EdgesGeometry(seat), wick); seatL.position.y = SY;
  g.add(seatM, seatL);
  const wp = [];
  for (let i = 1; i < 6; i++) {
    const t = -SW / 2 + (SW * i) / 6, u = -SD / 2 + (SD * i) / 6;
    wp.push(v(t, SY + 0.019, -SD / 2), v(t, SY + 0.019, SD / 2), v(-SW / 2, SY + 0.019, u), v(SW / 2, SY + 0.019, u));
  }
  g.add(segs(wp, weave));

  // legs (tube frame), slight splay
  const fx = SW / 2 - 0.01, fz = SD / 2 - 0.02;
  const legs = [
    v(-fx - 0.03, 0, fz + 0.05), v(-fx, SY - 0.02, fz),
    v(fx + 0.03, 0, fz + 0.05), v(fx, SY - 0.02, fz),
    v(-fx - 0.03, 0, -fz - 0.07), v(-fx, SY - 0.02, -fz),
    v(fx + 0.03, 0, -fz - 0.07), v(fx, SY - 0.02, -fz),
    // stretchers under seat
    v(-fx, SY - 0.03, fz), v(-fx, SY - 0.03, -fz),
    v(fx, SY - 0.03, fz), v(fx, SY - 0.03, -fz),
  ];
  // rear posts up to backrest, armrests
  const BT = 0.9, BZ = -SD / 2 - 0.05;
  legs.push(
    v(-fx, SY - 0.02, -fz), v(-fx - 0.01, BT, BZ),
    v(fx, SY - 0.02, -fz), v(fx + 0.01, BT, BZ),
    v(-fx - 0.01, 0.68, BZ + 0.02), v(-fx - 0.02, 0.66, 0.1),
    v(-fx - 0.02, 0.66, 0.1), v(-fx, SY + 0.02, fz),
    v(fx + 0.01, 0.68, BZ + 0.02), v(fx + 0.02, 0.66, 0.1),
    v(fx + 0.02, 0.66, 0.1), v(fx, SY + 0.02, fz),
  );
  g.add(segs(legs, frame));

  // backrest pad (curved slightly via 3 facets)
  const back = new THREE.Group();
  const BW = SW + 0.02, BH = 0.26;
  const curve = (x) => -0.035 * (1 - (2 * x / BW) ** 2);
  const facets = 4;
  const outline = [], weaveB = [];
  const corners = [];
  for (let i = 0; i <= facets; i++) {
    const x = -BW / 2 + (BW * i) / facets;
    corners.push([x, curve(x)]);
  }
  const posArr = [];
  for (let i = 0; i < facets; i++) {
    const [x0, z0] = corners[i], [x1, z1] = corners[i + 1];
    posArr.push(x0, 0, z0, x1, 0, z1, x1, BH, z1, x0, 0, z0, x1, BH, z1, x0, BH, z0);
    outline.push(v(x0, 0, z0), v(x1, 0, z1), v(x0, BH, z0), v(x1, BH, z1));
  }
  outline.push(v(corners[0][0], 0, corners[0][1]), v(corners[0][0], BH, corners[0][1]));
  outline.push(v(corners[facets][0], 0, corners[facets][1]), v(corners[facets][0], BH, corners[facets][1]));
  for (let i = 1; i < 4; i++) { const y = (BH * i) / 4; for (let k = 0; k < facets; k++) { const [x0, z0] = corners[k], [x1, z1] = corners[k + 1]; weaveB.push(v(x0, y, z0 + 0.002), v(x1, y, z1 + 0.002)); } }
  for (let i = 1; i < 8; i++) { const x = -BW / 2 + (BW * i) / 8; weaveB.push(v(x, 0, curve(x) + 0.002), v(x, BH, curve(x) + 0.002)); }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  back.add(new THREE.Mesh(bgeo, fillMat(C.woodFill, { side: THREE.DoubleSide })));
  back.add(segs(outline, wick), segs(weaveB, weave));
  back.position.set(0, BT - BH - 0.01, BZ + 0.015);
  back.rotation.x = -0.12;
  g.add(back);

  // feet hint shadow (footprint while dragging)
  const fp = segs([
    v(-0.3, 0.004, -0.33), v(0.3, 0.004, -0.33), v(0.3, 0.004, -0.33), v(0.3, 0.004, 0.3),
    v(0.3, 0.004, 0.3), v(-0.3, 0.004, 0.3), v(-0.3, 0.004, 0.3), v(-0.3, 0.004, -0.33),
  ], new THREE.LineBasicMaterial({ color: C.wicker, transparent: true, opacity: 0 }));

  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.95, 0.62), hitMat);
  hit.position.y = 0.47;
  g.add(hit);
  return { group: g, frame, wick, weave, hit, footprint: fp };
}

const chairs = [];
const R_CHAIR = 0.33;
const center = { x: -0.05, z: -0.25 };
const N_CHAIRS = 15;
function homeLayout() {
  // evenly spaced by arc length around an ellipse that fits the deck
  const rx = 2.15, rz = 1.6, S = 720;
  const pts = [], acc = [0];
  for (let k = 0; k <= S; k++) { const a = (k / S) * Math.PI * 2 + 0.2; pts.push([Math.cos(a) * rx, Math.sin(a) * rz]); }
  for (let k = 1; k <= S; k++) acc.push(acc[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const out = [];
  for (let i = 0, k = 0; i < N_CHAIRS; i++) {
    const L = (i / N_CHAIRS) * acc[S];
    while (acc[k] < L) k++;
    const x = center.x + pts[k][0] + Math.sin(i * 3.1) * 0.04;
    const z = center.z + pts[k][1] + Math.cos(i * 2.3) * 0.04;
    const rot = Math.atan2(center.x - x, center.z - z) + Math.sin(i * 1.7) * 0.18;
    out.push({ x, z, rot });
  }
  return out;
}
for (const [i, p] of homeLayout().entries()) {
  const c = buildChair();
  const ch = {
    id: i + 1, ...c,
    x: p.x, z: p.z, rot: p.rot,
    dx: p.x, dz: p.z, drot: p.rot, y: DECK.top, lift: 0,
    hover: 0, hoverT: 0, active: false,
  };
  c.hit.userData.chair = ch;
  world.add(c.group, c.footprint);
  chairs.push(ch);
}

// ---------- walkable area ----------
const obstacles = [
  [PER.xL - 0.25, PER.xL + 0.25, PER.zBack - 0.25, PER.zBack + 0.25],
  [PER.xR - 0.22, PER.xR + 0.22, PER.zBack - 0.22, PER.zBack + 0.22],
  [3.95, 4.45, -2.55, -0.4],
  [-4.45, -3.95, -1.9, 0.4],
];
function heightAt(x, z) {
  if (x >= DECK.x0 && x <= DECK.x1 && z >= DECK.z0 && z <= DECK.z1) return DECK.top;
  if (x >= DECK.x0 && x <= DECK.x1 + STEP && z >= DECK.z0 && z <= DECK.z1 + STEP) return STEP_TOP;
  return 0;
}
function constrain(c) {
  const m = R_CHAIR * 0.85;
  c.x = Math.min(FLOOR.x1 - m, Math.max(FLOOR.x0 + m, c.x));
  c.z = Math.min(FLOOR.z1 - m, Math.max(FLOOR.z0 + m, c.z));
  for (const [x0, x1, z0, z1] of obstacles) {
    const ex0 = x0 - m, ex1 = x1 + m, ez0 = z0 - m, ez1 = z1 + m;
    if (c.x > ex0 && c.x < ex1 && c.z > ez0 && c.z < ez1) {
      const pushes = [[c.x - ex0, -1, 0], [ex1 - c.x, 1, 0], [c.z - ez0, 0, -1], [ez1 - c.z, 0, 1]];
      pushes.sort((a, b) => a[0] - b[0]);
      const [d, sx, sz] = pushes[0];
      c.x += sx * d; c.z += sz * d;
    }
  }
}
function separate(dragged) {
  for (let it = 0; it < 6; it++) {
    for (let i = 0; i < chairs.length; i++) for (let j = i + 1; j < chairs.length; j++) {
      const a = chairs[i], b = chairs[j];
      let dx = b.x - a.x, dz = b.z - a.z;
      let d = Math.hypot(dx, dz);
      const min = R_CHAIR * 2;
      if (d < min) {
        if (d < 1e-4) { dx = 1; dz = 0; d = 1; }
        const o = (min - d), nx = dx / d, nz = dz / d;
        if (a === dragged) { b.x += nx * o; b.z += nz * o; }
        else if (b === dragged) { a.x -= nx * o; a.z -= nz * o; }
        else { a.x -= nx * o / 2; a.z -= nz * o / 2; b.x += nx * o / 2; b.z += nz * o / 2; }
      }
    }
    for (const c of chairs) if (c !== dragged) constrain(c);
    if (dragged) constrain(dragged);
  }
}

// ---------- people (low-poly) ----------
const tickers = [];
const pLine = lineMat(0x7c7c7c);
const pFill = fillMat(C.fill);
  function buildPerson(pFill_ = pFill, pLine_ = pLine) {
    const pFill = pFill_, pLine = pLine_;
    const part = (w, h, d, parent, x, y, z) => {
      const geo = new THREE.BoxGeometry(w, h, d).translate(0, -h / 2, 0); // pivot at top
      const s = solid(geo, { fill: pFill, line: pLine });
      s.position.set(x, y, z);
      parent.add(s);
      return s;
    };
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const hip = new THREE.Group(); hip.position.y = 0.9; body.add(hip);
    const torso = solid(new THREE.BoxGeometry(0.34, 0.54, 0.2).translate(0, 0.27, 0), { fill: pFill, line: pLine });
    hip.add(torso);
    const head = solid(new THREE.IcosahedronGeometry(0.115, 0), { fill: pFill, line: pLine, angle: 1 });
    head.position.set(0, 0.72, 0); torso.add(head);
    const legs = [-1, 1].map((sx) => {
      const thigh = part(0.13, 0.46, 0.15, hip, sx * 0.09, 0, 0);
      const shin = part(0.12, 0.44, 0.14, thigh, 0, -0.46, 0);
      return { thigh, shin };
    });
    const arms = [-1, 1].map((sx) => {
      const upper = part(0.09, 0.3, 0.1, torso, sx * 0.225, 0.52, 0);
      const fore = part(0.08, 0.28, 0.09, upper, 0, -0.3, 0);
      return { upper, fore };
    });
    return { root, body, hip, torso, head, legs, arms };
  }
  function walkPose(p, ph, m) {
    const s = Math.sin(ph);
    p.legs[0].thigh.rotation.x = s * 0.5 * m;
    p.legs[1].thigh.rotation.x = -s * 0.5 * m;
    p.legs[0].shin.rotation.x = Math.max(0, s) * 0.7 * m;
    p.legs[1].shin.rotation.x = Math.max(0, -s) * 0.7 * m;
    p.arms[0].upper.rotation.x = -s * 0.4 * m;
    p.arms[1].upper.rotation.x = s * 0.4 * m;
    p.arms[0].fore.rotation.x = p.arms[1].fore.rotation.x = -0.25 * m;
  }
if (people) {

  // sitters ride inside their chair's group, so dragging the chair carries them
  const sitIdx = [0, 2, 3, 6, 9, 11, 12, 15, 17];
  sitIdx.forEach((ci, n) => {
    const ch = chairs[ci]; if (!ch) return;
    const p = buildPerson();
    p.hip.position.set(0, 0.5, -0.1);
    p.torso.rotation.x = -0.08;
    for (const l of p.legs) { l.thigh.rotation.x = -Math.PI / 2 + 0.05; l.shin.rotation.x = Math.PI / 2 - 0.1; }
    const laptop = n % 3 !== 2;
    if (laptop) {
      for (const a of p.arms) { a.upper.rotation.x = -0.35; a.fore.rotation.x = -1.0; }
      const lap = new THREE.Group();
      lap.add(solid(new THREE.BoxGeometry(0.3, 0.018, 0.21), { fill: pFill, line: pLine }));
      const scr = solid(new THREE.BoxGeometry(0.3, 0.2, 0.012).translate(0, 0.1, 0), { fill: pFill, line: pLine });
      scr.position.z = -0.1; scr.rotation.x = -0.25; lap.add(scr);
      lap.position.set(0, 0.6, 0.26);
      p.root.add(lap);
    } else {
      // hands behind the head, leaning back
      p.torso.rotation.x = -0.22;
      for (const [i, a] of p.arms.entries()) { a.upper.rotation.set(-2.6, 0, (i ? -1 : 1) * 0.5); a.fore.rotation.x = 2.4; }
      p.head.rotation.x = 0.2;
    }
    ch.group.add(p.root);
    const seed = n * 1.7;
    tickers.push((dt, now) => {
      const t = now / 1000 + seed;
      p.head.rotation.y = Math.sin(t * 0.4) * 0.25;
      if (laptop) p.head.rotation.x = 0.25 + Math.sin(t * 0.7) * 0.05;
    });
  });

  // walkers: follow a path, pause at the ends, ping-pong
  function walker(path, speed, seed, pause = 1.6) {
    const p = buildPerson();
    world.add(p.root);
    const st = { i: 0, dir: 1, x: path[0][0], z: path[0][1], y: 0, face: 0, ph: seed, wait: seed % 1.5, moving: 0 };
    tickers.push((dt) => {
      let tgtI = st.i + st.dir;
      if (tgtI < 0 || tgtI >= path.length) { st.dir *= -1; tgtI = st.i + st.dir; }
      if (st.wait > 0) { st.wait -= dt; st.moving += (0 - st.moving) * Math.min(1, dt * 6); }
      else {
        const [tx, tz] = path[tgtI];
        const dx = tx - st.x, dz = tz - st.z, d = Math.hypot(dx, dz);
        const step = speed * dt;
        if (d <= step) {
          st.x = tx; st.z = tz; st.i = tgtI;
          if (st.i === 0 || st.i === path.length - 1) st.wait = pause;
        } else {
          st.x += dx / d * step; st.z += dz / d * step;
          const f = Math.atan2(dx, dz);
          let df = f - st.face; df = Math.atan2(Math.sin(df), Math.cos(df));
          st.face += df * Math.min(1, dt * 7);
        }
        st.moving += (1 - st.moving) * Math.min(1, dt * 6);
      }
      st.ph += dt * speed * 4.6 * st.moving;
      const m = st.moving;
      walkPose(p, st.ph, m);
      const gy = heightAt(st.x, st.z);
      st.y += (gy - st.y) * Math.min(1, dt * 10);
      p.root.position.set(st.x, st.y + Math.abs(Math.cos(st.ph)) * 0.025 * m, st.z);
      p.root.rotation.y = st.face;
    });
  }
  walker([[-3.9, 2.75], [0.5, 2.75], [3.9, 2.75]], 0.85, 0.3);
  walker([[-3.7, -2.25], [-3.7, 1.2], [-3.7, 2.6], [-1.5, 2.6]], 0.7, 2.1, 2.4);
  walker([[3.62, 1.9], [3.62, -0.2], [3.62, -2.2]], 0.6, 4.4, 3.0);

  // one standing in the middle of the circle, talking
  {
    const p = buildPerson();
    p.root.position.set(center.x + 0.2, DECK.top, center.z + 0.35);
    p.root.rotation.y = 0.5;
    world.add(p.root);
    tickers.push((dt, now) => {
      const t = now / 1000;
      p.root.rotation.y = 0.5 + Math.sin(t * 0.35) * 0.9;
      p.arms[1].upper.rotation.x = -0.9 + Math.sin(t * 1.3) * 0.35;
      p.arms[1].fore.rotation.x = -0.8 + Math.sin(t * 2.1) * 0.25;
      p.arms[0].upper.rotation.x = -0.15 + Math.sin(t * 0.9 + 1) * 0.1;
      p.torso.rotation.z = Math.sin(t * 0.8) * 0.04;
    });
  }
}

// ---------- the tidier: after ~1s without touching anything, someone comes to put the chairs back.
// interrupt them too many times and they lose it: they mess the chairs up and storm off. ----------
let lastTouch = -1e9;
let tidyInterrupt = () => {};
function noteInteraction() { lastTouch = performance.now(); tidyInterrupt(); }
if (tidy) {
  const CALM = new THREE.Color(0x9a9a9a), MAD = new THREE.Color(0xe0644f);
  const tLine = new THREE.LineBasicMaterial({ color: CALM.clone(), transparent: true, opacity: 0 });
  const tFill = fillMat(C.fill, { transparent: true, opacity: 0 });
  const p = buildPerson(tFill, tLine);
  p.root.visible = false;
  world.add(p.root);
  const home = homeLayout();
  const DOOR = [-4.25, 2.8];
  const GRIP = 0.4;
  const ANGER_LIMIT = 2;
  const IDLE_MS = 1100;
  const st = {
    mode: 'off', x: DOOR[0], z: DOOR[1], y: 0, face: 0, ph: 0, m: 0,
    chair: null, target: null, pickI: null, wait: 0, alpha: 0, lean: 0,
    anger: 0, mad: false, red: 0, fury: 0, hd: 0, turn: 0, turnIn: 0, t: 0, messLeft: 0, cool: 0, leftAt: -1e9, picked: new Set(),
  };
  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const misplaced = (c, i) => Math.hypot(c.x - home[i].x, c.z - home[i].z) > 0.1 || Math.abs(angDiff(home[i].rot, c.drot)) > 0.12;
  function nextChair() {
    let best = null, bd = Infinity;
    chairs.forEach((c, i) => {
      if (!misplaced(c, i)) return;
      const d = Math.hypot(c.x - st.x, c.z - st.z);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  const faceTo = (f, dt) => { st.face += angDiff(f, st.face) * Math.min(1, dt * 8); };
  function moveTo(tx, tz, speed, dt) {
    const dx = tx - st.x, dz = tz - st.z, d = Math.hypot(dx, dz), s = speed * dt;
    if (d <= s) { st.x = tx; st.z = tz; return true; }
    st.x += (dx / d) * s; st.z += (dz / d) * s;
    faceTo(Math.atan2(dx, dz), dt);
    return false;
  }
  function randomSpot() {
    const c = { x: FLOOR.x0 + 0.6 + Math.random() * (FLOOR.x1 - FLOOR.x0 - 1.2), z: FLOOR.z0 + 0.6 + Math.random() * (FLOOR.z1 - FLOOR.z0 - 1.2) };
    constrain(c);
    return { x: c.x, z: c.z, rot: Math.random() * Math.PI * 2 };
  }
  // walk to the spot behind chair i (opposite to where it has to go); true when there
  function approach(i, tgt, speed, dt) {
    const c = chairs[i];
    let ux = tgt.x - c.x, uz = tgt.z - c.z, ud = Math.hypot(ux, uz);
    if (ud < 0.05) { ux = c.x - st.x; uz = c.z - st.z; ud = Math.hypot(ux, uz) || 1; }
    return moveTo(c.x - (ux / ud) * GRIP, c.z - (uz / ud) * GRIP, speed, dt);
  }
  // push the held chair toward st.target; returns [placed, moving]
  function carry(dt, speed) {
    const c = chairs[st.chair], h = st.target;
    const dx = h.x - c.x, dz = h.z - c.z, d = Math.hypot(dx, dz), s = speed * dt;
    let moving = false;
    if (d > s) {
      c.x += (dx / d) * s; c.z += (dz / d) * s;
      st.x = c.x - (dx / d) * GRIP; st.z = c.z - (dz / d) * GRIP;
      faceTo(Math.atan2(dx, dz), dt);
      moving = true;
    } else { c.x = h.x; c.z = h.z; }
    const dr = angDiff(h.rot, c.drot);
    c.drot += dr * Math.min(1, dt * 3);
    if (d <= s && Math.abs(dr) < 0.03) { c.drot += dr; c.carried = false; st.chair = null; return [true, moving]; }
    return [false, moving];
  }
  function drop() { if (st.chair !== null) chairs[st.chair].carried = false; st.chair = null; }

  tidyInterrupt = () => {
    if (st.mode === 'off' || (st.mode === 'leave' && st.mad)) return;
    if (st.mode === 'angry' || st.mode === 'rampage' || st.mode === 'calm') return; // ignores you
    // snatching the chair out of their hands is the worst offence
    const snatched = st.chair !== null && drag && drag.chair === chairs[st.chair];
    drop();
    if (snatched) st.anger += ANGER_LIMIT;
    if (st.mode !== 'pause' || snatched) {
      if (!snatched) st.anger += 1;
      st.t = 0;
      if (st.anger >= ANGER_LIMIT) { st.mode = 'angry'; st.mad = true; } else st.mode = 'pause';
    }
  };

  tickers.push((dt, now) => {
    const idle = now - lastTouch > IDLE_MS && !drag;
    if (st.mode === 'off') {
      st.anger = Math.max(0, st.anger - dt / 20);
      st.cool -= dt;
      if (!idle || st.cool > 0 || nextChair() === null) return;
      if (now - st.leftAt < 15000) st.anger += 1; // you messed it up again right after
      st.mode = 'seek'; st.x = DOOR[0]; st.z = DOOR[1]; st.alpha = 0;
      p.root.visible = true;
    }
    st.t += dt;
    if (st.mode === 'pause' && idle) st.mode = 'seek';

    let moving = false;
    if (st.mode === 'seek') {
      const i = nextChair();
      if (i === null) st.mode = 'leave';
      else {
        moving = !approach(i, home[i], 1.05, dt);
        if (!moving) { st.mode = 'carry'; st.chair = i; st.target = home[i]; chairs[i].carried = true; st.wait = 0.3; }
      }
    }
    if (st.mode === 'carry') {
      if (st.wait > 0) st.wait -= dt;
      else { const [done, mv] = carry(dt, 0.8); moving = mv; if (done) st.mode = 'seek'; }
    }
    if (st.mode === 'angry') {
      faceTo(az, dt);
      if (st.t > 1.4) { st.mode = 'rampage'; st.fury = 1; st.hd = st.face; st.turnIn = 0; st.turn = 0; }
    }
    if (st.mode === 'rampage') {
      // runs around erratically, shoving chairs with the body; the anger wears off slowly
      st.fury = Math.max(0, st.fury - dt / 12);
      const f = st.fury;
      st.turnIn -= dt;
      if (st.turnIn <= 0) {
        st.turn = (Math.random() * 2 - 1) * (1.5 + 5 * f);
        st.turnIn = 0.25 + Math.random() * (0.5 + (1 - f) * 0.9);
        if (Math.random() < 0.25 * f) st.hd += (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random()); // sudden swerve
      }
      st.hd += st.turn * dt;
      // drift back toward the middle so the whole terrace gets it
      const dc = Math.hypot(center.x - st.x, center.z - st.z);
      if (dc > 1.6) st.hd += angDiff(Math.atan2(center.x - st.x, center.z - st.z), st.hd) * Math.min(1, dt * (dc - 1.4) * 1.2);
      const speed = 0.55 + 1.75 * f;
      let nx = st.x + Math.sin(st.hd) * speed * dt, nz = st.z + Math.cos(st.hd) * speed * dt;
      const probe = { x: nx, z: nz }; constrain(probe);
      if (Math.abs(probe.x - nx) + Math.abs(probe.z - nz) > 1e-4) {
        // hit a wall/column: turn toward the middle
        st.hd = Math.atan2(center.x - st.x, center.z - st.z) + (Math.random() - 0.5) * 1.2;
        nx = probe.x; nz = probe.z;
      }
      st.x = nx; st.z = nz;
      faceTo(st.hd, dt * 1.5);
      moving = true;
      // shove any chair in the way
      const R = 0.46;
      let shoved = false;
      for (const c of chairs) {
        if (drag && drag.chair === c) continue;
        const dx = c.x - st.x, dz = c.z - st.z, d = Math.hypot(dx, dz);
        if (d < R) {
          const k = (R - d) / (d || 1);
          c.x += dx * k * 1.05; c.z += dz * k * 1.05;
          c.drot += (Math.random() - 0.5) * 6 * dt * (0.3 + f) + Math.sign(dx * Math.cos(st.hd) - dz * Math.sin(st.hd)) * 2.2 * dt;
          shoved = true;
        }
      }
      if (shoved) separate(null);
      if (f <= 0) { st.mode = 'calm'; st.t = 0; }
    }
    if (st.mode === 'calm') {
      // catches their breath, looks at you, then gets back to tidying
      faceTo(az, dt * 0.6);
      if (st.t > 1.8) { st.mode = 'seek'; st.mad = false; st.anger = 0; }
    }
    if (st.mode === 'leave') {
      moving = true;
      if (moveTo(DOOR[0], DOOR[1], st.mad ? 1.6 : 1.05, dt)) {
        st.mode = 'off'; p.root.visible = false; st.leftAt = now;
        if (st.mad) { st.anger = 0; st.cool = 6; st.mad = false; st.red = 0; tLine.color.copy(CALM); }
        return;
      }
    }
    if (st.mode === 'pause') faceTo(az, dt); // turn and look at you

    st.m += ((moving ? 1 : 0) - st.m) * Math.min(1, dt * 8);
    const fury = st.mode === 'rampage' ? st.fury : 0;
    st.ph += dt * 4.4 * st.m * (1 + fury * 1.1);
    walkPose(p, st.ph, st.m);
    const holding = st.chair !== null ? 1 : 0;
    st.lean += (holding - st.lean) * Math.min(1, dt * 6);
    p.torso.rotation.x = 0.14 * st.lean + fury * 0.22 + (st.mode === 'calm' ? 0.18 + Math.sin(st.t * 5) * 0.05 : 0);
    const fuming = st.mode === 'angry';
    for (const [k, a] of p.arms.entries()) {
      a.upper.rotation.z = 0;
      if (holding) { a.upper.rotation.x = -0.42; a.fore.rotation.x = -0.3; }
      if (fuming) {
        a.upper.rotation.x = -2.75 + Math.sin(st.t * 28 + k * 2) * 0.28;
        a.upper.rotation.z = (k ? -1 : 1) * 0.32;
        a.fore.rotation.x = -0.5;
      } else if (fury > 0) {
        // flailing while running, settles as the fury fades
        const w = Math.min(1, fury * 1.6);
        a.upper.rotation.x = a.upper.rotation.x * (1 - w) + (-2.2 + Math.sin(st.t * 22 + k * 2.5) * 0.7) * w;
        a.upper.rotation.z = (k ? -1 : 1) * 0.45 * w;
        a.fore.rotation.x = -0.6 * w + a.fore.rotation.x * (1 - w);
      }
    }
    p.head.rotation.y = fuming ? Math.sin(st.t * 24) * 0.35 : fury * Math.sin(st.t * 17) * 0.3;
    const hop = fuming ? Math.abs(Math.sin(st.t * 13)) * 0.08 : fury * Math.abs(Math.sin(st.ph)) * 0.05;

    const redT = st.mode === 'angry' ? 1 : st.mode === 'rampage' ? Math.min(1, 0.15 + st.fury * 1.1) : 0;
    st.red += (redT - st.red) * Math.min(1, dt * (st.mode === 'calm' ? 1.2 : 5));
    // the red pulses while furious
    const pulse = st.mode === 'angry' || (st.mode === 'rampage' && st.fury > 0.3) ? 0.82 + 0.18 * Math.sin(st.t * 14) : 1;
    tLine.color.copy(CALM).lerp(MAD, st.red * pulse);

    const dDoor = Math.hypot(st.x - DOOR[0], st.z - DOOR[1]);
    const aT = st.mode === 'leave' ? Math.min(1, dDoor / 0.8) : 1;
    st.alpha += (aT - st.alpha) * Math.min(1, dt * (st.mode === 'leave' ? 20 : 4));
    tLine.opacity = st.alpha; tFill.opacity = st.alpha;
    tFill.depthWrite = st.alpha > 0.95;

    st.y += (heightAt(st.x, st.z) - st.y) * Math.min(1, dt * 10);
    p.root.position.set(st.x, st.y + hop + Math.abs(Math.cos(st.ph)) * 0.025 * st.m, st.z);
    p.root.rotation.y = st.face;
  });
}

// ---------- camera fit ----------
const TARGET = v(0, 0.9, -0.2);
let az = azimuth, azTarget = az;
const EL = Math.atan(1 / Math.SQRT2) + 0.02;
const AZ_MIN = Math.PI / 4 - 0.7, AZ_MAX = Math.PI / 4 + 0.7;
const bboxCorners = [];
for (const x of [FLOOR.x0, FLOOR.x1]) for (const y of [-0.18, PER.y + PER.h]) for (const z of [FLOOR.z0, FLOOR.z1]) bboxCorners.push(v(x, y, z));
let fitH = 5;
function camBasis(a) {
  const dir = v(Math.sin(a) * Math.cos(EL), Math.sin(EL), Math.cos(a) * Math.cos(EL));
  const right = v(Math.cos(a), 0, -Math.sin(a));
  const up = new THREE.Vector3().crossVectors(dir, right).negate();
  return { dir, right, up };
}
function computeFit(aspect) {
  let need = 0;
  for (let a = AZ_MIN; a <= AZ_MAX + 1e-6; a += (AZ_MAX - AZ_MIN) / 8) {
    const { right, up } = camBasis(a);
    for (const p of bboxCorners) {
      const d = p.clone().sub(TARGET);
      need = Math.max(need, Math.abs(d.dot(up)), Math.abs(d.dot(right)) / aspect);
    }
  }
  const pad = aspect < 0.8 ? 0.98 : 1.02;
  return need * pad;
}
function placeCamera() {
  const { dir } = camBasis(az);
  camera.position.copy(TARGET).addScaledVector(dir, 40);
  camera.up.set(0, 1, 0);
  camera.lookAt(TARGET);
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  fitH = computeFit(aspect);
  camera.top = fitH; camera.bottom = -fitH;
  camera.left = -fitH * aspect; camera.right = fitH * aspect;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
resize();
placeCamera();

// ---------- interaction ----------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitList = [...chairs.map(c => c.hit), ...bulbHit];
let hovered = null, hoveredBulb = false;
let drag = null, orbit = null, lastTap = { t: 0, chair: null };
let lightsOn = false;
let lastChair = null;

function setNDC(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function pick(e) {
  setNDC(e);
  const hits = ray.intersectObjects(hitList, false);
  if (!hits.length) return null;
  // prefer chairs over bulbs when overlapping only if chair hit is first
  const h = hits[0].object;
  if (h.userData.chair) return { chair: h.userData.chair };
  return { bulb: true };
}
function floorPoint(y) {
  plane.constant = -y;
  const p = new THREE.Vector3();
  return ray.ray.intersectPlane(plane, p) ? p : null;
}

function toggleLights() { setLights(!lightsOn); }
function setLights(on) {
  if (on === lightsOn) return;
  lightsOn = on;
  stage.classList.toggle('lit', lightsOn);
  // boot sequence: left to right with a little randomness
  const order = bulbs.map((b, i) => [b, b.mesh.position.x + b.mesh.position.z * 0.3 + Math.random() * 0.6]).sort((a, b) => a[1] - b[1]);
  const now = performance.now();
  order.forEach(([b], i) => { b.delay = now + (lightsOn ? i * 38 : i * 8); b.target = lightsOn ? 1 : 0; });
  updateStatus();
}

function rotateChair(c, delta) {
  noteInteraction();
  c.drot += delta;
  lastChair = c;
  updateStatus();
}

if (hoverLights) {
  stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setLights(true); });
  stage.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !drag) setLights(false); });
  if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => setLights(en.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] }).observe(stage);
  }
}

canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  if (!t || e.touches.length > 1) return;
  const p = pick(t);
  if (p) e.preventDefault();
}, { passive: false });

canvas.addEventListener('pointerdown', (e) => {
  const p = pick(e);
  const t = performance.now();
  if (p && p.chair) {
    const c = p.chair;
    const fp = floorPoint(c.y);
    drag = { chair: c, ox: fp ? c.x - fp.x : 0, oz: fp ? c.z - fp.z : 0, y: c.y, sx: e.clientX, sy: e.clientY, t, moved: false };
    c.active = true; lastChair = c;
    noteInteraction();
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    updateStatus();
  } else if (p && p.bulb) {
    toggleLights();
  } else {
    orbit = { sx: e.clientX, az: azTarget };
    canvas.setPointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (drag) {
    setNDC(e);
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 3) drag.moved = true;
    if (!drag.moved) return;
    const fp = floorPoint(drag.y);
    if (fp) {
      const c = drag.chair;
      c.x = fp.x + drag.ox; c.z = fp.z + drag.oz;
      noteInteraction();
      separate(c);
      updateStatus();
    }
    return;
  }
  if (orbit) {
    azTarget = Math.min(AZ_MAX, Math.max(AZ_MIN, orbit.az - (e.clientX - orbit.sx) * 0.004));
    canvas.style.cursor = 'ew-resize';
    return;
  }
  if (e.pointerType === 'mouse') {
    const p = pick(e);
    const nh = p && p.chair ? p.chair : null;
    if (nh !== hovered) { hovered = nh; }
    hoveredBulb = !!(p && p.bulb);
    canvas.style.cursor = hovered ? 'grab' : hoveredBulb ? 'pointer' : 'default';
  }
});

function endPointer(e) {
  if (drag) {
    const c = drag.chair;
    const now = performance.now();
    if (!drag.moved && now - drag.t < 300) {
      if (lastTap.chair === c && now - lastTap.t < 380) { rotateChair(c, Math.PI / 4); lastTap = { t: 0, chair: null }; }
      else lastTap = { t: now, chair: c };
    }
    c.active = false;
    drag = null;
    canvas.style.cursor = hovered ? 'grab' : 'default';
    updateStatus();
  }
  if (orbit) { orbit = null; canvas.style.cursor = 'default'; }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { if (!drag) hovered = null; });

canvas.addEventListener('wheel', (e) => {
  const target = (drag && drag.chair) || hovered;
  if (!target) return;
  e.preventDefault();
  rotateChair(target, Math.sign(e.deltaY) * (Math.PI / 12));
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (e.target !== document.body && e.target !== canvas) return;
  const k = e.key.toLowerCase();
  if (k === 'r') { const c = (drag && drag.chair) || hovered || lastChair; if (c) rotateChair(c, e.shiftKey ? -Math.PI / 4 : Math.PI / 4); }
  if (k === 'l') toggleLights();
  if (k === '0') { homeLayout().forEach((p, i) => { const c = chairs[i]; c.x = p.x; c.z = p.z; c.drot = p.rot; }); updateStatus(); }
});

function updateStatus() {
  const parts = [`luces <b>${lightsOn ? 'on' : 'off'}</b>`, `${chairs.length} sillas`];
  const c = (drag && drag.chair) || lastChair;
  if (c) {
    const deg = Math.round(((c.drot * 180 / Math.PI) % 360 + 360) % 360);
    const lvl = heightAt(c.x, c.z) === DECK.top ? 'deck' : heightAt(c.x, c.z) > 0 ? 'escalón' : 'piso';
    parts.push(`silla ${String(c.id).padStart(2, '0')}`);
    parts.push(`${c.x.toFixed(1)}, ${c.z.toFixed(1)} · ${deg}° · ${lvl}`);
  }
  statusEl.innerHTML = parts.join(' &middot; ');
}

// ---------- loop ----------
const tmpColor = new THREE.Color();
const cLine = new THREE.Color(C.line), cHover = new THREE.Color(C.hover), cActive = new THREE.Color(C.active);
const cWick = new THREE.Color(C.wicker), cWickHi = new THREE.Color(0xe3c48d);
const cBulbOff = new THREE.Color(C.bulbOff), cBulbOn = new THREE.Color(C.bulbOn);
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const k = 1 - Math.exp(-dt * 14);

  az += (azTarget - az) * (1 - Math.exp(-dt * 8));
  placeCamera();
  for (const t of tickers) t(dt, now);

  for (const c of chairs) {
    c.dx += (c.x - c.dx) * k;
    c.dz += (c.z - c.dz) * k;
    c.drotV = (c.drotV ?? c.drot); c.drotV += (c.drot - c.drotV) * k;
    const isDrag = drag && drag.chair === c && drag.moved;
    c.lift += ((isDrag || c.carried ? 0.07 : 0) - c.lift) * k;
    const gy = heightAt(c.dx, c.dz);
    c.y += (gy - c.y) * (1 - Math.exp(-dt * 18));
    c.group.position.set(c.dx, c.y + c.lift, c.dz);
    c.group.rotation.y = c.drotV;
    c.footprint.position.set(c.dx, c.y, c.dz);
    c.footprint.rotation.y = c.drotV;
    c.footprint.material.opacity += ((isDrag ? 0.7 : 0) - c.footprint.material.opacity) * k;

    const tgt = c.active ? 2 : (c === hovered ? 1 : 0);
    c.hover += (tgt - c.hover) * k;
    const h = c.hover;
    if (h <= 1) tmpColor.copy(cLine).lerp(cHover, h); else tmpColor.copy(cHover).lerp(cActive, h - 1);
    c.frame.color.copy(tmpColor);
    c.wick.color.copy(cWick).lerp(cWickHi, Math.min(1, h * 0.7) + (lightsOn ? 0.15 : 0));
  }

  let lit = 0;
  for (const b of bulbs) {
    if (now >= b.delay) {
      const flick = b.target && b.level < 0.98 ? (Math.random() < 0.25 ? -0.4 : 0) : 0;
      b.level += (b.target - b.level) * (1 - Math.exp(-dt * (b.target ? 10 : 18))) + flick * dt * 10;
      b.level = Math.max(0, Math.min(1, b.level));
    }
    const shimmer = b.target ? 0.94 + 0.06 * Math.sin(now * 0.004 + b.seed * 7) : 1;
    b.mesh.material.color.copy(cBulbOff).lerp(cBulbOn, b.level * shimmer);
    b.sprite.material.opacity = b.level * 0.7 * shimmer;
    lit += b.level;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
updateStatus();
statusEl.innerHTML = `luces <b>off</b> &middot; ${chairs.length} sillas`;
requestAnimationFrame(frame);
return { chairs, camera, world };
}
