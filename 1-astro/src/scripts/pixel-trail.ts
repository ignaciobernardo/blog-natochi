import { pixelTrailDefaults, type PixelTrailSettings, type PixelTrailPalette } from './pixel-trail-config';

type Point = { x: number; y: number };
type Tone = 'light' | 'middle' | 'shade';
type Tile = Point & { born: number; color: string; main: boolean; weight: number; familyIndex: number; tone: Tone };
type Burst = Point & { born: number; phase: number };
type VisibleBlock = Point & { born: number; color: string; alpha: number; weight: number };
type Settings = Partial<PixelTrailSettings> & { palette?: PixelTrailPalette; rounded?: boolean };

// Keep each family together: shadows are actual palette colors, not black overlays.
const palettes = { original: [
  { light: '#18D392', middle: '#18D392', shade: '#237B9F', span: 3 },
  { light: '#00F701', middle: '#05D306', shade: '#08A10B', span: 5 },
  { light: '#FFCC01', middle: '#F2C103', shade: '#A4840D', span: 5 },
  { light: '#FA4EDE', middle: '#FA4EDE', shade: '#A23A91', span: 5 },
], violet: [
  { light: '#EBEFF2', middle: '#CFD8DC', shade: '#CFD8DC', span: 3 },
  { light: '#CFD8DC', middle: '#EBEFF2', shade: '#BFABFE', span: 5 },
  { light: '#BFABFE', middle: '#BFABFE', shade: '#7D4DFA', span: 5 },
  { light: '#7D4DFA', middle: '#BFABFE', shade: '#7D4DFA', span: 5 },
] };

class PixelTrail extends HTMLElement {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private tiles = new Map<string, Tile>();
  private bursts: Burst[] = [];
  private previous: Point | null = null;
  private step = 0;
  private frame = 0;
  private width = 0;
  private height = 0;
  private size = pixelTrailDefaults.size;
  private duration = pixelTrailDefaults.duration;
  private branches = pixelTrailDefaults.branches;
  private maxBlocks = pixelTrailDefaults.maxBlocks;
  private dots = false;
  private numbers = false;
  private rounded = false;
  private palette: PixelTrailPalette = 'original';
  private get families() { return palettes[this.palette]; }
  private previewing = false;
  private backgroundRGB = [27, 27, 27];
  private events?: AbortController;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  connectedCallback() {
    this.canvas = this.querySelector('canvas')!;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.dots = this.dataset.variant === 'dots';
    this.numbers = this.dataset.variant === 'numbers';
    this.rounded = this.dataset.rounded === 'true';
    this.palette = this.dataset.palette === 'violet' ? 'violet' : 'original';
    const background = this.dataset.background?.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if (background) this.backgroundRGB = background.slice(1).map(channel => parseInt(channel, 16));
    this.size = Math.max(16, Number(this.dataset.size) || pixelTrailDefaults.size);
    this.duration = Math.max(500, Number(this.dataset.duration) || pixelTrailDefaults.duration);
    this.branches = Math.min(1, Math.max(0, Number(this.dataset.branches ?? pixelTrailDefaults.branches)));
    this.maxBlocks = Math.max(10, Math.min(300, Math.round(Number(this.dataset.maxBlocks) || pixelTrailDefaults.maxBlocks)));
    this.events = new AbortController();
    const options = { signal: this.events.signal };
    window.addEventListener('pointermove', this.pointer, { ...options, passive: true });
    window.addEventListener('pointerdown', this.pointer, { ...options, passive: true });
    window.addEventListener('click', this.explode, options);
    window.addEventListener('resize', this.resize, options);
    window.addEventListener('blur', this.resetPointer, options);
    document.documentElement.addEventListener('pointerleave', this.resetPointer, options);
    window.addEventListener('pointerup', (event) => {
      if (event.pointerType === 'touch') this.resetPointer();
    }, options);
    window.addEventListener('pointercancel', this.resetPointer, options);
    document.addEventListener('visibilitychange', this.clear, options);
    this.reduced.addEventListener('change', this.clear, options);
    window.addEventListener('pixel-trail:settings', this.settings as EventListener, options);
    window.addEventListener('pixel-trail:clear', this.clear, options);
    window.addEventListener('pixel-trail:demo', this.demo, options);
    this.resize();
    if (this.dataset.preview === 'true') this.showPreview();
  }

