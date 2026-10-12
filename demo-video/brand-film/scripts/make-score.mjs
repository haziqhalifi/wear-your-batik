// Original score and sound design for "The line that becomes a story", synthesised from scratch (no samples).
// Plucked strings (Karplus–Strong with a small wooden body), warm additive chords, soft hand percussion
// (frame drum, palm "tek", shaker), a restrained breathy flute, and a low pulse that enters with creation.
// Sound details follow the picture: the drawn wax line, cloth movement and delicate interface taps.
// The music is ducked under the narration (assets/<voice>/narration.json).
// Usage: node demo-video/brand-film/scripts/make-score.mjs [voiceDir=voice] → out/audio/score.wav (48 kHz stereo)
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { TL } from '../src/timeline.mjs';

const voiceDir = process.argv[2] || 'voice';
const narrFile = new URL(`../assets/${voiceDir}/narration.json`, import.meta.url).pathname;
const NARR = existsSync(narrFile) ? JSON.parse(readFileSync(narrFile, 'utf8')) : { sentences: [] };
const OUT = new URL('../out/audio/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const SR = 48000, DUR = TL.duration, N = Math.round(SR * DUR);
const TAU = Math.PI * 2;
const bus = () => [new Float32Array(N), new Float32Array(N)];
const music = bus(), sfx = bus(), send = new Float32Array(N), sendSfx = new Float32Array(N);
let seed = 20261012; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const mtof = m => 440 * 2 ** ((m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const BEAT = 60 / TL.bpm, BAR = BEAT * 4, E8 = BEAT / 2;

function put(b, i, v, pan = 0, rev = 0, s = send) {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  b[0][i] += v * l; b[1][i] += v * r; s[i] += v * rev;
}
function biquad(type) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q = .707) => {
    const w = TAU * Math.min(f, SR * .45) / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w);
    let b0, b1, b2; const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else { b0 = a; b1 = 0; b2 = -a; } // band-pass, constant peak gain
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; return y;
  };
}

// ── Harmony (D major). Pad voicings and bass roots (MIDI). ──
const CH = {
  Dadd9: { pad: [50, 57, 64, 66], bass: 38 }, Bm9: { pad: [54, 57, 61, 62], bass: 35 }, Gmaj9: { pad: [59, 62, 66, 69], bass: 43 },
  Em9: { pad: [55, 59, 62, 66], bass: 40 }, Gmaj7s11: { pad: [54, 59, 61, 62], bass: 43 }, Bm11: { pad: [57, 62, 64, 66], bass: 35 },
  Asus: { pad: [52, 57, 62, 64], bass: 33 }, A: { pad: [52, 57, 61, 64], bass: 33 }, Dmaj9: { pad: [54, 57, 61, 64], bass: 38 },
  DF: { pad: [54, 57, 61, 64], bass: 42 }, Em11: { pad: [55, 57, 62, 66], bass: 40 }, D69: { pad: [50, 57, 59, 64, 66, 69], bass: 38 },
};
const PROG = [
  [0, 'Dadd9'], [6, 'Bm9'], [9, 'Gmaj9'], [12, 'Em9'], [15, 'Gmaj7s11'], [18, 'Bm11'], [21, 'Asus'], [23.25, 'A'],
  [24, 'Dmaj9'], [27, 'Bm11'], [30, 'Gmaj9'], [33, 'Asus'], [35.25, 'A'], [36, 'DF'], [39, 'Gmaj9'], [42, 'Em11'], [44.25, 'A'],
  [45, 'Dmaj9'], [48, 'Bm11'], [51, 'Gmaj9'], [53.25, 'Asus'], [54, 'D69'],
];
const chordAt = t => { let c = PROG[0]; for (const p of PROG) if (t >= p[0]) c = p; return CH[c[1]]; };
// Section intensity: sparse → creation → build → warmest → resolve.
const intensity = t => t < 6 ? .32 + .05 * t / 6 : t < 14 ? .45 : t < 22 ? .55 : t < 34 ? .62 : t < 45 ? .62 + .16 * (t - 34) / 11 : t < 54 ? .95 : .85;

