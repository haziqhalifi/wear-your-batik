// Original score + sound design, synthesised from scratch and locked to src/timeline.js.
// Palette: gamelan-style metallophones in a pelog-like scale (paired, detuned bars for "ombak" shimmer),
// a gong ageng, a soft modern pulse, and foley-like SFX for wax, dye, stamps and UI.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const TL = createRequire(import.meta.url)('../src/timeline.js');

const SR = 48000, DUR = TL.duration + 0.5, N = Math.ceil(SR * DUR);
const dryL = new Float32Array(N), dryR = new Float32Array(N), send = new Float32Array(N);
const BEAT = 60 / TL.bpm;
let seed = 1234567; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const TAU = Math.PI * 2;

function put(i, v, pan = 0, rev = 0) {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  dryL[i] += v * l; dryR[i] += v * r; send[i] += v * rev;
}
// RBJ biquad, coefficients recomputed per sample so cutoffs can sweep.
function biquad(type) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q = .7) => {
    const w = TAU * Math.min(f, SR * .45) / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w);
    let b0, b1, b2; const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else { b0 = a; b1 = 0; b2 = -a; }
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; return y;
  };
}

// ───── instruments ─────
// Bonang / gender-like bar: inharmonic partials, a twin bar detuned for beating, mallet click.
function metal(t0, f, amp = .2, decay = 1.6, pan = 0, rev = .35) {
  const i0 = Math.round(t0 * SR), len = Math.round(SR * decay * 2.5);
  const parts = [[1, 1, 1], [2.76, .42, .55], [5.4, .18, .3], [8.93, .07, .18]];
  const ombak = 4.5; // Hz between the paired bars
  for (let n = 0; n < len; n++) {
    const t = n / SR; let v = 0;
    for (const [m, a, d] of parts) {
      const e = Math.exp(-t / (decay * d));
      v += a * e * (Math.sin(TAU * f * m * t) + .85 * Math.sin(TAU * (f * m + ombak * m ** .5) * t));
    }
    const atk = Math.min(1, t / .0025);
    const click = t < .006 ? rnd() * (1 - t / .006) * .25 : 0;
    put(i0 + n, (v * .5 * atk + click) * amp, pan, rev);
  }
}
function gong(t0, f = 62, amp = .55, decay = 7) {
  const i0 = Math.round(t0 * SR), len = Math.round(SR * decay * 1.2);
  const parts = [[1, 1, 1], [1.5, .25, .6], [2.01, .45, .7], [2.43, .2, .4], [2.98, .18, .35], [4.1, .08, .2]];
  for (let n = 0; n < len; n++) {
    const t = n / SR, bend = 1 + .03 * Math.exp(-t / .08);
    let v = 0;
    for (const [m, a, d] of parts) v += a * Math.exp(-t / (decay * d)) * (Math.sin(TAU * f * m * bend * t) + .7 * Math.sin(TAU * (f * m + 2.6) * bend * t + 1));
    const swell = Math.min(1, t / .02);
    put(i0 + n, v * swell * amp * .45, 0, .45);
  }
}
function kick(t0, amp = .7) {
  const i0 = Math.round(t0 * SR); let ph = 0;
  for (let n = 0; n < SR * .45; n++) {
    const t = n / SR, f = 46 + 110 * Math.exp(-t / .035);
    ph += TAU * f / SR;
    put(i0 + n, (Math.sin(ph) * Math.exp(-t / .22) + (t < .004 ? rnd() * .3 : 0)) * amp, 0, .02);
  }
}
const hpShaker = biquad('hp');
function shaker(t0, amp = .06, pan = .2) {
  const i0 = Math.round(t0 * SR), hp = biquad('hp');
  for (let n = 0; n < SR * .06; n++) { const t = n / SR; put(i0 + n, hp(rnd(), 7000, .8) * Math.exp(-t / .018) * Math.min(1, t / .004) * amp, pan, .05); }
}
function rim(t0, amp = .12) {
  const i0 = Math.round(t0 * SR), bp = biquad('bp');
  for (let n = 0; n < SR * .12; n++) { const t = n / SR; put(i0 + n, (bp(rnd(), 1800, 2.5) * 1.6 + Math.sin(TAU * 820 * t) * .5) * Math.exp(-t / .03) * amp, -.15, .25); }
}
function bass(t0, f, dur, amp = .32) {
  const i0 = Math.round(t0 * SR), len = Math.round(dur * SR);
  for (let n = 0; n < len; n++) {
    const t = n / SR, env = Math.min(1, t / .01) * Math.exp(-t / (dur * .9)) * Math.min(1, (dur - t) / .03);
    put(i0 + n, (Math.sin(TAU * f * t) + .28 * Math.sin(TAU * 2 * f * t) + .08 * Math.sin(TAU * 3 * f * t)) * env * amp, 0, 0);
  }
}
// Warm pad: a few detuned saws (additive), slow swell, low-passed.
function pad(t0, t1, freqs, amp = .05, cutoff = 1400) {
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR);
  const lpL = biquad('lp'), lpR = biquad('lp');
  for (let n = 0; n < len; n++) {
    const t = n / SR, env = Math.min(1, t / .8) * Math.min(1, (t1 - t0 - t) / .6);
    let l = 0, r = 0;
    freqs.forEach((f, vi) => {
      for (let h = 1; h <= 9; h++) {
        const a = 1 / h;
        l += a * Math.sin(TAU * f * h * t * 1.0021 + vi);
        r += a * Math.sin(TAU * f * h * t * .9979 + vi * 2);
      }
    });
    const i = i0 + n; if (i >= N) break;
    dryL[i] += lpL(l, cutoff) * env * amp; dryR[i] += lpR(r, cutoff) * env * amp; send[i] += (l + r) * .5 * env * amp * .15;
  }
}

