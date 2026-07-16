/**
 * Reusable DOM components for every poster template.
 *
 * Each function builds and returns a detached element; poster.js
 * assembles them. Templates therefore share one component library
 * and differ only in their CSS.
 */

/** Map Thai/English commodity keywords to an icon file in assets/icons/. */
const ICON_RULES = [
  { icon: 'rice.svg', keywords: ['ข้าว', 'rice', 'jasmine', 'paddy'] },
  { icon: 'rubber.svg', keywords: ['ยาง', 'rubber', 'latex'] },
  { icon: 'palm.svg', keywords: ['ปาล์ม', 'palm', 'มะพร้าว', 'coconut'] },
  { icon: 'cassava.svg', keywords: ['มัน', 'cassava', 'tapioca'] },
  { icon: 'corn.svg', keywords: ['ข้าวโพด', 'corn', 'maize'] },
  { icon: 'sugarcane.svg', keywords: ['อ้อย', 'น้ำตาล', 'sugar', 'cane'] },
  { icon: 'coffee.svg', keywords: ['กาแฟ', 'coffee', 'โกโก้', 'cocoa'] },
  {
    icon: 'fruit.svg',
    keywords: ['ทุเรียน', 'มะม่วง', 'ลำไย', 'มังคุด', 'เงาะ', 'ส้ม', 'กล้วย', 'สับปะรด', 'fruit', 'durian', 'mango', 'longan'],
  },
  {
    icon: 'vegetable.svg',
    keywords: ['ผัก', 'พริก', 'กระเทียม', 'หอม', 'มะเขือ', 'vegetable', 'chili', 'garlic', 'onion'],
  },
  { icon: 'shrimp.svg', keywords: ['กุ้ง', 'ปลา', 'shrimp', 'fish', 'seafood'] },
  { icon: 'livestock.svg', keywords: ['หมู', 'สุกร', 'ไก่', 'ไข่', 'วัว', 'โค', 'pork', 'pig', 'chicken', 'egg', 'beef'] },
];

/** Note: "ข้าวโพด" contains "ข้าว" — longer keyword rules must win. */
const FLAT_RULES = ICON_RULES.flatMap(({ icon, keywords }) =>
  keywords.map((keyword) => ({ icon, keyword })),
).sort((a, b) => b.keyword.length - a.keyword.length);

/**
 * Pick the icon file for a commodity name.
 * @param {string} name
 * @returns {string} relative path usable from templates/.
 */
export function iconFor(name) {
  const haystack = String(name).toLowerCase();
  const match = FLAT_RULES.find(({ keyword }) => haystack.includes(keyword));
  return `../assets/icons/${match ? match.icon : 'default.svg'}`;
}

/**
 * Shorthand element factory.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Direction of a change value: 'up' | 'down' | 'flat'.
 * @param {number} change
 * @returns {string}
 */
export function directionOf(change) {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'flat';
}

/**
 * Format a percent change for display, e.g. "+2.1%" / "-0.8%" / "0.0%".
 * @param {number} change
 * @returns {string}
 */
export function formatChange(change) {
  const value = Math.abs(change).toFixed(Math.abs(change) >= 10 ? 1 : 1);
  if (change > 0) return `+${value}%`;
  if (change < 0) return `-${value}%`;
  return `${value}%`;
}

/**
 * Change badge: colored pill with arrow + percent.
 * @param {number} change
 * @returns {HTMLElement}
 */
export function createChangeBadge(change) {
  const direction = directionOf(change);
  const badge = el('span', `change-badge is-${direction}`);
  const arrows = { up: '▲', down: '▼', flat: '▬' };
  badge.append(el('span', 'arrow', arrows[direction]), el('span', 'value', formatChange(change)));
  return badge;
}

/**
 * One commodity card: icon, name, province, price, unit, change badge.
 * @param {{ name: string, location: string, price: string, unit: string, change: number }} item
 * @returns {HTMLElement}
 */
export function createCommodityCard(item) {
  const card = el('article', `commodity-card is-${directionOf(item.change)}`);

  const top = el('div', 'card-top');
  const iconBox = el('div', 'card-icon');
  const icon = document.createElement('img');
  icon.src = iconFor(item.name);
  icon.alt = '';
  iconBox.append(icon);

  const heading = el('div', 'card-heading');
  heading.append(el('h2', 'card-name', item.name));
  if (item.location) heading.append(el('div', 'card-location', item.location));

  top.append(iconBox, heading);

  const bottom = el('div', 'card-bottom');
  const priceGroup = el('div', 'card-price-group');
  priceGroup.append(el('div', 'card-price', item.price));
  if (item.unit) priceGroup.append(el('div', 'card-unit', item.unit));
  bottom.append(priceGroup, createChangeBadge(item.change));

  card.append(top, bottom);
  return card;
}

/**
 * Footer stat pill (e.g. "ราคาขึ้น 4 รายการ").
 * @param {string} label
 * @param {string|number} value
 * @param {string} [direction] - 'up' | 'down' | ''
 * @returns {HTMLElement}
 */
export function createStatPill(label, value, direction = '') {
  const pill = el('div', `stat-pill${direction ? ` is-${direction}` : ''}`);
  pill.append(el('div', 'stat-pill-value', String(value)), el('div', 'stat-pill-label', label));
  return pill;
}

/**
 * Highlight row for the highest increase / decrease.
 * @param {string} label
 * @param {{ name: string, change: number } | null} entry
 * @param {string} direction - 'up' | 'down'
 * @returns {HTMLElement | null}
 */
export function createExtreme(label, entry, direction) {
  if (!entry) return null;
  const row = el('div', `extreme is-${direction}`);
  row.append(
    el('span', 'extreme-label', label),
    el('span', 'extreme-name', entry.name),
    el('span', 'extreme-value', formatChange(entry.change)),
  );
  return row;
}
