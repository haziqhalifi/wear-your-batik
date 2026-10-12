// The single graceful wax tendril drawn in the film, in canvas units (0–100). Shared by capture and preview.
export function strokePoints(N = 96) {
  const bez = (p0, p1, p2, p3, u) => p0.map((_, k) => (1-u)**3*p0[k] + 3*(1-u)**2*u*p1[k] + 3*(1-u)*u*u*p2[k] + u**3*p3[k]);
  const A = [[42, 76], [49, 91], [69, 95], [80, 85]];
  const pts = [];
  const nA = Math.round(N * .62), nB = N - nA;
  for (let i = 0; i <= nA; i++) pts.push(bez(...A, i / nA));
  // Curl: an inward spiral continuing the sweep's direction.
  const c = [75.5, 80.5], last = pts.at(-1);
  const a0 = Math.atan2(last[1] - c[1], last[0] - c[0]), r0 = Math.hypot(last[0] - c[0], last[1] - c[1]);
  for (let i = 1; i <= nB; i++) { const u = i / nB, a = a0 - u * Math.PI * 1.7, r = r0 * (1 - .68 * u); pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
  return pts.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
}
if (process.argv[1].endsWith('stroke-path.mjs')) console.log('M' + strokePoints().map(p => p.join(' ')).join('L'));
