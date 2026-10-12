// Captures the real Wear Your Batik app on a phone-sized viewport using genuine touch input (CDP touch events).
// Every frame is a screenshot of the running localhost app; nothing in the interface is mocked.
// The try-on generation endpoint is blocked, so no paid image generation can occur.
// Usage (from repo root, with `npm run dev` running): node demo-video/brand-film/scripts/capture-app.mjs
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { strokePoints } from './stroke-path.mjs';

const exe = `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const OUT = new URL('../assets/app/', import.meta.url).pathname;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const VW = 430, VH = 932, DPR = 3;

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
const context = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true });
await context.route('**/api/try-on', route => route.abort());
const page = await context.newPage();
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
const cdp = await context.newCDPSession(page);
const log = { viewport: { width: VW, height: VH, dpr: DPR }, captured: new Date().toISOString(), url: 'http://127.0.0.1:5180/', shots: {}, taps: {}, stroke: null, design: null };
const sleep = ms => page.waitForTimeout(ms);

async function settle(extra = 500) {
  // Wait for every 3D viewer on the page to finish re-texturing.
  await page.waitForFunction(() => !document.querySelector('.three-loading'), null, { timeout: 30000 }).catch(() => console.warn('3D still loading'));
  await page.evaluate(() => document.fonts.ready);
  await sleep(extra);
}
async function shot(name, opts = {}) {
  await page.screenshot({ path: `${OUT}${name}.png`, ...opts });
  log.shots[name] = { scrollY: await page.evaluate(() => scrollY) };
  console.log('shot', name);
}
async function measure(name, selectors) {
  log.rects ??= {};
  log.rects[name] = await page.evaluate(sel => Object.fromEntries(Object.entries(sel).map(([k, q]) => [k, [...document.querySelectorAll(q)].map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })])), selectors);
}
async function touch(type, x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 6, radiusY: 6, force: 1 }] });
}
async function tap(name, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw Error(`Not visible: ${name}`);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  log.taps[name] = { x, y, box, scrollY: await page.evaluate(() => scrollY) };
  await touch('touchStart', x, y); await sleep(70); await touch('touchEnd', x, y);
  console.log('tap', name, x.toFixed(0), y.toFixed(0));
}

try {
  await page.goto(log.url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(4500); // let the intro's wax-draw animation finish
  await shot('intro-hero');

  // Collection section exactly as the website presents it.
  const collection = page.locator('#batik-collection');
  await collection.scrollIntoViewIfNeeded();
  await page.evaluate(() => { const el = document.querySelector('#batik-collection'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 8); });
  await sleep(600);
  await shot('collection-0');
  await measure('collection', { swatches: '.intro-swatch-image', heading: '#collection-title', use: '.intro-use' });
  await tap('swatch-daun', page.locator('.intro-swatch').nth(1));
  await sleep(700);
  await shot('collection-1');
  await tap('create-with', page.getByRole('button', { name: /Create with Daun tropika/ }));
  await settle(900);
  await shot('create-paint-daun');

  await tap('tab-patterns', page.getByRole('button', { name: 'Patterns', exact: true }));
  await settle(700);
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(300);
  await shot('patterns-0');
  await tap('motif-bunga', page.locator('.guide-motifs button').filter({ hasText: 'Bunga raya' }));
  await settle(900);
  await shot('patterns-1');
  await tap('palette-laut', page.locator('.guide-palettes button').filter({ hasText: 'Laut & coral' }));
  await settle(900);
  await shot('patterns-2');

  await tap('tab-paint', page.getByRole('button', { name: 'Paint', exact: true }));
  await settle(700);
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(300);
  await shot('paint-0');
  await tap('tool-wax', page.getByRole('button', { name: 'Wax line', exact: true }));
  await sleep(400);
  // Off-camera preparation: a finer brush (2 → 1.5) using the slider's own keyboard control.
  await page.locator('.brush-settings input[type=range]').focus();
  await page.keyboard.press('ArrowLeft');
  log.brushWidth = await page.locator('.brush-settings input[type=range]').inputValue();
  // A neutral tap on the canvas caption clears focus and the tool tooltip.
  // A neutral tap on the empty left end of the tool bar clears hover and the tool tooltip (never the canvas).
  { const bar = await page.locator('.drawing-tools').boundingBox(); log.taps.neutral = { x: bar.x + 6, y: bar.y + bar.height / 2 };
    await touch('touchStart', bar.x + 6, bar.y + bar.height / 2); await sleep(70); await touch('touchEnd', 0, 0); }
  const waxPaths = () => page.evaluate(() => (document.querySelector('svg.drawing-canvas').innerHTML.match(/stroke="#f9e6b8" stroke-width="1.5"/g) || []).length);
  if (await waxPaths() !== 0) throw Error('Cloth already has a wax mark before the stroke');
  await sleep(500);
  const canvas = page.locator('svg.drawing-canvas');
  await shot('paint-1');
  await measure('paint', { canvas: 'svg.drawing-canvas', preview: '.guide-preview .live-garment-viewer' });
  const cb = await canvas.boundingBox();
  const pts = strokePoints(96), N = pts.length - 1;
  const toScreen = ([x, y]) => [cb.x + x / 100 * cb.width, cb.y + y / 100 * cb.height];
  log.stroke = { canvasBox: cb, scrollY: await page.evaluate(() => scrollY), points: pts.map(toScreen), frames: [] };
  const [sx, sy] = toScreen(pts[0]);
  await touch('touchStart', sx, sy);
  for (let i = 1; i <= N; i++) {
    const [x, y] = toScreen(pts[i]);
    await touch('touchMove', x, y);
    await sleep(16);
    const name = `stroke-${String(i).padStart(3, '0')}`; await shot(name); log.stroke.frames.push({ name, index: i, x, y });
  }
  await touch('touchEnd', 0, 0);
  await settle(1200);
  if (await waxPaths() !== 1) throw Error('Expected exactly one wax stroke on the cloth');
  await shot('paint-2');
  // Record the exact design state the app now holds (the cloth SVG it renders from this design).
  log.design = await page.evaluate(() => ({ fabric: document.querySelector('.guide-fabric img')?.getAttribute('src'), canvas: document.querySelector('svg.drawing-canvas')?.outerHTML }));
  await page.evaluate(() => scrollTo(0, 0));
  await settle(400);
  await shot('paint-3');

  await tap('choose-garment', page.getByRole('button', { name: /Choose garment/i }));
  await settle(1200);
  await page.evaluate(() => scrollTo(0, 0));
  await tap('neutral-2', page.locator('.guide-content h1'));
  // Off-camera: open the kebaya-inspired blouse first, so the sequence ends on the shirt we follow into 3D.
  await tap('prep-traditional', page.locator('.garment-categories button').filter({ hasText: 'Traditional' }));
  await sleep(400);
  await tap('prep-kebaya', page.locator('.garment-grid button').filter({ hasText: 'Kebaya' }));
  await settle(1200);
  await page.evaluate(() => scrollTo(0, 0));
  await tap('neutral-3', page.locator('.guide-content h1'));
  await sleep(400);
  await shot('garment-kebaya');
  await measure('garment', { cards: '.garment-grid button .garment-card-art img', preview: '.guide-preview .live-garment-viewer', categories: '.garment-categories button' });
  await tap('group-everyday', page.locator('.garment-categories button').filter({ hasText: 'Everyday' }));
  await settle(700);
  await shot('garment-everyday');
  await tap('garment-maxi', page.locator('.garment-grid button').filter({ hasText: 'Maxi dress' }));
  await settle(1200);
  await shot('garment-maxi');
  await tap('garment-shirt', page.locator('.garment-grid button').filter({ hasText: /^Shirt/ }));
  await settle(1200);
  await shot('garment-shirt');
  await tap('preview-3d', page.getByRole('button', { name: /Preview in 3D/i }));
  await settle(1500);
  await page.evaluate(() => scrollTo(0, 0));
  await shot('preview-0');

  await tap('try-on', page.getByRole('button', { name: /Try on/i }).first());
  await settle(1200);
  await page.evaluate(() => scrollTo(0, 0));
  await shot('tryon-0');
  await measure('tryon', { key: '.photo-step-content ~ *, [class*=key]', h2: '.guided-photo h2, .guided-photo-empty h2, h2' });
  await tap('try-sample', page.getByRole('button', { name: /Try a sample/i }));
  await settle(1200);
  await shot('tryon-1');
} finally {
  writeFileSync(`${OUT}capture.json`, JSON.stringify(log, null, 1));
  await browser.close();
}
