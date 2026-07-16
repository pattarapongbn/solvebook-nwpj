/**
 * Auto-fit utility: shrinks an element's font-size until its content
 * fits on one line inside its container. Long Thai commodity names
 * (e.g. "มันสำปะหลังโรงงานเชื้อแป้ง 25%") never overflow or get clipped.
 */

/**
 * Fit a single element by stepping the font size down.
 * @param {HTMLElement} element - Must have white-space: nowrap.
 * @param {number} [minPx] - Lower bound; below this we ellipsize instead.
 */
export function fitText(element, minPx = 14) {
  const startSize = parseFloat(window.getComputedStyle(element).fontSize);
  let size = startSize;

  while (element.scrollWidth > element.clientWidth && size > minPx) {
    size -= 1;
    element.style.fontSize = `${size}px`;
  }

  // Still too wide at the minimum size: fall back to an ellipsis so the
  // layout can never break, whatever data n8n sends.
  if (element.scrollWidth > element.clientWidth) {
    element.style.textOverflow = 'ellipsis';
  }
}

/**
 * Fit every element matching a selector.
 * @param {string} selector
 * @param {number} [minPx]
 */
export function fitAll(selector, minPx = 14) {
  document.querySelectorAll(selector).forEach((element) => fitText(element, minPx));
}
