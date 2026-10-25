/* tlon receipts: print simulation, fit-to-screen and the review panel.

   Every .print gets an alpha mask computed on the print head's dot grid (1 dot = 1/24 em), so the
   small defects of a real machine land where they would on paper:
     - heating elements: each column of the head prints a touch stronger or weaker, some die
     - paper feed: the stepper leaves faint bands across the roll
     - heat: lines with lots of ink sag (the head shares one supply), a cold head starts light
     - ribbon / pins (impact printers): worn ribbon bands, a tired pin, uneven strikes per char
     - age: the thermal layer fades in patches, specks of dust leave pinholes
   The #thermal SVG filter adds the ragged edge and ink spread on top. */
(() => {
  const INKS = {
    1: {
      name: "Térmica nueva", font: "thermal", ink: "#000",
      filter: { ragged: 1.0, blur: 0.6, slope: 1.25 },
      head: { sigma: 0.035, weak: [[0.71, 0.82]] }, feed: { amp: 0.04, wave: 44 },
      mottle: [[0.05, 34]], speck: 0.0012,
    },
    2: {
      name: "Cabezal gastado", font: "thermal", ink: "#000",
      filter: { ragged: 1.1, blur: 0.62, slope: 1.25 },
      head: { sigma: 0.07, dead: [0.262, 0.617], weak: [[0.39, 0.6], [0.398, 0.82], [0.83, 0.7]] },
      feed: { amp: 0.045, wave: 40 }, fade: { right: 0.18 }, mottle: [[0.05, 30]], speck: 0.002,
    },
    3: {
      name: "Rollo viejo", font: "thermal", ink: "#141312", alpha: 0.84,
      filter: { ragged: 1.4, blur: 0.82, slope: 1.05 },
      head: { sigma: 0.05 }, feed: { amp: 0.08, wave: 26, bands: 5, band: 0.22 }, fade: { edges: 0.16 },
      mottle: [[0.32, 70], [0.12, 13]], speck: 0.007,
    },
    4: {
      name: "Cinta de matriz", font: "dots", ink: "#17171d", alpha: 0.94,
      filter: { ragged: 0.5, blur: 0.42, slope: 1.1 },
      ribbon: { amp: 0.17, wave: 20 }, pin: { row: 7, gain: 0.6 }, strike: 0.09,
      mottle: [[0.07, 8]], speck: 0.003,
    },
    5: {
      name: "Calor desparejo", font: "thermal", ink: "#000",
      filter: { ragged: 1.1, blur: 0.75, slope: 1.45 },
      head: { sigma: 0.04 }, feed: { amp: 0.045, wave: 36 },
      heat: { density: 0.3, cold: 0.8 }, skips: 4, mottle: [[0.05, 30]], speck: 0.002,
    },
  };
  const HEADS = { a: "Referencia impresa", b: "Doble tamaño", c: "Marca raster", d: "Banda invertida", e: "Tramado" };
  // paper: w = normal print; k = the whole roll burnt black, type left unprinted (page bg lifts so it shows)
  const PAPERS = { w: { name: "Impresión normal", bg: "#000" }, k: { name: "Papel quemado", bg: "#2e2e2e" } };
  const DEFAULT = { ink: "2", head: "c", paper: "w" };

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const state = {
    ink: INKS[params.get("ink")] ? params.get("ink") : root.dataset.ink || DEFAULT.ink,
    head: HEADS[params.get("head")] ? params.get("head") : root.dataset.head || DEFAULT.head,
    paper: PAPERS[params.get("paper")] ? params.get("paper") : root.dataset.paper || DEFAULT.paper,
  };

  // ---- randomness ------------------------------------------------------------------------------
  const prng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = (rnd) => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const smooth = (t) => t * t * (3 - 2 * t);
  function noise1(rnd, n, wave) {
    const knots = Array.from({ length: Math.ceil(n / wave) + 2 }, rnd), out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const p = i / wave, k = Math.floor(p), f = smooth(p - k);
      out[i] = knots[k] * (1 - f) + knots[k + 1] * f;
    }
    return out;
  }
  function noise2(rnd, cols, rows, scale) {
    const gw = Math.ceil(cols / scale) + 2, gh = Math.ceil(rows / scale) + 2;
    const g = Float32Array.from({ length: gw * gh }, rnd);
    return (x, y) => {
      const px = x / scale, py = y / scale, ix = Math.floor(px), iy = Math.floor(py);
      const fx = smooth(px - ix), fy = smooth(py - iy), i = iy * gw + ix;
      const a = g[i] * (1 - fx) + g[i + 1] * fx, b = g[i + gw] * (1 - fx) + g[i + gw + 1] * fx;
      return a * (1 - fy) + b * fy;
    };
  }

  // ---- what got printed where (in dots, relative to the mask origin) ----------------------------
  function printedLines(print, ox, oy, dot) {
    const rects = [], range = document.createRange();
    const walker = document.createTreeWalker(print, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue;
      range.selectNodeContents(walker.currentNode);
      for (const r of range.getClientRects()) if (r.width > 0) rects.push(r);
    }
    print.querySelectorAll("img, .band").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width) rects.push(Object.assign({ solid: true }, r.toJSON()));
    });
    const full = print.clientWidth;
    const lines = [];
    for (const r of rects.sort((a, b) => a.top - b.top)) {
      const t = (r.top - oy) / dot, b = (r.bottom - oy) / dot;
      const last = lines[lines.length - 1];
      if (last && !r.solid && !last.solid && Math.abs(last.t - t) < 2) {
        last.l = Math.min(last.l, (r.left - ox) / dot); last.d += r.width / full;
        continue;
      }
      // a text line's content box is 24 dots per em; caps start 2/24 of it below the top
      const sc = (b - t) / 24;
      lines.push({ t, b, l: (r.left - ox) / dot, d: r.solid ? 1 : r.width / full, sc, cap: t + 2 * sc, solid: !!r.solid });
    }
    return lines;
  }

  // ---- the mask --------------------------------------------------------------------------------
  const urls = new WeakMap();
  function printMask(print, cfg, seed) {
    const fs = parseFloat(getComputedStyle(print).fontSize), dot = fs / 24, PAD = 4;
    const box = print.getBoundingClientRect();
    const cols = Math.ceil(box.width / dot) + 2 * PAD, rows = Math.ceil(box.height / dot) + 2 * PAD;
    const ox = box.left - PAD * dot, oy = box.top - PAD * dot;
    const rnd = prng(seed);

    // heating elements
    const col = new Float32Array(cols).fill(1), head = cfg.head || {};
    if (head.sigma) for (let x = 0; x < cols; x++) col[x] = 1 - Math.abs(gauss(rnd)) * head.sigma;
    const at = (f) => PAD + Math.round(f * (cols - 2 * PAD));
    for (const [f, g] of head.weak || []) col[at(f)] *= g;
    for (const f of head.dead || []) col[at(f)] = 0.05;
    if (cfg.fade) for (let x = 0; x < cols; x++) {
      const u = (x - PAD) / (cols - 2 * PAD);
      if (cfg.fade.right) col[x] *= 1 - cfg.fade.right * smooth(Math.min(1, Math.max(0, (u - 0.5) / 0.5)));
      if (cfg.fade.edges) col[x] *= 1 - cfg.fade.edges * Math.pow(Math.abs(u - 0.5) * 2, 3);
    }

    // paper feed / ribbon
    const row = new Float32Array(rows).fill(1);
    const along = cfg.feed || cfg.ribbon;
    if (along) {
      const n = noise1(rnd, rows, along.wave);
      for (let y = 0; y < rows; y++) row[y] *= 1 - along.amp * n[y];
    }
    if (cfg.feed && cfg.feed.bands) for (let i = 0; i < cfg.feed.bands; i++) {
      const y0 = Math.floor(rnd() * rows), h = 2 + Math.floor(rnd() * 4);
      for (let y = y0; y < Math.min(rows, y0 + h); y++) row[y] *= 1 - cfg.feed.band;
    }

    // per printed line: heat sag, cold start, feed skips, tired pin
    const lines = printedLines(print, ox, oy, dot);
    if (cfg.heat) for (const L of lines) {
      const sag = 1 - cfg.heat.density * Math.max(0, (L.d - 0.3) / 0.7);
      for (let y = Math.max(0, Math.floor(L.t)); y < Math.min(rows, Math.ceil(L.b)); y++) row[y] *= sag;
      const c0 = Math.round(L.cap);
      for (let y = c0; y < c0 + Math.round(2 * L.sc); y++) if (y >= 0 && y < rows) row[y] *= cfg.heat.cold;
    }
    if (cfg.skips) {
      const text = lines.filter((L) => !L.solid);
      for (let i = 0; i < cfg.skips && text.length; i++) {
        const L = text[Math.floor(rnd() * text.length)], y = Math.round(L.cap + (3 + rnd() * 10) * L.sc);
        if (y >= 0 && y < rows) row[y] *= 0.12;
      }
    }
    if (cfg.pin) for (const L of lines) {
      if (L.solid) continue;
      const y0 = Math.round(L.cap + cfg.pin.row * L.sc);
      for (let y = y0; y < y0 + Math.max(1, Math.round(L.sc)); y++) if (y >= 0 && y < rows) row[y] *= cfg.pin.gain;
    }
    const lineAt = new Int16Array(rows).fill(-1);
    lines.forEach((L, i) => { if (!L.solid) for (let y = Math.max(0, Math.floor(L.t)); y < Math.min(rows, Math.ceil(L.b)); y++) lineAt[y] = i; });
    const strikes = cfg.strike ? lines.map(() => new Map()) : null;

    const mottles = (cfg.mottle || []).map(([amp, scale]) => [amp, noise2(rnd, cols, rows, scale)]);
    const alpha = cfg.alpha ?? 1;
    const img = new ImageData(cols, rows), a = img.data;
    for (let y = 0; y < rows; y++) {
      const L = lineAt[y] >= 0 ? lines[lineAt[y]] : null;
      for (let x = 0; x < cols; x++) {
        let g = alpha * col[x] * row[y];
        for (const [amp, n] of mottles) g *= 1 - amp * n(x, y);
        if (cfg.speck && rnd() < cfg.speck) g *= 0.2;
        if (strikes && L) {
          const cell = Math.floor((x - L.l) / (12 * L.sc)), m = strikes[lineAt[y]];
          if (!m.has(cell)) m.set(cell, 1 - Math.abs(gauss(rnd)) * cfg.strike);
          g *= m.get(cell);
        }
        a[(y * cols + x) * 4 + 3] = Math.max(0, Math.min(255, g * 255));
      }
    }
    const cv = document.createElement("canvas");
    cv.width = cols; cv.height = rows;
    cv.getContext("2d").putImageData(img, 0, 0);
    cv.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const old = urls.get(print);
      // sized in em so the mask scales with the receipt without being recomputed
      const s = print.style, em = (n) => `${(n / 24).toFixed(4)}em`;
      s.maskImage = s.webkitMaskImage = `url(${url})`;
      s.maskSize = s.webkitMaskSize = `${em(cols)} ${em(rows)}`;
      s.maskPosition = s.webkitMaskPosition = `${em(-PAD)} ${em(-PAD)}`;
      s.maskRepeat = s.webkitMaskRepeat = "no-repeat";
      urls.set(print, url);
      if (old) setTimeout(() => URL.revokeObjectURL(old), 1000);
    });
  }

  // ---- filter: ragged edges + spread, tuned at the reference scale (1em = 30.54px) --------------
  const filter = document.getElementById("thermal");
  function tuneFilter() {
    const cfg = INKS[state.ink].filter;
    const k = parseFloat(getComputedStyle(document.querySelector(".desk")).fontSize) / 30.54;
    filter.querySelector("feTurbulence").setAttribute("baseFrequency", (0.9 / k).toFixed(3));
    filter.querySelector("feDisplacementMap").setAttribute("scale", (cfg.ragged * k).toFixed(3));
    filter.querySelector("feGaussianBlur").setAttribute("stdDeviation", (cfg.blur * k).toFixed(3));
    filter.querySelector("feFuncA").setAttribute("slope", cfg.slope);
  }

  // ---- fit: the receipt always shows whole, at reference size when the screen allows -----------
  const desk = document.querySelector(".desk"), main = document.querySelector(".receipt");
  function fit() {
    const mv = Math.max(20, innerHeight * 0.045), mh = 16;
    const cur = parseFloat(getComputedStyle(desk).fontSize);
    const hEm = main.offsetHeight / cur, wEm = main.offsetWidth / cur;
    const fs = Math.max(8, Math.min(26.1, (innerHeight - 2 * mv) / hEm, (innerWidth - 2 * mh) / wEm));
    root.style.setProperty("--fs", `${fs.toFixed(3)}px`);
    tuneFilter();
  }

  // ---- apply -----------------------------------------------------------------------------------
  const prints = () => [...document.querySelectorAll(".print")];
  function apply() {
    root.dataset.ink = state.ink;
    root.dataset.head = state.head;
    root.dataset.paper = state.paper;
    const paper = PAPERS[state.paper];
    root.style.setProperty("--ink", INKS[state.ink].ink);
    root.style.setProperty("--black", paper.bg);
    document.querySelector('meta[name="theme-color"]').content = paper.bg;
    fit();
    prints().forEach((p, i) => printMask(p, INKS[state.ink], 1000 * (i + 1) + Number(state.ink)));
    syncPanel();
  }

  // ---- review panel (?lab) ---------------------------------------------------------------------
  const panel = document.querySelector(".lab");
  function syncPanel() {
    if (!panel) return;
    panel.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.value === state[b.name]));
    panel.querySelector("[data-ink-name]").textContent = INKS[state.ink].name;
    panel.querySelector("[data-head-name]").textContent = HEADS[state.head];
    panel.querySelector("[data-paper-name]").textContent = PAPERS[state.paper].name;
  }
  function set(key, value) {
    state[key] = value;
    const q = new URLSearchParams(location.search);
    q.set(key, value);
    history.replaceState(null, "", `?${q}`);
    apply();
  }
  if (panel && params.has("lab")) {
    panel.hidden = false;
    panel.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set(b.name, b.value); });
    addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (INKS[e.key]) set("ink", e.key);
      else if (HEADS[e.key.toLowerCase()]) set("head", e.key.toLowerCase());
      else if (PAPERS[e.key.toLowerCase()]) set("paper", e.key.toLowerCase());
    });
  }

  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fit, 80); });
  document.fonts.ready.then(apply);
})();
