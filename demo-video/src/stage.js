/* Wear Your Batik — "Malam" (wax).
   One deterministic timeline: window.renderAt(seconds) paints a frame. The layout adapts to
   ?w=&h= (9:16, 1:1, 16:9) while every scene keeps the same timing. */
'use strict';
const Q = new URLSearchParams(location.search);
const W = +Q.get('w') || 1080, H = +Q.get('h') || 1920;
const u = Math.min(W, H) / 1080;
const MODE = H / W > 1.25 ? 'tall' : W / H > 1.25 ? 'wide' : 'square';
const M = window.MANIFEST, T = window.TL;
const NS = 'http://www.w3.org/2000/svg';
const ASSET = '../assets/';

// ───────────── math ─────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  outCubic: p => 1 - (1 - p) ** 3,
  inCubic: p => p ** 3,
  inOut: p => (p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  outExpo: p => (p >= 1 ? 1 : 1 - 2 ** (-10 * p)),
  inExpo: p => (p <= 0 ? 0 : 2 ** (10 * p - 10)),
  outBack: p => { const c = 1.5; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; },
  outQuint: p => 1 - (1 - p) ** 5,
  sine: p => -(Math.cos(Math.PI * p) - 1) / 2,
};
// Stamp landing: big → slams flat with a small settle.
const stampScale = p => (p <= 0 ? 1.35 : p >= 1 ? 1 : 1 + .35 * (1 - E.outCubic(clamp(p * 1.6))) - .035 * Math.sin(Math.PI * clamp((p - .55) / .45)));
const css = (el, o) => { for (const k in o) el.style[k] = o[k]; return el; };
const px = v => `${v.toFixed(2)}px`;
const div = (parent, cls, style = {}) => { const d = document.createElement('div'); if (cls) d.className = cls; d.style.position = 'absolute'; css(d, style); parent.appendChild(d); return d; };
const img = (parent, src, style = {}, cls = '') => { const i = new Image(); i.src = src; if (cls) i.className = cls; css(i, style); parent.appendChild(i); return i; };
const svgEl = (parent, tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const svgUrl = s => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
let seed = 7; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ───────────── layout per aspect ─────────────
const L = {
  tall:   { vc: [W * .5, H * .585], V: W * .86, word: [W * .075, H * .168], wordSize: 210 * u, cap: [W * .078, H * .19], capSize: 40 * u, capW: W * .84, label: [W * .075, H * .955], labelSize: 54 * u, phoneH: H * .56, zoom: .22, photoH: H * .6, cardH: H * .56, brand: [W * .075, H * .045], end: { logo: [W * .5, H * .4], logoS: W * .5, mark: H * .61, markSize: 118 * u } },
  square: { vc: [W * .63, H * .63], V: H * .56, word: [W * .07, H * .2], wordSize: 150 * u, cap: [W * .072, H * .23], capSize: 30 * u, capW: W * .4, label: [W * .07, H * .935], labelSize: 30 * u, labelW: W * .36, phoneH: H * .68, photoH: H * .6, cardH: H * .58, noBrand: true, zoom: .1, brand: [W * .07, H * .07], end: { logo: [W * .5, H * .34], logoS: H * .36, mark: H * .66, markSize: 100 * u } },
  wide:   { vc: [W * .67, H * .52], V: H * .8, word: [W * .065, H * .53], wordSize: 196 * u, cap: [W * .068, H * .565], capSize: 31 * u, capW: W * .36, label: [W * .065, H * .88], labelSize: 40 * u, phoneH: H * .86, zoom: .08, photoH: H * .84, cardH: H * .8, brand: [W * .065, H * .085], end: { logo: [W * .5, H * .35], logoS: H * .38, mark: H * .68, markSize: 108 * u } },
}[MODE];
const [CX, CY] = L.vc, V = L.V;

// ───────────── DOM scaffold ─────────────
const root = document.getElementById('root');
css(root, { width: px(W), height: px(H) });
const stage = svgEl(root, 'svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'fill' });
const defs = svgEl(stage, 'defs');
defs.innerHTML = `
  <radialGradient id="bgGlow" cx="50%" cy="55%" r="75%"><stop offset="0" stop-color="#173052"/><stop offset=".6" stop-color="#0f1c31"/><stop offset="1" stop-color="#0a1322"/></radialGradient>
  <radialGradient id="softLight" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f9e6b8" stop-opacity=".16"/><stop offset="1" stop-color="#f9e6b8" stop-opacity="0"/></radialGradient>
  <filter id="inkEdge" filterUnits="userSpaceOnUse" x="-80" y="-80" width="260" height="260"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="inkEdgeEnd" filterUnits="userSpaceOnUse" x="-80" y="-80" width="260" height="260"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="3" seed="9"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="floodEdge" filterUnits="userSpaceOnUse" x="${-W}" y="${-H}" width="${3 * W}" height="${3 * H}"><feTurbulence type="fractalNoise" baseFrequency="${(.006 / u).toFixed(5)}" numOctaves="3" seed="11"/><feDisplacementMap in="SourceGraphic" scale="${110 * u}" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="${9 * u}"/></filter>`;
svgEl(stage, 'rect', { width: W, height: H, fill: 'url(#bgGlow)' });
const softLight = svgEl(stage, 'ellipse', { cx: CX, cy: CY, rx: V * .75, ry: V * .75, fill: 'url(#softLight)', opacity: 0 });

// Full-screen dye flood (bar 3 downbeat).
const cloth = svgEl(stage, 'g');
const flood = svgEl(cloth, 'circle', { cx: CX, cy: CY, r: 0, fill: M.collection[0].colours.background, filter: 'url(#floodEdge)' });

// ── Fabric: seven stacked tile grids (hero palette, five swaps, back to hero) ──
const tileUrl = M.collection.map(c => svgUrl(c.tile.replace(/width="[\d.]+" height="[\d.]+" viewBox="0 0 100 200"/, 'width="400" height="400" viewBox="0 0 100 100"')));
const SWAP_SEQ = [0, 1, 2, 3, 4, 5, 0];
const fabric = svgEl(cloth, 'g');
const minP = (MODE === 'tall' ? W / 3.1 : MODE === 'wide' ? H / 2.9 : H / 3.1) * .86;
const ROWS = Math.ceil(Math.hypot(W, H) / 2 / minP) + 1, COLS = ROWS;
const grids = SWAP_SEQ.map((k, gi) => {
  const clip = svgEl(defs, 'clipPath', { id: `wipe${gi}`, clipPathUnits: 'userSpaceOnUse' });
  const poly = svgEl(clip, 'polygon', { points: '' });
  const outer = svgEl(fabric, 'g', gi ? { 'clip-path': `url(#wipe${gi})` } : {});
  const inner = svgEl(outer, 'g');
  const tiles = [];
  for (let r = -ROWS; r <= ROWS; r++) for (let c = -COLS; c <= COLS; c++) {
    const x = c + (Math.abs(r) % 2 ? .5 : 0) - .5, y = r - .5;
    const ring = Math.max(Math.abs(r), Math.abs(c + (Math.abs(r) % 2 ? .5 : 0)));
    const el = svgEl(inner, 'image', { href: tileUrl[k], x, y, width: 1.004, height: 1.004, preserveAspectRatio: 'none' });
    tiles.push({ el, x, y, ring });
  }
  return { k, outer, inner, poly, tiles };
});
const fabricShade = svgEl(cloth, 'rect', { width: W, height: H, fill: '#0b1526', opacity: 0 });

// ── Motif builder: wax outline (drawn) over colour (dyed through an ink mask) ──
function buildMotif(parent, artwork, id, filterId) {
  const g = svgEl(parent, 'g');
  const mask = svgEl(defs, 'mask', { id, maskUnits: 'userSpaceOnUse', x: -60, y: -60, width: 220, height: 220 });
  const mg = svgEl(mask, 'g', { filter: `url(#${filterId})` });
  const colour = svgEl(g, 'g', { mask: `url(#${id})` });
  colour.innerHTML = artwork;
  const wax = svgEl(g, 'g');
  wax.innerHTML = artwork.replace(/fill="#[0-9a-fA-F]{6}"/g, 'fill="none"');
  return { g, mg, colour, wax };
}
function prepareStrokes(motif, start, end) {
  const els = [...motif.wax.querySelectorAll('path, circle')];
  const items = els.map(el => {
    const len = el.getTotalLength();
    const m = el.getCTM(), s = m ? Math.hypot(m.a, m.b) : 1;
    el.setAttribute('stroke-dasharray', `${len} ${len}`);
    el.setAttribute('stroke-dashoffset', len);
    return { el, len, w: len * s };
  });
  const total = items.reduce((a, b) => a + b.w, 0);
  let cum = 0;
  for (const it of items) { it.s = cum / total * .8; it.d = Math.max(.035, it.w / total * 1.7); cum += it.w; }
  const maxEnd = Math.max(...items.map(i => i.s + i.d));
  for (const it of items) { it.s = start + it.s / maxEnd * (end - start); it.d = it.d / maxEnd * (end - start); }
  return items;
}
function drawStrokes(items, t) {
  let lead = null;
  for (const it of items) {
    const p = E.sine(prog(t, it.s, it.s + it.d));
    it.el.setAttribute('stroke-dashoffset', (it.len * (1 - p)).toFixed(3));
    it.el.setAttribute('visibility', t > it.s ? 'visible' : 'hidden');
    if (p > 0 && p < 1 && (!lead || it.s > lead.it.s)) lead = { it, p };
  }
  return lead;
}
function tipPoint(lead) {
  const pt = lead.it.el.getPointAtLength(lead.it.len * lead.p);
  const m = lead.it.el.getCTM();
  return [m.a * pt.x + m.c * pt.y + m.e, m.b * pt.x + m.d * pt.y + m.f];
}

// Hero: Bunga raya in Laut & coral — the app's default design.
const heroWrap = svgEl(stage, 'g');
const hero = buildMotif(heroWrap, M.collection[0].artwork, 'heroDye', 'inkEdge');
const heroBlooms = [[31, 82, 30, 0], [70, 71, 30, 0], [55, 43, 46, 1], [14, 24, 16, 2], [50, 50, 95, 3]].map(([cx, cy, r, i]) => ({ el: svgEl(hero.mg, 'circle', { cx, cy, r: 0, fill: '#fff' }), r, t0: T.dye.blooms[i] }));

// End logo: same artwork, drawn again as the signature.
const endWrap = svgEl(stage, 'g');
const endMotif = buildMotif(endWrap, M.collection[0].artwork, 'endDye', 'inkEdgeEnd');
const endBloom = svgEl(endMotif.mg, 'circle', { cx: 55, cy: 43, r: 0, fill: '#fff' });

// FX layer (stage coordinates): canting tip, wipe edge.
const fx = svgEl(root, 'svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'fill', style: 'z-index:6' });
const wipeLine = svgEl(fx, 'line', { stroke: '#fff1cf', 'stroke-width': 7 * u, 'stroke-linecap': 'round', opacity: 0 });
const wipeGlow = svgEl(fx, 'line', { stroke: '#ffcf7a', 'stroke-width': 26 * u, filter: 'url(#glow)', opacity: 0 });
const tipHalo = svgEl(fx, 'circle', { r: 26 * u, fill: '#ffc970', filter: 'url(#glow)', opacity: 0 });
const tipCore = svgEl(fx, 'circle', { r: 7.5 * u, fill: '#fff6dc', opacity: 0 });
const fxDefs = svgEl(fx, 'defs'); fxDefs.innerHTML = defs.querySelector('#glow').outerHTML;

// ── Phone with real app captures ──
const phoneH = L.phoneH, phoneW = phoneH * 390 / 844 + 0.06 * phoneH * 390 / 844;
const bezel = phoneW * .03, screenW = phoneW - 2 * bezel, screenH = screenW * 844 / 390;
const PH = screenH + 2 * bezel;
const phone = div(root, '', { left: px(CX - phoneW / 2), top: px(CY - PH / 2), width: px(phoneW), height: px(PH), borderRadius: px(phoneW * .13), zIndex: 3, opacity: 0 });
phone.id = 'phone';
const scr = div(phone, 'screen', { left: px(bezel), top: px(bezel), width: px(screenW), height: px(screenH), borderRadius: px(phoneW * .105) });
const k = screenW / 390; // css px → screen px
const shots = {};
for (const n of ['patterns', 'starter', 'stamp-tool', 'stamped']) shots[n] = img(scr, `${ASSET}screens/phone-${n}.png`, { opacity: 0 });
const drawnBar = img(scr, `${ASSET}screens/phone-drawn.png`, { opacity: 0, clipPath: `inset(${px(316 * k)} 0 ${px(screenH - 392 * k)} 0)` });
const drawnLine = img(scr, `${ASSET}screens/phone-drawn.png`, { opacity: 0 });
const drawnFull = img(scr, `${ASSET}screens/phone-drawn.png`, { opacity: 0 });
const ripple = div(scr, 'ripple', { opacity: 0 });
const pointer = div(scr, '', { width: px(30 * k), height: px(30 * k), opacity: 0 }); pointer.id = 'pointer';
const CANVAS = { x: 27, y: 387, w: 336, h: 336 };
const drawPath = p => [CANVAS.x + CANVAS.w * (.12 + .76 * p), CANVAS.y + CANVAS.h * (.85 - .7 * p) + Math.sin(p * Math.PI * 3) * CANVAS.h * .08];
const TAPS = { paint: [32, 271], wax: [156, 354], stampTool: [234, 354], stamp: [CANVAS.x + CANVAS.w * .28, CANVAS.y + CANVAS.h * .7] };

// ── Garment carousel (the app's own garment renderer) ──
const garmentOrder = ['kebaya', 'dress', 'sarong', 'blazer', 'gown', 'jacket', 'palazzo'];
const garmentList = [...garmentOrder.map(g => M.garments.find(x => x.garment === g)), { garment: 'shirt', label: 'Office / dress shirt', svg: M.heroShirt }];
const GROUP = { kebaya: 'Traditional & formal', dress: 'Everyday', sarong: 'Traditional & formal', blazer: 'Traditional & formal', gown: 'Traditional & formal', jacket: 'Everyday', palazzo: 'Everyday', shirt: 'Everyday' };
const garments = div(root, '', { left: 0, top: 0, width: px(W), height: px(H), zIndex: 3 }); garments.id = 'garments';
const disc = div(garments, 'disc', { left: px(CX - V * .47), top: px(CY - V * .47), width: px(V * .94), height: px(V * .94), opacity: 0 });
const ring = div(garments, 'ring', { left: px(CX - V * .52), top: px(CY - V * .52), width: px(V * 1.04), height: px(V * 1.04), opacity: 0 });
const gImgs = garmentList.map(g => img(garments, svgUrl(g.svg), { left: px(CX - V * .5), top: px(CY - V * .5), width: px(V), height: px(V), opacity: 0 }));

// ── 3D turntable card (real Three.js frames from the app) ──
const TT = 28;
const cardH = L.cardH, cardW = cardH * 1074 / 1434 * .98;
const card = div(root, '', { left: px(CX - cardW / 2), top: px(CY - cardH / 2), width: px(cardW), height: px(cardH), borderRadius: px(cardW * .06), zIndex: 3, opacity: 0 }); card.id = 'card';
const ttImgs = Array.from({ length: TT }, (_, i) => img(card, `${ASSET}turntable/f${String(i).padStart(3, '0')}.png`, { top: '-4%', left: '-3%', width: '106%', opacity: 0 }));
const badge = div(card, 'badge', { left: px(cardW * .06), top: px(cardW * .06), fontSize: px(22 * u), padding: `${px(9 * u)} ${px(18 * u)}` }); badge.textContent = '3D concept preview';

// ── Try-on: synthetic sample person → recorded AI result ──
const tryon = div(root, '', { left: 0, top: 0, width: px(W), height: px(H), zIndex: 3 }); tryon.id = 'tryon';
const photoH = L.photoH, photoW = photoH * 1024 / 1536;
const frame = div(tryon, 'frame', { left: px(CX - photoW / 2), top: px(CY - photoH / 2), width: px(photoW), height: px(photoH), borderRadius: px(photoW * .035), opacity: 0 });
const personImg = img(frame, `${ASSET}photos/sample-person.png`);
const resultImg = img(frame, `${ASSET}photos/result.png`, { clipPath: 'inset(0 0 100% 0)' });
const waxBar = div(frame, 'wax', { height: px(5 * u), opacity: 0 });
const chipW = photoW * (MODE === 'wide' ? .42 : .36);
const chip = div(tryon, '', { left: px(CX + photoW / 2 - chipW * .72), top: px(CY + photoH / 2 - chipW * 1.02), width: px(chipW), height: px(chipW * 1.1), borderRadius: px(chipW * .07), opacity: 0 }); chip.id = 'chip';
img(chip, `${ASSET}photos/tryon-source-shirt.png`);
const chipSpan = document.createElement('span'); chipSpan.textContent = 'Source design'; css(chipSpan, { fontSize: px(17 * u), padding: `${px(10 * u)} 0` }); chip.appendChild(chipSpan);

// ── Typography ──
const typeLayer = div(root, '', { left: 0, top: 0, width: px(W), height: px(H), zIndex: 5 });
const scrim = div(root, '', { left: 0, top: 0, width: px(W), height: px(H), zIndex: 4, opacity: 0,
  background: MODE === 'wide' ? 'linear-gradient(90deg, rgba(10,19,34,.96) 0%, rgba(10,19,34,.92) 38%, rgba(10,19,34,0) 52%)'
    : MODE === 'tall' ? 'linear-gradient(180deg, rgba(10,19,34,.96) 0%, rgba(10,19,34,.93) 21%, rgba(10,19,34,0) 33%, rgba(10,19,34,0) 82%, rgba(10,19,34,.9) 100%)'
    : 'linear-gradient(180deg, rgba(10,19,34,.96) 0%, rgba(10,19,34,.9) 26%, rgba(10,19,34,0) 40%), linear-gradient(0deg, rgba(10,19,34,.9) 0%, rgba(10,19,34,0) 20%)' });

const WORDS = [
  { w: 'Wax', i: 0.55, o: 3.72, n: '01' },
  { w: 'Dye', i: 4.0, o: 5.75, n: '02' },
  { w: 'Repeat', i: 6.0, o: 9.75, n: '03' },
  { w: 'Yours', i: 10.0, o: 12.75, n: '04' },
  { w: 'Shape', i: 13.0, o: 16.72, n: '05' },
  { w: 'Wear', i: 17.0, o: 19.72, n: '06' },
];
const words = WORDS.map(d => {
  const el = div(typeLayer, 'word', { left: px(L.word[0]), bottom: px(H - L.word[1]), fontSize: px(L.wordSize) });
  const chars = [...d.w, '.'].map((ch, i) => {
    const m = document.createElement('span'); m.className = 'm';
    const c = document.createElement('span'); c.className = 'c' + (ch === '.' ? ' dot' : ''); c.textContent = ch;
    m.appendChild(c); el.appendChild(m); return c;
  });
  return { ...d, el, chars };
});
const rule = div(typeLayer, 'rule', { left: px(L.word[0] + 4 * u), top: px(L.word[1] + 4 * u), width: px(110 * u), height: px(3 * u) });

const CAPS = [
  { s: 'Every batik begins with a line of wax.', i: .8, o: 3.72 },
  { s: 'Then colour floods in. Six palettes, five dyes.', i: 4.1, o: 5.75 },
  { s: 'Six original botanical motifs repeat into cloth.', i: 6.1, o: 9.75 },
  { s: 'Paint, draw in wax and stamp your own marks.', i: 10.1, o: 12.75 },
  { s: 'Choose from 15 garment shapes.', i: 13.1, o: 14.74 },
  { s: 'Turn it around in a 3D concept preview.', i: 15.05, o: 16.72 },
  { s: 'Then imagine wearing it with an AI try-on.', i: 17.1, o: 19.72 },
];
const caps = CAPS.map(d => { const el = div(typeLayer, 'cap', { left: px(L.cap[0]), top: px(L.cap[1] + 26 * u), fontSize: px(L.capSize), width: px(L.capW), opacity: 0 }); el.textContent = d.s; return { ...d, el }; });

// Bottom-left labels: real names from the app.
const LABELS = [];
T.repeat.swaps.forEach((ts, i) => { if (i < 5) LABELS.push({ e: `Motif · ${M.collection[i + 1].palette}`, n: M.collection[i + 1].label, i: ts, o: T.repeat.swaps[i + 1] }); });
LABELS.unshift({ e: `Motif · ${M.collection[0].palette}`, n: M.collection[0].label, i: 6.35, o: T.repeat.swaps[0] });
garmentList.forEach((g, i) => { const t0 = T.garments.start + i * T.garments.step; LABELS.push({ e: GROUP[g.garment], n: g.label, i: t0, o: i === garmentList.length - 1 ? T.turn.start - .05 : t0 + T.garments.step, quick: true }); });
LABELS.push({ e: 'Recorded example', n: 'AI try-on · synthetic demo person', i: T.wear.open + .3, o: T.wear.exit });
const labels = LABELS.map(d => {
  const el = div(typeLayer, 'label', { left: px(L.label[0]), bottom: px(H - L.label[1]), opacity: 0, width: L.labelW ? px(L.labelW) : 'auto' });
  el.innerHTML = `<span class="eyebrow" style="font-size:${px(L.labelSize * .42)}">${d.e}</span><span class="name" style="font-size:${px(L.labelSize)}">${d.n}</span>`;
  return { ...d, el };
});

// Brand + index chrome.
const brand = div(typeLayer, '', { left: px(L.brand[0]), top: px(L.brand[1]), opacity: 0 }); brand.id = 'brand';
brand.innerHTML = `<svg viewBox="-12 -12 128 130" width="${54 * u}" height="${55 * u}">${M.collection[0].artwork}</svg><span style="font-size:${px(34 * u)};margin-left:${px(14 * u)}">Wear Your Batik</span>`;
const index = div(typeLayer, '', { right: px(L.brand[0]), top: px(L.brand[1] + 14 * u), fontSize: px(20 * u), opacity: 0 }); index.id = 'index';

// End card type.
const endType = div(root, '', { left: 0, width: px(W), top: px(L.end.mark - L.end.markSize * .9), zIndex: 5 }); endType.id = 'endType';
const markEl = div(endType, 'mark', { position: 'relative', fontSize: px(L.end.markSize), lineHeight: '1' });
const markChars = [...'Wear Your Batik'].map(ch => { const m = document.createElement('span'); m.className = 'm'; css(m, { display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '.12em', marginBottom: '-.12em' }); const c = document.createElement('span'); c.style.display = 'inline-block'; c.innerHTML = ch === ' ' ? '&nbsp;' : ch; m.appendChild(c); markEl.appendChild(m); return c; });
const subEl = div(endType, 'sub', { position: 'relative', fontSize: px(L.end.markSize * .2), marginTop: px(L.end.markSize * .3), opacity: 0 }); subEl.textContent = 'A digital batik atelier';
const tagEl = div(endType, 'tag', { position: 'relative', fontSize: px(L.end.markSize * .42), marginTop: px(L.end.markSize * .55), opacity: 0 }); tagEl.textContent = 'From appreciation to participation.';
const urlEl = div(endType, 'url', { position: 'relative', fontSize: px(L.end.markSize * .22), marginTop: px(L.end.markSize * .32), opacity: 0 }); urlEl.textContent = 'wear-your-batik.vercel.app';

// Film grain + vignette.
const grainCanvas = document.createElement('canvas'); grainCanvas.width = grainCanvas.height = 256;
{ const g = grainCanvas.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = rand() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
const grain = div(root, '', { zIndex: 8, backgroundImage: `url(${grainCanvas.toDataURL()})`, backgroundSize: `${256 * u}px` }); grain.id = 'grain';
const vignette = div(root, '', { zIndex: 7 }); vignette.id = 'vignette';
const fadeOut = div(root, '', { zIndex: 9, opacity: 0 }); fadeOut.id = 'fade';

let heroItems, endItems;

// ───────────── frame renderer ─────────────
function setOpacity(el, v) { el.style.opacity = v.toFixed(3); }
function wipePolygon(s, theta) {
  const n = [Math.cos(theta), Math.sin(theta)], tg = [-n[1], n[0]], Lg = W + H, c = [W / 2, H / 2];
  const P = (a, b) => `${(c[0] + n[0] * a + tg[0] * b).toFixed(1)},${(c[1] + n[1] * a + tg[1] * b).toFixed(1)}`;
  return { points: `${P(-Lg, Lg)} ${P(-Lg, -Lg)} ${P(s, -Lg)} ${P(s, Lg)}`, a: [c[0] + n[0] * s - tg[0] * Lg, c[1] + n[1] * s - tg[1] * Lg], b: [c[0] + n[0] * s + tg[0] * Lg, c[1] + n[1] * s + tg[1] * Lg] };
}

function renderAt(t) {
  // ── camera for hero + fabric ──
  const sZoom = E.inOut(prog(t, T.repeat.start, T.repeat.zoomEnd));
  const sDrift = E.sine(prog(t, T.repeat.zoomEnd, 10.5));
  const P = t < T.repeat.start ? V * lerp(1.14, 1, E.sine(prog(t, 0, T.repeat.start)))
    : lerp(V, minP / .86, sZoom) * lerp(1, .86, sDrift);
  const rot = lerp(0, -7, E.inOut(prog(t, T.repeat.start, 10.5)));
  const camT = `translate(${CX} ${CY}) rotate(${rot.toFixed(3)})`;

  // ── 01 Wax: canting draws the motif ──
  const lead = drawStrokes(heroItems, t);
  heroWrap.setAttribute('transform', `${camT} scale(${(P / 100).toFixed(4)}) translate(-50 -50)`);
  const heroFade = 1 - prog(t, 6.55, 6.85);
  heroWrap.setAttribute('opacity', heroFade.toFixed(3));
  const breathe = 1 + .12 * Math.sin(t * 22);
  if (lead && t < T.wax.end + .05) {
    const [x, y] = tipPoint(lead);
    for (const e of [tipHalo, tipCore]) { e.setAttribute('cx', x); e.setAttribute('cy', y); }
    tipCore.setAttribute('opacity', 1); tipHalo.setAttribute('opacity', .75); tipHalo.setAttribute('r', 26 * u * breathe);
  } else {
    // Pre-roll: a single molten bead waits at the first stroke.
    const pre = E.outBack(prog(t, .05, .45)) * (1 - prog(t, .45, .55) * 0);
    if (t < T.wax.start + .02) {
      const [x, y] = tipPoint({ it: heroItems[0], p: 0 });
      for (const e of [tipHalo, tipCore]) { e.setAttribute('cx', x); e.setAttribute('cy', y); }
      tipCore.setAttribute('opacity', clamp(pre)); tipHalo.setAttribute('opacity', .75 * clamp(pre)); tipCore.setAttribute('r', 7.5 * u * Math.max(0, pre));
    } else { tipCore.setAttribute('opacity', 0); tipHalo.setAttribute('opacity', 0); }
  }

  // ── 02 Dye: flood and blooms ──
  const fp = E.outCubic(prog(t, T.dye.flood, T.dye.flood + 1.1));
  flood.setAttribute('r', (fp * Math.hypot(W, H) * .75).toFixed(1));
  cloth.setAttribute('opacity', (1 - prog(t, 12.85, 13.3)).toFixed(3));
  for (const b of heroBlooms) b.el.setAttribute('r', (b.r * E.outCubic(prog(t, b.t0, b.t0 + .65))).toFixed(2));

  // ── 03 Repeat: tiles stamp outward, zoom out, palettes swap on the beat ──
  fabric.setAttribute('opacity', t >= T.repeat.start ? 1 : 0);
  const fabricT = `${camT} scale(${P.toFixed(3)})`;
  grids.forEach((g, gi) => {
    const tsw = gi ? T.repeat.swaps[gi - 1] : T.repeat.start;
    const vis = t >= tsw - .01;
    g.outer.setAttribute('display', vis ? 'inline' : 'none');
    if (!vis) return;
    g.inner.setAttribute('transform', fabricT);
    if (gi === 0) {
      for (const tile of g.tiles) {
        const t0 = T.repeat.start + tile.ring * T.repeat.ringStep;
        const p = prog(t, t0, t0 + .3);
        if (tile.ring === 0) { tile.el.setAttribute('opacity', prog(t, T.repeat.start, T.repeat.start + .25).toFixed(3)); continue; }
        tile.el.setAttribute('opacity', clamp(p * 4).toFixed(3));
        const s = stampScale(p), cx = tile.x + .5, cy = tile.y + .5;
        tile.el.setAttribute('transform', p >= 1 ? '' : `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`);
      }
    } else {
      const theta = (gi % 2 ? -58 : -122) * Math.PI / 180;
      const D = Math.hypot(W, H) * .62;
      const wp = E.inOut(prog(t, tsw, tsw + .42));
      const { points } = wipePolygon(lerp(-D, D, wp), theta);
      g.poly.setAttribute('points', points);
    }
  });
  // Wax edge riding each wipe.
  let wipeOn = false;
  T.repeat.swaps.forEach((tsw, i) => {
    const wp = prog(t, tsw, tsw + .42);
    if (wp > 0 && wp < 1) {
      const gi = i + 1, theta = (gi % 2 ? -58 : -122) * Math.PI / 180, D = Math.hypot(W, H) * .62;
      const { a, b } = wipePolygon(lerp(-D, D, E.inOut(wp)), theta);
      for (const ln of [wipeLine, wipeGlow]) { ln.setAttribute('x1', a[0]); ln.setAttribute('y1', a[1]); ln.setAttribute('x2', b[0]); ln.setAttribute('y2', b[1]); }
      wipeOn = true;
    }
  });
  wipeLine.setAttribute('opacity', wipeOn ? .95 : 0); wipeGlow.setAttribute('opacity', wipeOn ? .8 : 0);
  fabricShade.setAttribute('opacity', lerp(0, .8, E.inOut(prog(t, 10.0, 10.5))).toFixed(3));

  // ── 04 Yours: phone, real UI, real marks ──
  const ph = T.phone;
  const pin = E.outBack(prog(t, ph.enter, ph.enter + .55)), pout = E.inCubic(prog(t, ph.exit, ph.exit + .35));
  const push = E.sine(prog(t, ph.tapStamp + .1, ph.exit)) * .05;
  const punch = Math.sin(Math.PI * prog(t, ph.tapStamp, ph.tapStamp + .18)) * .025;
  setOpacity(phone, clamp(prog(t, ph.enter, ph.enter + .2)) * (1 - prog(t, ph.exit + .15, ph.exit + .35)));
  const zoomIn = E.inOut(prog(t, ph.tapWax - .1, ph.drawStart + .1)) * (1 - E.inOut(prog(t, ph.tapStamp + .35, ph.exit - .05)));
  phone.style.transformOrigin = `50% ${(((bezel + (CANVAS.y + CANVAS.h / 2) * k) / PH) * 100).toFixed(2)}%`;
  phone.style.transform = `translateY(${px((1 - pin) * H * .7 + pout * H * .25)}) rotate(${((1 - pin) * -7 + pout * 4).toFixed(2)}deg) scale(${(1 + zoomIn * L.zoom + push - punch - pout * .08).toFixed(4)})`;
  const showShot = n => (n === 'patterns' ? t < ph.tapPaint + .05 : n === 'starter' ? t >= ph.tapPaint + .05 && t < ph.drawEnd + .1 : n === 'stamp-tool' ? t >= ph.tapStampTool + .05 && t < ph.tapStamp + .03 : t >= ph.tapStamp + .03);
  for (const n in shots) setOpacity(shots[n], showShot(n) ? 1 : 0);
  const drawP = E.sine(prog(t, ph.drawStart, ph.drawEnd));
  const inDraw = t >= ph.tapWax + .05 && t < ph.drawEnd + .1;
  setOpacity(drawnBar, inDraw ? 1 : 0);
  setOpacity(drawnLine, inDraw && t >= ph.drawStart ? 1 : 0);
  const [dx] = drawPath(drawP);
  drawnLine.style.clipPath = `inset(${px(CANVAS.y * k)} ${px(screenW - (dx + 4) * k)} ${px(screenH - (CANVAS.y + CANVAS.h) * k)} ${px(CANVAS.x * k)})`;
  setOpacity(drawnFull, t >= ph.drawEnd + .1 && t < ph.tapStampTool + .05 ? 1 : 0);
  // Pointer path between taps.
  const keys = [[ph.enter + .3, [300, 600], 0], [ph.tapPaint, TAPS.paint, 1], [ph.tapWax, TAPS.wax, 1], [ph.drawStart, drawPath(0), 0]];
  let pp = null, down = 0;
  if (t >= ph.drawStart && t <= ph.drawEnd) { pp = drawPath(drawP); down = 1; }
  else {
    const seq = t < ph.drawStart ? keys : [[ph.drawEnd, drawPath(1), 0], [ph.tapStampTool, TAPS.stampTool, 1], [ph.tapStamp, TAPS.stamp, 1], [ph.tapStamp + .6, [TAPS.stamp[0] + 70, TAPS.stamp[1] + 90], 0]];
    for (let i = 0; i < seq.length - 1; i++) {
      const [t0, a] = seq[i], [t1, b, tap] = seq[i + 1];
      if (t >= t0 && t <= t1) { const p = E.inOut(prog(t, t0 + .05, t1 - .02)); pp = [lerp(a[0], b[0], p), lerp(a[1], b[1], p)]; }
      if (tap) down = Math.max(down, 1 - Math.abs(t - t1) / .08);
    }
    if (!pp && t > seq[seq.length - 1][0]) pp = seq[seq.length - 1][1];
    if (!pp && t < seq[0][0]) pp = seq[0][1];
  }
  if (pp) { pointer.style.left = px(pp[0] * k); pointer.style.top = px(pp[1] * k); }
  pointer.style.transform = `translate(-50%,-50%) scale(${(1 - .22 * clamp(down)).toFixed(3)})`;
  setOpacity(pointer, clamp(prog(t, ph.enter + .3, ph.enter + .45)) * (1 - prog(t, ph.tapStamp + .45, ph.tapStamp + .7)) * .95);
  const rp = prog(t, ph.tapStamp, ph.tapStamp + .55);
  css(ripple, { left: px(TAPS.stamp[0] * k), top: px(TAPS.stamp[1] * k), width: px(40 * k + rp * 170 * k), height: px(40 * k + rp * 170 * k), opacity: (rp > 0 && rp < 1 ? (1 - rp) * .9 : 0).toFixed(3), borderWidth: px(3 * u * (1 - rp) + 1) });

  // ── 05 Shape: garments then 3D ──
  const gs = T.garments.start, gstep = T.garments.step;
  const discIn = E.outBack(prog(t, gs, gs + .4));
  const toCard = E.inOut(prog(t, T.turn.start - .04, T.turn.start + .14));
  const discOn = t >= gs && t < T.turn.start + .35;
  setOpacity(disc, discOn ? clamp(discIn * 1.5) * (1 - toCard) : 0);
  disc.style.transform = `scale(${(.6 + .4 * discIn + toCard * .2).toFixed(4)})`;
  setOpacity(ring, discOn ? clamp(prog(t, gs + .15, gs + .5)) * (1 - toCard) : 0);
  ring.style.transform = `rotate(${(t * 20).toFixed(2)}deg) scale(${(.9 + .1 * E.outCubic(prog(t, gs + .1, gs + .6))).toFixed(4)})`;
  gImgs.forEach((im, i) => {
    const t0 = gs + i * gstep, t1 = t0 + gstep, last = i === gImgs.length - 1;
    const a = E.outQuint(prog(t, t0, t0 + .16)), b = last ? 0 : E.inCubic(prog(t, t1 - .02, t1 + .1));
    const on = t >= t0 && (last ? t < T.turn.start + .3 : t < t1 + .1);
    setOpacity(im, on ? a * (1 - b) * (last ? 1 - prog(t, T.turn.start - .04, T.turn.start + .06) : 1) : 0);
    im.style.transform = `translateY(${px((1 - a) * V * .07 - b * V * .05)}) scale(${(.94 + .06 * a).toFixed(4)})`;
  });
  // 3D card
  const cIn = E.outBack(prog(t, T.turn.start - .04, T.turn.start + .4)), cOut = E.inCubic(prog(t, T.wear.open - .2, T.wear.open + .1));
  setOpacity(card, t >= T.turn.start - .04 && t < T.wear.open + .1 ? clamp(prog(t, T.turn.start - .04, T.turn.start + .08)) * (1 - cOut) : 0);
  card.style.transform = `scale(${(.86 + .14 * cIn - .08 * cOut).toFixed(4)})`;
  card.style.borderRadius = px(lerp(cardW * .5, cardW * .06, clamp(cIn)));
  const tp = E.inOut(prog(t, T.turn.start, T.turn.end)) * (TT - 1);
  const f0 = Math.floor(tp), fr = tp - f0;
  ttImgs.forEach((im, i) => setOpacity(im, i === f0 ? 1 : i === f0 + 1 ? fr : 0));

  // ── 06 Wear: open the frame like unrolled cloth, then the wax line transforms the shirt ──
  const w = T.wear;
  const open = E.inOut(prog(t, w.open, w.open + .55));
  const wOut = E.inCubic(prog(t, w.exit, w.exit + .3));
  setOpacity(frame, t >= w.open && t < T.end.start + .1 ? 1 - wOut : 0);
  frame.style.clipPath = `inset(0 ${(50 * (1 - open)).toFixed(2)}% 0 ${(50 * (1 - open)).toFixed(2)}%)`;
  frame.style.transform = `scale(${(1.04 - .04 * open - .06 * wOut).toFixed(4)})`;
  const wp = E.inOut(prog(t, w.wipeStart, w.wipeEnd));
  resultImg.style.clipPath = `inset(0 0 ${((1 - wp) * 100).toFixed(2)}% 0)`;
  setOpacity(waxBar, wp > 0 && wp < 1 ? 1 : 0);
  waxBar.style.top = px(wp * photoH - 2.5 * u);
  const cp = E.outBack(prog(t, w.chip, w.chip + .45));
  setOpacity(chip, t >= w.chip ? clamp(cp) * (1 - wOut) : 0);
  chip.style.transform = `translateY(${px((1 - cp) * 60 * u)}) rotate(${lerp(8, 3, cp).toFixed(2)}deg)`;
  // vertical wax seam that opens the frame
  if (t >= w.open - .05 && open < 1) {
    const sy = CY - photoH / 2, ey = CY + photoH / 2, dp = E.outCubic(prog(t, w.open - .05, w.open + .2));
    for (const ln of [wipeLine, wipeGlow]) { ln.setAttribute('x1', CX); ln.setAttribute('y1', sy); ln.setAttribute('x2', CX); ln.setAttribute('y2', lerp(sy, ey, dp)); ln.setAttribute('opacity', (1 - open) * .95); }
  }
  softLight.setAttribute('opacity', (clamp(prog(t, 12.8, 13.3)) * (1 - prog(t, 19.8, 20.2))).toFixed(3));

  // ── type: words, captions, labels, chrome ──
  for (const d of words) {
    const on = t >= d.i - .01 && t < d.o + .5;
    d.el.style.display = on ? 'block' : 'none';
    if (!on) continue;
    d.chars.forEach((c, i) => {
      const a = E.outExpo(prog(t, d.i + i * .045, d.i + i * .045 + .6));
      const b = E.inCubic(prog(t, d.o + i * .025, d.o + i * .025 + .26));
      c.style.transform = `translateY(${((1 - a) * 108 - b * 108).toFixed(2)}%)`;
    });
  }
  const cur = WORDS.findLast(d => t >= d.i - .01);
  const ruleOn = cur && t < cur.o + .2 && t < 19.9;
  const rIn = cur ? E.outExpo(prog(t, cur.i + .2, cur.i + .8)) : 0, rOut = cur ? E.inCubic(prog(t, cur.o, cur.o + .2)) : 0;
  rule.style.transform = `scaleX(${ruleOn ? (rIn * (1 - rOut)).toFixed(3) : 0})`;
  for (const d of caps) {
    const a = E.outCubic(prog(t, d.i, d.i + .45)), b = E.inCubic(prog(t, d.o, d.o + .22));
    setOpacity(d.el, a * (1 - b));
    d.el.style.transform = `translateY(${px((1 - a) * 18 * u - b * 10 * u)})`;
  }
  for (const d of labels) {
    const dur = d.quick ? .1 : .3;
    const a = E.outCubic(prog(t, d.i, d.i + dur)), b = prog(t, d.o - (d.quick ? .02 : .12), d.o + (d.quick ? .0 : .0));
    const on = t >= d.i && t < d.o;
    setOpacity(d.el, on ? a * (1 - b) : 0);
    d.el.style.transform = `translateY(${px((1 - a) * 14 * u)})`;
  }
  const chrome = clamp(prog(t, 1.0, 1.6)) * (1 - prog(t, 19.75, 20.05));
  setOpacity(brand, L.noBrand ? 0 : chrome); setOpacity(index, chrome);
  if (cur) index.innerHTML = `<b>${cur.n}</b> / 06`;
  setOpacity(scrim, clamp(prog(t, 5.75, 6.15)) * (1 - prog(t, 10.3, 10.9)) * .95);

  // ── End: signature ──
  const es = T.end.start;
  endWrap.setAttribute('opacity', t >= es - .05 ? 1 : 0);
  if (t >= es - .05) {
    const S = L.end.logoS, [lx, ly] = L.end.logo;
    const settle = E.outCubic(prog(t, es, es + 2.2));
    endWrap.setAttribute('transform', `translate(${lx} ${ly}) scale(${(S / 100 * (1.06 - .06 * settle)).toFixed(4)}) translate(-50 -50)`);
    drawStrokes(endItems, t);
    endBloom.setAttribute('r', (110 * E.outCubic(prog(t, es + .7, es + 1.5))).toFixed(2));
  }
  markChars.forEach((c, i) => { const a = E.outExpo(prog(t, T.end.mark + i * .03, T.end.mark + i * .03 + .7)); c.style.transform = `translateY(${((1 - a) * 110).toFixed(2)}%)`; });
  markEl.style.visibility = t >= T.end.mark ? 'visible' : 'hidden';
  for (const [el, t0] of [[subEl, T.end.sub], [tagEl, T.end.tag], [urlEl, T.end.url]]) {
    const a = E.outCubic(prog(t, t0, t0 + .6)); setOpacity(el, a); el.style.transform = `translateY(${px((1 - a) * 16 * u)})`;
  }
  setOpacity(fadeOut, prog(t, T.duration - .35, T.duration) * .0);

  // ── film grain shifts every frame ──
  const fi = Math.round(t * 30);
  grain.style.backgroundPosition = `${(fi * 37) % 256}px ${(fi * 91) % 256}px`;
}

window.ready = (async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  heroItems = prepareStrokes(hero, T.wax.start, T.wax.end);
  endItems = prepareStrokes(endMotif, T.end.start, T.end.start + .9);
  // Decode tile SVGs once so the first stamped frame is never blank.
  await Promise.all(tileUrl.map(src => { const i = new Image(); i.src = src; return i.decode().catch(() => {}); }));
  renderAt(Number(Q.get('t') || 0));
  return true;
})();
window.renderAt = renderAt;
