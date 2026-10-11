import express from 'express';
import { resolve } from 'node:path';
import { createApp } from './app.ts';

const app = createApp();
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true, hmr: { port: 24680 } }, appType: 'spa' });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 5180);
app.listen(port, '127.0.0.1', () => console.log(`Wear Your Batik: http://127.0.0.1:${port}`)).on('error', (error) => {
  console.error(`Could not start Wear Your Batik on port ${port}: ${error.message}`);
  process.exit(1);
});
