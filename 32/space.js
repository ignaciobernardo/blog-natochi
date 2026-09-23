// Screen-aligned type on projected architecture: glyphs remain printed on the
// page while the silhouettes, scale and atmospheric depth move in 3D.
const canvas = document.querySelector('#space');
const ctx = canvas.getContext('2d', { alpha: false });
const keys = new Set();
const eye = { x: 0, y: 1.65, z: -1.8, yaw: -.045, pitch: .015 };
let width, height, focal, dirty = true, previous = 0, dragging = null, walkingTime = 0;
const prose = (`Он шёл по длинному коридору, и каждое слово становилось дверью. За окнами был город, но здесь оставалась только тишина. ` +
  `Я помню этот дом: белые стены, лестницу, свет в конце комнаты. Никто не знал, где кончается одна история и начинается другая. ` +
  `— Неужели я уже приходил сюда? — подумал он. Время проходило сквозь открытые окна, страницы медленно поворачивались. ` +
  `Всё было рядом и всё было далеко. Человек остановился, прислушался и сделал ещё один шаг. На столе лежала книга без начала и конца. ` +
  `Можно было идти дальше, можно было вернуться, но пространство уже изменилось. Мы говорили о памяти, о свете, о том, что остаётся после нас. `).repeat(6);
const words = prose.split(' ');
const boxes = [];
function box(x, z, w, d, h, seed, bottom = 0) { boxes.push({ x, z, w, d, h, seed, bottom }); }
// An asymmetric succession of doorways with a clear, traversable center.
box(-4.8, 4, 6.5, 3.3, 5.8, 1);
box(4.4, 3.7, 5.5, 5.2, 6.8, 2);
box(-3.15, 7.5, 3.5, 3.0, 4.3, 3);
box(3.6, 12.4, 4.6, 3.2, 5.7, 4);
box(-3.8, 15, 5.2, 3.8, 6.8, 5);
box(.15, 8, 9, 1.9, 1.5, 6, 4.1);
box(-.2, 20, 8, 2.3, 1.3, 7, 3.9);
box(0, 1.8, 14, 2.2, 3, 8, 3.85);
box(0, -1, 22, 4, .05, 9, -.05);
box(-1.85, 2.6, 1.5, 1.3, .8, 15);
for (let i = 0; i < 12; i++) {
  const z = 24 + i * 7.2;
  box(-3.5 - Math.sin(i) * .5, z, 4.6, 3.2, 4.8 + (i % 3), 10 + i * 2);
  box(3.5 + Math.cos(i) * .45, z + 3, 4.4, 3.3, 5.7, 11 + i * 2);
  if (i % 2 === 0) box(0, z + 3, 9, 1.4, 1.4, 40 + i, 4.2);
}
box(-9, 48, 3, 115, 9, 70);
box(9, 48, 3, 115, 9, 71);
box(0, 112, 21, 2, 10, 72);
box(0, -12, 21, 2, 10, 73);

