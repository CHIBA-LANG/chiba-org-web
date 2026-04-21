// Halftone typography — random-anchor + scatter-on-impact edition.
// - Matrix katakana rain in the back.
// - Each new word slams in (slide / drop / explode / implode / glitch / zoom)
//   at a random anchor on the canvas (not always center).
// - When the new word lands, the previously-settled dots are torn off the
//   surface, given outward velocity from the new anchor, and fade out as
//   short-lived particles.

const STREAM = ['CHIBA', 'PARSE', 'TYPER', 'SSA', 'ASM', 'ATP', '尺八', 'EMIT', 'LINK', 'BOOT',
    '编译', '验证', '定理', '证明', '无GC', '无libc', '零运行时', 'Metal', 'Functional', 'Zero', 'Runtime', '安全', '可靠', '高性能', '优雅',
    // japanese
    'コンパイラ', '検証', '定理', '証明', 'GCなし', 'libcなし', 'ゼロランタイム', 'メタル', '関数型', '安全', '信頼性', '高性能', 'エレガント',
    // russian
    'компилятор', 'верификация', 'теорема', 'доказательство', 'безGC', 'безlibc', 'нулеваясредаисполнения', 'металл', 'функциональный', 'безопасный', 'надежный', 'высокаяпроизводительность', 'элегантный',
];
const STAGE_DURATION = 500; // ms total per word
const ENTRY_DURATION = 220;  // ms violent entry portion
const GRID_STEP = 2;
const MAX_RADIUS = 2.6;
const SCATTER_LIFE = 1700;   // ms scattered particles take to die

const DOT_COLOR = '#e8e8ee';
const DOT_COLOR_LIGHT = '#111114';
const ACCENT = '#00e676';
const RAIN_COLOR = '#00ff66';
const RAIN_HEAD = '#bbffc8';

const ENTRIES = [
  'left', 'right', 'top', 'bottom',
  'explode', 'implode', 'glitch', 'zoom',
] as const;
type Entry = typeof ENTRIES[number];

const KATAKANA =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
  '你我他她它的了在是我有和就不人都一一个上也很到说要去吗没看好像还这那吗吧呢啊哦恩哇嘿哈' +
  'АВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' +
  '0123456789ABCDEF<>/_=+*#@';

interface Dot { x: number; y: number; r: number; lum: number; accent: boolean; }
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; accent: boolean;
  life: number; // ms remaining
  ttl: number;  // total ms
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t: number): number {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeOutBounce(t: number): number {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
  if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
  t -= 2.625 / d1; return n1 * t * t + 0.984375;
}

function fit(canvas: HTMLCanvasElement): { w: number; h: number; dpr: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h, dpr };
}

function makeOffscreen(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.floor(w));
  c.height = Math.max(1, Math.floor(h));
  return c;
}

function isLightTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

// Sample a word into halftone dots, anchored at (ax, ay) with given size hint.
function sampleWord(word: string, ax: number, ay: number, w: number, h: number, scale: number): Dot[] {
  const off = makeOffscreen(w, h);
  const oc = off.getContext('2d')!;
  oc.fillStyle = '#000';
  oc.fillRect(0, 0, w, h);
  oc.fillStyle = '#fff';
  oc.textAlign = 'center';
  oc.textBaseline = 'middle';
  let size = h * 0.55 * scale;
  oc.font = `900 ${size}px "IBM Plex Sans", system-ui, sans-serif`;
  const targetW = w * 0.78 * scale;
  const measured = oc.measureText(word).width;
  if (measured > targetW) {
    size *= targetW / measured;
    oc.font = `900 ${size}px "IBM Plex Sans", system-ui, sans-serif`;
  }
  oc.fillText(word, ax, ay);

  const data = oc.getImageData(0, 0, w, h).data;
  const dots: Dot[] = [];
    const step = GRID_STEP + Math.random() * 2;
  for (let y = step * 0.5; y < h; y += step) {
    const xoff = (Math.floor(y / step) % 2 === 0) ? 0 : step * 0.5;
    for (let x = step * 0.5 + xoff; x < w; x += step) {
      const sx = Math.floor(x), sy = Math.floor(y);
      const i = (sy * w + sx) * 4;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
      if (lum < 0.2) continue;
      const r = Math.min(MAX_RADIUS, lum * MAX_RADIUS * 1.2);
      const accent = (Math.sin(x * 0.013 + y * 0.011) > 0.7);
      dots.push({ x, y, r, lum, accent });
    }
  }
  return dots;
}

