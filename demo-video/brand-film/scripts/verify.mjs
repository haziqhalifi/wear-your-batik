// Checks every deliverable against the brief: exact 60.000 s, 24 fps (1440 frames), 1080 × 1920,
// 48 kHz stereo AAC, loudness, and subtitles that match the narration script word for word.
// Usage: node demo-video/brand-film/scripts/verify.mjs  → out/verification.json (+ contact sheets)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { LINES } from './script.mjs';

const OUT = new URL('../out/', import.meta.url).pathname;
const SUFFIX = process.argv[2] || '';
const FORMATS = (process.argv[3] || '9x16 16x9').split(/\s+/).filter(Boolean);
const files = FORMATS.flatMap(f => { const [w, h] = f === '16x9' ? [1920, 1080] : [1080, 1920];
  return [[`wear-your-batik-brand-film-${f}${SUFFIX}.mp4`, w, h], [`wear-your-batik-brand-film-${f}-clean${SUFFIX}.mp4`, w, h]]; });
const report = { checked: new Date().toISOString(), videos: {}, subtitles: {}, pass: true };
const fail = msg => { report.pass = false; (report.failures ??= []).push(msg); console.error('FAIL', msg); };
const probe = f => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels,pix_fmt', '-of', 'json', f]));

for (const [name, fw, fh] of files) {
  const f = OUT + name;
  if (!existsSync(f)) { fail(`${name} is missing`); continue; }
  const p = probe(f), v = p.streams.find(s => s.codec_type === 'video'), a = p.streams.find(s => s.codec_type === 'audio');
  const lufsOut = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${f}" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p'`]).toString();
  const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(lufsOut)?.[1]), peak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(lufsOut)?.[1]);
  const r = { duration: Number(p.format.duration), video: `${v.codec_name} ${v.width}x${v.height} ${v.r_frame_rate} ${v.pix_fmt}`, frames: Number(v.nb_read_frames), audio: a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch` : 'none', integratedLUFS: I, truePeakDBFS: peak };
  report.videos[name] = r;
  if (Math.abs(r.duration - 60) > .02) fail(`${name}: duration ${r.duration}`);
  if (r.frames !== 1440) fail(`${name}: ${r.frames} frames`);
  if (v.width !== fw || v.height !== fh || v.r_frame_rate !== '24/1' || v.pix_fmt !== 'yuv420p') fail(`${name}: ${r.video}`);
  if (!a || a.sample_rate !== '48000' || a.channels !== 2) fail(`${name}: audio ${r.audio}`);
  if (!(I > -15.5 && I < -12.5)) fail(`${name}: loudness ${I} LUFS`);
  if (!(peak <= -.5)) fail(`${name}: peak ${peak} dBFS`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', f, '-vf', fw > fh ? 'fps=1,scale=320:-1,tile=10x6:padding=4' : 'fps=1,scale=180:-1,tile=15x4:padding=4', '-frames:v', '1', OUT + name.replace('.mp4', '-contact-sheet.jpg')]);
}

const srtFile = OUT + `wear-your-batik-brand-film${SUFFIX}.srt`;
if (!existsSync(srtFile)) fail('subtitle file is missing');
else {
  const cues = readFileSync(srtFile, 'utf8').trim().split(/\n\n+/).map(b => b.split('\n')).map(([n, time, ...text]) => {
    const [a, b] = time.split(' --> ').map(s => { const [h, m, rest] = s.split(':'); const [sec, ms] = rest.split(','); return +h * 3600 + +m * 60 + +sec + +ms / 1000; });
    return { n: +n, start: a, end: b, text: text.join(' ') };
  });
  const said = cues.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
  const script = LINES.map(l => l.text).join(' ');
  report.subtitles = { cues: cues.length, first: cues[0].start, last: cues.at(-1).end, words: script.split(/\s+/).length, matchesScript: said === script };
  if (said !== script) fail('subtitles do not match the script exactly');
  cues.forEach((c, i) => { if (c.end <= c.start || c.end > 60 || (i && c.start < cues[i - 1].end)) fail(`cue ${c.n} timing`); });
}
writeFileSync(OUT + `verification${SUFFIX}.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
