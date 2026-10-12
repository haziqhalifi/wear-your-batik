// Records the current localhost prototype. No UI screens or responses are mocked.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const out = resolve('demo-video/submission-2026-10-11');
mkdirSync(`${out}/raw`, { recursive: true });
mkdirSync(`${out}/stills`, { recursive: true });
const browser = await chromium.launch({
  executablePath: `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
  headless: true, args: ['--use-angle=metal', '--enable-gpu'],
});
const context = await browser.newContext({ viewport: { width: 1600, height: 750 }, deviceScaleFactor: 1,
  recordVideo: { dir: `${out}/raw`, size: { width: 1600, height: 750 } } });
// A recording cursor is the only editorial overlay added during capture.
await context.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const cursor = document.createElement('div');
    cursor.innerHTML = '<svg width="24" height="30" viewBox="0 0 24 30"><path d="M2 2v23l6-6 5 9 4-2-5-9h9z" fill="white" stroke="#101f36" stroke-width="1.5"/></svg>';
    cursor.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;left:-100px;top:-100px;filter:drop-shadow(0 2px 2px #0005)';
    document.body.append(cursor);
    addEventListener('mousemove', e => { cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`; });
  });
});
await context.route('**/api/try-on', route => route.abort());
const page = await context.newPage();
const start = performance.now();
const elapsed = () => (performance.now() - start) / 1000;
const markers = {};
const mark = name => { markers[name] = elapsed(); console.log(name, markers[name].toFixed(3)); };
const sleep = ms => page.waitForTimeout(ms);
const until = async (name, sec) => { await sleep(Math.max(0, (markers[name] + sec - elapsed()) * 1000)); };
const click = async (locator) => {
  const box = await locator.boundingBox();
  if (!box) throw Error('Target not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
  await sleep(180); await locator.click();
};
try {
  await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle' });
  await sleep(1400);
  mark('intro');
  await page.screenshot({ path: `${out}/stills/welcome.png` });
  await page.locator('.intro-art').screenshot({ path: `${out}/stills/botanical-closeup.png` });
  await sleep(3500);

  mark('create');
  await click(page.getByRole('button', { name: /Create my batik/i }));
  await until('create', 2);
  await click(page.getByRole('button', { name: 'Patterns', exact: true }));
  await until('create', 4);
  await click(page.getByRole('button', { name: /Bunga raya/ }).first());
  await until('create', 7);
  await click(page.getByRole('button', { name: /Senja merah/ }).first());
  await until('create', 10);
  await click(page.getByRole('button', { name: /Laut & coral/ }).first());
  await until('create', 12.5);
  await click(page.getByRole('button', { name: 'Repeat', exact: true }));
  await until('create', 14);
  const range = page.getByRole('slider', { name: 'Repeat size', exact: true });
  const rb = await range.boundingBox();
  await page.mouse.move(rb.x + rb.width * .24, rb.y + rb.height / 2, { steps: 15 });
  await page.mouse.down();
  await page.mouse.move(rb.x + rb.width * .45, rb.y + rb.height / 2, { steps: 22 });
  await page.mouse.up();
  await until('create', 20);
  await page.screenshot({ path: `${out}/stills/repeat.png` });

  mark('stamp');
  await click(page.getByRole('button', { name: 'Paint', exact: true }));
  await until('stamp', 1.5);
  await click(page.getByRole('button', { name: 'Stamp', exact: true }));
  await until('stamp', 2.5);
  await click(page.getByRole('button', { name: 'Daun tropika', exact: true }));
  const canvas = page.locator('svg.drawing-canvas');
  const cb = await canvas.boundingBox();
  await until('stamp', 4);
  await page.mouse.move(cb.x + cb.width * .65, cb.y + cb.height * .7, { steps: 18 });
  await page.mouse.click(cb.x + cb.width * .65, cb.y + cb.height * .7);
  await until('stamp', 6.5);
  await page.screenshot({ path: `${out}/stills/stamped.png` });
  await click(page.getByRole('button', { name: /Choose garment/i }));
  await until('stamp', 8);
  await click(page.locator('summary').filter({ hasText: 'Cut & placement' }));
  await until('stamp', 10);
  await click(page.getByRole('button', { name: 'Border', exact: true }));
  await until('stamp', 12.5);
  await click(page.getByRole('button', { name: 'Panels', exact: true }));
  await until('stamp', 15);
  await page.screenshot({ path: `${out}/stills/panels.png` });
  mark('stampEnd');
  await click(page.getByRole('button', { name: 'All over', exact: true }));
  await sleep(500);
  await page.locator('.guide-preview .live-garment-showroom').screenshot({ path: `${out}/stills/hero-garment.png` });
  const cloth = await page.locator('.guide-fabric img').getAttribute('src');
  writeFileSync(`${out}/stills/hero-cloth.svg`, cloth.includes(';base64,') ? Buffer.from(cloth.split(',')[1], 'base64') : decodeURIComponent(cloth.split(',').slice(1).join(',')));

  mark('three');
  await click(page.getByRole('button', { name: 'Preview in 3D', exact: false }));
  await until('three', 2);
  await click(page.getByRole('button', { name: /View shirt full screen/i }));
  await page.locator('.garment-detail-dialog .three-canvas canvas').waitFor();
  await page.locator('.garment-detail-dialog .three-loading').waitFor({ state: 'hidden', timeout: 20000 });
  if (await page.locator('.three-error').count()) throw Error('3D unavailable: do not claim success');
  await until('three', 4);
  const stage = page.locator('.garment-detail-dialog .three-stage');
  await stage.focus();
  // Keyboard orbit is an actual supported user interaction. One complete turn.
  for (let i = 0; i < 32; i++) { await page.keyboard.press('ArrowRight'); await sleep(140); }
  await until('three', 10);
  await click(page.getByRole('button', { name: 'Zoom in', exact: true }));
  await until('three', 12);
  await click(page.getByRole('button', { name: 'Reset garment view', exact: true }));
  await until('three', 15);
  await page.screenshot({ path: `${out}/stills/three.png` });
  mark('threeEnd');
  await click(page.getByRole('button', { name: 'Close full-screen preview', exact: true }));
  await sleep(750);
  await page.screenshot({ path: `${out}/stills/final-preview.png` });
  writeFileSync(`${out}/capture.json`, JSON.stringify({ markers, viewport: { width:1600,height:750 }, date:'2026-10-11', proof:'Actual localhost app. No generation call. Editorial recording cursor.' }, null, 2));
} finally {
  const video = page.video();
  await context.close();
  await video.saveAs(`${out}/raw/prototype.webm`);
  await browser.close();
}