// ── Warm additive pad, crossfaded chord to chord ──
function pad() {
  for (let c = 0; c < PROG.length; c++) {
    const [t0, name] = PROG[c], t1 = c + 1 < PROG.length ? PROG[c + 1][0] : DUR;
    const notes = CH[name].pad, atk = c === 0 ? 2.2 : .9, rel = 1.4;
    const i0 = Math.round(Math.max(0, t0 - .15) * SR), i1 = Math.min(N, Math.round((t1 + rel) * SR));
    notes.forEach((m, ni) => {
      const voices = [-7, 0, 6.5].map((cents, v) => ({ f: mtof(m) * 2 ** (cents / 1200), ph: (ni * 1.7 + v * 2.3) % TAU, pan: (v - 1) * .55 + (ni % 2 ? .12 : -.12) }));
      for (let i = i0; i < i1; i++) {
        const t = i / SR;
        const env = clamp((t - t0 + .15) / atk) * (t < t1 ? 1 : Math.max(0, 1 - (t - t1) / rel));
        if (env <= 0) continue;
        const inten = intensity(t), bright = .35 + .65 * inten;
        const lfo = 1 + .06 * Math.sin(TAU * .11 * t + ni);
        for (const vo of voices) {
          let x = 0;
          for (let h = 1; h <= 6; h++) x += Math.sin(vo.ph + TAU * vo.f * h * t) * (bright ** (h - 1)) / h ** 1.5;
          const fin = t > DUR - 1.4 ? Math.max(0, (DUR - t) / 1.4) ** 1.6 : 1;
          put(music, i, x * env * lfo * .0105 * (.55 + .6 * inten) * fin, vo.pan, .55);
        }
      }
    });
  }
}

// ── Plucked string: Karplus–Strong with a soft excitation and a small wooden body ──
function pluck(t0, m, amp = .2, pan = 0, opt = {}) {
  const f = mtof(m), period = SR / f, L = Math.floor(period), frac = period - L;
  const len = Math.round(SR * (opt.len || 3.2));
  const buf = new Float32Array(L + 2);
  const soft = opt.soft ?? .55; let lp = 0;
  for (let k = 0; k < buf.length; k++) { lp = lp * soft + rnd() * (1 - soft); buf[k] = lp; }
  let mean = 0; for (const v of buf) mean += v; mean /= buf.length; for (let k = 0; k < buf.length; k++) buf[k] -= mean;
  const decay = opt.decay ?? (.9965 - Math.max(0, m - 72) * .0006);
  const b1 = biquad('bp'), b2 = biquad('bp'), hp = biquad('hp');
  let idx = 0, prev = 0;
  const i0 = Math.round(t0 * SR);
  for (let n = 0; n < len; n++) {
    const a = buf[idx % buf.length], b = buf[(idx + 1) % buf.length];
    const y = a + (b - a) * (1 - frac);
    const nv = decay * .5 * (y + prev); prev = y;
    buf[idx % buf.length] = nv; idx++;
    const body = b1(nv, 210, 2.2) * .35 + b2(nv, 470, 2.6) * .22;
    let v = hp(nv + body, 70);
    const tail = n > len - SR * .3 ? (len - n) / (SR * .3) : 1;
    put(music, i0 + n, v * amp * tail, pan, opt.rev ?? .32);
  }
  // A faint glassy harmonic for bell-like notes.
  if (opt.bell) for (let n = 0; n < SR * 2.6; n++) { const t = n / SR; put(music, i0 + n, Math.sin(TAU * f * 2 * t) * Math.exp(-t / .7) * amp * .22 * opt.bell + Math.sin(TAU * f * 3.01 * t) * Math.exp(-t / .35) * amp * .08 * opt.bell, pan, .6); }
}

// ── Breathy flute: sine-rich tone, delayed vibrato, breath noise, soft onset scoop ──
function flute(t0, t1, m, amp = .05, pan = .15) {
  const f = mtof(m), i0 = Math.round(t0 * SR), i1 = Math.round((t1 + .45) * SR);
  const bp = biquad('bp'), lp = biquad('lp'); let ph = 0;
  for (let i = i0; i < i1 && i < N; i++) {
    const t = i / SR - t0;
    const env = clamp(t / .22) ** 1.5 * (i / SR < t1 ? 1 : Math.max(0, 1 - (i / SR - t1) / .45));
    const vib = 1 + .0055 * clamp((t - .35) / .5) * Math.sin(TAU * 5.1 * t);
    const scoop = 2 ** (-.18 * Math.exp(-t / .06) / 12);
    ph += TAU * f * vib * scoop / SR;
    const tone = Math.sin(ph) + .16 * Math.sin(2 * ph + .3) + .07 * Math.sin(3 * ph + .9);
    const breath = bp(rnd(), f * 2.1, 1.4) * (.55 + .45 * Math.exp(-t / .12)) * .9;
    const v = lp(tone * .9 + breath, 4200) * env * amp;
    put(music, i, v, pan, .5);
  }
}

