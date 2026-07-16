/**
 * LumpuFarm Publisher — HTTP entry point.
 *
 * Endpoints:
 *   POST /render            render market data to PNG (main endpoint)
 *   POST /publish/facebook  publish a stored image to Facebook (optional)
 *   GET  /templates         list available templates
 *   GET  /images/:file      retrieve a previously generated image
 *   GET  /health            liveness probe
 */
import express from 'express';
import { IMAGES_DIR, TEMPLATES, settings } from './config.js';
import { closeRenderer } from './renderer.js';
import { publishRouter } from './routes/publish.js';
import { renderRouter } from './routes/render.js';
import { logger } from './utils/logger.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Main API routes.
app.use(renderRouter);
app.use(publishRouter);

// Browse previously generated images (n8n can re-fetch by filename).
app.use('/images', express.static(IMAGES_DIR, { fallthrough: false }));

// Template discovery for workflow builders.
app.get('/templates', (_req, res) => {
  const templates = Object.entries(TEMPLATES).map(([name, t]) => ({
    name,
    width: t.width,
    height: t.height,
    description: t.description,
  }));
  res.json({ default: 'facebook', templates });
});

// Liveness probe for Docker healthcheck / uptime monitors.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Uniform JSON error responses (bad JSON body, missing image, etc.).
app.use((error, _req, res, _next) => {
  const status = error.status ?? error.statusCode ?? 500;
  logger.warn('Request error', { status, message: error.message });
  res.status(status).json({ error: error.message ?? 'Internal error' });
});

const server = app.listen(settings.port, () => {
  logger.info(`LumpuFarm Publisher listening on port ${settings.port}`);
});

/**
 * Graceful shutdown: stop accepting connections, then close Chromium.
 * @param {string} signal
 */
async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down`);
  server.close(async () => {
    await closeRenderer();
    process.exit(0);
  });
  // Hard exit if something hangs longer than 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
