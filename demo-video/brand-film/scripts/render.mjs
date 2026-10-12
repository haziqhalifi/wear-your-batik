// Deterministic renderer: serves the repo locally, calls window.renderAt(t) per frame and pipes frames to ffmpeg.
//   node demo-video/brand-film/scripts/render.mjs stills 1080x1920 <outDir> 0.5,3.2,... [query]
//   node demo-video/brand-film/scripts/render.mjs video  1080x1920 <out.mp4> [audio.wav] [query] [from-to]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { homedir } from 'node:os';

const [mode, size, out, extra, query = '', range = ''] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const ROOT = new URL('../../../', import.meta.url).pathname; // repository root
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wav': 'audio/wav' };
const server = createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!path.startsWith(ROOT)) throw Error('outside root');
    await stat(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/demo-video/brand-film/src/stage.html?w=${w}&h=${h}${query ? '&' + query : ''}`;

const exe = `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const missing = new Set();
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
page.on('response', r => { if (r.status() >= 400) missing.add(r.url()); });
await page.goto(url);
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const { duration, fps } = await page.evaluate(() => ({ duration: window.TL.duration, fps: window.TL.fps }));

if (mode === 'stills') {
  mkdirSync(out, { recursive: true });
  for (const t of extra.split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: `${out}/t${t.toFixed(2).padStart(5, '0')}.png` });
  }
} else {
  const [f0, f1] = range ? range.split('-').map(s => Math.round(Number(s) * fps)) : [0, Math.round(duration * fps)];
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (extra && extra !== '-') args.push('-i', extra, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-map', '0:v', '-map', '1:a');
  // Chrome's JPEG frames are full-range BT.601; deliver broadcast-range BT.709 for consistent colour everywhere.
  args.push('-vf', 'scale=in_range=full:in_color_matrix=bt601:out_range=limited:out_color_matrix=bt709,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-profile:v', 'high', '-level', '4.2',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', '-r', String(fps), '-frames:v', String(f1 - f0), out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.renderAt(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 48 === 0) console.log(`${size} frame ${f}/${f1} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('wrote', out);
}
if (missing.size) console.error('MISSING', [...missing].slice(0, 20).join('\n'));
await browser.close();
server.close();
