/**
 * Central configuration for LumpuFarm Publisher.
 *
 * Everything configurable lives here: paths, the template registry
 * and environment-driven settings. No other module reads process.env
 * directly (except dotenv-style bootstrapping in server.js).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of the project root (one level above src/). */
export const ROOT_DIR = path.resolve(__dirname, '..');

/** Where template HTML files live. */
export const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

/** Where generated PNG files are persisted. */
export const IMAGES_DIR = path.join(ROOT_DIR, 'storage', 'images');

/** Where log files are written. */
export const LOGS_DIR = path.join(ROOT_DIR, 'storage', 'logs');

/**
 * Template registry.
 *
 * Adding a new output format = add an HTML file in templates/,
 * a CSS file in styles/, and one entry here. Nothing else changes.
 */
export const TEMPLATES = {
  facebook: {
    file: 'facebook.html',
    width: 1080,
    height: 1350,
    description: 'Facebook feed poster (4:5)',
  },
  'instagram-story': {
    file: 'instagram-story.html',
    width: 1080,
    height: 1920,
    description: 'Instagram / Facebook story (9:16)',
  },
  telegram: {
    file: 'telegram.html',
    width: 1280,
    height: 720,
    description: 'Telegram channel banner (16:9)',
  },
  future: {
    file: 'future.html',
    width: 1080,
    height: 1080,
    description: 'Square poster (1:1) — base for future formats',
  },
};

/** Template used when the request does not specify one. */
export const DEFAULT_TEMPLATE = 'facebook';

/** Runtime settings resolved from the environment. */
export const settings = {
  port: Number(process.env.PORT ?? 3000),
  // Optional: path to a system Chromium binary. Leave empty to use the
  // browser bundled with the Playwright Docker image.
  chromiumPath: process.env.CHROMIUM_EXECUTABLE_PATH ?? '',
  timezone: process.env.TZ ?? 'Asia/Bangkok',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  facebook: {
    pageId: process.env.FB_PAGE_ID ?? '',
    accessToken: process.env.FB_ACCESS_TOKEN ?? '',
    graphVersion: process.env.FB_GRAPH_VERSION ?? 'v21.0',
  },
};
