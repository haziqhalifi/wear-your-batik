import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { normalizeImage, generateTryOn, TryOnError } from '../server/tryon.ts';
import { createApp } from '../server/app.ts';

async function png() {
  const buffer = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#456789' } }).png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

test('image normalization rejects disguised and oversized files, and accepts an actual PNG', async () => {
  const valid = await png();
  assert.match(await normalizeImage(valid, 'Photo'), /^data:image\/png;base64,/);
  await assert.rejects(normalizeImage('data:image/png;base64,aGVsbG8=', 'Photo'), { code: 'INVALID_IMAGE' });
  await assert.rejects(normalizeImage('data:image/svg+xml;base64,aGVsbG8=', 'Photo'), { code: 'INVALID_IMAGE' });
  await assert.rejects(normalizeImage(`data:image/png;base64,${'A'.repeat(14_000_000)}`, 'Photo'), { code: 'IMAGE_TOO_LARGE' });
});

test('provider payload preserves image ordering and avoids unsupported input fidelity option', async () => {
  let body: any;
  const result = await generateTryOn('person', 'shirt', { apiKey: 'test-only', model: 'gpt-image-2', fetcher: async (_url, options) => {
    body = JSON.parse(options?.body as string);
    return new Response(JSON.stringify({ data: [{ b64_json: 'dGVzdA==' }] }));
  } });
  assert.deepEqual(body.images, [{ image_url: 'person' }, { image_url: 'shirt' }]);
  assert.equal(body.model, 'gpt-image-2'); assert.equal(body.n, 1); assert.equal(body.input_fidelity, undefined);
  assert.equal(result.image, 'data:image/png;base64,dGVzdA==');
});

test('provider errors are actionable and never expose raw upstream content', async () => {
  await assert.rejects(generateTryOn('p', 'g', { apiKey: 'test-only', model: 'gpt-image-2', fetcher: async () => new Response(JSON.stringify({ error: { message: 'secret upstream debug' } }), { status: 401 }) }), (error: any) => error.code === 'API_KEY_INVALID' && !error.message.includes('secret'));
  await assert.rejects(generateTryOn('p', 'g', { apiKey: '', model: 'gpt-image-2' }), { code: 'NOT_CONFIGURED' });
  await assert.rejects(generateTryOn('p', 'g', { apiKey: 'test-only', model: 'gpt-image-2', fetcher: async () => { throw new DOMException('Timed out', 'TimeoutError'); } }), { code: 'TIMEOUT' });
});

test('API blocks simultaneous generations and rejects unrelated browser origins', async () => {
  let release!: () => void;
  let began!: () => void;
  const started = new Promise<void>(r => { began = r; });
  const pending = new Promise<void>(r => { release = r; });
  let calls = 0;
  const app = createApp({ configuration: () => ({ apiKey: 'test-only', model: 'gpt-image-2' }), generate: async () => {
    calls++; began(); await pending; return { image: 'data:image/png;base64,dGVzdA==', model: 'gpt-image-2', durationMs: 1 };
  } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(r => server.once('listening', r));
  const addr = server.address() as { port: number }; const url = `http://127.0.0.1:${addr.port}`;
  try {
    const image = await png(); const body = JSON.stringify({ personImage: image, garmentImage: image, designVersion: 'design-1' });
    const request = () => fetch(`${url}/api/try-on`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const first = request(); await started;
    const duplicate = await request(); assert.equal(duplicate.status, 429); assert.equal(calls, 1);
    release(); const result = await (await first).json(); assert.equal(result.designVersion, 'design-1');
    const crossOrigin = await fetch(`${url}/api/try-on`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://unrelated.example' }, body });
    assert.equal(crossOrigin.status, 403); assert.equal(calls, 1);
  } finally { release(); server.closeAllConnections(); await new Promise<void>((r, j) => server.close(e => e ? j(e) : r())); }
});
