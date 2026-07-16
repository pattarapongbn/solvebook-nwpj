/**
 * POST /render — the main endpoint.
 *
 * Accepts market data JSON (from n8n), renders the requested template
 * to PNG, saves a copy under storage/images/, and streams the PNG back.
 */
import { Router } from 'express';
import { renderImage } from '../renderer.js';
import { computeMarketStats } from '../services/marketStats.js';
import { logger } from '../utils/logger.js';
import { saveImage } from '../utils/storage.js';
import { validateRenderRequest } from '../utils/validate.js';

export const renderRouter = Router();

renderRouter.post('/render', async (req, res) => {
  const result = validateRenderRequest(req.body);
  if (!result.ok) {
    res.status(400).json({ error: 'Invalid payload', details: result.errors });
    return;
  }

  const { payload, template } = result;

  try {
    // Attach derived summary stats (totals, extremes) for the footer.
    payload.stats = computeMarketStats(payload.items);

    const buffer = await renderImage(template, payload);
    const { fileName } = await saveImage(buffer, payload.updated);

    res
      .status(200)
      .type('image/png')
      .setHeader('Content-Disposition', `inline; filename="${fileName}"`)
      .setHeader('X-Image-Filename', fileName)
      .setHeader('X-Template', template)
      .send(buffer);
  } catch (error) {
    logger.error('Render failed', { template, message: error.message });
    res.status(500).json({ error: 'Render failed', message: error.message });
  }
});