// Cache typeset pages; render their screen-space ink through each face's mask.
const pages = new Map();
function page(seed, bold) {
  const id = `${seed}-${bold}`;
  if (pages.has(id)) return pages.get(id);
  const sheet = document.createElement('canvas');
  sheet.width = 1024; sheet.height = 1024;
  const c = sheet.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, 1024, 1024);
  c.fillStyle = '#050505'; c.font = `${bold ? 700 : 400} 15px Arial`;
  let index = seed * 31;
  for (let y = 13; y < 1040; y += 14) {
    let x = -(seed % 7) * 9;
    while (x < 1024) {
      const word = words[index++ % words.length] + ' ';
      c.fillText(word, x, y); x += c.measureText(word).width;
    }
  }
  pages.set(id, sheet); return sheet;
}
function cameraPoint(p) {
  const x = p[0] - eye.x, y = p[1] - eye.y, z = p[2] - eye.z;
  const side = x * Math.cos(eye.yaw) - z * Math.sin(eye.yaw);
  const forward = x * Math.sin(eye.yaw) + z * Math.cos(eye.yaw);
  return [side, y * Math.cos(eye.pitch) - forward * Math.sin(eye.pitch), y * Math.sin(eye.pitch) + forward * Math.cos(eye.pitch)];
}
function clipNear(points) {
  const result = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    if (a[2] >= .08) result.push(a);
    if ((a[2] >= .08) !== (b[2] >= .08)) {
      const t = (.08 - a[2]) / (b[2] - a[2]);
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, .08]);
    }
  }
  return result;
}
function faces() {
  const output = [];
  for (const b of boxes) {
    const l = b.x - b.w / 2, r = b.x + b.w / 2, n = b.z - b.d / 2, f = b.z + b.d / 2, t = b.bottom + b.h, y = b.bottom;
    const sides = [
      { p: [[l,y,n],[r,y,n],[r,t,n],[l,t,n]], visible: eye.z < n, type: 0 },
      { p: [[r,y,f],[l,y,f],[l,t,f],[r,t,f]], visible: eye.z > f, type: 0 },
      { p: [[l,y,f],[l,y,n],[l,t,n],[l,t,f]], visible: eye.x < l, type: 1 },
      { p: [[r,y,n],[r,y,f],[r,t,f],[r,t,n]], visible: eye.x > r, type: 1 },
      { p: [[l,y,f],[r,y,f],[r,y,n],[l,y,n]], visible: eye.y < y, type: 2 },
      { p: [[l,t,n],[r,t,n],[r,t,f],[l,t,f]], visible: eye.y > t, type: 2 }
    ];
    for (const s of sides) {
      if (!s.visible) continue;
      const points = s.p.map(cameraPoint);
      const clipped = clipNear(points);
      if (clipped.length < 3) continue;
      const poly = clipped.map(p => [width / 2 + p[0] * focal / p[2], height * .51 - p[1] * focal / p[2]]);
      if (poly.every(p=>p[0]<0) || poly.every(p=>p[0]>width) || poly.every(p=>p[1]<0) || poly.every(p=>p[1]>height)) continue;
      output.push({ poly, depth: points.reduce((sum,p)=>sum+p[2],0)/4, seed: b.seed, type: s.type });
    }
  }
  return output.sort((a,b)=>b.depth-a.depth);
}
function render() {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
  for (const face of faces()) {
    const { poly, seed, type } = face;
    const depth = Math.max(.9, face.depth);
    const left = Math.max(0, Math.min(...poly.map(p=>p[0]))), right = Math.min(width, Math.max(...poly.map(p=>p[0])));
    const top = Math.max(0, Math.min(...poly.map(p=>p[1]))), bottom = Math.min(height, Math.max(...poly.map(p=>p[1])));
    ctx.save(); ctx.beginPath(); poly.forEach((p,i)=>i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(left, top, right-left, bottom-top);
    const dark = (type === 1 && seed % 2 === 0) || seed === 9;
    const opacity = Math.min(1, Math.exp(-Math.max(0, depth-2) * .12) * (dark ? 1 : .68));
    const fontSize = Math.max(2.7, Math.min(48, focal * (dark ? .07 : .05) / depth));
    const tile = 1024 * fontSize / 15;
    ctx.globalAlpha = opacity;
    const texture = page(seed, dark);
    // Stable anchors follow the architecture rather than swimming with the viewport.
    const anchorX = poly[0][0], anchorY = poly[0][1];
    const startX = left - ((left - anchorX) % tile + tile) % tile;
    const startY = top - ((top - anchorY) % tile + tile) % tile;
    for (let y = startY; y < bottom; y += tile) for (let x = startX; x < right; x += tile) {
      if (type === 1 && seed % 3 !== 0) {
        ctx.save(); ctx.translate(x+tile,y+tile); ctx.rotate(Math.PI); ctx.drawImage(texture,0,0,tile,tile); ctx.restore();
      } else ctx.drawImage(texture,x,y,tile,tile);
    }
    ctx.restore();
  }
}
function resize() {
  width = innerWidth; height = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  focal = Math.max(height * .77, width * .55); dirty = true;
}
function clear() { keys.clear(); dragging = null; }
function reset() {
  clear(); Object.assign(eye, { x: 0, y: 1.65, z: -1.8, yaw: -.045, pitch: .015 });
  walkingTime = 0; dirty = true; document.body.classList.remove('walking');
}
function blocked(x,z) {
  return boxes.some(b => b.bottom < 1.9 && b.bottom+b.h > .2 && x > b.x-b.w/2-.23 && x < b.x+b.w/2+.23 && z > b.z-b.d/2-.23 && z < b.z+b.d/2+.23);
}
const controls = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
addEventListener('keydown', e => {
  if (controls.has(e.code)) { e.preventDefault(); keys.add(e.code); }
  if (e.code === 'KeyR') reset();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', clear);
document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
canvas.addEventListener('pointerdown', e => { canvas.focus(); dragging = { id:e.pointerId, x:e.clientX, y:e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (!dragging || e.pointerId !== dragging.id) return;
  eye.yaw += (e.clientX-dragging.x) * .003;
  eye.pitch = Math.max(-1.1, Math.min(1.1, eye.pitch + (e.clientY-dragging.y) * .003));
  dragging.x=e.clientX; dragging.y=e.clientY; dirty=true;
});
canvas.addEventListener('pointerup', () => { dragging=null; });
canvas.addEventListener('pointercancel', () => { dragging=null; });
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(button.dataset.key); });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.key));
}
document.querySelector('#reset').addEventListener('click', reset);
addEventListener('resize', resize);
function frame(time) {
  const dt = Math.min((time-previous)/1000, .035); previous=time;
  let forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
  let strafe = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
  const length = Math.hypot(forward, strafe);
  if (length) {
    forward/=length; strafe/=length;
    const speed = dt * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 5 : 2.5);
    const dx = (Math.sin(eye.yaw)*forward + Math.cos(eye.yaw)*strafe)*speed;
    const dz = (Math.cos(eye.yaw)*forward - Math.sin(eye.yaw)*strafe)*speed;
    if (!blocked(eye.x+dx,eye.z)) eye.x+=dx;
    if (!blocked(eye.x,eye.z+dz)) eye.z+=dz;
    walkingTime+=dt; if (walkingTime>1.5) document.body.classList.add('walking');
    dirty=true;
  }
  if (dirty) { render(); dirty=false; }
  requestAnimationFrame(frame);
}
resize(); requestAnimationFrame(frame);
