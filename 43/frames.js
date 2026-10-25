// frames.js: drag anywhere to draw a frame, and a second cursor comes and fits it to
// whatever you meant. When nobody is touching the page, two cursors do it on their own.
// Theme with CSS vars on :root: --fx-line, --fx-handle, --fx-ink, --fx-cursor-a,
// --fx-cursor-a-edge, --fx-cursor-b, --fx-cursor-b-edge, --fx-hint-bg, --fx-hint-ink.
(() => {
  if (window.__fxFrames) return;
  window.__fxFrames = true;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  const css = `
    .fx-layer{position:absolute;left:0;top:0;width:0;height:0;z-index:60;pointer-events:none}
    .fx-frame{position:absolute;box-sizing:border-box;border:1px solid var(--fx-line,#a3b2c6);transition:opacity .14s}
    .fx-frame.is-gone{opacity:0}
    .fx-shape{position:absolute;inset:0;border:1.5px solid var(--fx-ink,#111a2c);border-radius:var(--fx-r,8px);opacity:0}
    .fx-frame.is-shaping .fx-shape{opacity:1}
    .fx-h{position:absolute;width:5px;height:5px;background:var(--fx-handle,#111a2c)}
    .fx-h.tl{left:-3px;top:-3px}.fx-h.tr{right:-3px;top:-3px}.fx-h.bl{left:-3px;bottom:-3px}.fx-h.br{right:-3px;bottom:-3px}
    .fx-cursor{position:absolute;left:0;top:0;width:22px;height:22px;opacity:0;transition:opacity .16s;will-change:transform}
    .fx-cursor.is-on{opacity:1}
    .fx-cursor svg{display:block;width:22px;height:22px;overflow:visible;transition:transform .09s}
    .fx-cursor.is-down svg{transform:scale(.88)}
    .fx-cursor.a path{fill:var(--fx-cursor-a,#111a2c);stroke:var(--fx-cursor-a-edge,#fff)}
    .fx-cursor.b path{fill:var(--fx-cursor-b,#000);stroke:var(--fx-cursor-b-edge,#fff)}
    html.fx-drawing,html.fx-drawing *{user-select:none!important;-webkit-user-select:none!important}
    .fx-hint{position:fixed;right:16px;bottom:16px;z-index:61;display:flex;align-items:center;gap:8px;
      padding:6px 10px 6px 8px;border:1px solid var(--fx-line,#a3b2c6);background:var(--fx-hint-bg,#fff);
      color:var(--fx-hint-ink,#5e5e5e);font:400 11px/16px ui-monospace,"SF Mono",Menlo,monospace;
      letter-spacing:.02em;pointer-events:none;transition:opacity .3s}
    .fx-hint.is-gone{opacity:0}
    .fx-hint svg{width:14px;height:14px;display:block}
    .fx-hint rect{fill:none;stroke:var(--fx-line,#a3b2c6)}
    .fx-hint .hd{fill:var(--fx-handle,#111a2c);stroke:none}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  // ---------- small helpers ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const norm = (r) => ({
    x1: Math.min(r.x1, r.x2), y1: Math.min(r.y1, r.y2),
    x2: Math.max(r.x1, r.x2), y2: Math.max(r.y1, r.y2),
  });
  // text blocks hug their glyphs, not the full block width
  const boxOf = (el) => {
    if (!(el instanceof SVGElement) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const b = range.getBoundingClientRect();
      if (b.width > 2 && b.height > 2) return b;
    }
    return el.getBoundingClientRect();
  };
  const pageRect = (el, pad = 0) => {
    const b = boxOf(el);
    return { x1: b.left + scrollX - pad, y1: b.top + scrollY - pad, x2: b.right + scrollX + pad, y2: b.bottom + scrollY + pad };
  };
  const area = (r) => Math.max(0, r.x2 - r.x1) * Math.max(0, r.y2 - r.y1);
  const overlap = (a, b) => area({ x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), x2: Math.min(a.x2, b.x2), y2: Math.min(a.y2, b.y2) });

  class Cancelled extends Error {}
  // a token is a run of gestures; killing it stops every move/press/nap that carries it
  const USER = { dead: false };
  const nap = async (ms, tk) => { await sleep(ms); if (tk.dead) throw new Cancelled(); };

  // ---------- frame ----------
  class Frame {
    constructor(x, y) {
      this.el = document.createElement('div');
      this.el.className = 'fx-frame';
      this.el.innerHTML = '<div class="fx-shape"></div><i class="fx-h tl"></i><i class="fx-h tr"></i><i class="fx-h bl"></i><i class="fx-h br"></i>';
      layer.appendChild(this.el);
      this.r = { x1: x, y1: y, x2: x, y2: y };
      this.paint();
    }
    set(r) { this.r = { ...r }; this.paint(); }
    corner(c, x, y) {
      if (c === 'tl') { this.r.x1 = x; this.r.y1 = y; } else { this.r.x2 = x; this.r.y2 = y; }
      this.paint();
    }
    paint() {
      const r = norm(this.r);
      const w = r.x2 - r.x1, h = r.y2 - r.y1;
      const s = this.el.style;
      s.left = r.x1 + 'px'; s.top = r.y1 + 'px'; s.width = w + 'px'; s.height = h + 'px';
      s.setProperty('--fx-r', clamp(Math.min(w, h) * 0.2, 3, 14) + 'px');
    }
    shaping(on = true) { this.el.classList.toggle('is-shaping', on); }
    remove(delay = 0) {
      setTimeout(() => {
        this.el.classList.add('is-gone');
        setTimeout(() => this.el.remove(), 160);
      }, delay);
    }
  }

  // ---------- ghost cursor ----------
  const SHAPES = {
    // a: compact arrowhead leaning left (hotspot top-left); b: classic arrow with a tail
    a: { d: 'M3 2.5 L18.5 9.2 L11.4 11.4 L9.2 18.5 Z', hx: 3, hy: 2.5 },
    b: { d: 'M4 2 L4 18.2 L8.3 14.3 L11.2 20.6 L13.9 19.4 L11.1 13.3 L16.8 13.3 Z', hx: 4, hy: 2 },
  };
  class Ghost {
    constructor(kind) {
      const s = SHAPES[kind];
      this.hx = s.hx; this.hy = s.hy;
      this.el = document.createElement('div');
      this.el.className = 'fx-cursor ' + kind;
      this.el.innerHTML = `<svg viewBox="0 0 22 22"><path d="${s.d}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
      layer.appendChild(this.el);
      this.x = 0; this.y = 0; this.on = false;
    }
    place(x, y) {
      this.x = x; this.y = y;
      this.el.style.transform = `translate(${x - this.hx}px, ${y - this.hy}px)`;
    }
    show(x, y) {
      if (!this.on) { this.place(x, y); this.on = true; }
      this.el.classList.add('is-on');
    }
    hide() { this.on = false; this.el.classList.remove('is-on'); }
    async press(tk) { this.el.classList.add('is-down'); await nap(90, tk); }
    async release(tk) { this.el.classList.remove('is-down'); await nap(60, tk); }
    move(x, y, tk, { speed = 1, onStep } = {}) {
      const x0 = this.x, y0 = this.y;
      const dist = Math.hypot(x - x0, y - y0);
      const dur = clamp(220 + dist * 0.85, 240, 980) * speed;
      // bow the path a little so it doesn't look like a robot
      const bend = rnd(-0.16, 0.16) * dist;
      const cx = (x0 + x) / 2 + (-(y - y0) / (dist || 1)) * bend;
      const cy = (y0 + y) / 2 + ((x - x0) / (dist || 1)) * bend;
      return new Promise((resolve, reject) => {
        const t0 = performance.now();
        const step = (now) => {
          if (tk.dead) { this.el.classList.remove('is-down'); return reject(new Cancelled()); }
          const t = clamp((now - t0) / dur, 0, 1), e = ease(t), u = 1 - e;
          const px = u * u * x0 + 2 * u * e * cx + e * e * x;
          const py = u * u * y0 + 2 * u * e * cy + e * e * y;
          this.place(px, py);
          if (onStep) onStep(px, py);
          if (t < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
      });
    }
  }

  const A = new Ghost('a'); // the one who fixes things
  const B = new Ghost('b'); // the one who draws sloppy frames

  // enter from a point near the target, nudged toward the nearest viewport edge
  function entryFor(x, y) {
    const vx = x - scrollX, vy = y - scrollY;
    const ex = vx < innerWidth / 2 ? -1 : 1, ey = vy < innerHeight / 2 ? -1 : 1;
    return {
      x: clamp(x + ex * rnd(90, 170), scrollX + 8, scrollX + innerWidth - 24),
      y: clamp(y + ey * rnd(60, 130), scrollY + 8, scrollY + innerHeight - 24),
    };
  }
  function arrive(g, x, y) {
    if (!g.on) { const p = entryFor(x, y); g.show(p.x, p.y); }
  }

  // ---------- gestures ----------
  async function drawFrame(g, r, tk, { shape = false, speed = 1.15, keep } = {}) {
    arrive(g, r.x1, r.y1);
    await g.move(r.x1, r.y1, tk);
    await g.press(tk);
    const f = new Frame(r.x1, r.y1);
    if (keep) keep.push(f);
    if (shape) f.shaping();
    await g.move(r.x2, r.y2, tk, { speed, onStep: (x, y) => f.corner('br', x, y) });
    await g.release(tk);
    return f;
  }

  async function fitFrame(g, f, t, tk) {
    f.set(norm(f.r));
    const needTL = Math.hypot(f.r.x1 - t.x1, f.r.y1 - t.y1) > 3;
    const needBR = Math.hypot(f.r.x2 - t.x2, f.r.y2 - t.y2) > 3;
    // grab the worse corner last, so the shape shows up on the final drag
    const order = [];
    if (needTL) order.push('tl');
    if (needBR) order.push('br');
    if (!order.length) {
      arrive(g, f.r.x2, f.r.y2);
      await g.move(f.r.x2, f.r.y2, tk);
      await g.press(tk); f.shaping(); await g.release(tk);
      return;
    }
    for (let i = 0; i < order.length; i++) {
      const c = order[i];
      const hx = c === 'tl' ? f.r.x1 : f.r.x2, hy = c === 'tl' ? f.r.y1 : f.r.y2;
      const tx = c === 'tl' ? t.x1 : t.x2, ty = c === 'tl' ? t.y1 : t.y2;
      arrive(g, hx, hy);
      await g.move(hx, hy, tk);
      await g.press(tk);
      if (i === order.length - 1) f.shaping();
      await g.move(tx, ty, tk, { speed: 1.1, onStep: (x, y) => f.corner(c, x, y) });
      f.corner(c, tx, ty);
      await g.release(tk);
    }
  }

  async function wander(g, tk) {
    await g.move(g.x + rnd(-80, 80), g.y + rnd(30, 90), tk, { speed: 1.3 });
  }

  // ---------- what did you mean? ----------
  const SKIP = new Set(['SCRIPT', 'STYLE', 'BR', 'HEAD', 'META', 'LINK', 'TITLE', 'DEFS', 'CLIPPATH', 'LINEARGRADIENT', 'RADIALGRADIENT', 'FILTER', 'PATTERN', 'MASK', 'DESC', 'HTML', 'BODY']);
  function candidates() {
    const out = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (SKIP.has(el.tagName.toUpperCase()) || layer.contains(el) || el.closest('.fx-hint')) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 6 || b.height < 6) continue;
      out.push(el);
    }
    return out;
  }
  function visible(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) return false;
    }
    return true;
  }
  function depth(el) { let d = 0; for (let n = el; n; n = n.parentElement) d++; return d; }

  function bestTarget(r) {
    r = norm(r);
    const ra = area(r);
    const scored = [];
    for (const el of candidates()) {
      const e = pageRect(el);
      const inter = overlap(r, e);
      if (!inter) continue;
      const iou = inter / (ra + area(e) - inter);
      if (iou > 0.12) scored.push({ el, iou, a: area(e), d: depth(el) });
    }
    // same-size wrappers tie: prefer the smaller, deeper one
    scored.sort((p, q) => (Math.abs(q.iou - p.iou) > 0.02 ? q.iou - p.iou : p.a - q.a || q.d - p.d));
    for (const s of scored.slice(0, 8)) if (visible(s.el)) return s.el;
    return null;
  }

  // ---------- your frames ----------
  const queue = [];
  let working = false;

  async function work() {
    if (working) return;
    working = true;
    stopAmbient();
    while (queue.length) {
      const { f, target } = queue.shift();
      if (!target) {
        // nothing under it: click it and delete it
        try {
          arrive(A, f.r.x2, f.r.y2);
          await A.move((f.r.x1 + f.r.x2) / 2, (f.r.y1 + f.r.y2) / 2, USER);
          await A.press(USER); await A.release(USER);
        } catch (e) { /* cancelled */ }
        f.remove();
        continue;
      }
      const t = pageRect(target, 6);
      if (reduce) { f.set(t); f.shaping(); f.remove(1400); continue; }
      try { await fitFrame(A, f, t, USER); } catch (e) { f.remove(); continue; }
      f.remove(1500);
      if (!queue.length) { try { await wander(A, USER); } catch (e) {} }
    }
    working = false;
    setTimeout(() => { if (!working) A.hide(); }, 700);
    lastUser = performance.now();
  }

  let drag = null, lastUser = performance.now(), hint = null, suppressClick = false;
  const NOPE = 'a,button,input,textarea,select,label,summary,video,iframe,[role="button"],[tabindex],[contenteditable],.fx-ignore';

  addEventListener('pointerdown', (e) => {
    lastUser = performance.now();
    if (e.button !== 0 || e.pointerType === 'touch') return;
    if (e.target.closest && e.target.closest(NOPE)) return;
    drag = { x: e.pageX, y: e.pageY, f: null, id: e.pointerId };
  }, true);

  addEventListener('pointermove', (e) => {
    lastUser = performance.now();
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.f) {
      if (Math.hypot(e.pageX - drag.x, e.pageY - drag.y) < 6) return;
      document.documentElement.classList.add('fx-drawing');
      getSelection().removeAllRanges();
      drag.f = new Frame(drag.x, drag.y);
      stopAmbient();
    }
    drag.f.corner('br', e.pageX, e.pageY);
  }, true);

  function endDrag() {
    if (!drag) return;
    const f = drag.f;
    drag = null;
    document.documentElement.classList.remove('fx-drawing');
    if (!f) return;
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    const r = norm(f.r);
    if (r.x2 - r.x1 < 8 || r.y2 - r.y1 < 8) { f.remove(); return; }
    while (queue.length >= 4) queue.shift().f.remove();
    queue.push({ f, target: bestTarget(r) });
    dismissHint();
    work();
  }
  addEventListener('pointerup', endDrag, true);
  addEventListener('pointercancel', endDrag, true);
  addEventListener('click', (e) => { if (suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);
  addEventListener('dragstart', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); }, true);
  addEventListener('resize', () => { layer.querySelectorAll('.fx-frame').forEach((n) => n.remove()); });

  // ---------- hint ----------
  let drawnBefore = false;
  try { drawnBefore = localStorage.getItem('fx-drawn') === '1'; } catch (e) {}
  if (finePointer && !drawnBefore) {
    hint = document.createElement('div');
    hint.className = 'fx-hint';
    hint.innerHTML = '<svg viewBox="0 0 14 14"><rect x="2.5" y="2.5" width="9" height="9"/><rect class="hd" x="1" y="1" width="3" height="3"/><rect class="hd" x="10" y="10" width="3" height="3"/></svg><span>drag anywhere to draw a frame</span>';
    document.body.appendChild(hint);
  }
  function dismissHint() {
    try { localStorage.setItem('fx-drawn', '1'); } catch (e) {}
    if (hint) { hint.classList.add('is-gone'); setTimeout(() => hint && hint.remove(), 400); hint = null; }
  }

  // ---------- ambient: the two of them, on their own ----------
  const POOL = 'h1, h2, p, li, figure, nav a, footer a, button, [role="button"], img';
  let run = null; // the ambient token in flight
  function stopAmbient() {
    if (!run) return;
    run.dead = true;
    run.frames.forEach((f) => f.remove());
    run = null;
    B.hide();
    if (!working) A.hide();
  }

  function inView(minW = 24, minH = 12) {
    const out = [];
    for (const el of document.querySelectorAll(POOL)) {
      if (layer.contains(el) || el.closest('.fx-hint')) continue;
      const b = el.getBoundingClientRect();
      if (b.width < minW || b.height < minH) continue;
      if (b.width > innerWidth * 0.85 || b.height > innerHeight * 0.6) continue;
      if (b.left < 40 || b.top < 40 || b.right > innerWidth - 40 || b.bottom > innerHeight - 40) continue;
      if (!visible(el)) continue;
      out.push(el);
    }
    return out;
  }
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function sloppy(t) {
    const exactTL = Math.random() < 0.35;
    return {
      x1: exactTL ? t.x1 : t.x1 + rnd(-30, 8), y1: exactTL ? t.y1 : t.y1 + rnd(-24, 8),
      x2: t.x2 + rnd(-10, 38), y2: t.y2 + rnd(-8, 30),
    };
  }

  const scenes = [
    // B draws it wrong, A fixes it
    async (els, tk) => {
      const t = pageRect(pick(els), 6);
      const f = await drawFrame(B, sloppy(t), tk, { keep: tk.frames });
      wander(B, tk).catch(() => {});
      await fitFrame(A, f, t, tk);
      await nap(1200, tk);
    },
    // B frames a loose area, A draws the real shape inside it
    async (els, tk) => {
      const t = pageRect(pick(els), 6);
      const loose = { x1: t.x1 - rnd(30, 70), y1: t.y1 - rnd(20, 50), x2: t.x2 + rnd(30, 80), y2: t.y2 + rnd(20, 50) };
      await drawFrame(B, loose, tk, { keep: tk.frames });
      wander(B, tk).catch(() => {});
      await drawFrame(A, t, tk, { shape: true, keep: tk.frames });
      await nap(1100, tk);
    },
    // both draw at once, then each fixes their own
    async (els, tk) => {
      if (els.length < 2) return;
      const e1 = pick(els);
      const e2 = pick(els.filter((e) => e !== e1 && !e.contains(e1) && !e1.contains(e)));
      if (!e2) return;
      const t1 = pageRect(e1, 6), t2 = pageRect(e2, 6);
      const [f1, f2] = await Promise.all([
        drawFrame(B, sloppy(t1), tk, { keep: tk.frames }),
        drawFrame(A, sloppy(t2), tk, { keep: tk.frames }),
      ]);
      await nap(250, tk);
      await Promise.all([fitFrame(B, f1, t1, tk), fitFrame(A, f2, t2, tk)]);
      await nap(1100, tk);
    },
  ];

  async function ambient() {
    if (run || working || drag || document.hidden) return;
    const els = inView();
    if (!els.length) return;
    const tk = (run = { dead: false, frames: [] });
    try {
      await pick(scenes)(els, tk);
      tk.frames.forEach((f) => f.remove());
      tk.frames = [];
      await Promise.all([wander(A, tk), wander(B, tk)]);
    } catch (e) {
      if (!(e instanceof Cancelled)) console.error(e);
    }
    if (run === tk) stopAmbient();
  }

  if (!reduce) {
    setTimeout(ambient, 1800);
    (function loop() {
      setTimeout(() => {
        if (performance.now() - lastUser > 3200) ambient();
        loop();
      }, rnd(5200, 8200));
    })();
  }
})();
