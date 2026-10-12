// "The line that becomes a story" — deterministic stage for the Wear Your Batik brand film.
// window.renderAt(t) draws the exact frame for time t (seconds). Nothing here is random at render time.
// Sources: the app's own vector artwork (assets/generated), real app captures (assets/app, assets/three).
import { TL } from './timeline.mjs';
import { createCloth, PANEL_W, PANEL_H } from './cloth3d.js';

const qs = new URLSearchParams(location.search);
const W = Number(qs.get('w')) || 1080, H = Number(qs.get('h')) || 1920;
const SUBS = qs.get('subs') === '1';
const A = '../assets/';
const NS = 'http://www.w3.org/2000/svg';
const json = async p => (await fetch(p)).json();
const M = await json(A + 'generated/manifest.json');
const CAP = await json(A + 'app/capture.json');
const CAP3 = await json(A + 'three/capture.json');
let NARR = null;
try { NARR = await json(A + (qs.get('voice') || 'voice') + '/narration.json'); } catch { NARR = null; }

// ───────────── helpers ─────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, [a, b]) => clamp((t - a) / (b - a));
const E = {
  inOut: u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2,
  sine: u => .5 - .5 * Math.cos(Math.PI * u),
  out: u => 1 - (1 - u) ** 3,
  out2: u => 1 - (1 - u) ** 2,
  in: u => u * u * u,
  quint: u => u < .5 ? 16 * u ** 5 : 1 - (-2 * u + 2) ** 5 / 2,
  expoOut: u => u >= 1 ? 1 : 1 - 2 ** (-9 * u),
};
const LOG_KEYS = new Set(['s', 'z', 'zoom', 'dist']);
function mix(a, b, u) {
  if (typeof a === 'number') return lerp(a, b, u);
  const o = {};
  for (const k in a) o[k] = LOG_KEYS.has(k) ? Math.exp(lerp(Math.log(a[k]), Math.log(b[k]), u)) : lerp(a[k], b[k] ?? a[k], u);
  return o;
}
// Keyframe track: [[time, value], ...] eased between keys.
const track = (keys, e = E.inOut) => t => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
    return mix(v0, v1, (keys[i][2] || e)((t - t0) / (t1 - t0)));
  }
  return keys.at(-1)[1];
};
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent?.appendChild(n); return n; };
const div = (cls, parent, html = '') => { const n = document.createElement('div'); if (cls) n.className = cls; n.innerHTML = html; parent?.appendChild(n); return n; };
const show = (node, o) => { node.style.opacity = o; node.style.visibility = o > .001 ? 'visible' : 'hidden'; };
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const parseSvg = s => new DOMParser().parseFromString(`<svg xmlns="${NS}">${s}</svg>`, 'image/svg+xml').documentElement;

const root = document.getElementById('root');
root.style.width = W + 'px'; root.style.height = H + 'px';
const $ = id => document.getElementById(id);
for (const c of ['weave', 'weaveTop', 'grain', 'gl']) { $(c).width = W; $(c).height = H; }
for (const s of ['art', 'cloth', 'rosette', 'emblem', 'orbits']) { $(s).setAttribute('viewBox', `0 0 ${W} ${H}`); $(s).setAttribute('width', W); $(s).setAttribute('height', H); }
const portrait = H > W;
const U = Math.min(W, H) / 1080; // type scale unit

// ───────────── woven cloth texture ─────────────
// A 32-thread plain weave tile with slight per-thread irregularity (deterministic).
function makeWeaveTile(light) {
  const T = 512, n = 32, p = T / n, c = document.createElement('canvas'); c.width = c.height = T;
  const g = c.getContext('2d');
  let seed = light ? 7 : 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const warp = Array.from({ length: n }, () => .75 + rnd() * .5), weft = Array.from({ length: n }, () => .75 + rnd() * .5);
  g.fillStyle = light ? '#808080' : '#0a1526'; g.fillRect(0, 0, T, T);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const over = (i + j) % 2 === 0, x = i * p, y = j * p;
    const k = over ? warp[i] : weft[j];
    const grad = over ? g.createLinearGradient(x, 0, x + p, 0) : g.createLinearGradient(0, y, 0, y + p);
    if (light) { grad.addColorStop(0, 'rgba(70,70,70,1)'); grad.addColorStop(.5, `rgba(${150 + 40 * k},${150 + 40 * k},${150 + 40 * k},1)`); grad.addColorStop(1, 'rgba(70,70,70,1)'); }
    else { grad.addColorStop(0, 'rgba(18,34,60,0)'); grad.addColorStop(.5, `rgba(${34 * k + 10},${56 * k + 12},${92 * k + 14},.95)`); grad.addColorStop(1, 'rgba(18,34,60,0)'); }
    g.fillStyle = grad;
    g.beginPath();
    if (over) g.roundRect(x + p * .1, y - p * .15, p * .8, p * 1.3, p * .4); else g.roundRect(x - p * .15, y + p * .1, p * 1.3, p * .8, p * .4);
    g.fill();
  }
  return c;
}
const weaveDark = makeWeaveTile(false), weaveLight = makeWeaveTile(true);
const weaveCtx = $('weave').getContext('2d'), weaveTopCtx = $('weaveTop').getContext('2d');
function drawWeave(ctx, tile, pitchPx, angle, ox, oy, alpha, base) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (base) { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); }
  if (alpha <= 0) return;
  const pat = ctx.createPattern(tile, 'repeat');
  const k = pitchPx / (512 / 32);
  pat.setTransform(new DOMMatrix().translate(ox, oy).rotate(angle).scale(k));
  ctx.globalAlpha = alpha; ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
}