  disconnectedCallback() {
    this.events?.abort();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.tiles.clear();
    this.bursts = [];
  }

  private resetPointer = () => { this.previous = null; };

  private resize = () => {
    const restorePreview = this.previewing;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.clear();
    if (restorePreview) this.showPreview();
  };

  private settings = (event: CustomEvent<Settings>) => {
    const { size, duration, branches, maxBlocks, palette, rounded } = event.detail;
    if (rounded !== undefined) {
      this.rounded = rounded;
      this.dataset.rounded = String(rounded);
    }
    if (palette === 'original' || palette === 'violet') {
      this.palette = palette;
      this.dataset.palette = palette;
      for (const tile of this.tiles.values()) tile.color = this.families[tile.familyIndex]![tile.tone];
    }
    if ((palette !== undefined || rounded !== undefined) && size === undefined && duration === undefined && branches === undefined && maxBlocks === undefined) {
      cancelAnimationFrame(this.frame);
      this.draw(performance.now());
      return;
    }
    if (size !== undefined) this.size = Math.max(16, Math.min(96, size));
    if (duration !== undefined) this.duration = Math.max(500, Math.min(12000, duration));
    if (branches !== undefined) this.branches = Math.max(0, Math.min(1, branches));
    if (maxBlocks !== undefined) {
      this.maxBlocks = Math.max(10, Math.min(300, Math.round(maxBlocks)));
      this.trimTiles();
      if (size === undefined && duration === undefined && branches === undefined) {
        cancelAnimationFrame(this.frame);
        this.draw(performance.now());
        return;
      }
    }
    this.clear();
  };

  private clear = () => {
    this.previewing = false;
    this.tiles.clear();
    this.bursts = [];
    this.previous = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.draw(performance.now());
  };

  private pointer = (event: PointerEvent) => {
    if ((event.target as Element)?.closest('[data-trail-controls]') || document.hidden) {
      this.resetPointer();
      return;
    }
    if (this.previewing) this.clear();
    this.trace({ x: Math.floor(event.clientX / this.size), y: Math.floor(event.clientY / this.size) });
  };

  private explode = (event: MouseEvent) => {
    if (event.button !== 0 || event.detail === 0 || document.hidden ||
      (event.target as Element)?.closest('[data-trail-controls], a, button, input, select, textarea')) return;
    if (this.previewing) this.clear();
    this.bursts.push({ x: event.clientX, y: event.clientY, born: performance.now(), phase: Math.random() * Math.PI * 2 });
    // Bound work even during rapid clicking. Bursts have their own short lifetime.
    if (this.bursts.length > 12) this.bursts.shift();
    if (!this.frame) this.frame = requestAnimationFrame(this.draw);
  };

