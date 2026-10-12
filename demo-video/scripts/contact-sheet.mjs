// Contact sheet: representative frames from each scene of a rendered video, labelled.
// node scripts/contact-sheet.mjs out/final/wear-your-batik-9x16.mp4 out/contact-sheet-9x16.png [cols]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';

const [input, output, colsArg] = process.argv.slice(2);
const cols = Number(colsArg || 6);
const SHOTS = [
  [0.3, '01 Wax', 'Molten bead waits'], [2.2, '01 Wax', 'Canting draws Bunga raya'], [4.4, '02 Dye', 'Colour floods on the downbeat'],
  [5.4, '02 Dye', 'Motif fully dyed'], [6.3, '03 Repeat', 'Tiles stamp outward'], [8.25, '03 Repeat', 'Palette wipe on the beat'],
  [11.3, '04 Yours', 'Real app: wax line'], [12.45, '04 Yours', 'Real app: stamp lands'], [13.6, '05 Shape', 'App garment renderer'],
  [16.0, '05 Shape', 'Real 3D turntable'], [18.25, '06 Wear', 'Recorded AI try-on wipe'], [23.0, 'End', 'Signature + URL'],
];
const dir = mkdtempSync(`${tmpdir()}/sheet-`);
const frames = SHOTS.map(([t], i) => {
  const f = `${dir}/${i}.jpg`;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(t), '-i', input, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '3', f]);
  return `data:image/jpeg;base64,${readFileSync(f).toString('base64')}`;
});
const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', input]).toString().trim().split(',').map(Number);
const cellW = 300, cellH = Math.round(cellW * h / w);
const html = `<html><head><link rel="stylesheet" href="file://${new URL('../assets/fonts/fonts.css', import.meta.url).pathname}"></head>
<body style="margin:0;background:#0a1322;font-family:'DM Sans';color:#f9e6b8">
<div id="s" style="display:inline-block;padding:28px">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin:0 4px 20px"><span style="font-family:'Libre Caslon Display';font-size:34px">Wear Your Batik — “Malam” · contact sheet</span><span style="font-size:14px;letter-spacing:.2em;color:#efbd66">${w}×${h} · 24 s · 30 fps</span></div>
<div style="display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:16px">
${SHOTS.map(([t, scene, note], i) => `<figure style="margin:0"><img src="${frames[i]}" style="width:${cellW}px;height:${cellH}px;display:block;border-radius:6px"><figcaption style="margin-top:8px;font-size:13px;line-height:1.35"><b style="color:#efbd66;letter-spacing:.12em">${scene}</b> &nbsp;${t.toFixed(2)}s<br><span style="opacity:.8">${note}</span></figcaption></figure>`).join('')}
</div></div></body></html>`;
const exe = `${homedir()}/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: 1.5 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.locator('#s').screenshot({ path: output });
await browser.close();
rmSync(dir, { recursive: true });
console.log('wrote', output);
