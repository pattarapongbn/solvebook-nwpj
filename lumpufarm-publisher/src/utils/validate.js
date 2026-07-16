/**
 * Request payload validation for POST /render.
 *
 * Plain-function validation (no schema library) keeps the image small
 * and the error messages precise for the n8n workflow author.
 */
import { DEFAULT_TEMPLATE, TEMPLATES } from '../config.js';

/**
 * Validate and normalize a render request body.
 *
 * @param {unknown} body - Raw JSON body from Express.
 * @returns {{ ok: true, payload: object, template: string } | { ok: false, errors: string[] }}
 */
export function validateRenderRequest(body) {
  const errors = [];

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, errors: ['Body must be a JSON object'] };
  }

  const template = body.template ?? DEFAULT_TEMPLATE;
  if (typeof template !== 'string' || !TEMPLATES[template]) {
    errors.push(
      `"template" must be one of: ${Object.keys(TEMPLATES).join(', ')}`,
    );
  }

  for (const field of ['date', 'title']) {
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(`"${field}" is required and must be a non-empty string`);
    }
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('"items" must be a non-empty array');
  } else {
    body.items.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`items[${index}] must be an object`);
        return;
      }
      for (const field of ['name', 'price']) {
        if (typeof item[field] !== 'string' && typeof item[field] !== 'number') {
          errors.push(`items[${index}].${field} is required`);
        }
      }
      if (item.change !== undefined && Number.isNaN(Number(item.change))) {
        errors.push(`items[${index}].change must be a number`);
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  // Normalized payload: only the fields templates know about.
  const payload = {
    date: body.date.trim(),
    updated: typeof body.updated === 'string' ? body.updated.trim() : '',
    title: body.title.trim(),
    subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : '',
    sources: typeof body.sources === 'string' ? body.sources.trim() : '',
    items: body.items.map((item) => ({
      name: String(item.name),
      location: item.location !== undefined ? String(item.location) : '',
      price: String(item.price),
      unit: item.unit !== undefined ? String(item.unit) : '',
      change: item.change !== undefined ? Number(item.change) : 0,
    })),
  };

  return { ok: true, payload, template };
}
