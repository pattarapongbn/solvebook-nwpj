/**
 * Image storage: persists every generated PNG under storage/images/
 * with a timestamp-based filename such as 2026-07-16-0630.png.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { IMAGES_DIR, settings } from '../config.js';

/**
 * Build the base filename for a render.
 *
 * The date part always comes from "now" in the configured timezone
 * (the payload date is free-form Thai text like "16 กรกฎาคม 2569" and
 * is not machine-parseable). The time part prefers the payload's
 * "updated" field ("06:30" -> "0630") and falls back to current time.
 *
 * @param {string} [updated] - "HH:MM" string from the payload.
 * @returns {string} e.g. "2026-07-16-0630"
 */
export function buildBaseName(updated) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: settings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';

  const datePart = `${get('year')}-${get('month')}-${get('day')}`;
  const fromPayload = typeof updated === 'string' ? updated.match(/^(\d{1,2}):(\d{2})$/) : null;
  const timePart = fromPayload
    ? `${fromPayload[1].padStart(2, '0')}${fromPayload[2]}`
    : `${get('hour')}${get('minute')}`;

  return `${datePart}-${timePart}`;
}

/**
 * Save a PNG buffer, never overwriting an existing file.
 * If 2026-07-16-0630.png exists, saves 2026-07-16-0630-2.png, etc.
 *
 * @param {Buffer} buffer - PNG bytes.
 * @param {string} [updated] - "HH:MM" from the payload for the filename.
 * @returns {Promise<{ fileName: string, filePath: string }>}
 */
export async function saveImage(buffer, updated) {
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  const base = buildBaseName(updated);

  let fileName = `${base}.png`;
  for (let attempt = 2; ; attempt += 1) {
    const filePath = path.join(IMAGES_DIR, fileName);
    try {
      // 'wx' fails if the file already exists — atomic collision check.
      await fs.writeFile(filePath, buffer, { flag: 'wx' });
      return { fileName, filePath };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      fileName = `${base}-${attempt}.png`;
    }
  }
}