// ── Hand percussion and low pulse ──
function dum(t0, amp = .3, pan = -.05) {
  amp *= .72;
  const i0 = Math.round(t0 * SR), lp = biquad('lp'); let ph = 0;
  for (let n = 0; n < SR * .7; n++) {
    const t = n / SR, f = 72 + 58 * Math.exp(-t / .035);
    ph += TAU * f / SR;
    const v = Math.sin(ph) * Math.exp(-t / .26) + lp(rnd(), 520) * Math.exp(-t / .028) * .9;
    put(music, i0 + n, v * amp, pan, .14);
  }
}
function tek(t0, amp = .08, pan = .2) {
  const i0 = Math.round(t0 * SR), bp = biquad('bp');
  for (let n = 0; n < SR * .16; n++) { const t = n / SR; const v = bp(rnd(), 2300, 1.3) * Math.exp(-t / .03) * 1.6 + Math.sin(TAU * 360 * t) * Math.exp(-t / .022) * .5; put(music, i0 + n, v * amp, pan, .2); }
}
function shaker(t0, amp = .035, pan = .32) {
  const i0 = Math.round(t0 * SR), hp = biquad('hp'), bp = biquad('bp');
  for (let n = 0; n < SR * .13; n++) { const t = n / SR; const env = clamp(t / .014) * Math.exp(-Math.max(0, t - .014) / .045); put(music, i0 + n, bp(hp(rnd(), 5200), 8200, .8) * env * amp * 2.2, pan, .12); }
}
function pulse(t0, m, amp = .12, len = .62) {
  const f = mtof(m), i0 = Math.round(t0 * SR);
  for (let n = 0; n < SR * len; n++) {
    const t = n / SR, env = clamp(t / .028) * Math.exp(-t / (len * .42));
    const v = Math.sin(TAU * f * t) + .32 * Math.sin(TAU * 2 * f * t) + .1 * Math.sin(TAU * 3 * f * t);
    put(music, i0 + n, v * env * amp, 0, .05);
  }
}

// ── Sound details ──
function waxLine(t0, t1, amp, panFrom = -.3, panTo = .3, ease = u => .5 - .5 * Math.cos(Math.PI * u)) {
  const i0 = Math.round(t0 * SR), i1 = Math.round(t1 * SR), bp = biquad('bp'), lp = biquad('lp'), bp2 = biquad('bp'), soft = biquad('lp');
  for (let i = i0; i < i1; i++) {
    const u = (i - i0) / (i1 - i0), du = (ease(Math.min(1, u + .002)) - ease(Math.max(0, u - .002))) / .004;
    const speed = Math.min(1.6, du) ** .7;
    const env = clamp(u / .04) * clamp((1 - u) / .06);
    let v = bp(rnd(), 1900 + 900 * speed, .9) * .7 + lp(rnd(), 900) * .25;
    if (rnd() > .9993 - .0005 * speed) v += bp2(rnd() * 6, 3400, 2) ; // wax grain
    put(sfx, i, soft(v, 5200) * amp * speed * env, panFrom + (panTo - panFrom) * u, .12, sendSfx);
  }
}
function swish(t0, dur = .8, amp = .05, pan = 0) {
  const i0 = Math.round((t0 - dur * .45) * SR), len = Math.round(dur * SR), bp = biquad('bp'), lp = biquad('lp');
  for (let n = 0; n < len; n++) {
    const u = n / len, env = Math.sin(Math.PI * u) ** 1.6;
    const f = 380 + 1500 * Math.sin(Math.PI * u) ** 2;
    const v = bp(rnd(), f, .7) * .8 + lp(rnd(), 420) * .4;
    put(sfx, i0 + n, v * env * amp, pan + .5 * (u - .5), .25, sendSfx);
  }
}
function tap(t0, amp = .06, pan = .1) {
  const i0 = Math.round(t0 * SR), hp = biquad('hp');
  for (let n = 0; n < SR * .09; n++) { const t = n / SR; put(sfx, i0 + n, (hp(rnd(), 3000) * Math.exp(-t / .004) * .6 + Math.sin(TAU * 2350 * t) * Math.exp(-t / .016) * .5) * amp, pan, .08, sendSfx); }
}
function chime(t0, m, amp = .03, pan = .1) {
  const f = mtof(m), i0 = Math.round(t0 * SR);
  for (let n = 0; n < SR * 1.1; n++) { const t = n / SR; put(sfx, i0 + n, (Math.sin(TAU * f * t) + .25 * Math.sin(TAU * f * 2.0 * t)) * Math.exp(-t / .3) * clamp(t / .004) * amp, pan, .45, sendSfx); }
}

