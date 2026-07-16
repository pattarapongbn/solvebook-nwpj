/**
 * Playwright renderer.
 *
 * Keeps a single headless Chromium instance alive for the process
 * lifetime (launching per-request would cost ~1s each time), opens the
 * requested template over file://, injects the JSON payload into the
 * page's render function, waits until fonts and layout settle, and
 * screenshots the poster at exactly the template's dimensions.
 */
import path from 'node:path';
import { chromium } from 'playwright';
import { TEMPLATES, TEMPLATES_DIR, settings } from './config.js';
import { logger } from './utils/logger.js';

/** @type {import('playwright').Browser | null} */
let browser = null;

/** Serialize launches so concurrent first requests share one browser. */
let launching = null;

/**
 * Get (or lazily launch) the shared Chromium instance.
 * @returns {Promise<import('playwright').Browser>}
 */
async function getBrowser() {
  if (browser?.isConnected()) return browser;
  if (!launching) {
    launching = chromium
      .launch({
        headless: true,
        executablePath: settings.chromiumPath || undefined,
        args: [
          // Required inside Docker where /dev/shm is small by default.
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--force-color-profile=srgb',
          // Templates use ES modules loaded over file:// — Chromium
          // blocks those by default (CORS), this flag allows them.
          '--allow-file-access-from-files',
        ],
      })
      .then((instance) => {
        browser = instance;
        launching = null;
        logger.info('Chromium launched');
        return instance;
      })
      .catch((error) => {
        launching = null;
        throw error;
      });
  }
  return launching;
}

/**
 * Render one poster.
 *
 * @param {string} templateName - Key from the TEMPLATES registry.
 * @param {object} payload - Validated market data (with stats attached).
 * @returns {Promise<Buffer>} PNG bytes.
 */
export async function renderImage(templateName, payload) {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown template "${templateName}"`);
  }

  const startedAt = Date.now();
  const instance = await getBrowser();
  const context = await instance.newContext({
    viewport: { width: template.width, height: template.height },
    deviceScaleFactor: 1,
  });

  try {
    const page = await context.newPage();
    const templateUrl = `file://${path.join(TEMPLATES_DIR, template.file)}`;

    await page.goto(templateUrl, { waitUntil: 'load' });

    // Hand the payload to the template's render entry point.
    await page.evaluate((data) => window.LumpuFarm.render(data), payload);

    // Wait for webfonts (Thai glyphs) and the template's completion flag.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => window.LumpuFarm.isComplete());

    const buffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: template.width, height: template.height },
    });

    logger.info('Rendered image', {
      template: templateName,
      items: payload.items.length,
      ms: Date.now() - startedAt,
    });
    return buffer;
  } finally {
    await context.close();
  }
}

/** Close the shared browser (used on graceful shutdown). */
export async function closeRenderer() {
  if (browser?.isConnected()) {
    await browser.close();
    browser = null;
    logger.info('Chromium closed');
  }
}