// ───── sound design ─────
function sizzle(t0, t1, amp = .085) { // hot wax on cloth
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), bp = biquad('bp'), hp = biquad('hp');
  let crack = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR, p = t / (t1 - t0);
    const env = Math.min(1, t / .15) * Math.min(1, (t1 - t0 - t) / .2) * (.75 + .25 * Math.sin(t * 9));
    if ((rnd() + 1) / 2 < .0009) crack = .8 + (rnd() + 1) * .3;
    crack *= .9965;
    const v = bp(rnd(), 5200 + 1800 * Math.sin(t * 3.1), 1.3) * .9 + hp(rnd() * crack, 2500) * .6;
    put(i0 + n, v * env * amp, -.5 + p, .2);
  }
}
function drip(t0, base = 520, amp = .22, pan = 0) { // dye drop: plip + liquid swell
  const i0 = Math.round(t0 * SR); let ph = 0; const lp = biquad('lp');
  for (let n = 0; n < SR * .7; n++) {
    const t = n / SR, f = base * (1 + 1.6 * (1 - Math.exp(-t / .03)));
    ph += TAU * f / SR;
    const plip = Math.sin(ph) * Math.exp(-t / .06);
    const swell = lp(rnd(), 380, .9) * Math.sin(Math.PI * Math.min(1, t / .7)) * 1.4;
    put(i0 + n, (plip * .8 + swell) * amp, pan, .4);
  }
}
function thud(t0, amp = .3, pan = 0, pitch = 1) { // stamp landing
  const i0 = Math.round(t0 * SR); let ph = 0; const bp = biquad('bp'), lp = biquad('lp');
  for (let n = 0; n < SR * .3; n++) {
    const t = n / SR, f = (62 + 90 * Math.exp(-t / .02)) * pitch;
    ph += TAU * f / SR;
    const wood = bp(rnd(), 2300 * pitch, 3) * Math.exp(-t / .012) * 2.2;
    const paper = lp(rnd(), 3500) * Math.exp(-t / .03) * .5;
    put(i0 + n, (Math.sin(ph) * Math.exp(-t / .09) + wood + paper) * amp, pan, .18);
  }
}
function whoosh(t0, dur, amp = .16, f0 = 300, f1 = 5000, p0 = -.6, p1 = .6) {
  const i0 = Math.round(t0 * SR), len = Math.round(dur * SR), bp = biquad('bp'), bp2 = biquad('bp');
  for (let n = 0; n < len; n++) {
    const p = n / len, env = Math.sin(Math.PI * p) ** 2, f = f0 * (f1 / f0) ** p;
    put(i0 + n, (bp(rnd(), f, 1.2) + bp2(rnd(), f * 1.5, 2) * .5) * env * amp, p0 + (p1 - p0) * p, .3);
  }
}
function tick(t0, amp = .12, f = 2400, pan = 0) {
  const i0 = Math.round(t0 * SR);
  for (let n = 0; n < SR * .03; n++) { const t = n / SR; put(i0 + n, (Math.sin(TAU * f * t) * .7 + rnd() * .3) * Math.exp(-t / .006) * amp, pan, .15); }
}
function scratch(t0, t1, amp = .07) { // finger dragging a wax line on glass
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), bp = biquad('bp');
  for (let n = 0; n < len; n++) {
    const t = n / SR, p = n / len, env = Math.sin(Math.PI * p) ** .5;
    put(i0 + n, bp(rnd(), 3000 + 1500 * Math.sin(t * 40), 2) * env * amp * (.7 + .3 * Math.sin(t * 70)), -.4 + .8 * p, .15);
  }
}
function riser(t0, t1, amp = .1) {
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), hp = biquad('hp'); let ph = 0;
  for (let n = 0; n < len; n++) {
    const p = n / len, env = p ** 2.2;
    ph += TAU * (220 * 2 ** (p * 2)) / SR;
    put(i0 + n, (hp(rnd(), 800 + 9000 * p, .8) * 1.2 + Math.sin(ph) * .25 * (1 + Math.sin(n / SR * TAU * 12)) * .5) * env * amp, Math.sin(p * 8) * .3, .35);
  }
}
function revCymbal(t0, t1, amp = .12) {
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), hp = biquad('hp');
  for (let n = 0; n < len; n++) { const p = n / len; put(i0 + n, hp(rnd(), 4000, .7) * p ** 3 * amp, 0, .3); }
}

