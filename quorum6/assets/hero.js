/* Hero: sixty points that connect into a quorum.
   Left alone they drift apart as separate points with faint threads; every few seconds, or as soon as the
   visitor moves over them, they gather into one connected body that behaves like a liquid (hover pulls it,
   a press grabs part of it, release flings it). Physics: mercury-core.js (study of aiforui.dev/lab Mercury). */
(function () {
  const M = window.Mercury, wrap = document.querySelector('[data-hero-net]');
  if (!M || !wrap) return;
  const canvas = wrap.querySelector('canvas');
  const css = n => getComputedStyle(wrap).getPropertyValue(n).trim();
  const C = { link: css('--net-link') || '#93a3b5', node: css('--net-node') || '#f4efe4', held: css('--net-held') || '#e0906f' };
  const SP_IDLE = 2.0, LINK = 62, IDLE_AFTER = 2600, AUTO_AFTER = 4000, CYCLE = 11;
  // The network is drawn 1.3× larger around its centre, so it fills the hero square; pointer positions are mapped back
  const Z = 1.3, CX = 300, CY = 288, mx = v => CX + (v - CX) / Z, my = v => CY + (v - CY) / Z;
  let S = null, ptr, liq = 0, lastTouch = -1e9;
  const smooth = x => x * x * (3 - 2 * x);

  function draw(ctx) {
    const { x, y, held, sz } = S, buckets = Array.from({ length: 8 }, () => []);
    for (let i = 0; i < M.N; i++) for (let j = i + 1; j < M.N; j++) {
      const d = Math.hypot(x[j] - x[i], y[j] - y[i]);
      if (d < LINK) buckets[Math.min(7, Math.floor(Math.pow(1 - d / LINK, 1.5) * 8))].push(i, j);
    }
    ctx.lineWidth = 1; ctx.strokeStyle = C.link;
    buckets.forEach((b, k) => {
      if (!b.length) return;
      ctx.globalAlpha = ((k + 0.5) / 8) * 0.7; ctx.beginPath();
      for (let m = 0; m < b.length; m += 2) { ctx.moveTo(x[b[m]], y[b[m]]); ctx.lineTo(x[b[m + 1]], y[b[m + 1]]); }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    for (let i = 0; i < M.N; i++) { ctx.fillStyle = held[i] ? C.held : C.node; ctx.beginPath(); ctx.arc(x[i], y[i], held[i] ? 2.9 : 1.7 + 0.6 * sz[i], 0, Math.PI * 2); ctx.fill(); }
  }

  const st = M.stage(wrap, canvas, ({ ctx, dt, t, reduced }) => {
    if (!S) { S = M.createState(); if (reduced) for (let i = 0; i < 400; i++) M.step(S, 1 / 60, 0, 0, false, true, { spread: SP_IDLE }); }
    const sp = { inside: ptr.inside, down: ptr.down, vx: ptr.vx / Z, vy: ptr.vy / Z, x: mx(ptr.x), y: my(ptr.y), taps: ptr.taps.map(t => ({ x: mx(t.x), y: my(t.y) })), releases: ptr.releases.slice() };
    ptr.taps.length = 0; ptr.releases.length = 0;
    const { over, px, py } = M.handlePointer(S, sp), now = performance.now();
    const touching = S.nHeld > 0 || ptr.down || (over && now - ptr.moved < IDLE_AFTER);
    if (touching) lastTouch = now;
    const auto = !reduced && now - lastTouch > AUTO_AFTER && (t + 3.5) % CYCLE > CYCLE / 2;
    const target = touching || auto ? 1 : 0, tau = target > liq ? (touching ? 0.22 : 0.9) : 1.6;
    liq += (target - liq) * (1 - Math.exp(-dt / tau));
    const e = smooth(Math.min(1, Math.max(0, liq)));
    if (!reduced) M.step(S, dt, px, py, over, reduced, { spread: 1 + (SP_IDLE - 1) * (1 - e), drift: 34 * (1 - e), t });
    ctx.save(); ctx.translate(CX, CY); ctx.scale(Z, Z); ctx.translate(-CX, -CY);
    draw(ctx);
    ctx.restore();
    if (over && !reduced) { ctx.fillStyle = C.held; ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 2.6, 0, Math.PI * 2); ctx.fill(); }
    return !reduced;
  }, 2);
  ptr = M.pointer(wrap, st.wake);
})();
