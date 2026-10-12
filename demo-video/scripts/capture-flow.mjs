// Walks the real guided flow on a phone viewport and captures each state.
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';

const exe = `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const url = process.argv[2] || 'http://127.0.0.1:5180/';
const dir = new URL('../assets/screens/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const shot = async (name, wait = 1200) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${dir}phone-${name}.png` }); console.log('shot', name); };
const btns = async () => console.log((await page.locator('button:visible').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | '));

await page.goto(url, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Create my batik/i }).click();
await page.waitForTimeout(800);
await page.getByText('Patterns', { exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Bunga raya/ }).first().click();
await shot('patterns', 2500);
await page.getByRole('button', { name: /Senja merah/ }).first().click();
await shot('patterns-senja', 2500);
await page.getByRole('button', { name: /Laut & coral/ }).first().click();
await page.getByText('Paint', { exact: true }).click();
await shot('starter', 2000);

// Draw a real wax-line mark on the canvas.
const canvas = page.locator('svg.drawing-canvas').first();
const box = await canvas.boundingBox();
console.log('canvas box', box);
if (box) {
  await page.getByRole('button', { name: 'Wax line' }).first().click().catch(() => {});
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * .12, box.y + box.height * .85);
  await page.mouse.down();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    await page.mouse.move(box.x + box.width * (.12 + .76 * t), box.y + box.height * (.85 - .7 * t) + Math.sin(t * Math.PI * 3) * box.height * .08, { steps: 2 });
  }
  await page.mouse.up();
  await shot('drawn');
  // Stamp tool, then click to place.
  await page.getByRole('button', { name: 'Stamp', exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  await btns();
  await shot('stamp-tool');
  await page.mouse.click(cx - box.width * .22, cy + box.height * .2);
  await shot('stamped');
}
await page.getByRole('button', { name: /Choose garment/i }).click();
await shot('garment', 1500);
await btns();
await page.getByRole('button', { name: /Preview/i }).first().click().catch(e => console.log('preview nav fail', e.message));
await shot('preview', 4000);
await btns();
await page.getByRole('button', { name: /Try on/i }).first().click().catch(e => console.log('tryon nav fail', e.message));
await shot('tryon', 1500);
await browser.close();