// ───── score ─────
// Pelog-like set on D.
const P = { D3: 146.83, A3: 220, D4: 293.66, Eb4: 311.13, F4: 349.23, A4: 440, Bb4: 466.16, D5: 587.33, Eb5: 622.25, F5: 698.46, A5: 880, Bb5: 932.33, D6: 1174.66 };
const D1 = 36.71, F1 = 43.65, A1 = 55, Bb1 = 58.27, D2 = 73.42, F2 = 87.31;

// 01 Wax — sparse, molten
metal(.08, P.D6, .07, 1.2, .3, .6);              // the bead appears
pad(0, 4.2, [D2, A1 * 2, P.D3], .028, 900);
[[.5, P.D5, .14], [1.25, P.A4, .1], [2.0, P.F4, .11], [2.5, P.Eb4, .08], [3.0, P.D4, .09], [3.5, P.A3, .07]].forEach(([t, f, a], i) => metal(t, f, a, 1.8, i % 2 ? -.35 : .35, .55));
sizzle(TL.wax.start, TL.wax.end);
riser(3.0, 4.0, .07);

// 02 Dye — downbeat: gong + pulse begins
gong(TL.dye.flood, 62, .45, 5);
TL.dye.blooms.forEach((t, i) => drip(t, [480, 620, 540, 700][i], .2, [-.4, .3, -.2, .4][i]));
metal(TL.dye.flood, P.D5, .16, 2.4, 0, .6);
metal(TL.dye.flood, P.A4, .1, 2.4, 0, .6);

// Groove: 4.0 → 16.5, and 18.0 → 19.75
const grooveOn = t => (t >= 4.0 && t < 16.5) || (t >= 18.0 && t < 19.75);
for (let t = 4.0; t < 20; t += BEAT) if (grooveOn(t)) kick(t, t < 6 ? .45 : .62);
for (let t = 6.0; t < 20; t += BEAT / 4) if (grooveOn(t)) shaker(t, (Math.round(t / (BEAT / 4)) % 2 ? .035 : .06) * (Math.round(t / (BEAT / 4)) % 4 === 2 ? 1.5 : 1), .25);
for (let t = 6.0 + BEAT; t < 20; t += BEAT * 2) if (grooveOn(t)) rim(t, .1);

// Bass + pad by bar (bar = 2 s)
const bars = { 4: [D2, [P.D3, P.A3]], 6: [D2, [P.D3, P.A3]], 8: [Bb1, [Bb1 * 2, P.F4 / 2]], 10: [F2, [F2 * 2, P.A3]], 12: [D2, [P.D3, P.A3]], 14: [A1, [P.A3, P.Eb4 / 2]], 18: [D2, [P.D3, P.A3]] };
for (const [b, [root, chord]] of Object.entries(bars)) {
  const t = +b;
  for (const off of [0, .75, 1.5]) if (grooveOn(t + off)) bass(t + off, root, off === .75 ? .5 : .45);
  pad(t, t + 2.05, chord, .022, 1600);
}
pad(16.5, 18.1, [P.D3, P.A3, P.F4 / 2], .03, 1100); // the break

// Bonang interlock (eighths), varying per section
const pat = [[0, 3, 2, 3, 0, 3, 4, 3], [5, 3, 2, 3, 5, 4, 2, 1], [0, 2, 3, 4, 5, 4, 3, 2]];
const sc = [P.D5, P.Eb5, P.F5, P.A5, P.Bb5, P.D6];
for (let t = 6.0, s = 0; t < 20; t += BEAT / 2, s++) {
  if (!grooveOn(t)) continue;
  const bar = Math.floor(t / 2), p = pat[bar % 3];
  metal(t, sc[p[s % 8]] / 2, s % 2 ? .055 : .075, .55, s % 2 ? .45 : -.45, .25);
}

// 03 Repeat — stamping rings, then palette wipes on the beat
for (let r = 0; r < TL.repeat.rings; r++) thud(TL.repeat.start + r * TL.repeat.ringStep, .26 - r * .025, (r % 2 ? .3 : -.3), 1 - r * .05);
TL.repeat.swaps.forEach((t, i) => { whoosh(t - .02, .45, .13, 500, 6000, i % 2 ? .6 : -.6, i % 2 ? -.6 : .6); metal(t, [P.A5, P.F5, P.D6, P.Bb5, P.A5, P.D5][i], .085, 1.1, i % 2 ? .4 : -.4, .5); });

