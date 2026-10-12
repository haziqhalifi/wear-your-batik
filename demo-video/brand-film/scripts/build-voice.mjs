// Places the narration on the film's timeline, sentence by sentence, and writes subtitle timing.
// Each voiced line is split at its natural pauses (one segment per sentence); every sentence starts at its
// timeline target (TL.sentenceTargets) or just after the previous one, never earlier.
// Usage: node demo-video/brand-film/scripts/build-voice.mjs [voiceDir=voice]   → assets/<voiceDir>/narration.{wav,json}
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { LINES } from './script.mjs';
import { TL } from '../src/timeline.mjs';

const dirName = process.argv[2] || 'voice';
const DIR = new URL(`../assets/${dirName}/`, import.meta.url).pathname;
const SR = 48000;
const read = file => {
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
};
const sentencesOf = text => text.match(/[^.!?]+[.!?]+/g).map(s => s.trim());

// Speech activity from a 10 ms RMS envelope.
function regions(x) {
  const hop = SR / 100, env = [];
  for (let i = 0; i + hop <= x.length; i += hop) { let e = 0; for (let k = 0; k < hop; k++) e += x[i + k] ** 2; env.push(Math.sqrt(e / hop)); }
  const peak = Math.max(...env), thr = peak * 10 ** (-36 / 20);
  const on = env.map(v => v > thr);
  let first = on.indexOf(true), last = on.lastIndexOf(true);
  const gaps = [];
  for (let i = first; i <= last; i++) if (!on[i]) { let j = i; while (j <= last && !on[j]) j++; gaps.push({ a: i / 100, b: j / 100, len: (j - i) / 100 }); i = j; }
  return { start: first / 100, end: (last + 1) / 100, gaps };
}

const out = new Float32Array(Math.round(SR * TL.duration));
const sentences = [];
let prevEnd = 0;
for (const [li, line] of LINES.entries()) {
  const file = `${DIR}line-${li}.wav`;
  if (!existsSync(file)) throw Error(`Missing ${file}`);
  const x = read(file);
  const r = regions(x);
  const texts = sentencesOf(line.text);
  // The n−1 longest pauses separate the n sentences.
  const cuts = [...r.gaps].sort((p, q) => q.len - p.len).slice(0, texts.length - 1).sort((p, q) => p.a - q.a);
  const bounds = [r.start, ...cuts.flatMap(c => [c.a, c.b]), r.end];
  texts.forEach((text, k) => {
    const a = Math.max(0, bounds[2 * k] - .03), b = Math.min(x.length / SR, bounds[2 * k + 1] + .09);
    const target = TL.sentenceTargets[li][k];
    const start = Math.max(target, prevEnd + (k === 0 ? .35 : .2));
    const seg = x.subarray(Math.round(a * SR), Math.round(b * SR));
    const o = Math.round(start * SR);
    for (let n = 0; n < seg.length && o + n < out.length; n++) {
      const fade = Math.min(1, n / (SR * .012), (seg.length - n) / (SR * .04));
      out[o + n] += seg[n] * fade;
    }
    const end = start + (b - a);
    sentences.push({ line: li, index: k, text, caption: caption(text), start: +start.toFixed(3), end: +end.toFixed(3), target, late: +(start - target).toFixed(3) });
    prevEnd = end;
  });
}
function caption(text) {
  if (text.length <= 34) return text;
  // Two balanced lines, preferring a comma near the middle.
  const mid = text.length / 2; let best = -1, score = 1e9;
  for (let i = 1; i < text.length - 1; i++) if (text[i] === ' ') { const s = Math.abs(i - mid) - (text[i - 1] === ',' ? 6 : 0); if (s < score) { score = s; best = i; } }
  return text.slice(0, best) + '\n' + text.slice(best + 1);
}
const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
if (peak > .99) for (let i = 0; i < out.length; i++) out[i] *= .99 / peak;
const pcm = Buffer.from(out.buffer);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s24le', `${DIR}narration.wav`], { input: pcm });
writeFileSync(`${DIR}narration.json`, JSON.stringify({ voice: dirName, sentences }, null, 1));
for (const s of sentences) console.log(`${s.start.toFixed(2).padStart(6)}–${s.end.toFixed(2).padEnd(6)} ${s.late > .05 ? `(+${s.late.toFixed(2)}s)` : '         '} ${s.text}`);