// ───────────── the score ─────────────
pad();
// Low drone underneath the opening, very soft.
for (let i = 0; i < Math.round(14 * SR); i++) { const t = i / SR; const env = clamp(t / 3) * (t < 12 ? 1 : (14 - t) / 2); put(music, i, (Math.sin(TAU * mtof(38) * t) + .3 * Math.sin(TAU * mtof(50) * t)) * env * .018, 0, .2); }

// 1 · the bloom note
pluck(TL.bloomNote, 81, .15, .1, { bell: .55, len: 4.5, rev: .55, soft: .7 });
flute(4.1, 5.9, 66, .022, -.15);

// 2 · gentle arpeggios as the bloom opens
const arp = (t0, t1, step, pattern, amp, reg = 0, swing = 0) => {
  let k = 0;
  for (let t = t0; t < t1 - .05; t += step, k++) {
    const p = pattern[k % pattern.length]; if (p === null) continue;
    const c = chordAt(t + .01), notes = [...c.pad].sort((a, b) => a - b);
    const m = notes[p % notes.length] + 12 * (Math.floor(p / notes.length) + 1) + reg;
    const humanT = (k % 2 ? swing : 0) + rnd() * .006;
    pluck(t + humanT, m, amp * (.85 + .15 * Math.cos(k * 1.3)), ((k * 37) % 9) / 9 * .7 - .35);
  }
};
arp(6.35, 13.6, BEAT, [0, 2, 3, 1, 2, null, 3, 1], .085);
flute(11.7, 12.9, 69, .03, .2); flute(12.9, 14.3, 66, .028, .2);

// 3 · travelling eighths across the collection
arp(14.0, 21.6, E8, [0, 2, 1, 3, 2, 4, 3, 5], .065, 0, .03);
flute(19.2, 20.4, 71, .03, -.1); flute(20.4, 21.2, 69, .028, -.1); flute(21.2, 22.5, 64, .027, -.1);
for (const c of [15.25, 15.95, 16.65, 17.35, 18.05, 18.75]) swish(c - .2, .7, .018, (c - 17) * .12);

// 4 · rhythm enters with creation
for (let t = 21.75; t < 53.6; t += E8) {
  const k = Math.round((t - 21.75) / E8), lvl = clamp((t - 21.75) / 3) * (t < 34 ? .8 : t < 45 ? 1 : 1.15);
  shaker(t, (k % 2 ? .036 : .022) * lvl, k % 2 ? .34 : .26);
}
dum(22.5, .22);
for (let bar = 24; bar < 54; bar += BAR) {
  const full = bar >= 34, warm = bar >= 45;
  dum(bar, warm ? .34 : .28); dum(bar + BEAT * 1.5, warm ? .22 : .17, .05);
  if (bar < 51 || true) dum(bar + BEAT * 3, .12, -.08);
  if (full) { tek(bar + BEAT, .07); tek(bar + BEAT * 3, .08); }
  if (warm) { dum(bar + BEAT * 2.5, .14, .08); tek(bar + BEAT * 3.5, .045, -.25); }
}
dum(54.0, .26);
for (let t = 22.5; t < 53.95; t += BEAT) { const lvl = t < 34 ? .058 : t < 45 ? .078 : .1; pulse(t, chordAt(t + .01).bass, lvl); }
arp(24.0, 33.9, E8, [0, null, 2, 1, null, 3, null, 2], .07, 0, .035);
// The repeat arriving across the cloth: one tiny bell per ring of tiles.
[74, 76, 79, 81, 83, 86, 88].forEach((m, d) => chime(TL.repeatDraw[0] + .1 + d * .16 * 1.25, m, .022 - d * .0018, (d % 2 ? .3 : -.3)));
flute(31.2, 33.9, 78, .024, .18);

// 5 · the garment: fuller, building
arp(34.0, 44.9, E8, [0, 2, 1, 3, 2, null, 4, 3], .072, 0, .035);
flute(40.8, 42.0, 69, .03, .15); flute(42.0, 43.0, 71, .03, .15); flute(43.0, 44.3, 74, .032, .15); flute(44.3, 45.3, 73, .03, .15);

// 6 · the warmest, fullest moment
arp(45.0, 53.9, E8, [0, 2, 4, 3, 5, 4, 2, 3], .078, 0, .03);
for (const t of [45, 48, 51]) { const b = chordAt(t + .01).bass; pluck(t, b + 12, .12, -.2, { len: 3, soft: .75 }); }
flute(50.3, 51.4, 78, .036, .1); flute(51.4, 52.2, 76, .034, .1); flute(52.2, 53.2, 74, .034, .1); flute(53.2, 55.6, 81, .03, .1);
[74, 78, 81, 83, 86, 88].forEach((m, i) => pluck(TL.rosette[0] + .45 + i * .11, m, .05, (i - 2.5) * .22, { bell: .6, len: 2.6 }));