// ───────────── grain + vignette ─────────────
const grainTiles = [0, 1, 2, 3].map(s => {
  const c = document.createElement('canvas'); c.width = 360; c.height = 640; const g = c.getContext('2d');
  const d = g.createImageData(360, 640); let seed = 11 + s * 977;
  for (let i = 0; i < d.data.length; i += 4) { seed = (seed * 16807) % 2147483647; const v = seed / 2147483647 * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
});
const grainCtx = $('grain').getContext('2d');
$('grain').style.mixBlendMode = 'overlay';
function drawGrain(frame, amount) {
  grainCtx.clearRect(0, 0, W, H);
  grainCtx.globalAlpha = amount; grainCtx.imageSmoothingEnabled = true;
  grainCtx.drawImage(grainTiles[frame % 4], 0, 0, W, H);
  grainCtx.globalAlpha = 1;
  const v = grainCtx.createRadialGradient(W / 2, H * .48, Math.min(W, H) * .35, W / 2, H * .5, Math.hypot(W, H) * .62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)');
  grainCtx.globalCompositeOperation = 'source-over'; grainCtx.fillStyle = v; grainCtx.fillRect(0, 0, W, H);
}

// ───────────── botanical drawing engine (shared by the opening bloom and the end emblem) ─────────────
// Each filled shape becomes [dye fill, wax line] siblings in the original order, so outlines overlap
// exactly as on the website; fills spread from a seed through an organic, soft-edged dye mask.
let maskId = 0;
function buildBotanical(svgRoot, artwork, prefix) {
  const defs = el('defs', {}, svgRoot);
  const f = el('filter', { id: `${prefix}-dye`, x: '-60%', y: '-60%', width: '220%', height: '220%', 'color-interpolation-filters': 'sRGB' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.11', numOctaves: '2', seed: '4', result: 'n' }, f);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '7', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f);
  el('feGaussianBlur', { in: 'd', stdDeviation: '1.15' }, f);
  const cam = el('g', {}, svgRoot);
  const doc = parseSvg(artwork);
  const art = doc.firstElementChild; cam.appendChild(document.importNode(art, true));
  const top = cam.firstElementChild;
  const items = [];
  const walk = (node, path) => {
    [...node.children].forEach((child, i) => {
      const p = [...path, i];
      if (child.tagName === 'g') return walk(child, p);
      const fill = child.getAttribute('fill') ?? inherited(child, 'fill');
      const sw = Number(child.getAttribute('stroke-width') ?? inherited(child, 'stroke-width') ?? 1);
      const hasFill = fill && fill !== 'none';
      const line = child.cloneNode(); line.setAttribute('fill', 'none'); line.setAttribute('pathLength', '1');
      line.setAttribute('stroke-dasharray', '1 1.02'); line.setAttribute('stroke-dashoffset', '1');
      let fillNode = null, mask = null;
      if (hasFill) {
        fillNode = child.cloneNode(); fillNode.setAttribute('stroke', 'none');
        const id = `${prefix}-m${maskId++}`;
        mask = el('mask', { id, maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', x: -400, y: -400, width: 900, height: 900 });
        child.parentNode.insertBefore(mask, child);
        const circle = el('circle', { cx: 0, cy: 0, r: 0, fill: 'white', filter: `url(#${prefix}-dye)` }, mask);
        fillNode.setAttribute('mask', `url(#${id})`);
        child.parentNode.insertBefore(fillNode, child);
        mask.circle = circle;
      }
      child.parentNode.insertBefore(line, child);
      child.remove();
      items.push({ path: p.join('.'), line, fill: fillNode, mask, sw, kind: child.tagName });
    });
  };
  const inherited = (n, attr) => { for (let a = n.parentElement; a; a = a.parentElement) if (a.hasAttribute?.(attr)) return a.getAttribute(attr); return null; };
  walk(top, []);
  // Seeds and reach for the dye, in each element's local space.
  for (const it of items) if (it.fill) {
    const b = it.fill.getBBox();
    const sx = clamp(0, b.x, b.x + b.width), sy = clamp(0, b.y, b.y + b.height);
    const seedX = it.kind === 'circle' ? b.x + b.width / 2 : sx, seedY = it.kind === 'circle' ? b.y + b.height / 2 : sy;
    it.seed = [seedX, seedY];
    it.reach = Math.max(...[[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => Math.hypot(x - seedX, y - seedY))) * 1.18 + 3;
    it.mask.circle.setAttribute('cx', seedX); it.mask.circle.setAttribute('cy', seedY);
  }
  for (const it of items) it.len = it.line.getTotalLength?.() || 1;
  return { cam, top, items, byPath: Object.fromEntries(items.map(i => [i.path, i])) };
}
function setLine(it, u, widthScale = 1) {
  it.line.setAttribute('stroke-dashoffset', (1 - u).toFixed(4));
  it.line.style.visibility = u > 0 ? 'visible' : 'hidden';
  it.line.setAttribute('stroke-width', (it.sw * widthScale).toFixed(4));
}
function setFill(it, u) {
  if (!it.fill) return;
  it.mask.circle.setAttribute('r', (it.reach * E.out2(u)).toFixed(3));
  it.fill.style.visibility = u > 0 ? 'visible' : 'hidden';
}
// Point of a line's drawing tip, in screen pixels.
function tipOf(it, u) {
  const p = it.line.getPointAtLength(it.len * clamp(u));
  const m = it.line.getScreenCTM(); const r = root.getBoundingClientRect();
  return [m.a * p.x + m.c * p.y + m.e - r.left, m.b * p.x + m.d * p.y + m.f - r.top];
}

// Flower artwork structure (motifArtwork('flower')): 0 stems, 1–2 leaves, 3 main bloom, 4 small bloom, 5 dots.
// Main bloom: 3.0.(2k) petal k, 3.0.(2k+1) its veins, 3.1 centre, 3.2 curl, 3.3.x accents.
const art = buildBotanical($('art'), M.hero.artwork, 'a');
const fx = el('g', {}, $('art'));
const bead = el('circle', { r: 9, fill: 'url(#beadGlow)' }, fx);
{ const d = el('defs', {}, $('art')); const g = el('radialGradient', { id: 'beadGlow' }, d);
  el('stop', { offset: '0', 'stop-color': '#fffaf0', 'stop-opacity': '1' }, g); el('stop', { offset: '.35', 'stop-color': '#fbe9bf', 'stop-opacity': '.9' }, g); el('stop', { offset: '1', 'stop-color': '#edc87e', 'stop-opacity': '0' }, g); }

function bloomSchedule(t) {
  // Returns [lineProgress, fillProgress] for an element path.
  const s = (a, b) => seg(t, [a, b]);
  const sched = {};
  const petal = k => k === 0 ? { l: s(...TL.petalDraw), f: s(...TL.petalFill), v: s(...TL.veinDraw) }
    : { l: E.sine(s(TL.petalsDraw[0] + (k - 1) * .32, TL.petalsDraw[0] + (k - 1) * .32 + 1.15)), f: s(TL.fillsBloom[0] + .3 + (k - 1) * .36, TL.fillsBloom[0] + .3 + (k - 1) * .36 + 1.7), v: s(8.0 + k * .25, 9.0 + k * .25) };
  for (let k = 0; k < 5; k++) { const p = petal(k); sched[`3.0.${2 * k}`] = [p.l, p.f]; sched[`3.0.${2 * k + 1}`] = [p.v, 0]; }
  sched['3.1'] = [s(7.5, 8.3), s(8.2, 9.3)];
  sched['3.2'] = [s(8.3, 9.2), 0];
  for (let k = 0; k < 3; k++) sched[`3.3.${k}`] = [s(8.9 + k * .12, 9.4 + k * .12), s(9.0 + k * .12, 9.7 + k * .12)];
  sched['0'] = [E.sine(s(...TL.stemsDraw)), 0];
  sched['1.0'] = [s(6.8, 8.0), s(7.9, 9.6)]; sched['1.1'] = [s(8.6, 9.4), 0];
  sched['2.0'] = [s(7.2, 8.4), s(8.3, 10.0)]; sched['2.1'] = [s(9.0, 9.8), 0];
  for (let k = 0; k < 10; k++) sched[`4.0.${k}`] = [s(7.6 + (k >> 1) * .1, 8.6 + (k >> 1) * .1), k % 2 ? 0 : s(8.7 + (k >> 1) * .1, 9.9 + (k >> 1) * .1)];
  sched['4.1'] = [s(8.3, 8.9), s(8.9, 9.8)]; sched['4.2'] = [s(8.5, 9.1), 0];
  for (let k = 0; k < 3; k++) sched[`4.3.${k}`] = [s(9.0, 9.5), s(9.3, 9.9)];
  for (let k = 0; k < 3; k++) sched[`5.${k}`] = [s(9.4 + k * .15, 9.9 + k * .15), s(9.5 + k * .15, 10.2 + k * .15)];
  return sched;
}

// Camera for the opening: from an extreme close-up on petal 0 out to the website's intro composition.
const FINAL_ART = portrait ? { x: 50, y: 52, ax: W * .57, ay: H * .7, s: 7.7 * U, rot: 12 } : { x: 50, y: 50, ax: W * .7, ay: H * .52, s: 6.3 * U, rot: 12 };
const artCam = track([
  [0, { x: 47.5, y: 33.5, ax: W / 2, ay: H * .47, s: 31 * U, rot: -7 }],
  [2.9, { x: 53, y: 26.5, ax: W / 2, ay: H * .47, s: 22 * U, rot: -2 }, E.sine],
  [TL.pullBack[0], { x: 54, y: 26, ax: W / 2, ay: H * .47, s: 20.5 * U, rot: -1 }, E.sine],
  [TL.pullBack[1], FINAL_ART, E.inOut],
  [12.8, { ...FINAL_ART, s: FINAL_ART.s * 1.035 }, E.sine],
  [13.75, { x: 55, y: 43, ax: W * .5, ay: H * .5, s: 6.9 * U, rot: 0 }, E.inOut],
]);

// ───────────── website intro world (gradient, faint fabric, orbits, echo botanical) ─────────────
const glow = $('glow');
const introFabric = $('introFabric');
introFabric.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(M.collection[0].fabric);
Object.assign(introFabric.style, { width: '100%', height: '100%', objectFit: 'cover', transformOrigin: '50% 70%' });
const orbits = $('orbits');
const orbitA = el('ellipse', { fill: 'none', stroke: '#f8edcf', 'stroke-opacity': '.09', 'stroke-width': 2 }, orbits);
const orbitB = el('ellipse', { fill: 'none', stroke: '#f8edcf', 'stroke-opacity': '.09', 'stroke-width': 2 }, orbits);
const echoG = el('g', {}, orbits);
{ const doc = parseSvg(M.hero.artwork); echoG.appendChild(document.importNode(doc.firstElementChild, true));
  echoG.querySelectorAll('path,circle').forEach(n => { n.setAttribute('pathLength', '1'); n.setAttribute('stroke-dasharray', '1 1.02'); }); }
const echoParts = [...echoG.querySelectorAll('path,circle')];

// ───────────── typography ─────────────
const type = $('type');
function titleBlock(lines, size, x, y, align = 'left') {
  const n = div('title', type); n.style.fontSize = size + 'px'; n.style.lineHeight = '.93'; n.style.left = x + 'px'; n.style.top = y + 'px'; n.style.textAlign = align;
  if (align === 'center') { n.style.transform = 'translateX(-50%)'; }
  n.lines = lines.map(l => { const s = document.createElement('span'); s.className = 'line'; const i = document.createElement('span'); i.textContent = l; s.appendChild(i); n.appendChild(s); return i; });
  return n;
}
function reveal(node, u, rise = 34) {
  const v = E.out(clamp(u));
  node.style.opacity = v; node.style.transform = `translateY(${(1 - v) * rise}px)`; node.style.filter = v < 1 ? `blur(${(1 - v) * 7}px)` : 'none';
}
const headline = titleBlock(['A living art.', 'An unfolding', 'story.'], (portrait ? 184 : 132) * U, (portrait ? 70 : 140) * U, (portrait ? 196 : 210) * U);
headline.style.lineHeight = '.91'; headline.style.letterSpacing = '-.045em';

// Collection panel labels
const labels = M.collection.map(c => {
  const n = div('label', type, `<b>${c.label}</b><span class="rule"></span><i>${c.palette}</i>`);
  n.style.left = 84 * U + 'px'; n.style.top = (portrait ? 150 : 90) * U + 'px';
  n.querySelector('b').style.fontSize = 76 * U + 'px'; n.querySelector('i').style.fontSize = 24 * U + 'px';
  const r = n.querySelector('.rule'); r.style.width = 92 * U + 'px'; r.style.margin = `${22 * U}px 0 ${20 * U}px`;
  return n;
});
const labelShade = div('', type); Object.assign(labelShade.style, { position: 'absolute', left: 0, right: 0, top: 0, height: (portrait ? 620 : 380) * U + 'px', background: 'linear-gradient(rgba(9,17,31,.84) 35%, rgba(9,17,31,0))' });
type.prepend(labelShade);
const collectionHeading = titleBlock(['One cloth. Endless expressions.'], 1, 0, 0); // positioned from capture measurements
collectionHeading.style.letterSpacing = '-.015em';

// End card
const endType = div('', type);
const wordmark = titleBlock(['Wear Your Batik'], (portrait ? 118 : 100) * U, W / 2, (portrait ? 1040 : 560) * U, 'center');
const tagline = div('title', type, '<span class="line">Design your cloth.</span><span class="line">Wear your story.</span>');
Object.assign(tagline.style, { fontFamily: 'var(--sans)', fontSize: 42 * U + 'px', lineHeight: '1.42', letterSpacing: '.005em', left: W / 2 + 'px', top: (portrait ? 1205 : 690) * U + 'px', textAlign: 'center', color: '#e9dfc4' });
const cta = div('', type, '<span>Create my batik</span><span style="font-size:1.45em;line-height:0">↗</span>'); cta.id = 'cta';
Object.assign(cta.style, { fontSize: 33 * U + 'px', width: 430 * U + 'px', height: 116 * U + 'px', padding: `0 ${44 * U}px`, left: (W / 2 - 215 * U) + 'px', top: (portrait ? 1395 : 850) * U + 'px', boxSizing: 'border-box' });

// Subtitles
const subs = $('subs'); const subLine = document.createElement('span'); subs.appendChild(subLine);
Object.assign(subLine.style, { fontSize: 41 * U + 'px', lineHeight: '1.38', padding: `${10 * U}px ${26 * U}px`, maxWidth: (portrait ? 900 : 1300) * U + 'px' });
subs.style.top = (portrait ? 1590 : 900) * U + 'px';

// ───────────── real app captures ─────────────
const ui = $('ui');
const CW = CAP.viewport.width; // CSS px of the captured phone screen
const Z = (portrait ? 1000 : 666) * U / CW; // film px per CSS px for the phone screen
const WIN = portrait ? { x: (W - CW * Z) / 2, y: 80 * U, w: CW * Z, h: H - 160 * U } : { x: (W - CW * Z) / 2, y: 30 * U, w: CW * Z, h: H - 60 * U };
function makeShot() {
  const box = div('shot', ui); const a = new Image(), b = new Image(); box.append(a, b);
  for (const i of [a, b]) { i.style.width = CW * Z + 'px'; }
  return { box, a, b };
}
const phone = makeShot();
const big = makeShot(); // full-bleed 3D captures
const touchEl = div('', ui); touchEl.id = 'touch';
const rippleEl = div('', ui); rippleEl.id = 'ripple';
const tipEl = div('', ui); tipEl.id = 'fingertip';
const captionChip = div('caption-chip', type);
const imgCache = new Map();
const CREAM = 'radial-gradient(ellipse 60% 80% at 50% 45%, #f4eedf 0%, #ebe3d1 70%, #e3d9c4 100%)';
async function setImg(img, src) {
  if (!src) { img.removeAttribute('src'); img.style.opacity = 0; return; }
  if (img.dataset.src !== src) {
    img.dataset.src = src; img.src = src;
    try { await img.decode(); } catch { /* keep going; missing frames are reported by the renderer */ }
  }
}
const appImg = n => n ? `${A}app/${n}.png` : null;
const threeImg = n => n ? `${A}three/${n}.png` : null;

// Phone "camera": which part of the captured screen is seen, and how close.
// sy: CSS scroll offset of the window; zoom: extra magnification about (fx, fy) in CSS px.
function placePhone(view) {
  const { sy = 0, zoom = 1, fx = CW / 2, fy = 466, wy = WIN.y, wh = WIN.h, wx = WIN.x, ww = WIN.w, radius = 34 * U, opacity = 1 } = view;
  // Window (clip) rectangle in film px; content transform maps CSS px → film px.
  const k = Z * zoom;
  const ox = wx + ww / 2 - fx * k + (fx - CW / 2) * Z * 0; // keep (fx) centred when zoomed
  const box = phone.box;
  Object.assign(box.style, { left: wx + 'px', top: wy + 'px', width: ww + 'px', height: wh + 'px', borderRadius: radius + 'px' });
  show(box, opacity);
  const cx = view.cx ?? (wx + ww / 2), cy = view.cy ?? (wy + (fy - sy) * Z);
  // CSS point (fx, fy) lands at film (cx, cy).
  const tx = cx - fx * k - wx, ty = cy - fy * k - wy;
  for (const i of [phone.a, phone.b]) i.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
  phone.map = (x, y) => [wx + tx + x * k, wy + ty + y * k];
  return phone.map;
}

// ───────────── cloth (2D vector, the app's own pattern) ─────────────
const clothSvg = $('cloth');
const clothDefs = el('defs', {}, clothSvg);
clothDefs.appendChild(document.importNode(parseSvg(M.hero.patternDef).firstElementChild, true));
clothDefs.querySelector('pattern').id = 'heroCloth';
const silMask = el('mask', { id: 'silMask', maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 12000, height: 12000 }, clothDefs);
const silOuter = el('rect', { x: -5000, y: -5000, width: 12000, height: 12000, fill: 'white' }, silMask);
el('path', { d: M.hero.kebayaSilhouette, fill: 'white' }, silMask);
const seamGlowF = el('filter', { id: 'seamGlow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, clothDefs);
el('feGaussianBlur', { stdDeviation: '2.2' }, seamGlowF);
const clothCam = el('g', {}, clothSvg);
const clothBody = el('g', { mask: 'url(#silMask)' }, clothCam);
el('rect', { x: -3000, y: -3000, width: 7000, height: 8000, fill: 'url(#heroCloth)' }, clothBody);
// Per-tile copies of the drawn wax line, so the repeat can be seen arriving tile by tile.
const strokeD = 'M' + M.hero.strokePoints.map(p => p.join(' ')).join('L');
const repeats = [];
const TS = .972; // cloth units per tile unit (pattern 97.2 units per 100-unit tile)
for (let j = -6; j <= 8; j++) for (let i = -6; i <= 10; i++) for (const b of [0, 1]) {
  const ox = (100 * i + (b ? 50 : 0)) * TS, oy = (200 * j + (b ? 100 : 0)) * TS;
  const p = el('path', { d: strokeD, fill: 'none', stroke: M.hero.colours.wax, 'stroke-width': M.hero.strokeWidth, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1.02', transform: `translate(${ox} ${oy}) scale(${TS})` }, clothBody);
  repeats.push({ p, d: Math.hypot(i + (b ? .5 : 0), (2 * j + b) * 1.0), home: i === 0 && j === 0 && !b });
}
const seamGlow = el('path', { d: M.hero.kebayaSilhouette, fill: 'none', stroke: '#fff2cf', 'stroke-width': 3.2, 'stroke-opacity': .55, filter: 'url(#seamGlow)', pathLength: 1, 'stroke-dasharray': '1 1.02', 'stroke-linejoin': 'round' }, clothCam);
const seam = el('path', { d: M.hero.kebayaSilhouette, fill: 'none', stroke: '#fbeecd', 'stroke-width': 1.9, pathLength: 1, 'stroke-dasharray': '1 1.02', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, clothCam);
const seamBead = el('circle', { r: 3.2, fill: 'url(#beadGlow2)' }, clothCam);
{ const g = el('radialGradient', { id: 'beadGlow2' }, clothDefs);
  el('stop', { offset: '0', 'stop-color': '#fffaf0' }, g); el('stop', { offset: '.4', 'stop-color': '#fbe9bf', 'stop-opacity': '.85' }, g); el('stop', { offset: '1', 'stop-color': '#edc87e', 'stop-opacity': '0' }, g); }
const kebayaImg = el('image', { href: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(M.hero.kebaya), x: 0, y: 0, width: 600, height: 600 }, clothCam);
const clothShade = el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#clothLight)', 'pointer-events': 'none' }, clothSvg);
{ const g = el('linearGradient', { id: 'clothLight', x1: 0, y1: 0, x2: 1, y2: 1 }, clothDefs);
  el('stop', { offset: '0', 'stop-color': '#fff6e0', 'stop-opacity': '.10' }, g); el('stop', { offset: '.55', 'stop-color': '#000', 'stop-opacity': '0' }, g); el('stop', { offset: '1', 'stop-color': '#020812', 'stop-opacity': '.28' }, g); }

// ───────────── rosette of the six fabrics ─────────────
const ros = $('rosette');
const rosDefs = el('defs', {}, ros);
{ const f = el('filter', { id: 'petalShadow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, rosDefs);
  el('feDropShadow', { dx: 0, dy: 14, stdDeviation: 16, 'flood-color': '#030914', 'flood-opacity': .55 }, f); }
const rosG = el('g', {}, ros);
const PET = { w: 250, len: 560, r0: 318 };
const petals = M.collection.map((c, i) => {
  const pat = el('pattern', { id: `rf${i}`, patternUnits: 'userSpaceOnUse', width: 480, height: 480, patternTransform: 'scale(.62)' }, rosDefs);
  el('image', { href: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(c.fabric), width: 480, height: 480 }, pat);
  const clip = el('clipPath', { id: `rc${i}` }, rosDefs);
  const shape = el('rect', { x: -PET.w / 2, y: 0, width: PET.w, height: PET.len, rx: PET.w / 2 }, clip);
  const g = el('g', { filter: 'url(#petalShadow)' }, rosG);
  const inner = el('g', { 'clip-path': `url(#rc${i})` }, g);
  el('rect', { x: -400, y: -100, width: 800, height: 900, fill: `url(#rf${i})` }, inner);
  const edge = el('rect', { x: -PET.w / 2, y: 0, width: PET.w, height: PET.len, rx: PET.w / 2, fill: 'none', stroke: c.colours.wax, 'stroke-opacity': .6, 'stroke-width': 2.2 }, g);
  return { g, shape, edge };
});
const rosCenterClip = el('clipPath', { id: 'rosCenter' }, rosDefs);
const rosCircle = el('circle', { cx: 0, cy: 0, r: 300 }, rosCenterClip);
const rosCenter = el('g', {}, ros);
const rosImgWrap = el('g', { 'clip-path': 'url(#rosCenter)' }, rosCenter);
el('rect', { x: -3000, y: -3000, width: 6000, height: 6000, fill: '#efe7d6' }, rosImgWrap);
const rosImgA = el('image', { preserveAspectRatio: 'none' }, rosImgWrap);
const rosImgB = el('image', { preserveAspectRatio: 'none' }, rosImgWrap);
const rosRing = el('circle', { cx: 0, cy: 0, r: 300, fill: 'none', stroke: '#f8edcf', 'stroke-opacity': .7, 'stroke-width': 2.5 }, rosCenter);

// ───────────── end emblem ─────────────
const emb = buildBotanical($('emblem'), M.emblem, 'e');
const embBead = el('circle', { r: 8, fill: 'url(#beadGlow)' }, $('emblem'));
{ const d = el('defs', {}, $('emblem')); const g = el('radialGradient', { id: 'beadGlowE' }, d); }
embBead.setAttribute('fill', '#fff5dc');

// ───────────── WebGL cloth panels ─────────────
const cloth3 = await createCloth($('gl'), W, H, M.collection.map(c => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(c.panel)));

// Collection layout from the real capture (CSS px in the captured viewport).
const RECT = CAP.rects || {};
const swatches = RECT.collection?.swatches || [];
const FAB_UNITS_PER_CSS = 480 / 245; // the website shows each swatch's cloth at background-size 245px

// ───────────── frame state helpers ─────────────
const tapsByName = Object.fromEntries(TL.taps.map(t => [t.name, t]));
function tapPoint(name) { const c = CAP.taps[name]; return c ? [c.x, c.y] : [CW / 2, 466]; }

function sentenceAt(t) {
  if (!NARR) return null;
  for (const s of NARR.sentences) if (t >= s.start - .05 && t <= s.end + .35) return s;
  return null;
}

// ───────────── render ─────────────
let lastFrame = -1;
window.renderAt = async function renderAt(t) {
  const frame = Math.round(t * TL.fps);
  const jobs = [];
  // Fixed stacking: titles over pictures, grain over everything, subtitles always on top.
  clothSvg.style.zIndex = 5; ui.style.zIndex = 6; type.style.zIndex = 10; $('grain').style.zIndex = 15; subs.style.zIndex = 20;

  // ── backdrop: indigo, woven cloth at the opening camera's scale ──
  const ac = artCam(t);
  const inOpening = t < TL.toCloth[1] + .2;
  const pitch = inOpening ? .62 * ac.s : 5 * U;
  const weaveAmt = inOpening ? lerp(.22, .62, E.sine(seg(t, [0, 2.6]))) : .5;
  drawWeave(weaveCtx, weaveDark, pitch, inOpening ? ac.rot : 0, inOpening ? ac.ax : 0, inOpening ? ac.ay : 0, weaveAmt, '#101F36');

  // ── 1–2 · line, bloom and the website intro ──
  const artVis = t < TL.toCloth[1] ? 1 - E.sine(seg(t, [13.55, TL.toCloth[1]])) : 0;
  show($('art'), artVis);
  if (artVis > 0) {
    art.cam.setAttribute('transform', `translate(${ac.ax} ${ac.ay}) rotate(${ac.rot}) scale(${ac.s}) translate(${-ac.x} ${-ac.y})`);
    const sched = bloomSchedule(t);
    // Fine line at close range: wax lines keep a delicate width while the camera is near.
    const raw = 1.1 * ac.s, px = raw <= 8 * U ? raw : 8 * U + (raw - 8 * U) * .2;
    const wscale = px / raw;
    for (const it of art.items) { const [l, f] = sched[it.path] || [1, 1]; setLine(it, l, wscale); setFill(it, f); }
    const p0 = art.byPath['3.0.0'];
    const u0 = seg(t, [TL.petalDraw[0] - .32, TL.petalDraw[1]]);
    const beadOn = u0 > 0 && u0 < 1 ? 1 : u0 >= 1 ? 1 - seg(t, [TL.petalDraw[1], TL.petalDraw[1] + .5]) : 0;
    if (beadOn > 0) { const [bx, by] = tipOf(p0, E.sine(u0)); bead.setAttribute('cx', bx); bead.setAttribute('cy', by); bead.setAttribute('r', 13 * U); }
    bead.style.opacity = beadOn;
    // Petal 0 is drawn with an eased gesture rather than linearly.
    setLine(p0, E.sine(u0), wscale);
  }

  // Website intro world
  const iw = E.sine(seg(t, TL.introWorld)) * (1 - E.sine(seg(t, [13.0, 14.0])));
  glow.style.background = `radial-gradient(ellipse 85% 55% at ${portrait ? '62% 68%' : '74% 45%'}, #123f50 0%, rgba(16,31,54,0) 78%)`;
  show(glow, iw);
  show(introFabric, iw * .13);
  Object.assign(introFabric.style, { transform: `rotate(-12deg) scale(${1.3 + .05 * seg(t, [8, 14])})`, maskImage: 'linear-gradient(transparent 42%, #000 78%)', WebkitMaskImage: 'linear-gradient(transparent 42%, #000 78%)' });
  show(orbits, iw);
  if (iw > 0) {
    const cx = FINAL_ART.ax, cy = FINAL_ART.ay;
    orbitA.setAttribute('cx', cx); orbitA.setAttribute('cy', cy); orbitA.setAttribute('rx', 470 * U); orbitA.setAttribute('ry', 400 * U); orbitA.setAttribute('transform', `rotate(${-30 + t * .6} ${cx} ${cy})`);
    orbitB.setAttribute('cx', cx); orbitB.setAttribute('cy', cy + 20 * U); orbitB.setAttribute('rx', 510 * U); orbitB.setAttribute('ry', 470 * U); orbitB.setAttribute('transform', `rotate(${35 - t * .4} ${cx} ${cy})`);
    const eu = seg(t, [9.2, 12.4]);
    echoG.setAttribute('transform', `translate(${(portrait ? 40 : W * .4) * U} ${(portrait ? 1690 : 900) * U}) rotate(-35) scale(${2.4 * U}) translate(-50 -50)`);
    echoG.style.opacity = .7;
    // The website's own wax-draw recipe: outline 0→80 %, colour fades in from 48 %.
    const dash = 1 - clamp(eu / .8), fo = clamp((eu - .48) / .32);
    for (const n of echoParts) { n.setAttribute('stroke-dashoffset', dash.toFixed(4)); n.style.fillOpacity = fo; }
  }
  // Headline
  const hu = seg(t, TL.headline), hOut = seg(t, [12.8, 13.3]);
  headline.lines.forEach((ln, i) => reveal(ln, seg(t, [TL.headline[0] + i * .28, TL.headline[0] + i * .28 + .95])));
  show(headline, hu > 0 ? 1 - E.sine(hOut) : 0);

  // ── 3 · collection panels (WebGL) ──
  const glOn = t >= TL.toCloth[0] + .5 && t < TL.collectionIn[1] + .05;
  const glOpacity = glOn ? E.sine(seg(t, [13.55, TL.toCloth[1]])) * (1 - seg(t, TL.collectionIn)) : 0;
  show($('gl'), glOpacity);
  if (glOpacity > 0) renderPanels(t);
  labels.forEach((n, i) => {
    const c = panelCentres[i];
    const on = seg(t, [c - .3, c - .08]), off = i === 5 ? seg(t, [TL.panelsResolve[0], TL.panelsResolve[0] + .25]) : seg(t, [c + .2, c + .38]);
    show(n, on * (1 - off));
    n.style.transform = `translateY(${(1 - E.out(seg(t, [c - .3, c + .05]))) * 16}px)`;
    n.querySelector('.rule').style.transform = `scaleX(${E.out(seg(t, [c - .22, c + .15]))})`;
  });
  show(labelShade, E.sine(seg(t, [panelCentres[0] - .5, panelCentres[0] - .1])) * (1 - seg(t, [TL.panelsResolve[0], TL.panelsResolve[0] + .4])));

  // ── phone screens ──
  const ph = phoneState(t);
  if (ph) {
    jobs.push(setImg(phone.a, ph.a), setImg(phone.b, ph.b));
    phone.a.style.opacity = 1; phone.b.style.opacity = ph.mix ?? 0;
    const map = placePhone(ph.view);
    // Collection heading typeset over the capture's own heading, then handing over to it.
    const hd = RECT.collection?.heading?.[0];
    if (hd && t > 18.9 && t < 21.0) {
      const [hx, hy] = map(hd.x, hd.y);
      Object.assign(collectionHeading.style, { left: hx + 'px', top: hy + 'px', fontSize: 28 * Z * (ph.view.zoom || 1) + 'px', lineHeight: hd.h * Z / (28 * Z) + '' });
      const u = seg(t, [19.35, 19.95]);
      show(collectionHeading, u * (1 - seg(t, [20.45, 20.6])));
      reveal(collectionHeading.lines[0], u, 16);
    } else show(collectionHeading, 0);
    // touch indicator
    touchUI(t, map);
  } else { show(phone.box, 0); show(touchEl, 0); show(rippleEl, 0); show(tipEl, 0); show(collectionHeading, 0); }

  // full-bleed 3D captures (turntable / detail)
  const bg3 = threeState(t);
  if (bg3) {
    jobs.push(setImg(big.a, bg3.a));
    Object.assign(big.box.style, { left: bg3.x + 'px', top: bg3.y + 'px', width: bg3.w + 'px', height: bg3.h + 'px', borderRadius: (bg3.r || 0) + 'px', background: bg3.bg ? CREAM : 'none' });
    big.a.style.width = bg3.iw + 'px'; big.a.style.transform = `translate(${bg3.ix}px, ${bg3.iy}px)`;
    const edge = bg3.bg ? 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' : 'none';
    big.a.style.maskImage = edge; big.a.style.webkitMaskImage = edge;
    show(big.box, bg3.opacity); big.b.style.opacity = 0;
  } else show(big.box, 0);

  // ── 4–5 · cloth, repeat and seam ──
  clothFrame(t, ph);

  // ── 6 · rosette ──
  rosetteFrame(t, jobs);

  // ── 7 · signature ──
  endFrame(t);

  // overlays
  const topWeave = t < 14.2 ? .34 * E.sine(seg(t, [0, 2.6])) : t > 53.6 ? .22 * seg(t, [53.6, 54.4]) : 0;
  drawWeave(weaveTopCtx, weaveLight, inOpening ? .62 * ac.s : 5 * U, inOpening ? ac.rot : 0, inOpening ? ac.ax : 0, inOpening ? ac.ay : 0, topWeave, null);
  drawGrain(frame, .07);
  subtitleFrame(t);
  await Promise.all(jobs);
  lastFrame = frame;
};

// ── S3 panel choreography ──
const ROW_GAP = 1.22;
const panelCentres = Array.from({ length: 6 }, (_, i) => TL.panelsTravel[0] + .35 + i * (TL.panelsTravel[1] - TL.panelsTravel[0] - .7) / 5);
function renderPanels(t) {
  const n = 6;
  // Camera: begins as a flat, colour-exact close-up matching the opening bloom, pulls back, travels the row.
  const travel = t => {
    const c = panelCentres, step = c[1] - c[0];
    if (t <= c[0]) return 0;
    if (t >= c[n - 1]) return (n - 1) * ROW_GAP;
    const i = Math.floor((t - c[0]) / step);
    return (i + E.inOut((t - c[i]) / step)) * ROW_GAP;
  };
  // Match the first panel's bloom (tile B, i=2, j=3) to the art camera's last framing.
  const bloomU = [(243 + 53.5 * .972) , (680.4 + 43 * .972)];
  const bloomWorld = [-PANEL_W / 2 + bloomU[0] / 600, PANEL_H / 2 - bloomU[1] / 600];
  const pxPerUnit = 6.9 * U * (100 / 97.2);
  const startView = (W / pxPerUnit) / 600; // world width visible at the start
  const v0 = cloth3.viewAt(1);
  const dist0 = startView / v0.w;
  const pull = E.inOut(seg(t, TL.panelsIn));
  const resolve = E.inOut(seg(t, [TL.panelsResolve[0], TL.panelsResolve[0] + .6]));
  const v1 = cloth3.viewAt(1);
  const distTravel = portrait ? (.86 * PANEL_W) / v1.w : 1.8 / v1.h;
  const camX0 = bloomWorld[0], camY0 = bloomWorld[1];
  let camX = lerp(camX0, 0, pull) + travel(t), camY = lerp(camY0, -.05, pull), dist = Math.exp(lerp(Math.log(dist0), Math.log(distTravel), pull));
  // Resolve: camera settles where the website's swatch grid can be laid onto the z = 0 plane.
  const resolveCam = { x: travel(TL.panelsTravel[1] + 5), y: 0, dist: 6.4 };
  if (resolve > 0) { camX = lerp(camX, resolveCam.x, resolve); camY = lerp(camY, resolveCam.y, resolve); dist = Math.exp(lerp(Math.log(dist), Math.log(resolveCam.dist), resolve)); }
  cloth3.look(camX, camY, dist);
  const view = cloth3.viewAt(dist);
  const flat = 1 - E.sine(seg(t, [TL.panelsIn[0] + .15, TL.panelsIn[1]])) + E.sine(seg(t, [TL.panelsResolve[0] + .4, TL.panelsResolve[1]]));
  const phoneMap = phoneMapFor(views.collection);
  for (let i = 0; i < n; i++) {
    const ry = (i % 2 ? -.2 : .17) * (1 - resolve), z = (i % 2 ? -.16 : 0) * (1 - resolve);
    let p = { x: i * ROW_GAP - (i < 5 ? 1.7 * resolve : 0), y: (i % 2 ? .05 : -.03) * (1 - resolve), z, ry, folds: 2.6 * (1 - clamp(flat)) * (1 - resolve), time: t, phase: i * 1.7, flat: clamp(flat), opacity: 1 };
    const sw = swatches[i];
    // The last panel (in view) settles first; the others are dealt in from the left, one by one.
    const ri = i === 5 ? E.inOut(seg(t, [TL.panelsResolve[0] + .25, TL.panelsResolve[1] - .2])) : E.inOut(seg(t, [TL.panelsResolve[0] + .32 + i * .1, TL.panelsResolve[0] + .92 + i * .1]));
    if (sw && ri > 0) {
      // Target: the swatch rectangle on screen, unprojected onto the z = 0 plane at the resolve camera.
      const [x0, y0] = phoneMap(sw.x, sw.y), [x1, y1] = phoneMap(sw.x + sw.w, sw.y + sw.h);
      const vr = cloth3.viewAt(resolveCam.dist);
      const wx = resolveCam.x + ((x0 + x1) / 2 / W - .5) * vr.w, wy = resolveCam.y - ((y0 + y1) / 2 / H - .5) * vr.h;
      const ww = (x1 - x0) / W * vr.w, wh = (y1 - y0) / H * vr.h;
      const cropU = sw.w * FAB_UNITS_PER_CSS / 600, cropV = sw.h * FAB_UNITS_PER_CSS / (600 * PANEL_H);
      const u = ri;
      p = { ...p, x: lerp(p.x, wx, u), y: lerp(p.y, wy, u), z: lerp(p.z, 0, u), sx: lerp(1, ww / PANEL_W, u), sy: lerp(1, wh / PANEL_H, u), cropU: Math.exp(lerp(0, Math.log(cropU), u)), cropV: Math.exp(lerp(0, Math.log(cropV), u)) };
    }
    cloth3.setPanel(i, p);
  }
  const lit = 1 - clamp(flat);
  cloth3.lights.key.intensity = 2.1 * lit; cloth3.lights.fill.intensity = .22 * lit; cloth3.lights.rim.intensity = .6 * lit; cloth3.lights.hemi.intensity = .42 * lit;
  cloth3.render();
}

// ── phone shot list ──
function phoneMapFor(view) { const k = Z * (view.zoom || 1); const fx = view.fx ?? CW / 2, fy = view.fy ?? 466; const cx = view.cx ?? ((view.wx ?? WIN.x) + (view.ww ?? WIN.w) / 2); const cy = view.cy ?? ((view.wy ?? WIN.y) + (fy - (view.sy || 0)) * Z); return (x, y) => [cx - fx * k + x * k, cy - fy * k + y * k]; }
const views = {
  collection: { sy: 100, zoom: 1 },
  patterns: { sy: 0, zoom: 1 },
  paintWide: { sy: 0, zoom: 1 },
};
function canvasRect() { return RECT.paint?.canvas?.[0] || { x: 27, y: 387, w: 376, h: 376 }; }
function paintZoomView(z) { const c = canvasRect(); return { fx: c.x + c.w / 2, fy: c.y + c.h / 2, zoom: z, cx: WIN.x + WIN.w / 2, cy: H * .5 }; }

function phoneState(t) {
  // Returns { a, b, mix, view } for the phone screen at time t, or null when not on screen.
  const tap = n => tapsByName[n].t;
  const dissolve = (t0, d = .12) => clamp((t - t0) / d);
  if (t >= TL.collectionIn[0] && t < TL.toApp[1]) {
    const v = { ...views.collection, opacity: E.sine(seg(t, TL.collectionIn)) };
    if (t < tap('swatch-daun')) return { a: appImg('collection-0'), view: v };
    return { a: appImg('collection-0'), b: appImg('collection-1'), mix: dissolve(tap('swatch-daun') + .05), view: { ...v, opacity: 1 - E.sine(seg(t, TL.toApp)) } };
  }
  if (t >= TL.toApp[0] && t < TL.toPaint[1]) {
    const v = { ...views.patterns, opacity: E.sine(seg(t, TL.toApp)) };
    if (t < tap('motif-bunga')) return { a: appImg('patterns-0'), view: v };
    if (t < tap('palette-laut')) return { a: appImg('patterns-0'), b: appImg('patterns-1'), mix: dissolve(tap('motif-bunga') + .05), view: v };
    if (t < TL.toPaint[0]) return { a: appImg('patterns-1'), b: appImg('patterns-2'), mix: dissolve(tap('palette-laut') + .05), view: v };
    return { a: appImg('patterns-2'), b: appImg('paint-1'), mix: E.sine(seg(t, TL.toPaint)), view: v };
  }
  if (t >= TL.toPaint[1] && t < TL.toCloth2[0]) {
    const zFull = (portrait ? 1000 : 880) * U / (canvasRect().w * Z);
    const zt = track([[TL.toPaint[1], 1], [TL.stroke[0] - .1, zFull], [TL.toCloth2[0], zFull * 1.07, E.sine]])(t);
    const c = canvasRect();
    const zoomed = paintZoomView(zt);
    const u = E.inOut(seg(t, [TL.toPaint[1], TL.stroke[0] - .1]));
    const cy0 = WIN.y + (c.y + c.h / 2) * Z;
    const view = { ...zoomed, cy: lerp(cy0, (portrait ? 1185 : 590) * U, u), wx: lerp(WIN.x, 0, u), wy: lerp(WIN.y, 0, u), ww: lerp(WIN.w, W, u), wh: lerp(WIN.h, H, u), radius: lerp(34 * U, 0, u) };
    const su = strokeProgress(t);
    if (t < TL.stroke[0]) return { a: appImg('paint-1'), view };
    if (t < TL.stroke[1]) return { a: appImg(strokeFrameName(su)), view };
    return { a: appImg('stroke-096'), b: appImg('paint-2'), mix: dissolve(TL.stroke[1] + .12, .15), view };
  }
  if (t >= TL.toGarmentPage[0] && t < TL.to3D[1]) {
    const v = { sy: 0, zoom: 1, opacity: E.sine(seg(t, [TL.toGarmentPage[0], TL.toGarmentPage[0] + .35])) };
    const g = RECT.garment?.preview?.[0];
    if (t >= TL.to3D[0]) v.opacity = 1 - seg(t, [TL.to3D[1], TL.to3D[1] + .12]);
    if (t < tap('group-everyday')) return { a: appImg('garment-kebaya'), view: v };
    if (t < tap('garment-maxi')) return { a: appImg('garment-kebaya'), b: appImg('garment-everyday'), mix: dissolve(tap('group-everyday') + .05), view: v };
    if (t < tap('garment-shirt')) return { a: appImg('garment-everyday'), b: appImg('garment-maxi'), mix: dissolve(tap('garment-maxi') + .05), view: v };
    return { a: appImg('garment-maxi'), b: appImg('garment-shirt'), mix: dissolve(tap('garment-shirt') + .05), view: v };
  }
  if (t >= TL.toTryOn[0] && t < TL.toDetail[1]) {
    const tr = tryonWindow(t);
    const v = { sy: 0, zoom: 1, wy: tr.wy, wh: tr.wh, opacity: E.sine(seg(t, TL.toTryOn)) * (1 - E.sine(seg(t, TL.toDetail))) };
    if (t < tap('try-sample')) return { a: appImg('tryon-0'), view: v };
    return { a: appImg('tryon-0'), b: appImg('tryon-1'), mix: dissolve(tap('try-sample') + .05, .18), view: v };
  }
  return null;
}
function tryonWindow(t) {
  const u = E.inOut(seg(t, [tapsByName['try-sample'].t + .05, tapsByName['try-sample'].t + .65]));
  const h0 = 575 * Z, h1 = WIN.h;
  const wh = lerp(h0, h1, u), wy = (H - wh) / 2 - 40 * U;
  return { wy, wh };
}
function strokeProgress(t) { return E.sine(seg(t, TL.stroke)); }
const strokeFrames = CAP.stroke?.frames || [];
function strokeFrameName(u) { const i = clamp(Math.round(u * (strokeFrames.length - 1)), 0, strokeFrames.length - 1); return strokeFrames[i]?.name || 'paint-1'; }

function touchUI(t, map) {
  // Discreet touch indicator: glides in, presses, ripples, fades.
  let best = null;
  for (const tp of TL.taps) { if (t >= tp.t - .55 && t <= tp.t + .55) best = tp; }
  if (best && CAP.taps[best.name]) {
    const [x, y] = map(...tapPoint(best.name));
    const u = clamp((t - (best.t - .55)) / .5);
    const prev = TL.taps[TL.taps.indexOf(best) - 1];
    const from = prev && best.t - prev.t < 1.4 && CAP.taps[prev.name] ? map(...tapPoint(prev.name)) : [x + 70 * U, y + 120 * U];
    const g = E.inOut(u);
    const px = lerp(from[0], x, g), py = lerp(from[1], y, g);
    const press = 1 - .18 * Math.sin(Math.PI * clamp((t - best.t + .08) / .2));
    const appear = prev && best.t - prev.t < 1.4 ? 1 : seg(t, [best.t - .55, best.t - .35]);
    const vis = appear * (1 - seg(t, [best.t + .3, best.t + .55]));
    show(touchEl, vis * .95);
    touchEl.style.transform = `translate(${px}px, ${py}px) scale(${press})`;
    const r = seg(t, [best.t, best.t + .5]);
    show(rippleEl, r > 0 && r < 1 ? (1 - r) * .8 : 0);
    rippleEl.style.transform = `translate(${x}px, ${y}px) scale(${1 + r * 1.3})`;
  } else { show(touchEl, 0); show(rippleEl, 0); }
  // Fingertip for the drawn wax line: it follows the real recorded touch points.
  if (t >= TL.stroke[0] - .35 && t <= TL.stroke[1] + .3) {
    const f = strokeFrames;
    const i = clamp(Math.round(strokeProgress(t) * (f.length - 1)), 0, f.length - 1);
    const pt = t < TL.stroke[0] ? f[0] : f[i];
    if (pt) {
      const [x, y] = map(pt.x, pt.y);
      const vis = seg(t, [TL.stroke[0] - .35, TL.stroke[0] - .05]) * (1 - seg(t, [TL.stroke[1] + .05, TL.stroke[1] + .3]));
      show(tipEl, vis * .9); tipEl.style.transform = `translate(${x}px, ${y}px) scale(${1.15 * U * 1.6})`;
    }
  } else show(tipEl, 0);
}

// ── S4–S5 cloth ──
function clothFrame(t, ph) {
  const on = t >= TL.toCloth2[0] && t < TL.toGarmentPage[1] + .1;
  show(clothSvg, on ? 1 : 0);
  if (!on) return;
  // Match: the app canvas tile on screen at the cut ↔ tile A(0,0) of the cloth.
  const c = canvasRect();
  const cutView = phoneState(TL.toCloth2[0] - .001)?.view || paintZoomView(1.22);
  const map = phoneMapFor(cutView);
  const [tx, ty] = map(c.x, c.y), [tx1] = map(c.x + c.w, c.y);
  const sCut = (tx1 - tx) / 100 / TS; // px per cloth unit at the cut
  const gS = (portrait ? 2.55 : 1.85) * U, gC = [300, 300], gP = [W / 2, H * .47];
  // Camera: zoom about a cloth focus point.
  const u = E.inOut(seg(t, TL.clothPull));
  const focus0 = [50 * TS, 50 * TS], s0 = sCut, p0 = [tx + 50 * TS * sCut, ty + 50 * TS * sCut];
  const s = Math.exp(lerp(Math.log(s0), Math.log(gS), u));
  const fxp = lerp(focus0[0], gC[0], u), fyp = lerp(focus0[1], gC[1], u);
  const sxp = lerp(p0[0], gP[0], u), syp = lerp(p0[1], gP[1], u);
  // slow drift once settled
  const drift = seg(t, [TL.clothPull[1], TL.seam[1]]) * 6 * U;
  let camT = `translate(${sxp} ${syp - drift}) scale(${s}) translate(${-fxp} ${-fyp})`;
  // Into the garment page: the 2D kebaya (the app's render) flies to its own thumbnail.
  const card = RECT.garment?.cards?.[1];
  const fly = E.inOut(seg(t, [TL.toGarmentPage[0] + .1, TL.toGarmentPage[1]]));
  if (fly > 0 && card) {
    const pm = phoneMapFor({ sy: 0, zoom: 1 });
    const side = Math.min(card.w, card.h); // object-fit: contain of a square image
    const [kx, ky] = pm(card.x + (card.w - side) / 2, card.y + (card.h - side) / 2);
    const kS = side * Z / 600;
    const fromX = sxp - fxp * s, fromY = syp - drift - fyp * s;
    camT = `translate(${lerp(fromX, kx, fly)} ${lerp(fromY, ky, fly)}) scale(${Math.exp(lerp(Math.log(s), Math.log(kS), fly))})`;
  }
  clothCam.setAttribute('transform', camT);
  // Tile-by-tile arrival of the wax line.
  for (const r of repeats) {
    const d0 = TL.repeatDraw[0] + r.d * .16;
    const v = r.home ? 1 : E.sine(seg(t, [d0, d0 + .7]));
    r.p.setAttribute('stroke-dashoffset', (1 - v).toFixed(4));
    r.p.style.visibility = v > 0 ? 'visible' : 'hidden';
  }
  // Seam along the kebaya silhouette, then the cloth outside it lifts away.
  const su = E.sine(seg(t, TL.seam));
  for (const p of [seam, seamGlow]) { p.setAttribute('stroke-dashoffset', (1 - su).toFixed(4)); p.style.visibility = su > 0 ? 'visible' : 'hidden'; }
  const seamFade = 1 - seg(t, [TL.silhouetteOut[1] - .2, TL.silhouetteOut[1] + .2]);
  seam.style.opacity = seamFade; seamGlow.style.opacity = seamFade * .9;
  if (su > 0 && su < 1) { const L = seam.getTotalLength(), q = seam.getPointAtLength(L * su); seamBead.setAttribute('cx', q.x); seamBead.setAttribute('cy', q.y); seamBead.style.opacity = 1; seamBead.setAttribute('r', 7 * U / (gS)); }
  else seamBead.style.opacity = 0;
  const out = E.sine(seg(t, TL.silhouetteOut));
  silOuter.setAttribute('fill', `rgb(${Math.round(255 * (1 - out))},${Math.round(255 * (1 - out))},${Math.round(255 * (1 - out))})`);
  kebayaImg.style.opacity = E.sine(seg(t, [TL.silhouetteOut[0] + .2, TL.silhouetteOut[1] + .05])) * (1 - seg(t, [TL.toGarmentPage[1] - .02, TL.toGarmentPage[1] + .08]));
  clothBody.style.opacity = 1 - seg(t, [TL.silhouetteOut[1], TL.silhouetteOut[1] + .1]);
  clothShade.style.opacity = (1 - out);
  // The garment page slides in beneath the cloth while the kebaya lands in its thumbnail.
  ui.style.zIndex = t > TL.toGarmentPage[0] ? 4 : 6;
}

// ── 3D captures ──
const turnCount = CAP3.turntable?.frames || 192;
const M3 = portrait ? W / 1080 : H / 1320;
function threeState(t) {
  // Full-bleed real 3D frames: the 1080 × 1920 frame centre sits at the screen centre at scale M3,
  // then an extra zoom k about (W/2, H*.46).
  const at = (k, o, a) => { const iw = 1080 * M3 * k, ih = 1920 * M3 * k; return { x: 0, y: 0, w: W, h: H, iw, ix: W / 2 - iw / 2 + (1 - k) * 0, iy: H * .46 - (H * .46 - (H / 2 - 1920 * M3 / 2)) * k, opacity: o, a, bg: !portrait }; };
  if (t >= TL.to3D[0] && t < TL.toTryOn[1]) {
    const u = E.inOut(seg(t, TL.turntable));
    const i = Math.round(u * turnCount);
    const h = E.inOut(seg(t, TL.toTryOn));
    const a = threeImg(`turn-${String(i).padStart(3, '0')}`);
    // Expands from the garment page's live preview, like the app's own full-screen view.
    const g = RECT.garment?.preview?.[0];
    const e = E.inOut(seg(t, [TL.to3D[0], TL.to3D[1] + .15]));
    if (g && e < 1) {
      const pm = phoneMapFor({ sy: 0, zoom: 1 });
      const [x0, y0] = pm(g.x, g.y), [x1, y1] = pm(g.x + g.w, g.y + g.h);
      const bx = lerp(x0, 0, e), by = lerp(y0, 0, e), bw = lerp(x1 - x0, W, e), bh = lerp(y1 - y0, H, e);
      const k = Math.exp(lerp(Math.log(120 * Z / 650), Math.log(M3), e)), ay = lerp(880, 960, e);
      return { x: bx, y: by, w: bw, h: bh, r: lerp(4, 0, e) * U, iw: 1080 * k, ix: bw / 2 - 540 * k, iy: bh / 2 - ay * k, opacity: E.sine(seg(t, [TL.to3D[0], TL.to3D[0] + .14])), a, bg: !portrait && e > .5 };
    }
    return at(lerp(1, .84, h), 1 - h, a);
  }
  if (t >= TL.toDetail[0] && t < TL.rosette[0] + .05) {
    const u = seg(t, TL.detail);
    const i = clamp(Math.round(1 + u * 119), 1, 120);
    const k = lerp(.9, 1, E.out(seg(t, TL.toDetail)));
    return at(k, E.sine(seg(t, TL.toDetail)), threeImg(`detail-${String(i).padStart(3, '0')}`));
  }
  return null;
}

// ── S6 rosette ──
function rosetteFrame(t, jobs) {
  const on = t >= TL.rosette[0] && t < TL.toIndigo[1];
  show(ros, on ? 1 : 0);
  if (!on) return;
  const u = E.inOut(seg(t, TL.rosette));
  const out = E.inOut(seg(t, TL.toIndigo));
  const cx = W / 2, cy = H * (portrait ? .46 : .5);
  const form = E.inOut(seg(t, [TL.rosette[0], TL.rosette[0] + 1.3]));
  const scale = U * (portrait ? 1 : .6) * lerp(1.18, 1, E.out(seg(t, [TL.rosette[0] + .3, TL.rosette[1]]))) * (1 - .1 * out);
  rosG.setAttribute('transform', `translate(${cx} ${cy}) rotate(${lerp(-18, 6, u)}) scale(${scale})`);
  petals.forEach((p, i) => {
    const pu = E.out(seg(t, [TL.rosette[0] + .45 + i * .11, TL.rosette[0] + 1.6 + i * .11])) * (1 - out);
    const len = Math.max(1, PET.len * pu);
    p.g.setAttribute('transform', `rotate(${i * 60 + 30}) translate(0 ${PET.r0 + (1 - pu) * 30})`);
    p.shape.setAttribute('height', len); p.edge.setAttribute('height', len);
    p.g.style.opacity = clamp(pu * 2.5);
  });
  // Centre: the real 3D preview, first as the full-frame close-up, then the whole shirt inside a ring.
  const R = lerp(Math.hypot(W, H) * .5 / scale, 292, form) * (1 - out);
  rosCenter.setAttribute('transform', `translate(${cx} ${cy}) scale(${scale})`);
  rosCircle.setAttribute('r', Math.max(0, R)); rosRing.setAttribute('r', Math.max(0, R));
  rosRing.style.opacity = seg(t, [TL.rosette[0] + .7, TL.rosette[0] + 1.3]) * (1 - out);
  // A: detail close-up, exactly as it was full-frame (screen space → rosette space).
  const di = clamp(Math.round(1 + seg(t, TL.detail) * 119), 1, 120);
  const hrefA = threeImg(`detail-${String(di).padStart(3, '0')}`);
  rosImgA.setAttribute('href', hrefA);
  { const iw = 1080 * M3, ih = 1920 * M3; rosImgA.setAttribute('x', (W / 2 - iw / 2 - cx) / scale); rosImgA.setAttribute('y', (H / 2 - ih / 2 - cy) / scale); rosImgA.setAttribute('width', iw / scale); rosImgA.setAttribute('height', ih / scale); }
  // B: the whole garment from the turntable, fitted into the ring.
  const ti = Math.round(lerp(0, 40, u)) % turnCount;
  const hrefB = threeImg(`turn-${String(ti).padStart(3, '0')}`);
  rosImgB.setAttribute('href', hrefB);
  const fit = 600 / 820; // garment width in a turntable frame ≈ 820 px → ring diameter
  rosImgB.setAttribute('x', -540 * fit); rosImgB.setAttribute('y', -900 * fit); rosImgB.setAttribute('width', 1080 * fit); rosImgB.setAttribute('height', 1920 * fit);
  rosImgB.style.opacity = E.sine(seg(t, [TL.rosette[0] + .5, TL.rosette[0] + 1.25]));
  rosCenter.style.opacity = 1 - out;
  for (const h of [hrefA, hrefB]) jobs.push(new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = h; }));
}

// ── S7 signature ──
const EMB = { cx: W / 2, cy: (portrait ? 700 : 300) * U, s: (portrait ? 3.7 : 2.45) * U };
function endFrame(t) {
  const on = t >= TL.toIndigo[0];
  show($('emblem'), on ? 1 : 0);
  for (const n of [wordmark, tagline, cta]) if (!on) show(n, 0);
  if (!on) return;
  const breathe = Math.sin((t - 55) * .9) * .006;
  emb.cam.setAttribute('transform', `translate(${EMB.cx} ${EMB.cy}) scale(${EMB.s * (1 + breathe)}) translate(-50 -52)`);
  const [a, b] = TL.emblemDraw, [fa, fb] = TL.emblemFill;
  emb.items.forEach((it, k) => {
    const o = (k / emb.items.length) * .55;
    setLine(it, E.sine(seg(t, [a + o * (b - a), a + (o + .45) * (b - a)])), 1);
    setFill(it, seg(t, [fa + (k % 7) * .06, fb + (k % 7) * .06]));
  });
  // drawing tip on the main stem
  const stem = emb.byPath['0'];
  const su = seg(t, [a, a + .45 * (b - a)]);
  if (su > 0 && su < 1) { const [x, y] = tipOf(stem, E.sine(su)); embBead.setAttribute('cx', x); embBead.setAttribute('cy', y); embBead.style.opacity = 1; } else embBead.style.opacity = 0;
  // Indigo returns
  show(wordmark, 1); reveal(wordmark.lines[0], seg(t, TL.wordmark), 26);
  show(tagline, 1); reveal(tagline, seg(t, TL.tagline), 20);
  show(cta, 1); reveal(cta, seg(t, TL.cta), 18);
  tagline.style.transform += ' translateX(-50%)';
}

function subtitleFrame(t) {
  if (!SUBS || !NARR) { show(subs, 0); return; }
  const s = sentenceAt(t);
  // The end card already shows these words on screen; captions there would only duplicate them.
  if (!s || s.line === 6) { show(subs, 0); return; }
  subLine.innerHTML = s.caption.replace(/\n/g, '<br>');
  const fade = Math.min(seg(t, [s.start - .05, s.start + .1]), 1 - seg(t, [s.end + .2, s.end + .35]));
  show(subs, fade);
}

await document.fonts.ready;
await Promise.all([...document.images].filter(i => i.src).map(i => i.decode().catch(() => {})));
window.TL = TL;
window.ready = true;
