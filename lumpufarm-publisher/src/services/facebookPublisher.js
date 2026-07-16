/**
 * Facebook Graph API publisher (future integration, ready today).
 *
 * Publishes a generated PNG to a Facebook Page as a photo post.
 * Activated by setting FB_PAGE_ID and FB_ACCESS_TOKEN in .env —
 * until then, isConfigured() is false and the /publish/facebook
 * route responds with 501 Not Implemented.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { IMAGES_DIR, settings } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Whether Facebook credentials are present.
 * @returns {boolean}
 */
export function isConfigured() {
  return Boolean(settings.facebook.pageId && settings.facebook.accessToken);
}

/**
 * Publish a stored image to the configured Facebook Page.
 *
 * @param {string} fileName - Name of a file inside storage/images/.
 * @param {string} [caption] - Optional post caption.
 * @returns {Promise<{ postId: string }>}
 */
export async function publishToFacebook(fileName, caption = '') {
  if (!isConfigured()) {
    throw new Error('Facebook is not configured (set FB_PAGE_ID and FB_ACCESS_TOKEN)');
  }

  // Prevent path traversal: only bare filenames inside IMAGES_DIR.
  const filePath = path.join(IMAGES_DIR, path.basename(fileName));
  const buffer = await fs.readFile(filePath);

  const { pageId, accessToken, graphVersion } = settings.facebook;
  const url = `https://graph.facebook.com/${graphVersion}/${pageId}/photos`;

  const form = new FormData();
  form.append('source', new Blob([buffer], { type: 'image/png' }), fileName);
  form.append('caption', caption);
  form.append('access_token', accessToken);

  const response = await fetch(url, { method: 'POST', body: form });
  const data = await response.json();

  if (!response.ok) {
    logger.error('Facebook publish failed', { fileName, error: data.error });
    throw new Error(data.error?.message ?? `Facebook API error (${response.status})`);
  }

  logger.info('Published to Facebook', { fileName, postId: data.post_id ?? data.id });
  return { postId: data.post_id ?? data.id };
}
