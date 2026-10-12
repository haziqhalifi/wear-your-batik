// High-resolution capture of the app's real 3D preview (full-screen dialog) for the 9:16 film.
// The viewport is 620 × 1102 CSS px (9:16, still the phone layout) at 1.75× — the app's own WebGL
// pixel-ratio cap — so the garment renders at the film's native width. The design is rebuilt with the
// exact same touch actions as capture-app.mjs. Usage: node demo-video/brand-film/scripts/capture-3d.mjs
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { strokePoints } from './stroke-path.mjs';

const exe = `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const OUT = new URL('../assets/three/', import.meta.url).pathname;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
// Match the app's own WebGL pixel-ratio cap so the 3D canvas renders at exactly the film's width.
const scene = readFileSync(new URL('../../../src/three/scene.ts', import.meta.url), 'utf8');
const DPR = Number(/devicePixelRatio,\s*([\d.]+)\)/.exec(scene)?.[1] || 2);
const VW = Math.round(1080 / DPR), VH = Math.round(1920 / DPR);
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
const context = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true });
await context.route('**/api/try-on', route => route.abort());
const page = await context.newPage();
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
const cdp = await context.newCDPSession(page);
const sleep = ms => page.waitForTimeout(ms);
const log = { viewport: { width: VW, height: VH, dpr: DPR }, captured: new Date().toISOString() };
const settle = async (extra = 500) => { await page.waitForFunction(() => !document.querySelector('.three-loading'), null, { timeout: 30000 }); await sleep(extra); };
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 6, radiusY: 6, force: 1 }] });
async function tap(locator) {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  await touch('touchStart', b.x + b.width / 2, b.y + b.height / 2); await sleep(70); await touch('touchEnd', 0, 0);
}
const shot = name => page.screenshot({ path: `${OUT}${name}.png` });

try {
  await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle' });
  await sleep(1500);
  await tap(page.locator('.intro-swatch').nth(1));
  await sleep(500);
  await tap(page.getByRole('button', { name: /Create with Daun tropika/ }));
  await settle(800);
  await tap(page.getByRole('button', { name: 'Patterns', exact: true }));
  await sleep(500);
  await tap(page.locator('.guide-motifs button').filter({ hasText: 'Bunga raya' }));
  await settle(600);
  await tap(page.locator('.guide-palettes button').filter({ hasText: 'Laut & coral' }));
  await settle(600);
  await tap(page.getByRole('button', { name: 'Paint', exact: true }));
  await sleep(500);
  await tap(page.getByRole('button', { name: 'Wax line', exact: true }));
  await page.locator('.brush-settings input[type=range]').focus();
  await page.keyboard.press('ArrowLeft');
  { const bar = await page.locator('.drawing-tools').boundingBox(); await touch('touchStart', bar.x + 6, bar.y + bar.height / 2); await sleep(70); await touch('touchEnd', 0, 0); }
  const waxPaths = () => page.evaluate(() => (document.querySelector('svg.drawing-canvas').innerHTML.match(/stroke="#f9e6b8" stroke-width="1.5"/g) || []).length);
  if (await waxPaths() !== 0) throw Error('Cloth already has a wax mark before the stroke');
  const canvas = page.locator('svg.drawing-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const cb = await canvas.boundingBox();
  const pts = strokePoints(96).map(([x, y]) => [cb.x + x / 100 * cb.width, cb.y + y / 100 * cb.height]);
  await touch('touchStart', ...pts[0]);
  for (const p of pts.slice(1)) { await touch('touchMove', ...p); await sleep(16); }
  await touch('touchEnd', 0, 0);
  await settle(800);
  if (await waxPaths() !== 1) throw Error('Expected exactly one wax stroke on the cloth');
  log.fabric = await page.evaluate(() => document.querySelector('.guide-fabric img')?.getAttribute('src'));
  await tap(page.getByRole('button', { name: /Choose garment/i }));
  await settle(1000);
  await tap(page.getByRole('button', { name: /Preview in 3D/i }));
  await settle(1500);
  await tap(page.getByRole('button', { name: /full screen/i }).first());
  await page.locator('.garment-detail-dialog .three-canvas canvas').waitFor();
  await settle(1500);
  await shot('dialog-fit');
  await tap(page.getByRole('button', { name: 'Zoom in', exact: true }));
  await sleep(800);
  await tap(page.locator('.garment-detail-hint'));
  await sleep(400);
  await shot('turn-000');
  const stage = await page.locator('.garment-detail-dialog .three-canvas').boundingBox();
  const cy = stage.y + stage.height * .55;
  const full = await page.evaluate(() => document.querySelector('.garment-detail-dialog .three-canvas canvas').clientHeight);
  const TURN = 192, step = full / TURN, x0 = VW * .12, x1 = VW * .88;
  log.turntable = { frames: TURN, stepPx: step, elementHeight: full };
  let x = x0, down = false;
  for (let i = 1; i <= TURN; i++) {
    if (!down) { await touch('touchStart', x, cy); down = true; await sleep(30); }
    x += step; await touch('touchMove', x, cy); await sleep(25);
    await shot(`turn-${String(i).padStart(3, '0')}`);
    if (x + step > x1) { await touch('touchEnd', 0, 0); down = false; x = x0; await sleep(40); }
  }
  if (down) await touch('touchEnd', 0, 0);
  await sleep(300);
  // A closer look at the cloth with the dialog's own zoom control, then a slow partial turn.
  await tap(page.getByRole('button', { name: 'Zoom in', exact: true })); await sleep(300);
  await tap(page.locator('.garment-detail-hint'));
  await sleep(600);
  x = x0; await touch('touchStart', x, cy); await sleep(30);
  for (let i = 1; i <= 120; i++) {
    x += full / 900; await touch('touchMove', x, cy); await sleep(25);
    await shot(`detail-${String(i).padStart(3, '0')}`);
  }
  await touch('touchEnd', 0, 0);
} finally {
  writeFileSync(`${OUT}capture.json`, JSON.stringify(log, null, 1));
  await browser.close();
}