// 7 · resolution: one warm sustained chord
[50, 57, 62, 66, 69, 74, 78].forEach((m, i) => pluck(54.0 + i * .028, m, .08, (i - 3) * .15, { len: 5.5, soft: .7, rev: .45 }));
for (let i = Math.round(54 * SR); i < N; i++) { const t = i / SR, env = clamp((t - 54) / 1.2) * Math.max(0, Math.min(1, (DUR - t) / 1.6)) ** 1.4; put(music, i, (Math.sin(TAU * mtof(38) * t) + .4 * Math.sin(TAU * mtof(45) * t)) * env * .03, 0, .3); }

// Sound details
waxLine(TL.petalDraw[0] - .32, TL.petalDraw[1], .018, -.2, .2);
waxLine(TL.stroke[0], TL.stroke[1], .04, -.35, .35);
waxLine(TL.seam[0], TL.seam[1], .02, .3, -.3);
waxLine(TL.emblemDraw[0], TL.emblemDraw[1], .016, -.15, .15);
for (const t of TL.swishes) swish(t, .85, .045);
const chordTone = t => { const c = chordAt(t); return [...c.pad].sort((a, b) => b - a)[0] + 12; };
for (const tp of TL.taps) { tap(tp.t, .055); if (tp.shot) chime(tp.t + .06, chordTone(tp.t), .016, .15); }

// ───────────── reverb, ducking, master ─────────────
function reverb(input, size = .86) {
  const s = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(d => Math.round(d * s * 1.25));
  const aps = [556, 441, 341, 225].map(d => Math.round(d * s));
  const out = [new Float32Array(N), new Float32Array(N)];
  [0, 23].forEach((spread, ch) => {
    const cb = combs.map(d => ({ buf: new Float32Array(d + spread), i: 0, store: 0 }));
    const ab = aps.map(d => ({ buf: new Float32Array(d + spread), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = input[n] * .015; let y = 0;
      for (const c of cb) { const o = c.buf[c.i]; c.store = o * .62 + c.store * .38; c.buf[c.i] = x + c.store * size; c.i = (c.i + 1) % c.buf.length; y += o; }
      for (const a of ab) { const b = a.buf[a.i]; const o = -y + b; a.buf[a.i] = y + b * .5; a.i = (a.i + 1) % a.buf.length; y = o; }
      out[ch][n] = y;
    }
  });
  return out;
}
const [ml, mr] = reverb(send, .87), [sl, sr] = reverb(sendSfx, .8);
// Narration envelope → gentle ducking of the score (about −7 dB), smooth attack and release.
const voiceOn = new Float32Array(N);
for (const s of NARR.sentences) for (let i = Math.round((s.start - .12) * SR); i < Math.round((s.end + .2) * SR); i++) if (i >= 0 && i < N) voiceOn[i] = 1;
const duck = new Float32Array(N); let g = 0;
for (let i = 0; i < N; i++) { const target = voiceOn[i]; const k = target > g ? 1 - Math.exp(-1 / (SR * .12)) : 1 - Math.exp(-1 / (SR * .5)); g += (target - g) * k; duck[i] = 1 - .56 * g; }
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  L[i] = (music[0][i] + ml[i] * .9) * duck[i] + (sfx[0][i] + sl[i] * .7) * (1 - .3 * (1 - duck[i]));
  R[i] = (music[1][i] + mr[i] * .9) * duck[i] + (sfx[1][i] + sr[i] * .7) * (1 - .3 * (1 - duck[i]));
}
// Soft limiter and normalisation to a −3 dBFS peak; final loudness is set at the mix stage.
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = .7 / peak;
const pcm = Buffer.alloc(N * 8);
for (let i = 0; i < N; i++) { pcm.writeFloatLE(Math.tanh(L[i] * gain * 1.05) / 1.05, i * 8); pcm.writeFloatLE(Math.tanh(R[i] * gain * 1.05) / 1.05, i * 8 + 4); }
const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8); header.write('fmt ', 12);
header.writeUInt32LE(16, 16); header.writeUInt16LE(3, 20); header.writeUInt16LE(2, 22); header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 8, 28); header.writeUInt16LE(8, 32); header.writeUInt16LE(32, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
writeFileSync(`${OUT}score.wav`, Buffer.concat([header, pcm]));
console.log(`score.wav: ${DUR}s, peak normalised; ducked under ${NARR.sentences.length} narrated sentences (${voiceDir})`);
