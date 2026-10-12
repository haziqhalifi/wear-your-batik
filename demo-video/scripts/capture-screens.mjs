// Captures authentic screenshots of the running app (npm run dev → http://127.0.0.1:5180).
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';

const exe = `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const url = process.argv[2] || 'http://127.0.0.1:5180/';
const dir = new URL('../assets/screens/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=metal', '--enable-gpu'] });

async function session(name, viewport, scale) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${dir}${name}-intro.png` });
  const buttons = async () => (await page.locator('button:visible').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  console.log(name, 'intro buttons:', await buttons());
  await page.getByRole('button', { name: /Create my batik/i }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${dir}${name}-step1.png` });
  console.log(name, 'step1 buttons:', await buttons());
  await page.close();
}
await session('desk', { width: 1440, height: 900 }, 2);
await session('phone', { width: 390, height: 844 }, 3);
await browser.close();
