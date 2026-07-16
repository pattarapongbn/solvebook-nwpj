/**
 * Minimal leveled logger.
 *
 * Writes to stdout/stderr and appends to storage/logs/app.log so the
 * container keeps a persistent audit trail of every render request.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOGS_DIR, settings } from '../config.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const LOG_FILE = path.join(LOGS_DIR, 'app.log');

fs.mkdirSync(LOGS_DIR, { recursive: true });

/**
 * Format a single log line: ISO timestamp, level, message, optional context.
 * @param {string} level
 * @param {string} message
 * @param {object} [context]
 * @returns {string}
 */
function formatLine(level, message, context) {
  const base = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  return context ? `${base} ${JSON.stringify(context)}` : base;
}

/**
 * Emit a log entry if it passes the configured level threshold.
 * @param {string} level
 * @param {string} message
 * @param {object} [context]
 */
function emit(level, message, context) {
  if (LEVELS[level] < LEVELS[settings.logLevel]) return;
  const line = formatLine(level, message, context);
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
  // Fire-and-forget append; logging must never crash the request.
  fs.appendFile(LOG_FILE, `${line}\n`, () => {});
}

export const logger = {
  debug: (message, context) => emit('debug', message, context),
  info: (message, context) => emit('info', message, context),
  warn: (message, context) => emit('warn', message, context),
  error: (message, context) => emit('error', message, context),
};
