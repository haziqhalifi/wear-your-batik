import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { DEFAULT_DESIGN, shirtSvg, type Design } from '../src/patterns.ts';

// An explicit live smoke test against the same endpoint as the UI.
// Uses only the bundled synthetic person, never discovers personal photos.
const variants: Record<string, Design> = {
  leaf: DEFAULT_DESIGN,
  flower: { ...DEFAULT_DESIGN, motif: 'flower', background: '#7b3431', foreground: '#f1d7ae', accent: '#c99853' },
  flow: { ...DEFAULT_DESIGN, motif: 'flow', background: '#214b44', foreground: '#e7d9b6', accent: '#ba8a4b' },
};
const name = process.argv[2] || 'leaf';
if (!variants[name]) throw new Error('Choose leaf, flower or flow.');
const base = 'http://127.0.0.1:5180';
const status = await fetch(`${base}/api/status`).then(r => r.json());
if (!status.configured) { console.error('OpenAI key is not configured in .env.local. No API request made.'); process.exit(2); }
const person = await readFile('public/sample-person.png');
const garment = await sharp(Buffer.from(shirtSvg(variants[name]))).resize(1024, 1024, { fit: 'contain', background: '#f5f0e7' }).png().toBuffer();
const out = `artifacts/tryon/${name}`;
await mkdir(out, { recursive: true });
await writeFile(`${out}/shirt.png`, garment);
const started = Date.now();
const response = await fetch(`${base}/api/try-on`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(95_000),
  body: JSON.stringify({ personImage: `data:image/png;base64,${person.toString('base64')}`, garmentImage: `data:image/png;base64,${garment.toString('base64')}`, designVersion: `smoke-${name}` }),
});
const data = await response.json();
const record = { timestamp: new Date().toISOString(), variant: name, model: status.model, status: response.status, durationMs: Date.now() - started, syntheticPerson: true, error: data.error, code: data.code };
await writeFile(`${out}/test.json`, JSON.stringify(record, null, 2));
if (!response.ok) { console.error(JSON.stringify(record, null, 2)); process.exit(1); }
if (data.designVersion !== `smoke-${name}` || !data.image?.startsWith('data:image/png;base64,')) throw new Error('Unexpected result');
await writeFile(`${out}/result.png`, Buffer.from(data.image.split(',')[1], 'base64'));
console.log(JSON.stringify({ ...record, result: `${out}/result.png` }, null, 2));