  private collectBursts(now: number, blocks: Map<string, VisibleBlock>) {
    this.bursts = this.bursts.filter(burst => now - burst.born < 600);
    for (const burst of this.bursts) {
      const elapsed = now - burst.born;
      const radius = this.size * (this.reduced.matches ? 1.5 : 4);
      const cx = Math.floor(burst.x / this.size);
      const cy = Math.floor(burst.y / this.size);
      for (let y = cy - 4; y <= cy + 4; y++) {
        for (let x = cx - 4; x <= cx + 4; x++) {
          if (x < 0 || y < 0 || x * this.size >= this.width || y * this.size >= this.height) continue;
          const dx = (x + 0.5) * this.size - burst.x;
          const dy = (y + 0.5) * this.size - burst.y;
          const distance = Math.hypot(dx, dy);
          if (distance > radius) continue;
          // Activate successive circles of grid cells, then rapidly dissolve each one.
          const delay = this.reduced.matches ? 0 : distance / radius * 240;
          const age = (elapsed - delay) / 340;
          if (age < 0 || age >= 1) continue;
          const angle = (Math.atan2(dy, dx) + Math.PI + burst.phase) % (Math.PI * 2);
          const family = this.families[Math.floor(angle / (Math.PI * 2) * this.families.length)]!;
          const shade = Math.abs(x * 13 + y * 7) % 5;
          const key = `${x},${y}`;
          const born = burst.born + delay;
          if ((blocks.get(key)?.born ?? -Infinity) > born) continue;
          // Seeded per burst/cell so opacity never flickers between animation frames.
          const seed = Math.sin(x * 12.9898 + y * 78.233 + burst.phase * 37.719) * 43758.5453;
          const random = seed - Math.floor(seed);
          const weight = this.numbers ? (1 + Math.floor(random * 10)) / 10 : this.dots ? (1 + Math.floor(random * 100)) / 100 : 1;
          blocks.set(key, {
            x, y, born, weight,
            color: shade === 0 ? family.shade : shade === 1 ? family.middle : family.light,
            alpha: weight * (this.reduced.matches ? 1 : Math.min(1, age * 12) * Math.pow(1 - age, 0.7)),
          });
        }
      }
    }
  }

  private trace(target: Point) {
    if (this.previous?.x === target.x && this.previous?.y === target.y) return;
    const now = performance.now();
    if (!this.previous) {
      this.stamp(target, { x: 1, y: 0 }, now);
    } else {
      // Walk grid boundaries in order. Every step shares a side, including diagonals.
      let { x, y } = this.previous;
      const dx = target.x - x;
      const dy = target.y - y;
      const nx = Math.abs(dx);
      const ny = Math.abs(dy);
      let ix = 0;
      let iy = 0;
      while (ix < nx || iy < ny) {
        const horizontal = iy >= ny || (ix < nx && (ix + 0.5) / nx < (iy + 0.5) / ny);
        const direction = horizontal ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
        x += direction.x;
        y += direction.y;
        if (horizontal) ix++; else iy++;
        this.stamp({ x, y }, direction, now);
      }
    }
    this.previous = target;
    if (!this.frame) this.frame = requestAnimationFrame(this.draw);
  }

  private stamp(point: Point, direction: Point, now: number) {
    let index = this.step++ % 18;
    const familyIndex = this.families.findIndex((family) => {
      if (index < family.span) return true;
      index -= family.span;
      return false;
    });
    this.put(point, familyIndex, Math.random() < 0.23 ? 'middle' : 'light', true, now);
    // Only the cursor path generates branches; branches never generate other branches.
    for (const side of [-1, 1]) {
      if (Math.random() > this.branches * 0.65) continue;
      const neighbor = { x: point.x - direction.y * side, y: point.y + direction.x * side };
      const tone = Math.random() < 0.27 ? 'light' : 'shade';
      this.put(neighbor, familyIndex, tone, false, now);
    }
  }

  private put(point: Point, familyIndex: number, tone: Tone, main: boolean, born: number) {
    if (point.x < 0 || point.y < 0 || point.x * this.size >= this.width || point.y * this.size >= this.height) return;
    const key = `${point.x},${point.y}`;
    const existing = this.tiles.get(key);
    if (!main && existing?.main) return;
    // Updating a cell makes it the newest entry in insertion order.
    this.tiles.delete(key);
    const weight = existing?.weight ?? (this.numbers ? (1 + Math.floor(Math.random() * 10)) / 10 : this.dots ? (1 + Math.floor(Math.random() * 100)) / 100 : 1);
    const color = this.families[familyIndex]![tone];
    this.tiles.set(key, { ...point, color, main, born, weight, familyIndex, tone });
    this.trimTiles();
  }