// 04 Yours — phone, taps, wax line, stamp
const ph = TL.phone;
whoosh(ph.enter - .05, .55, .14, 200, 2500, 0, 0);
tick(ph.tapPaint, .13, 2600); tick(ph.tapWax, .13, 2900); tick(ph.tapStampTool, .13, 2700);
scratch(ph.drawStart, ph.drawEnd);
sizzle(ph.drawStart, ph.drawEnd, .04);
thud(ph.tapStamp, .4, -.2, .95); metal(ph.tapStamp, P.D6, .08, 1.4, -.2, .7); metal(ph.tapStamp + .06, P.A5, .06, 1.4, .2, .7);
whoosh(ph.exit - .05, .4, .12, 3000, 300, 0, 0);

// 05 Shape — garment flicks, then the 3D turn
for (let i = 0; i < TL.garments.count; i++) { const t = TL.garments.start + i * TL.garments.step; tick(t, .1, 1500 + (i % 2) * 400, i % 2 ? .3 : -.3); tick(t + .028, .06, 3200, 0); }
whoosh(TL.turn.start - .1, 2.1, .07, 400, 1800, -.8, .8);   // pans with the rotation
metal(TL.turn.start, P.F5, .07, 2, .3, .6);

// 06 Wear — break, riser, the wax wipe glissando, beat returns
riser(16.6, TL.wear.wipeStart, .16);
whoosh(TL.wear.open, .5, .1, 2500, 400, 0, 0);
const gl = [P.D5, P.Eb5, P.F5, P.A5, P.Bb5, P.D6];
gl.forEach((f, i) => metal(TL.wear.wipeStart + i * (TL.wear.wipeEnd - TL.wear.wipeStart) / gl.length, f, .08, 1.3, -.5 + i * .2, .6));
tick(TL.wear.chip, .08, 2000);
revCymbal(19.0, TL.end.start, .12);

// End — gong, the signature
gong(TL.end.start, 55, .6, 8);
bass(TL.end.start, D1, 3, .3);
pad(TL.end.start, DUR, [P.D3, P.A3, P.F4, P.D4], .03, 1300);
metal(TL.end.start, P.D5, .14, 3, 0, .7); metal(TL.end.start, P.A4, .1, 3, 0, .7);
drip(TL.end.start + .75, 560, .16, 0);
[P.D5, P.F5, P.A5, P.D6].forEach((f, i) => metal(TL.end.mark + i * .12, f, .06, 2, -.3 + i * .2, .7));
metal(TL.end.tag, P.A5, .06, 2.5, .2, .8);
metal(TL.end.url, P.D6, .04, 2.5, -.2, .8);

// ───── simple sidechain on pad/bass feel: duck the whole bed a touch after kicks (musical pump) ─────
// ───── reverb (Freeverb-style) ─────
function reverb(input) {
  const s = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(d => Math.round(d * s));
  const aps = [556, 441, 341, 225].map(d => Math.round(d * s));
  const out = [new Float32Array(N), new Float32Array(N)];
  [0, 23].forEach((spread, ch) => {
    const cb = combs.map(d => ({ buf: new Float32Array(d + spread), i: 0, store: 0 }));
    const ab = aps.map(d => ({ buf: new Float32Array(d + spread), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = input[n] * .015; let y = 0;
      for (const c of cb) { const o = c.buf[c.i]; c.store = o * .75 + c.store * .25; c.buf[c.i] = x + c.store * .86; c.i = (c.i + 1) % c.buf.length; y += o; }
      for (const a of ab) { const b = a.buf[a.i]; const o = -y + b; a.buf[a.i] = y + b * .5; a.i = (a.i + 1) % a.buf.length; y = o; }
      out[ch][n] = y;
    }
  });
  return out;
}
const [wl, wr] = reverb(send);
const L = new Float32Array(N), R = new Float32Array(N);
let peak = 0;
for (let n = 0; n < N; n++) {
  const fade = Math.min(1, (DUR - .1 - n / SR) / 1.6, n / SR / .01);
  L[n] = (dryL[n] + wl[n] * 1.1) * Math.max(0, fade); R[n] = (dryR[n] + wr[n] * 1.1) * Math.max(0, fade);
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
}
const g = .89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * g)) * 32767), 46 + n * 4); }
const dir = new URL('../out/audio/', import.meta.url).pathname; mkdirSync(dir, { recursive: true });
writeFileSync(dir + 'score-raw.wav', buf);
console.log('peak', peak.toFixed(3), 'duration', DUR, 's');