function dotPos(
  d: Dot, p: number, entry: Entry, t: number,
  cx: number, cy: number, w: number, h: number,
): { x: number; y: number; a: number; r: number } {
  let dx = d.x, dy = d.y, a = 1, r = d.r;
  const e = easeOutCubic(p);
  const eb = easeOutBack(p);
  switch (entry) {
    case 'left':
      dx = -120 + (d.x - (-120)) * eb;
      a = Math.min(1, p * 1.4);
      break;
    case 'right':
      dx = (w + 120) + (d.x - (w + 120)) * eb;
      a = Math.min(1, p * 1.4);
      break;
    case 'top':
      dy = -180 + (d.y - (-180)) * easeOutBounce(p);
      a = Math.min(1, p * 1.6);
      break;
    case 'bottom':
      dy = (h + 180) + (d.y - (h + 180)) * eb;
      a = Math.min(1, p * 1.4);
      break;
    case 'explode': {
      const ang = Math.atan2(d.y - cy, d.x - cx) || (d.x - cx) * 0.001;
      const dist = (1 - e) * Math.max(w, h) * 0.85;
      dx = d.x - Math.cos(ang) * dist;
      dy = d.y - Math.sin(ang) * dist;
      a = p;
      r = d.r * (0.3 + e * 0.7);
      break;
    }
    case 'implode': {
      const seed = d.x * 0.31 + d.y * 0.17;
      const ang = Math.atan2(d.y - cy, d.x - cx) + (1 - p) * (Math.sin(seed) * 0.6);
      const dist = (1 - e) * Math.max(w, h) * 1.05;
      dx = d.x + Math.cos(ang) * dist;
      dy = d.y + Math.sin(ang) * dist;
      a = p;
      break;
    }
    case 'glitch': {
      const seed = d.x * 0.31 + d.y * 0.17 + Math.floor(t / 36);
      const k = (1 - p);
      dx = d.x + Math.sin(seed) * 70 * k;
      dy = d.y + Math.cos(seed * 1.3) * 40 * k;
      a = 0.35 + p * 0.65;
      break;
    }
    case 'zoom': {
      const k = 1 + (1 - e) * 3.2;
      dx = cx + (d.x - cx) * k;
      dy = cy + (d.y - cy) * k;
      r = d.r * (0.5 + e * 0.5);
      a = p;
      break;
    }
  }
  return { x: dx, y: dy, a, r };
}

