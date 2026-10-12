// Renders the stage deterministically: one screenshot per frame piped into ffmpeg.
// node scripts/render.mjs video 1080x1920 out/name.mp4 [audio.wav]
// node scripts/render.mjs stills 1080x1920 out/dir 0.3,1.2,...
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [mode, size, out, extra] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const FPS = 30;
const exe = `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const stageUrl = pathToFileURL(new URL('../src/stage.html', import.meta.url).pathname).href + `?w=${w}&h=${h}`;

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--allow-file-access-from-files', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(stageUrl);
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.TL.duration);

if (mode === 'stills') {
  mkdirSync(out, { recursive: true });
  for (const t of extra.split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: `${out}/t${t.toFixed(2).padStart(5, '0')}.png` });
  }
} else {
  const frames = Math.round(duration * FPS);
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
  if (extra) args.push('-i', extra, '-c:a', 'aac', '-b:a', '256k', '-shortest');
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-maxrate', '24M', '-bufsize', '48M', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-r', String(FPS), out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`${size} frame ${f}/${frames} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('wrote', out);
}
await browser.close();
