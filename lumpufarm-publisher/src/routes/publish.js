/**
 * POST /publish/facebook — publish a stored image to a Facebook Page.
 *
 * Dormant until FB_PAGE_ID and FB_ACCESS_TOKEN are configured; the
 * rest of the pipeline works without it.
 */
import { Router } from 'express';
import { isConfigured, publishToFacebook } from '../services/facebookPublisher.js';
import { logger } from '../utils/logger.js';

export const publishRouter = Router();

publishRouter.post('/publish/facebook', async (req, res) => {
  if (!isConfigured()) {
    res.status(501).json({
      error: 'Facebook publishing is not configured',
      hint: 'Set FB_PAGE_ID and FB_ACCESS_TOKEN in .env, then restart',
    });
    return;
  }

  const { fileName, caption } = req.body ?? {};
  if (typeof fileName !== 'string' || fileName.trim() === '') {
    res.status(400).json({ error: '"fileName" is required (e.g. "2026-07-16-0630.png")' });
    return;
  }

  try {
    const { postId } = await publishToFacebook(fileName.trim(), caption ?? '');
    res.status(200).json({ ok: true, postId });
  } catch (error) {
    logger.error('Publish route failed', { message: error.message });
    const status = error.code === 'ENOENT' ? 404 : 502;
    res.status(status).json({ error: error.message });
  }
});