export function boot(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let raf = 0;
  let running = true;
  let lastT = 0;

  // matrix rain layer
  const RAIN_FONT = 13;
  let rain = makeOffscreen(1, 1);
  let rainCtx = rain.getContext('2d')!;
  let drops: number[] = [];

  // active stage
  let stageIdx = -1;
  let stageStart = 0;
  let entry: Entry = 'left';
  let restDots: Dot[] = [];
  let settled: Dot[] = [];   // last word still on canvas
  let scattered: Particle[] = [];
  let stamped = false;
  let anchorX = 0, anchorY = 0;
  let scale = 1;

  function pickAnchor(): void {
    // word width can be up to ~80% canvas, keep anchor inside safe band
    const padX = w * 0.22;
    const padY = h * 0.32;
    anchorX = padX + Math.random() * (w - padX * 2);
    anchorY = padY + Math.random() * (h - padY * 2);
    scale = 0.65 + Math.random() * 0.55; // 0.65 ~ 1.2
  }

  function resize(): void {
    const dims = fit(canvas);
    w = dims.w; h = dims.h;
    rain = makeOffscreen(w, h);
    rainCtx = rain.getContext('2d')!;
    rainCtx.fillStyle = '#000';
    rainCtx.fillRect(0, 0, w, h);
    const cols = Math.max(1, Math.floor(w / RAIN_FONT));
    drops = new Array(cols).fill(0).map(() => Math.random() * (h / RAIN_FONT));
    if (stageIdx >= 0) {
      pickAnchor();
      restDots = sampleWord(STREAM[stageIdx], anchorX, anchorY, w, h, scale);
    }
  }

  function scatterFrom(prev: Dot[], ax: number, ay: number): Particle[] {
    const out: Particle[] = [];
    for (const d of prev) {
      if (Math.random() > 0.72) continue;

      const dxp = d.x - ax;
      const dyp = d.y - ay;
      const dist = Math.hypot(dxp, dyp) || 1;
      // outward push, stronger if close to anchor
      const force = 220 + 320 / Math.max(0.3, dist / Math.max(w, h));
      const jitter = 0.55;
      const ang = Math.atan2(dyp, dxp) + (Math.random() - 0.5) * jitter;
      const speed = force * (0.4 + Math.random() * 0.7);
      out.push({
        x: d.x, y: d.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 60, // tiny upward bias
        r: d.r,
        accent: d.accent,
        life: SCATTER_LIFE * (0.7 + Math.random() * 0.6),
        ttl: SCATTER_LIFE,
      });
    }
    return out;
  }

  function ensureStage(time: number): void {
    const idx = Math.floor(time / STAGE_DURATION) % STREAM.length;
    if (idx !== stageIdx) {
      stageIdx = idx;
      stageStart = Math.floor(time / STAGE_DURATION) * STAGE_DURATION;
      pickAnchor();
      restDots = sampleWord(STREAM[idx], anchorX, anchorY, w, h, scale);
      entry = ENTRIES[Math.floor(Math.random() * ENTRIES.length)];
      stamped = false;
    }
  }

  function paintRain(): void {
    rainCtx.fillStyle = isLightTheme() ? 'rgba(255,255,255,0.16)' : 'rgba(7,7,10,0.10)';
    rainCtx.fillRect(0, 0, w, h);
    rainCtx.font = `${RAIN_FONT}px "IBM Plex Mono", monospace`;
    rainCtx.textBaseline = 'top';
    for (let i = 0; i < drops.length; i++) {
      const ch = KATAKANA[Math.floor(Math.random() * KATAKANA.length)];
      const x = i * RAIN_FONT;
      const y = drops[i] * RAIN_FONT;
      rainCtx.fillStyle = Math.random() > 0.965 ? RAIN_HEAD : RAIN_COLOR;
      rainCtx.fillText(ch, x, y);
      if (y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  function paintSettled(): void {
    const dotColor = isLightTheme() ? DOT_COLOR_LIGHT : DOT_COLOR;
    for (const d of settled) {
      ctx.fillStyle = d.accent ? ACCENT : dotColor;
      ctx.globalAlpha = 0.55 + d.lum * 0.45;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paintScattered(dt: number): void {
    const dotColor = isLightTheme() ? DOT_COLOR_LIGHT : DOT_COLOR;
    const friction = Math.pow(0.985, dt / 16.6);
    const next: Particle[] = [];
    for (const p of scattered) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vx *= friction;
      p.vy *= friction;
      p.vy += 18 * (dt / 1000); // gentle gravity
      p.x += p.vx * (dt / 1000);
      p.y += p.vy * (dt / 1000);
      const a = Math.max(0, p.life / p.ttl);
      ctx.fillStyle = p.accent ? ACCENT : dotColor;
      ctx.globalAlpha = a * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.4), 0, Math.PI * 2);
      ctx.fill();
      next.push(p);
    }
    ctx.globalAlpha = 1;
    scattered = next;
  }

  function paintHud(time: number): void {
    const word = STREAM[stageIdx] ?? '';
    ctx.save();
    // ctx.font = '500 11px "IBM Plex Mono", monospace';
    // ctx.textBaseline = 'top';
    // ctx.fillStyle = '#9a9aa3';
    // ctx.fillText('stage:', 14, 18);
    // ctx.fillStyle = ACCENT;
    // ctx.fillText(word.toLowerCase(), 60, 18);
    // ctx.fillStyle = '#9a9aa3';
    // ctx.fillText('entry:', 14, 36);
    // ctx.fillStyle = '#e8e8ee';
    // ctx.fillText(entry, 60, 36);
    // ctx.fillStyle = '#9a9aa3';
    // ctx.fillText('halftone / 7px / scatter', 14, h - 26);
    // ctx.fillStyle = '#3a3a44';
    ctx.fillText(
      'rain ' + ((Math.sin(time * 0.001) * 0.5 + 0.5) * 100).toFixed(1) + '%',
      w - 110,
      h - 26,
    );
    ctx.restore();
  }

  function frame(time: number): void {
    if (!running) { lastT = time; return; }
    const dt = lastT === 0 ? 16.6 : Math.min(64, time - lastT);
    const dotColor = isLightTheme() ? DOT_COLOR_LIGHT : DOT_COLOR;
    lastT = time;
    ensureStage(time);
    paintRain();

    // transparent base
    ctx.clearRect(0, 0, w, h);

    // matrix bg
    ctx.globalAlpha = 0.55;
    ctx.drawImage(rain, 0, 0, w, h);
    ctx.globalAlpha = 1;

    // settled dots from previous landing (until impact)
    paintSettled();

    // scattered particles flying away & fading
    paintScattered(dt);

    // current word entering
    const local = time - stageStart;
    const p = Math.min(1, local / ENTRY_DURATION);
    for (const d of restDots) {
      const t = dotPos(d, p, entry, time, anchorX, anchorY, w, h);
      if (t.a <= 0.01) continue;
      ctx.fillStyle = d.accent ? ACCENT : dotColor;
      ctx.globalAlpha = t.a * (0.45 + d.lum * 0.55);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // impact: scatter the previous settled set, then become the new settled
    if (!stamped && p >= 1) {
      stamped = true;
      if (settled.length > 0) {
        scattered = scattered.concat(scatterFrom(settled, anchorX, anchorY));
      }
      settled = restDots;
    }

    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    paintHud(time);
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  resize();

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !running) {
        running = true;
        lastT = 0;
        raf = requestAnimationFrame(frame);
      } else if (!e.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }
  });
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      lastT = 0;
      raf = requestAnimationFrame(frame);
    }
  });


  raf = requestAnimationFrame(frame);
}
