import { isGarmentType } from '../src/garments.js';
import express from 'express';
import { configuration, generateTryOn, normalizeImage, TryOnError } from './tryon.js';

export function createApp(deps: {
  hosted?: boolean;
  configuration?: typeof configuration;
  generate?: typeof generateTryOn;
} = {}) {
  const app = express();
  const getConfig = deps.configuration || configuration;
  let busy = false;
  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const host = req.hostname;
    if (!deps.hosted && !['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
      res.status(403).json({ error: 'This prototype is available on localhost only.', code: 'LOCAL_ONLY' }); return;
    }
    if (req.method !== 'GET' && req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) throw new Error('Different origin');
      } catch { res.status(403).json({ error: 'Open the app to make a preview.', code: 'ORIGIN_REJECTED' }); return; }
    }
    next();
  });
  app.get('/api/status', (_req, res) => {
    const { apiKey, model } = getConfig();
    res.json({ configured: Boolean(apiKey), provider: 'OpenAI', model });
  });
  app.post('/api/try-on', express.json({ limit: '29mb' }), async (req, res) => {
    if (!req.is('application/json')) { res.status(415).json({ code: 'JSON_REQUIRED', error: 'Send the photo through the studio.' }); return; }
    if (busy) { res.status(429).json({ code: 'BUSY', error: 'A preview is already being made. Please wait for it to finish.' }); return; }
    const version = req.body?.designVersion;
    if (typeof version !== 'string' || !version.length || version.length > 3000) { res.status(400).json({ code: 'INVALID_DESIGN', error: 'Please choose a pattern first.' }); return; }
    const garmentType = req.body?.garmentType ?? 'shirt';
    if (!isGarmentType(garmentType)) { res.status(400).json({ code: 'INVALID_GARMENT', error: 'Choose a garment from the studio.' }); return; }
    busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    const abort = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', abort);
    try {
      const config = getConfig();
      if (!config.apiKey) throw new TryOnError(503, 'NOT_CONFIGURED', 'Photo try-on is not connected yet. Add your OpenAI key to .env.local, then retry.');
      const [person, garment] = await Promise.all([normalizeImage(req.body?.personImage, 'Photo'), normalizeImage(req.body?.garmentImage, 'Garment')]);
      const result = await (deps.generate || generateTryOn)(person, garment, { ...config, garmentType, outputFormat: deps.hosted ? 'jpeg' : 'png', signal: controller.signal });
      if (!res.destroyed) res.json({ ...result, designVersion: version });
    } catch (error) {
      const err = error instanceof TryOnError ? error : new TryOnError(500, 'INTERNAL_ERROR', 'The preview could not be completed. Please try again.');
      if (!res.destroyed) res.status(err.status).json({ code: err.code, error: err.message });
    } finally {
      clearTimeout(timer); res.off('close', abort); busy = false;
    }
  });
  app.use('/api', (_req, res) => res.status(404).json({ code: 'NOT_FOUND', error: 'Unknown API route.' }));
  app.use((error: { type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.type === 'entity.too.large' ? 413 : 400).json({ code: 'INVALID_REQUEST', error: 'The upload could not be read. Use JPEG or PNG files up to 10 MB each.' });
  });
  return app;
}