  private trimTiles() {
    while (this.tiles.size > this.maxBlocks) {
      this.tiles.delete(this.tiles.keys().next().value!);
    }
  }

  private draw = (now: number) => {
    this.frame = 0;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (this.dataset.grid !== 'false') {
      for (let y = 0; y < this.height; y += this.size) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(this.width, y + 0.5);
      }
    }
    ctx.stroke();
    const blocks = new Map<string, VisibleBlock>();
    for (const [key, tile] of this.tiles) {
      const age = this.previewing ? 0 : (now - tile.born) / this.duration;
      if (age >= 1) { this.tiles.delete(key); continue; }
      // Reduced motion keeps the response immediate and removes the fading animation.
      blocks.set(key, { ...tile, alpha: tile.weight * (this.reduced.matches ? 1 : 1 - Math.pow(Math.max(0, (age - 0.45) / 0.55), 2)) });
    }
    this.collectBursts(now, blocks);
    // One shared budget for trail, branches and all explosions; count overlapping cells once.
    const visible = [...blocks.entries()].reverse().sort((a, b) => b[1].born - a[1].born).slice(0, this.maxBlocks);
    const retained = new Set(visible.map(([key]) => key));
    for (const key of this.tiles.keys()) {
      if (!retained.has(key)) this.tiles.delete(key);
    }
    for (const [, block] of visible) {
      ctx.globalAlpha = block.alpha;
      ctx.fillStyle = block.color;
      ctx.beginPath();
      if (this.dots) {
        ctx.arc((block.x + 0.5) * this.size, (block.y + 0.5) * this.size, this.size * 0.38, 0, Math.PI * 2);
      } else if (!this.numbers && this.rounded) {
        // Original block radius; numeric pixels always retain square corners.
        ctx.roundRect(block.x * this.size, block.y * this.size, this.size, this.size, this.size * 0.13);
      } else {
        ctx.rect(block.x * this.size, block.y * this.size, this.size, this.size);
      }
      ctx.fill();
      if (this.numbers) {
        // Contrast against the actual composited cell; labels keep the weight readable.
        const rgb = [1, 3, 5].map(offset => parseInt(block.color.slice(offset, offset + 2), 16));
        const blended = rgb.map((channel, i) => channel * block.alpha + this.backgroundRGB[i]! * (1 - block.alpha));
        const brightness = blended[0]! * 0.299 + blended[1]! * 0.587 + blended[2]! * 0.114;
        ctx.fillStyle = brightness > 145 ? '#1B1B1B' : '#FFFFFF';
        ctx.globalAlpha = Math.min(1, block.alpha / block.weight) * 0.85;
        ctx.font = `500 ${Math.max(9, this.size * 0.33)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(block.weight.toFixed(1), (block.x + 0.5) * this.size, (block.y + 0.5) * this.size);
      }
    }
    ctx.globalAlpha = 1;
    if ((this.tiles.size || this.bursts.length) && !document.hidden && !this.previewing) this.frame = requestAnimationFrame(this.draw);
  };

  private showPreview() {
    this.demo();
    cancelAnimationFrame(this.frame);
    this.previewing = true;
    this.draw(performance.now());
  }

  private demo = () => {
    this.clear();
    this.step = 0;
    const columns = Math.floor(this.width / this.size);
    const row = Math.floor(this.height * (this.dataset.preview === 'true' ? 0.77 : 0.52) / this.size);
    const start = this.dataset.preview === 'true' ? Math.max(1, Math.floor(columns / 2) - 14) : 1;
    const end = this.dataset.preview === 'true' ? Math.min(columns - 1, start + 28) : columns - 1;
    for (let x = start; x < end; x++) {
      this.trace({ x, y: row + Math.round(Math.sin(x * 0.65)) });
    }
    this.resetPointer();
  };
}

if (!customElements.get('pixel-trail')) customElements.define('pixel-trail', PixelTrail);
