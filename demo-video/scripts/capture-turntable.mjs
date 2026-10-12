// Real 3D turntable: rotates the app's own Three.js garment with its arrow-key control and grabs each frame.
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';

const exe = `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const url = process.argv[2] || 'http://127.0.0.1:5180/';
const dir = new URL('../assets/turntable/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Create my batik/i }).click();
await page.waitForTimeout(600);
await page.getByText('Patterns', { exact: true }).click();
await page.getByRole('button', { name: /Bunga raya/ }).first().click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Choose garment/i }).click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Preview/i }).first().click();
await page.waitForTimeout(5000);
const stages = page.locator('.three-stage');
console.log('stages', await stages.count());
const stage = stages.first();
await stage.focus();
const frames = Number(process.argv[3] || 32);
for (let i = 0; i < frames; i++) {
  await page.waitForTimeout(i === 0 ? 300 : 650);
  await stage.screenshot({ path: `${dir}f${String(i).padStart(3, '0')}.png` });
  await page.keyboard.press('ArrowRight');
}
console.log('frames', frames);
await browser.close();
